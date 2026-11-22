<?php
/**
 * Plugin Name: Spectra Meta Pixel
 * Description: Meta Pixel (dataset 441517592665285) on every public page, plus a Lead event when the Clarity Scorecard is submitted. Added 23 Nov 2026 for the Clarity Scorecard Meta ads. Skips logged-in users so Anna's own visits don't count.
 */
if (!defined('ABSPATH')) { exit; }

add_action('wp_head', function () {
    if (is_admin() || is_user_logged_in()) { return; }
    ?>
<!-- Meta Pixel (Spectra) -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '441517592665285');
fbq('track', 'PageView');
(function(){
  var sent = false, of = window.fetch;
  if (!of) return;
  window.fetch = function(u, o){
    try {
      var s = (typeof u === 'string') ? u : (u && u.url) || '';
      if (!sent && s.indexOf('/webhook/clarity-audit') > -1) {
        sent = true;
        fbq('track', 'Lead', {content_name: 'Clarity Scorecard'});
      }
    } catch(e) {}
    return of.apply(this, arguments);
  };
})();
</script>
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=441517592665285&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel -->
    <?php
}, 20);
