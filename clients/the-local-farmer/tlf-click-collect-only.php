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

/**
 * Short haul and Long haul have no Click & Collect, so a collect-only item
 * there leaves no options. Show a clear message instead of the rural one.
 */
function tlf_collect_only_no_options_msg( $html ) {
	if ( function_exists( 'WC' ) && WC()->cart ) {
		foreach ( WC()->cart->get_cart() as $item ) {
			if ( ! empty( $item['data'] ) && 'click-collect-only' === $item['data']->get_shipping_class() ) {
				return '<p>Some items in your cart are Click &amp; Collect only and can&rsquo;t be delivered to this address. Please remove them to get delivery, or contact us to arrange collection.</p>';
			}
		}
	}
	return $html;
}
add_filter( 'woocommerce_no_shipping_available_html', 'tlf_collect_only_no_options_msg', 20 );
add_filter( 'woocommerce_cart_no_shipping_available_html', 'tlf_collect_only_no_options_msg', 20 );
