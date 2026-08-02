/* Layout smoke-test injected into a temp copy of a banner before render.
   Flags the ways these fixed-canvas banners actually break:
     · .b-pad content taller than the canvas (silently clipped)
     · text boxes overflowing their own width (scrollWidth > clientWidth)
     · content straying outside the banner box or under the marquee
   Deliberate bleeds (ghost glyph, skyline, marquee ticker) are exempt.
   Result is written into <title> so `--dump-dom` can read it back. */
(function () {
  function run() {
    var out = [];
    var banner = document.querySelector('.banner');
    if (!banner) { document.title = 'CHECK-FAIL no .banner'; return; }
    var br = banner.getBoundingClientRect();

    var marquee = banner.querySelector('.b-marquee');
    var floor = marquee ? marquee.getBoundingClientRect().top : br.bottom;

    function sig(el) {
      return el.tagName.toLowerCase() +
        (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') +
        ' "' + (el.textContent || '').trim().slice(0, 24) + '"';
    }
    function exempt(el) {
      return el.closest('.b-ghost, .b-skyline, .b-marquee, .feat-sky') !== null ||
             el.classList.contains('b-ghost') || el.classList.contains('b-skyline') ||
             el.classList.contains('feat-sky');
    }

    // 1. Canvas overflow — the pad column is taller than the banner.
    var pad = banner.querySelector('.b-pad');
    if (pad && pad.scrollHeight > pad.clientHeight + 1) {
      out.push('PAD-OVERFLOW scrollH=' + pad.scrollHeight + ' clientH=' + pad.clientHeight);
    }

    var els = banner.querySelectorAll('.b-pad *');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (exempt(el)) continue;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;

      // 2. Text clipped inside its own box.
      if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') {
        out.push('CLIPPED ' + sig(el) + ' sw=' + el.scrollWidth + ' cw=' + el.clientWidth);
      }
      // 3. Flex/inline child wider than the space it was given.
      if (el.children.length === 0 && r.right > br.right - 1) {
        out.push('PAST-RIGHT ' + sig(el) + ' right=' + Math.round(r.right - br.left));
      }
      if (el.children.length === 0 && r.left < br.left - 1) {
        out.push('PAST-LEFT ' + sig(el) + ' left=' + Math.round(r.left - br.left));
      }
      // 4. Content sliding under the gold marquee or off the bottom.
      if (el.children.length === 0 && r.bottom > floor + 1) {
        out.push('UNDER-MARQUEE ' + sig(el) + ' bottom=' + Math.round(r.bottom - br.top) +
                 ' floor=' + Math.round(floor - br.top));
      }
    }

    // 5. Images that never loaded.
    var imgs = banner.querySelectorAll('img');
    for (var j = 0; j < imgs.length; j++) {
      if (!imgs[j].complete || imgs[j].naturalWidth === 0) out.push('IMG-BROKEN ' + imgs[j].getAttribute('src'));
    }

    // 6. Fonts actually resolved (not the Georgia/Arial fallback). Read the
    //    families the banner really asks for off the rendered elements, so
    //    this keeps working when a banner overrides the design-system type.
    var want = {};
    var sample = banner.querySelectorAll('.b-pad, .b-pad *, .b-marquee, .b-marquee *');
    for (var m = 0; m < sample.length; m++) {
      var fam = getComputedStyle(sample[m]).fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (fam && !/^(serif|sans-serif|monospace|system-ui|ui-)/.test(fam)) want[fam] = true;
    }
    Object.keys(want).forEach(function (fam) {
      if (!document.fonts.check('600 40px "' + fam + '"')) out.push('FONT-MISSING ' + fam);
    });

    out.push('SIZE ' + Math.round(br.width) + 'x' + Math.round(br.height));
    document.title = 'CHECK ' + (out.length === 1 ? 'OK ' : 'ISSUES ') + out.join(' | ');
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(run, 250); });
  else window.addEventListener('load', run);
})();
