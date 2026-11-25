/* Páramo — shared behaviour. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var root = doc.getAttribute('data-root') || '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PHASE_NAMES = { dawn: 'Dawn', day: 'Day', golden: 'Golden hour', night: 'Night' };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function heroSrc(p, w) { return root + 'assets/hero-' + p + '-' + w + '.webp'; }

  /* ---------- clock (Bogotá, 24 h) ---------- */
  var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function bogotaParts(now) {
    var out = {};
    fmt.formatToParts(now).forEach(function (p) { out[p.type] = p.value; });
    return { h: +out.hour % 24, m: +out.minute, s: +out.second };
  }
  var turns = 0, lastDeg = null;
  function tickClock() {
    var t = bogotaParts(new Date());
    var label = String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0');
    var deg = (t.h % 12) * 30 + t.m * 0.5 + t.s * 0.0083;
    if (lastDeg !== null && deg < lastDeg) turns++;
    lastDeg = deg;
    $$('.clock-time').forEach(function (el) { if (el.textContent !== label) el.textContent = label; });
    $$('.clock-hand').forEach(function (el) { el.style.transform = 'rotate(' + (deg + turns * 360) + 'deg)'; });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- sun phase ---------- */
  function currentPhase() {
    if (doc.hasAttribute('data-phase-fixed')) return doc.getAttribute('data-phase');
    return window.paramoPhase ? window.paramoPhase(Date.now()) : 'day';
  }
  function applyPhaseText(p) {
    $$('.clock').forEach(function (el) { el.title = PHASE_NAMES[p]; });
    $$('[data-phase-line]').forEach(function (el) { el.hidden = el.getAttribute('data-phase-line') !== p; });
  }
  function swapHero(p, done) {
    var medias = $$('.hero-media');
    if (!medias.length) { if (done) done(); return; }
    medias.forEach(function (media, k) {
      var cur = media.querySelector('img:not(.is-next)');
      if (!cur) return;
      var next = cur.cloneNode(false);
      next.classList.add('is-next');
      next.removeAttribute('fetchpriority');
      next.srcset = heroSrc(p, 1280) + ' 1280w, ' + heroSrc(p, 1920) + ' 1920w, ' + heroSrc(p, 2560) + ' 2560w';
      next.src = heroSrc(p, 1920);
      var a = cur.getAttribute('data-alt-' + p);
      if (a) next.alt = a;
      next.addEventListener('load', function () {
        requestAnimationFrame(function () {
          next.classList.remove('is-next');
          setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, reduce.matches ? 0 : 1050);
          if (done && k === 0) done();
        });
      }, { once: true });
      media.appendChild(next);
    });
  }
  function setPhase(p, announce) {
    if (p === doc.getAttribute('data-phase')) return;
    doc.setAttribute('data-phase', p);
    applyPhaseText(p);
    // the pixel art is drawn from the new hero once it has loaded, so the file is fetched once
    swapHero(p, redrawArt);
    if (announce) {
      var live = $('#phase-live');
      if (live) live.textContent = 'It is now ' + PHASE_NAMES[p] + ' in Bogotá.';
    }
  }
  applyPhaseText(doc.getAttribute('data-phase'));
  function recheck() { setPhase(currentPhase(), true); }
  setInterval(recheck, 60000);
  window.addEventListener('focus', recheck);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) recheck(); });

  /* ---------- pixel art from the scene (footer, product card, About values) ----------
     The scene is shrunk to 6 px cells, then every cell is snapped to a small palette
     with a 4 × 4 Bayer matrix (ordered dithering). Each light phase has its own palette
     built from the brand's moss, frailejón gold and water blue, so the art follows the sun. */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  var MOSS = ['#14201a', '#2b3a30', '#3d5a4c', '#6b8272', '#a5b2a0'];
  var PALETTES = {
    dawn: MOSS.concat(['#5f6b2c', '#a89a4c', '#d9a637', '#245a75', '#5d6f96', '#8e89a8', '#c49aa0', '#e6c4b4', '#f7f8f2']).map(rgb),
    day: MOSS.concat(['#5f6b2c', '#9c9a3c', '#d9a637', '#f0c95e', '#1f3f6e', '#2f5e9a', '#2f6f8f', '#6fa3bd', '#f7f8f2']).map(rgb),
    golden: MOSS.slice(0, 4).concat(['#5e4048', '#8a6414', '#b4623a', '#d9a637', '#e7a56b', '#f0c95e', '#c98a7a', '#f7e3c4']).map(rgb),
    night: ['#0b1220', '#14201a', '#1a2840', '#2b3a30', '#3d5a4c', '#245a75', '#3f5f8a', '#6b8272', '#a5b2a0', '#d9a637', '#f0c95e', '#f7f8f2'].map(rgb)
  };
  // the product card is a single water-blue ramp, with the frailejón flowers kept in gold
  var WATER = ['#163648', '#1f4c64', '#2a6585', '#4d89a8', '#8db7cb', '#d6e6ec'].map(rgb);
  // below 1024 px the art runs under the card's text: a darker ramp keeps white text at 4.5:1 or more
  var WATER_DEEP = ['#0f2836', '#163648', '#1f4c64', '#2a6585', '#3f7c9c'].map(rgb);
  var GOLD = [rgb('#b9821d'), rgb('#f0c95e')];
  function nearest(pal, r, g, b) {
    var best = pal[0], bd = Infinity;
    for (var i = 0; i < pal.length; i++) {
      var p = pal[i], rm = (r + p[0]) / 2, dr = r - p[0], dg = g - p[1], db = b - p[2];
      var dist = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (dist < bd) { bd = dist; best = p; }
    }
    return best;
  }
  function dither(d, w, h, opts) {
    var x, y, i, t;
    if (opts.ramp) {
      // luminance ramp, levelled so any phase fills the whole ramp
      var lum = new Float32Array(w * h), sorted;
      for (i = 0; i < w * h; i++) lum[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
      sorted = Array.prototype.slice.call(lum).sort(function (a, b) { return a - b; });
      var lo = sorted[(sorted.length * 0.03) | 0], hi = sorted[(sorted.length * 0.97) | 0], n = opts.ramp.length - 1;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        i = y * w + x; t = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
        var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], c;
        if (opts.gold && r > 140 && g > 100 && r - b > 90 && g - b > 50 && r >= g) c = GOLD[t < 0 ? 0 : 1];
        else c = opts.ramp[Math.max(0, Math.min(n, Math.round(((lum[i] - lo) / Math.max(1, hi - lo)) * n + t)))];
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2];
      }
      return;
    }
    var pal = opts.palette, spread = opts.spread || 40, sat = 1.12;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = (y * w + x) * 4; t = ((BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5) * spread;
      var R = d[i], G = d[i + 1], B = d[i + 2], L = 0.299 * R + 0.587 * G + 0.114 * B;
      var q = nearest(pal, L + (R - L) * sat + t, L + (G - L) * sat + t, L + (B - L) * sat + t);
      d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2];
    }
  }
  var scenes = {};
  function withScene(src, fn) {
    var s = scenes[src];
    if (s && s.complete && s.naturalWidth) { fn(s); return; }
    if (!s) {
      s = scenes[src] = new Image();
      s.decoding = 'async'; s._q = [];
      s.onload = function () { var q = s._q; s._q = []; q.forEach(function (f) { f(s); }); };
      s.src = src;
    }
    s._q.push(fn);
  }
  function sceneSrc() {
    // reuse the hero file that is already on screen; inner pages fetch the 1280 file once
    var p = doc.getAttribute('data-phase'), imgs = $$('.hero-media img.hero-img');
    for (var i = 0; i < imgs.length; i++) {
      var s = imgs[i].currentSrc;
      if (imgs[i].complete && s && s.indexOf('hero-' + p + '-') > -1) return s;
    }
    return heroSrc(p, 1280);
  }
  function paint(canvas, opts) {
    withScene(sceneSrc(), function (img) {
      var box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var cell = opts.cell || 6;
      var w = Math.max(8, Math.round(box.width / cell)), h = Math.max(8, Math.round(box.height / cell));
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      var ar = w / h, iw = img.naturalWidth, ih = img.naturalHeight;
      var sw = iw * (opts.zoom || 1), sh = sw / ar;
      if (sh > ih) { sh = ih; sw = sh * ar; }
      var sx = (iw - sw) * (opts.x == null ? 0.5 : opts.x);
      var sy = (ih - sh) * (opts.y == null ? 1 : opts.y);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      try {
        var data = ctx.getImageData(0, 0, w, h);
        dither(data.data, w, h, opts);
        ctx.putImageData(data, 0, 0);
      } catch (e) { /* file:// or tainted canvas: keep the smooth downscale */ }
    });
  }
  var ART = [
    // footer: frailejones, the shore and the walker, closer than the hero panorama (no sky on narrow screens)
    { canvas: '.reveal-canvas', watch: '.site-footer', opts: function (p) {
      return window.innerWidth < 768 ? { cell: 6, zoom: 0.42, x: 0.72, y: 0.9, palette: PALETTES[p] } : { cell: 6, zoom: 0.75, x: 0.3, y: 0.85, palette: PALETTES[p] };
    } },
    // product card: the far shore and the frailejones, in water blue with gold flowers
    { canvas: '.product-canvas', watch: '.product', opts: function () {
      return window.innerWidth < 1024 ? { cell: 6, zoom: 0.5, x: 0.95, y: 0.75, ramp: WATER_DEEP } : { cell: 6, zoom: 0.5, x: 0.95, y: 0.75, ramp: WATER, gold: true };
    } },
    // About values: the frailejón rosettes up close
    { canvas: '.values-canvas', watch: '.values-frame', opts: function (p) { return { cell: 6, zoom: 0.45, x: 0.05, y: 0.9, palette: PALETTES[p] }; } }
  ].filter(function (a) { a.el = $(a.canvas); a.target = $(a.watch); return a.el && a.target; });
  function drawArt(a) { a.drawn = true; paint(a.el, a.opts(doc.getAttribute('data-phase') || 'day')); }
  function redrawArt() { ART.forEach(function (a) { if (a.drawn) drawArt(a); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        ART.forEach(function (a) { if (a.target === e.target && !a.drawn) drawArt(a); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '600px 0px' });
    ART.forEach(function (a) { io.observe(a.target); });
  } else ART.forEach(drawArt);
  var rz, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      // phones fire resize when the toolbar hides: only redraw when the width changes
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth; redrawArt();
    }, 250);
  });

  /* ---------- nav theme by section ---------- */
  var header = $('.site-header');
  var themed = $$('[data-nav-theme]');
  var ticking = false;
  function updateTheme() {
    ticking = false;
    var y = 60, theme = null;
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) theme = themed[i].getAttribute('data-nav-theme');
    }
    if (theme && header && header.getAttribute('data-theme') !== theme) header.setAttribute('data-theme', theme);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateTheme); } }, { passive: true });
  updateTheme();

  /* ---------- mobile menu ---------- */
  var burger = $('.nav-burger'), menu = $('#menu'), lock = false;
  function setMenu(open) {
    if (!burger || !menu || lock) return;
    lock = true; setTimeout(function () { lock = false; }, 350);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    // the page behind the opaque panel is out of reach while the menu is open
    ['main', '.site-footer'].forEach(function (s) {
      var el = $(s);
      if (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
    });
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) { var f = menu.querySelector('a'); if (f) setTimeout(function () { f.focus(); }, 60); }
    else burger.focus();
  }
  if (burger && menu) {
    menu.setAttribute('inert', '');
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { lock = false; setMenu(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && burger.getAttribute('aria-expanded') === 'true') { lock = false; setMenu(false); }
    });
  }

  /* ---------- word reveal (home H1 + vision line) ---------- */
  function splitWords(el) {
    var i = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part;
        if (el.hasAttribute('aria-label')) s.setAttribute('aria-hidden', 'true');
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  $$('.reveal-words').forEach(function (el) {
    splitWords(el);
    if (reduce.matches) { el.classList.add('is-in'); return; }
    if (el.getAttribute('data-reveal') === 'scroll' && 'IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { el.classList.add('is-in'); o.disconnect(); } });
      }, { rootMargin: '0px 0px -20% 0px' });
      o.observe(el);
    } else {
      setTimeout(function () { el.classList.add('is-in'); }, 100);
    }
  });

  /* ---------- pixel dissolve (vision frailejón) ---------- */
  $$('.vision .pixel-art').forEach(function (svg) {
    var rects = $$('rect', svg);
    if (reduce.matches || !('IntersectionObserver' in window)) { svg.classList.add('is-in'); return; }
    for (var k = rects.length - 1; k > 0; k--) { var j = (Math.random() * (k + 1)) | 0, t = rects[k]; rects[k] = rects[j]; rects[j] = t; }
    var groups = 8, per = Math.ceil(rects.length / groups);
    rects.forEach(function (r, n) {
      var g = (n / per) | 0, within = n % per;
      r.style.transitionDelay = (g * 10 + within * 10) + 'ms';
    });
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { svg.classList.add('is-in'); o.disconnect(); } });
    }, { rootMargin: '0px 0px -20% 0px' });
    o.observe(svg);
  });

  /* ---------- signatures (about) ---------- */
  $$('.letter-wrap').forEach(function (el) {
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { el.classList.add('is-in'); o.disconnect(); } });
    }, { threshold: 0.3 });
    o.observe(el);
  });

  /* ---------- copy link (article) ---------- */
  $$('[data-copy-link]').forEach(function (btn) {
    var label = $('.copy-label', btn), status = $('[data-copy-status]');
    btn.addEventListener('click', function () {
      var done = function () {
        label.textContent = 'Link copied';
        if (status) status.textContent = 'Link copied';
        setTimeout(function () { label.textContent = 'Copy link'; }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done);
      else {
        var t = document.createElement('textarea'); t.value = location.href; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      }
    });
  });

  /* ---------- request form (local validation, simulated send) ---------- */
  var form = $('[data-request-form]');
  if (form) {
    var summary = $('[data-summary]'), sendErr = $('[data-send-error]'), success = $('[data-success]');
    var submit = $('.form-submit', form), submitLabel = $('.submit-label', form);
    var rules = {
      name: function (v) { return v.trim() ? '' : 'Add your name so we know who to answer.'; },
      email: function (v) {
        if (!v.trim()) return 'Add your work email so we can reply.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'This email looks incomplete. Check for a missing @ or domain.';
      },
      org: function (v) { return v.trim() ? '' : 'Add the name of your organization.'; },
      type: function (v) { return v ? '' : 'Choose the option that fits you best.'; },
      message: function (v) { return v.length > 1000 ? 'Please shorten this to 1,000 characters or fewer.' : ''; },
      consent: function (v, el) { return el.checked ? '' : 'Tick the box so we can reply to you.'; }
    };
    function check(name) {
      var el = form.elements[name];
      var msg = rules[name](el.value, el);
      var out = $('#e-' + name);
      if (out) out.textContent = msg;
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      return msg;
    }
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur', function () {
        if (el.getAttribute('aria-invalid') === 'true' || el.value) check(name);
      });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(name); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendErr.hidden = true;
      var bad = Object.keys(rules).filter(function (n) { return check(n); });
      if (bad.length) {
        summary.textContent = 'Fix ' + bad.length + ' field(s) below to send your request.';
        summary.hidden = false;
        // keep the summary clear of the fixed nav, then move focus to the first field to fix
        form.elements[bad[0]].focus({ preventScroll: true });
        summary.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
        return;
      }
      summary.hidden = true;
      submit.disabled = true; submit.setAttribute('aria-busy', 'true');
      submitLabel.textContent = 'Sending request…';
      setTimeout(function () {
        submit.disabled = false; submit.removeAttribute('aria-busy');
        if (navigator.onLine === false) {
          submitLabel.textContent = 'Send request again';
          sendErr.hidden = false;
          return;
        }
        form.hidden = true;
        success.hidden = false;
        var h = $('h2', success); if (h) h.focus();
      }, 900);
    });
  }
})();
