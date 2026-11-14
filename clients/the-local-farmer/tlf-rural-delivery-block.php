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

const TLF_RURAL_USE_GSS = false; // Phase 2 switch.

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
 * Phase 2 stub: GoSweetSpot POST v2/addressvalidation (per NZ Couriers CI,
 * 30 Sep 2026). Request/response fields still to confirm against the GSS API
 * docs once the key is in hand. Result cached 30 days per address. Fails open
 * (returns false) if GSS is down, so checkout never breaks.
 */
function tlf_gss_says_rural( array $d ) {
	$key = 'tlf_gss_rural_' . md5( strtolower( implode( '|', $d ) ) );
	$cached = get_transient( $key );
	if ( false !== $cached ) { return 'yes' === $cached; }
	// TODO: wp_remote_post to GSS with access_key + site_id from wp-config constants.
	return false;
}
