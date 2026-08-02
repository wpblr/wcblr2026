/* ════════════════════════════════════════════════════════════════════
   WordCamp Bengaluru 2026 — Banner "Download PNG" button
   Drop-in: include AFTER the html-to-image CDN and after the .banner
   markup. Adds a floating crimson pill that rasterises the 1080×1080
   .banner node to a pixel-exact PNG and downloads it. The button is
   position:fixed and lives OUTSIDE .banner, so it never appears in the
   exported image.

   Filename: reads [data-download-name] off .banner, else the document
   title, else "wordcamp-banner".
   ════════════════════════════════════════════════════════════════════ */
(function () {
  function slug(s) {
    return (s || 'wordcamp-banner').trim().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || 'wordcamp-banner';
  }

  /* ── Font embedding ────────────────────────────────────────────────
     The banners pull their type from Google Fonts via a cross-origin
     @import (styles.css → tokens/fonts.css → fonts.googleapis.com).
     html-to-image cannot read cross-origin @font-face rules, so it
     exports WITHOUT the fonts. To fix this reliably we build our own
     "fontEmbedCSS": fetch every Google Fonts stylesheet, then inline
     each referenced font file as a base64 data URI. Passing that to
     toPng() guarantees the PNG carries the real fonts.               */
  var _fontEmbedCSS = null;

  function collectFontCssUrls() {
    var urls = {};
    // <link rel=stylesheet href=...googleapis...>
    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) {
      if (l.href && /fonts\.googleapis\.com/.test(l.href)) urls[l.href] = true;
    });
    // Walk stylesheets recursively — the Google Fonts @import is nested
    // several levels deep (styles.css → tokens/fonts.css → googleapis).
    function walk(sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (e) { return; } // cross-origin: skip
      if (!rules) return;
      Array.prototype.forEach.call(rules, function (rule) {
        if (rule.type === CSSRule.IMPORT_RULE) {
          if (rule.href && /fonts\.googleapis\.com/.test(rule.href)) urls[rule.href] = true;
          if (rule.styleSheet) walk(rule.styleSheet);
        }
      });
    }
    Array.prototype.forEach.call(document.styleSheets, walk);
    return Object.keys(urls);
  }

  function fetchAsDataUri(url) {
    return fetch(url, { mode: 'cors', cache: 'force-cache' })
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var fr = new FileReader();
          fr.onload = function () { resolve(fr.result); };
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
      });
  }

  function buildFontEmbedCSS() {
    if (_fontEmbedCSS != null) return Promise.resolve(_fontEmbedCSS);
    var cssUrls = collectFontCssUrls();
    if (!cssUrls.length) { _fontEmbedCSS = ''; return Promise.resolve(''); }

    return Promise.all(cssUrls.map(function (u) {
      return fetch(u, { mode: 'cors' }).then(function (r) { return r.text(); }).catch(function () { return ''; });
    })).then(function (texts) {
      var css = texts.join('\n');
      // Find every url(...) pointing at a font file and inline it.
      var fontUrls = {};
      css.replace(/url\((['"]?)(https?:\/\/[^)'"]+)\1\)/g, function (_, q, u) { fontUrls[u] = true; return _; });
      var list = Object.keys(fontUrls);
      return Promise.all(list.map(function (u) {
        return fetchAsDataUri(u).then(function (d) { return { u: u, d: d }; }).catch(function () { return null; });
      })).then(function (pairs) {
        pairs.forEach(function (p) {
          if (!p) return;
          css = css.split(p.u).join(p.d);
        });
        _fontEmbedCSS = css;
        return css;
      });
    }).catch(function () { _fontEmbedCSS = ''; return ''; });
  }
  /* ── Rasterise, without downloading ────────────────────────────────
     Split out from the button so a caller can decide what to do with the
     result. Resolves with { name, dataUrl }. Exposed on window below, so
     the gallery can export a whole set in sequence without reimplementing
     the font embedding or guessing the export size.                    */
  function renderBannerPng() {
    var banner = document.querySelector('.banner');
    if (!banner) return Promise.reject(new Error('No .banner in this document'));
    if (!window.htmlToImage) return Promise.reject(new Error('html-to-image is not loaded'));

    var name = slug(banner.getAttribute('data-download-name') || document.title);
    // Export at the banner's own rendered size, so square (1080×1080) and
    // landscape featured-image (1200×630) variants both come out pixel-exact
    // from the same shared script.
    var expW = banner.offsetWidth || 1080;
    var expH = banner.offsetHeight || 1080;
    // Make sure fonts are actually loaded, then build embedded font CSS so
    // the exported PNG carries the real typefaces.
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

    return ready.then(buildFontEmbedCSS).then(function (fontEmbedCSS) {
      return window.htmlToImage.toPng(banner, {
        width: expW, height: expH, pixelRatio: 1, cacheBust: true,
        fontEmbedCSS: fontEmbedCSS,
        filter: function (node) { return node.id !== 'wc-download-btn'; }
      });
    }).then(function (dataUrl) {
      return { name: name + '.png', dataUrl: dataUrl };
    });
  }

  function saveDataUrl(name, dataUrl) {
    var a = document.createElement('a');
    a.download = name;
    a.href = dataUrl;
    a.click();
  }

  window.wcExportBanner = renderBannerPng;

  function init() {
    var banner = document.querySelector('.banner');
    if (!banner || !window.htmlToImage) return;

    var btn = document.createElement('button');
    btn.id = 'wc-download-btn';
    btn.type = 'button';
    btn.textContent = 'Download PNG';
    btn.setAttribute('style', [
      'position:fixed', 'right:20px', 'bottom:20px', 'z-index:99999',
      'font-family:var(--font-body, sans-serif)', 'font-weight:700', 'font-size:15px',
      'letter-spacing:0.02em', 'color:#F2ECE0', 'background:#C9344A',
      'border:none', 'border-radius:999px', 'padding:14px 22px', 'cursor:pointer',
      'box-shadow:0 10px 28px -10px rgba(43,28,20,.55)', 'transition:background .15s ease, transform .15s ease'
    ].join(';'));
    btn.addEventListener('mouseenter', function () { btn.style.background = '#DA4257'; btn.style.transform = 'translateY(-1px)'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = '#C9344A'; btn.style.transform = 'none'; });
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var label = btn.textContent;
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.textContent = 'Rendering…';
      renderBannerPng().then(function (out) {
        saveDataUrl(out.name, out.dataUrl);
      }).catch(function (e) {
        console.error('Banner export failed:', e);
        alert('Sorry, the PNG export failed — check the console.');
      }).then(function () {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = label;
      });
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
