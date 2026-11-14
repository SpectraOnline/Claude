<?php
/**
 * The Local Farmer: block home delivery to rural addresses (mu-plugin).
 * Spectra Online, 15 Nov 2026.
 *
 * What it does
 * - If any shipping address line says "RD 1".."RD 99" or "Rural Delivery",
 *   delivery options are removed, Click & Collect stays, and the existing
 *   message shows: "Sorry, we do not currently offer automated rural delivery
 *   to this address. Please contact us directly and we can arrange a rural
 *   delivery quote."
 * - Checkout also refuses a delivery order with an RD address as a safety net
 *   (covers express pay buttons and any cached rates).
 * - Phase 2 (optional): ask GoSweetSpot's address validation (NZ Couriers' own
 *   rural flag) for addresses with no RD in them. Off until we have the API key
 *   and have tested the response shape.
 *
 * Install: Code Snippets plugin (or mu-plugin). Back up first. Undo = deactivate.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

// Phase 2: GoSweetSpot check runs only when both constants are set in wp-config.php:
// define( 'TLF_GSS_ACCESS_KEY', '...' ); define( 'TLF_GSS_SITE_ID', '...' );
define( 'TLF_RURAL_USE_GSS', defined( 'TLF_GSS_ACCESS_KEY' ) && defined( 'TLF_GSS_SITE_ID' ) );

function tlf_address_is_rural( array $pkg_dest ) {
	// Check each line on its own. "RD n" counts only at the start of a line,
	// after a comma, or after a street word (e.g. "Smith Road RD 3"), so a
	// town address like "12 Main Rd" + unit "2" is NOT caught.
	$re = '/(?:^|,|\b(?:road|rd|street|st|lane|ln|highway|hwy|drive|dr|avenue|ave|way|place|pl|crescent|cres|terrace|tce)\.?\s)\s*R\.?\s?D\.?\s*\d{1,2}(?=\s*$|\s*,|\s+[A-Za-z])|\brural\s+delivery\b/i';
	foreach ( array( 'address', 'address_1', 'address_2', 'city' ) as $field ) {
		if ( ! empty( $pkg_dest[ $field ] ) && preg_match( $re, trim( (string) $pkg_dest[ $field ] ) ) ) {
			return true;
		}
	}
	if ( TLF_RURAL_USE_GSS ) {
		return tlf_gss_says_rural( $pkg_dest );
	}
	return false;
}

/** Remove delivery rates (keep Click & Collect) for rural addresses. */
add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {
	if ( empty( $package['destination'] ) || ! tlf_address_is_rural( $package['destination'] ) ) {
		return $rates;
	}
	foreach ( $rates as $id => $rate ) {
		if ( 'local_pickup' !== $rate->get_method_id() && 'pickup_location' !== $rate->get_method_id() ) {
			unset( $rates[ $id ] );
		}
	}
	if ( function_exists( 'wc_has_notice' ) && ! wc_has_notice( tlf_rural_msg(), 'notice' ) && ! is_admin() ) {
		wc_add_notice( tlf_rural_msg(), 'notice' );
	}
	return $rates;
}, 100, 2 );

/** Safety net at Place order. */
add_action( 'woocommerce_after_checkout_validation', function ( $data, $errors ) {
	$methods = (array) ( $data['shipping_method'] ?? array() );
	$is_pickup = false;
	foreach ( $methods as $m ) {
		if ( 0 === strpos( (string) $m, 'local_pickup' ) || 0 === strpos( (string) $m, 'pickup_location' ) ) { $is_pickup = true; }
	}
	if ( $is_pickup ) { return; }
	$p = empty( $data['ship_to_different_address'] ) ? 'billing_' : 'shipping_';
	$dest = array(
		'address_1' => $data[ $p . 'address_1' ] ?? '',
		'address_2' => $data[ $p . 'address_2' ] ?? '',
		'city'      => $data[ $p . 'city' ] ?? '',
		'postcode'  => $data[ $p . 'postcode' ] ?? '',
	);
	if ( tlf_address_is_rural( $dest ) ) {
		$errors->add( 'tlf_rural', tlf_rural_msg() );
	}
}, 10, 2 );

function tlf_rural_msg() {
	return 'Sorry, we do not currently offer automated rural delivery to this address. Please contact us directly and we can arrange a rural delivery quote, or choose Click &amp; Collect.';
}

/**
 * Phase 2: GoSweetSpot POST v2/addressvalidation (NZ Couriers' own rural flag).
 * Docs: api-docs.gosweetspot.com/docs/address-validation/v2-addressvalidation.html
 * Rural if the NZCouriers entry in AvailableServices says IsRural (falls back to
 * Address.IsRural). Cached 30 days per address. Fails open (not rural) if GSS is
 * slow or down, so checkout never breaks; the RD check still applies.
 */
function tlf_gss_says_rural( array $d ) {
	$street = trim( (string) ( $d['address'] ?? $d['address_1'] ?? '' ) );
	$pc     = trim( (string) ( $d['postcode'] ?? '' ) );
	if ( '' === $street || '' === $pc || ( isset( $d['country'] ) && 'NZ' !== $d['country'] ) ) {
		return false;
	}
	$body = array(
		'Consignee' => 'Checkout address check',
		'Address'   => array(
			'BuildingName'  => '',
			'StreetAddress' => $street,
			'Suburb'        => trim( (string) ( $d['address_2'] ?? '' ) ),
			'City'          => trim( (string) ( $d['city'] ?? '' ) ),
			'PostCode'      => $pc,
			'CountryCode'   => 'NZ',
		),
	);
	$key    = 'tlf_gss_rural_' . md5( strtolower( wp_json_encode( $body['Address'] ) ) );
	$cached = get_transient( $key );
	if ( false !== $cached ) {
		return 'yes' === $cached;
	}
	$res = wp_remote_post( 'https://api.gosweetspot.com/v2/addressvalidation', array(
		'timeout' => 4,
		'headers' => array(
			'access_key'   => TLF_GSS_ACCESS_KEY,
			'site_id'      => TLF_GSS_SITE_ID,
			'Content-Type' => 'application/json',
		),
		'body'    => wp_json_encode( $body ),
	) );
	if ( is_wp_error( $res ) || 200 !== (int) wp_remote_retrieve_response_code( $res ) ) {
		return false; // fail open, do not cache
	}
	$json  = json_decode( wp_remote_retrieve_body( $res ), true );
	$addr  = $json['Address'] ?? $json['address'] ?? array();
	$rural = null;
	foreach ( (array) ( $addr['AvailableServices'] ?? array() ) as $svc ) {
		if ( isset( $svc['Carrier'] ) && 0 === strcasecmp( $svc['Carrier'], 'NZCouriers' ) ) {
			$rural = ! empty( $svc['IsRural'] );
		}
	}
	if ( null === $rural ) {
		$rural = ! empty( $addr['Address']['IsRural'] ?? $addr['IsRural'] ?? false );
	}
	set_transient( $key, $rural ? 'yes' : 'no', 30 * DAY_IN_SECONDS );
	return $rural;
}
