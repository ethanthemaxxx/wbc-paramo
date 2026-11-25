/* Páramo — home: sticky five-step stepper, term chips, typewriter + toasts. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- diagram states ---------- */
  var SCATTER = [[120, 90], [178, 150], [96, 214], [232, 96], [270, 206], [336, 118], [318, 256], [392, 80], [430, 186], [486, 110], [512, 236], [206, 262]];
  var SHEDS = [[124, 108], [170, 98], [134, 156], [180, 148], [278, 160], [324, 146], [290, 206], [338, 202], [440, 104], [486, 96], [452, 154], [496, 146]];
  var INPUTS = SHEDS.map(function (p, i) { return [60 + (i % 3) * 22, 70 + Math.floor(i / 3) * 52]; });
  var LAYERS = {
    1: { sheds: 0, flows: 0, fan: 0, alert: 0, dots: 1 },
    2: { sheds: 1, flows: 0, fan: 0, alert: 0, dots: 1 },
    3: { sheds: .45, flows: 1, fan: 0, alert: 0, dots: 1 },
    4: { sheds: 0, flows: 0, fan: 1, alert: 0, dots: 1 },
    5: { sheds: 0, flows: 0, fan: .35, alert: 1, dots: 0 }
  };
  function drawDiagram(svg, step) {
    if (!svg) return;
    svg.setAttribute('data-step', step);
    var pos = step === 1 ? SCATTER : step <= 3 ? SHEDS : INPUTS;
    $$('.dg-dot', svg).forEach(function (d, i) {
      d.style.transform = 'translate(' + pos[i][0] + 'px,' + pos[i][1] + 'px)' + (step >= 4 ? ' scale(.6)' : '');
      d.style.fill = step === 3 ? '#2f6f8f' : step === 4 ? '#d9a637' : '';
    });
    var l = LAYERS[step];
    Object.keys(l).forEach(function (k) {
      var g = $('.dg-' + k, svg);
      if (g) g.style.opacity = l[k];
    });
  }

  /* ---------- stepper ---------- */
  var section = $('.stepper');
  var stage = $('.stepper-stage');
  var diagram = $('.diagram', stage);
  var ticks = $$('.ticks span');
  var tickWrap = $('.ticks');
  var body = $('.step-body');
  var cap = $('.fig-cap');
  var steps = $$('.step', body);
  var caps = $$('.cap', cap);
  var current = 0, swapTimer, isStatic = false;
  // the five steps share one grid cell (see css), so swapping never changes the layout
  function show(list, n) { list.forEach(function (el, i) { el.classList.toggle('is-current', i === n); }); }
  function setStep(n, instant) {
    if (n === current && !instant) return;
    current = n;
    ticks.forEach(function (t, i) { t.classList.toggle('is-on', i === n); });
    if (tickWrap) tickWrap.setAttribute('aria-label', 'Step ' + (n + 1) + ' of 5');
    clearTimeout(swapTimer);
    if (instant || reduce) {
      show(steps, n); show(caps, n); drawDiagram(diagram, n + 1);
      return;
    }
    body.classList.add('is-out'); cap.classList.add('is-out');
    swapTimer = setTimeout(function () {
      show(steps, n); show(caps, n); drawDiagram(diagram, n + 1);
      body.classList.remove('is-out'); cap.classList.remove('is-out');
    }, 300);
  }

  /* The figure must fit under the sticky top on any screen. Shrink it to the height that is
     left; if even a small figure cannot fit (very short windows, 400 % zoom), list the five
     steps one after another, each with its own figure, and drop the sticky stage. */
  var staticList;
  function buildStatic() {
    if (staticList) return;
    staticList = document.createElement('ol');
    staticList.className = 'steps-static';
    staticList.setAttribute('aria-hidden', 'true');
    var fig = $('.figure', stage);
    steps.forEach(function (st, i) {
      var li = document.createElement('li');
      var s = st.cloneNode(true);
      s.classList.add('is-current');
      li.appendChild(s);
      var f = fig.cloneNode(true);
      $$('.cap', f).forEach(function (c, j) { if (j !== i) c.parentNode.removeChild(c); else c.classList.add('is-current'); });
      var fc = $('.fig-cap', f); if (fc) fc.classList.remove('is-out');
      f.style.maxWidth = '';
      drawDiagram($('.diagram', f), i + 1);
      li.appendChild(f);
      staticList.appendChild(li);
    });
    stage.parentNode.insertBefore(staticList, stage.nextSibling);
  }
  function fit() {
    if (!section || !stage) return;
    var fig = $('.figure', stage), text = $('.step-text', stage);
    section.classList.remove('is-static'); isStatic = false;
    fig.style.maxWidth = '';
    var cs = getComputedStyle(stage);
    var top = parseFloat(cs.top) || 0, pad = parseFloat(cs.paddingTop) || 0;
    var avail = window.innerHeight - top - pad - 16;
    var row = cs.display === 'grid' || cs.flexDirection === 'row';
    var textH = text.offsetHeight;
    var room = row ? avail : avail - textH - (parseFloat(cs.rowGap) || 0);
    var diagramH = room - 34 - cap.offsetHeight; // bezel padding and border, caption
    if (diagramH < 96 || (row && textH > avail)) {
      buildStatic();
      section.classList.add('is-static'); isStatic = true;
      return;
    }
    var maxW = Math.floor(diagramH * 608 / 327 + 34);
    if (maxW < fig.offsetWidth) fig.style.maxWidth = maxW + 'px';
  }

  if (section && body) {
    setStep(0, true);
    var wrap = $('.product-wrap', section);
    var endDistance = function () { return Math.max(800, section.offsetHeight - (wrap ? wrap.offsetHeight : 0) - window.innerHeight * 0.5); };
    var raf = 0;
    var onScroll = function () {
      raf = 0;
      if (isStatic) return;
      var top = section.getBoundingClientRect().top;
      setStep(Math.min(4, Math.max(0, Math.floor(Math.min(1, Math.max(0, -top / endDistance())) * 5))));
    };
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
    fit();
    onScroll();
    var fz, fitW = window.innerWidth, fitH = window.innerHeight;
    window.addEventListener('resize', function () {
      clearTimeout(fz);
      fz = setTimeout(function () {
        // a phone toolbar sliding in or out is not a new layout: ignore small height-only changes
        if (window.innerWidth === fitW && Math.abs(window.innerHeight - fitH) < 160) return;
        fitW = window.innerWidth; fitH = window.innerHeight;
        fit(); onScroll();
      }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); });
  }

  /* ---------- interactive term + chips ---------- */
  var term = $('.term'), h2 = term && term.closest('h2');
  if (term && h2) {
    var on = function () { h2.classList.add('is-term-on'); };
    var off = function () { if (!term.classList.contains('is-pinned')) h2.classList.remove('is-term-on'); };
    term.addEventListener('mouseenter', on);
    term.addEventListener('mouseleave', off);
    term.addEventListener('focus', on);
    term.addEventListener('blur', function () { term.classList.remove('is-pinned'); off(); });
    term.addEventListener('click', function () {
      if (term.classList.toggle('is-pinned')) on(); else h2.classList.remove('is-term-on');
    });
  }

  /* ---------- typewriter + toasts ---------- */
  var tw = $('.typewriter .tw-text');
  var items = $$('.services li');
  var toast = $('.toast');
  var product = $('.product');
  var toggle = $('.tw-toggle');
  if (tw && items.length && toast && !reduce) {
    var idx = 0, typing = 0, cycle = 0, visible = false, paused = false;
    var icons = {};
    $$('template[data-icon]').forEach(function (t) { icons[t.getAttribute('data-icon')] = t.innerHTML; });
    var type = function (text) {
      clearInterval(typing);
      var i = 0;
      tw.textContent = '';
      typing = setInterval(function () {
        i++;
        tw.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(typing);
      }, 30);
    };
    var showToast = function (li) {
      $('.toast-title', toast).textContent = li.getAttribute('data-title');
      $('.toast-desc', toast).textContent = li.getAttribute('data-desc');
      $('.toast-icon', toast).innerHTML = icons[li.getAttribute('data-icon')] || '';
      toast.classList.remove('is-entering');
      void toast.offsetWidth;
      toast.classList.add('is-entering');
    };
    var next = function () {
      idx = (idx + 1) % items.length;
      var li = items[idx];
      tw.classList.add('is-fading');
      setTimeout(function () {
        tw.classList.remove('is-fading');
        type(li.textContent);
        showToast(li);
      }, 200);
    };
    var start = function () { if (!cycle && !paused) cycle = setInterval(next, 4000); };
    var stop = function () { clearInterval(cycle); cycle = 0; };
    // WCAG 2.2.2: content that changes on its own gets a way to stop it
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        paused = !paused;
        toggle.firstChild.textContent = paused ? 'Play examples' : 'Pause examples';
        product.classList.toggle('is-paused', paused);
        if (paused) { stop(); clearInterval(typing); tw.textContent = items[idx].textContent; }
        else if (visible) start();
      });
    }
    if ('IntersectionObserver' in window && product) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; if (visible && !document.hidden) start(); else stop(); });
      }, { threshold: 0.2 }).observe(product);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    } else start();
  }
})();
