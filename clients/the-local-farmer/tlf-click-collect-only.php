<?php
/**
 * The Local Farmer: "Click and collect only" products (mu-plugin).
 * Spectra Online, 17 Nov 2026.
 *
 * Any product in the shipping class with slug "click-collect-only" can only be
 * collected. If the cart holds one, delivery options are removed and only
 * Click & Collect is offered, with a short note. Candace sets the class on a
 * product (Product data > Shipping > Shipping class) to turn it on or off.
 * Undo = delete this file.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function tlf_cart_has_collect_only( $package ) {
	foreach ( (array) ( $package['contents'] ?? array() ) as $item ) {
		$product = $item['data'] ?? null;
		if ( $product && is_object( $product ) && 'click-collect-only' === $product->get_shipping_class() ) {
			return true;
		}
	}
	return false;
}

add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {
	if ( ! tlf_cart_has_collect_only( $package ) ) {
		return $rates;
	}
	foreach ( $rates as $id => $rate ) {
		if ( ! in_array( $rate->get_method_id(), array( 'local_pickup', 'pickup_location' ), true ) ) {
			unset( $rates[ $id ] );
		}
	}
	$msg = 'Some items in your cart are Click &amp; Collect only, so delivery is not available for this order.';
	if ( function_exists( 'wc_has_notice' ) && ! is_admin() && ! wc_has_notice( $msg, 'notice' ) ) {
		wc_add_notice( $msg, 'notice' );
	}
	return $rates;
}, 110, 2 );
