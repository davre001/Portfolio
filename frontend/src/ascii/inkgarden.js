/* ============================================================================
 * Ink Garden — "Electric Gaze" ASCII-art photo effect (Canvas2D, reimplemented)
 *
 * Self-contained engine. Exposes window.InkGarden (the renderer),
 * window.InkGardenDefaults (the full parameter set), and window.InkGardenCharSets.
 *
 * Pipeline per frame (render(t)):
 *   1. background (bgMode / bgBlur / bgOpacity)
 *   2. grid the canvas into cellSize cells; sample average colour per cell
 *   3. per-cell shape per renderMode (characters/dither/mosaic/dots/cross/
 *      diamond/voxel/lego/mixed/lines/diagonal/braille/disco); respect coverage,
 *      density, invert, edgeEmphasis
 *   4. colour adjustments: brightness, contrast, saturation, grayscale, then
 *      tint @ tintOpacity via overlayBlend; blur via blurType/blurAmount
 *   5. post-effects (pfx) when enabled, at their intensity
 *   6. glow lights when enabled
 *   7. reveal mask back to the plain photo when enabled
 *   8. animation (animStyle) over time t
 * ========================================================================== */
const __inkgarden = (function (root) {
  'use strict';

  /* ----------------------------- math helpers ---------------------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function frac(x) { return x - Math.floor(x); }
  function hash2(c, r) { return frac(Math.sin(c * 127.1 + r * 311.7) * 43758.5453); }
  function lumOf(r, g, b) { return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

  function hexToRgb(hex) {
    if (typeof hex !== 'string') return [200, 200, 200];
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [200, 200, 200];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function overlayC(a, b) {
    a /= 255; b /= 255;
    var r = a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b);
    return clamp(r * 255, 0, 255);
  }
  function softLightC(a, b) {
    a /= 255; b /= 255;
    var r = b < 0.5 ? 2 * a * b + a * a * (1 - 2 * b) : 2 * a * (1 - b) + Math.sqrt(Math.max(0, a)) * (2 * b - 1);
    return clamp(r * 255, 0, 255);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ------------------------------- defaults ------------------------------- */
  var InkGardenCharSets = {
    standard: ' .:-=+*#%@',
    blocks: ' ░▒▓█',
    simple: ' .:*#',
    dots: ' ·•●',
    ascii: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
  };

  var InkGardenDefaults = {
    renderMode: 'dither',
    bgMode: 'none',
    bgBlur: 12,
    bgOpacity: 90,
    cellSize: 9,
    coverage: 100,
    invert: false,
    styleBlend: 'source-over',
    charSet: 'standard',
    customChars: '',
    brightness: 0,
    contrast: 158,
    edgeEmphasis: 0,
    density: 20,
    toneCurve: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    tint: '#3ca6ff',
    tintOpacity: 0,
    overlayBlend: 'multiply',
    saturation: 100,
    grayscale: 0,
    blurType: 'off',
    blurAmount: 35,
    blurAngle: 0,
    directionalBothSides: false,
    tiltFocus: 35,
    tiltPosition: 50,
    tiltFeather: 15,
    lensFocus: 40,
    blurCenterX: 50,
    blurCenterY: 50,
    progressivePosition: 55,
    progressiveReverse: false,
    pfx: {
      vignette: { enabled: false, intensity: 38 },
      scanLines: { enabled: false, intensity: 40 },
      chromatic: { enabled: false, intensity: 15 },
      bloom: { enabled: false, intensity: 25 },
      filmGrain: { enabled: false, intensity: 30 },
      glitch: { enabled: false, intensity: 20 },
      pixelate: { enabled: false, intensity: 15 },
      halftone: { enabled: false, intensity: 20 },
      filmDust: { enabled: false, intensity: 20 }
    },
    animated: true,
    animStyle: 'shimmer',
    animSpeed: { enabled: true, intensity: 100 },
    animIntensity: { enabled: true, intensity: 60 },
    animRandomness: { enabled: false, intensity: 0 },
    lights: { enabled: false, points: [] },
    mask: {
      enabled: false, tool: 'freehand', brushSize: 30, showOverlay: false,
      invert: false, dataUrl: null, shapes: []
    },
    dotGrid: false
  };

  /* ------------------------------- engine --------------------------------- */
  function InkGarden(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    this.opts = opts;
    this.params = opts.params || JSON.parse(JSON.stringify(InkGardenDefaults));
    this.maxOut = opts.maxOut || 900;
    this.onFrame = opts.onFrame || null;
    this._raf = 0;
    this.source = null;
    this.outW = 0; this.outH = 0;
    this._samp = null;
    this._fxC = null;
    this._tmp = null;
    this._noise = null;
    this._maskImg = null;
    this._maskReady = false;
  }

  InkGarden.prototype._makeCanvas = function (w, h) {
    var d = (typeof document !== 'undefined') ? document : null;
    if (d && d.createElement) {
      var cv = d.createElement('canvas');
      cv.width = w; cv.height = h;
      return cv;
    }
    return {
      width: w, height: h,
      getContext: function () {
        return new Proxy({}, {
          get: function (t, p) {
            if (p === 'getImageData') return function (x, y, ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4), width: ww, height: hh }; };
            if (p === 'createLinearGradient' || p === 'createRadialGradient') return function () { return { addColorStop: function () {} }; };
            if (p === 'createPattern') return function () { return {}; };
            if (p === 'measureText') return function () { return { width: 0 }; };
            return function () {};
          },
          set: function () { return true; }
        });
      }
    };
  };

  InkGarden.prototype._isDrawable = function (img) {
    if (!img) return false;
    if (typeof Image !== 'undefined' && img instanceof Image) return true;
    if (img.getContext) return true;
    if (img.complete !== undefined && img.width > 0) return true;
    return false;
  };

  InkGarden.prototype._fit = function (w, h) {
    if (!w || !h) { w = 640; h = 400; }
    var scale = Math.min(1, this.maxOut / Math.max(w, h));
    this.outW = Math.max(1, Math.round(w * scale));
    this.outH = Math.max(1, Math.round(h * scale));
    if (this.canvas) { this.canvas.width = this.outW; this.canvas.height = this.outH; }
  };

  InkGarden.prototype._paintProcedural = function (ctx, w, h, seed) {
    seed = seed || 7;
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'hsl(' + (seed * 40 % 360) + ',60%,45%)');
    g.addColorStop(1, 'hsl(' + ((seed * 40 + 120) % 360) + ',55%,30%)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var rnd = function (n) { return frac(Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453); };
    for (var i = 0; i < 60; i++) {
      var x = rnd(i) * w, y = rnd(i + 99) * h, r = (8 + rnd(i + 7) * 60);
      var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,' + (0.15 + rnd(i + 3) * 0.5) + ')');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    for (var j = 0; j < 14; j++) {
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.1 + rnd(j + 200) * 0.3) + ')';
      ctx.lineWidth = 1 + rnd(j + 5) * 4;
      ctx.beginPath();
      ctx.moveTo(rnd(j) * w, rnd(j + 1) * h);
      ctx.lineTo(rnd(j + 2) * w, rnd(j + 3) * h);
      ctx.stroke();
    }
  };

  /* --------------------------- public image API --------------------------- */
  InkGarden.prototype.setImage = function (img) {
    if (!img) return;
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    this._fit(w, h);
    this.source = this._makeCanvas(this.outW, this.outH);
    var sctx = this.source.getContext('2d');
    if (this._isDrawable(img)) {
      try { sctx.drawImage(img, 0, 0, this.outW, this.outH); } catch (e) { this._paintProcedural(sctx, this.outW, this.outH, 7); }
    } else {
      this._paintProcedural(sctx, this.outW, this.outH, 7);
    }
    if (!this._raf) this.render((typeof performance !== 'undefined' ? performance.now() : 0));
  };

  InkGarden.prototype.generateSampleScene = function (n) {
    var w = Math.min(this.maxOut, 640), h = Math.min(this.maxOut, 400);
    this._fit(w, h);
    this.source = this._makeCanvas(this.outW, this.outH);
    this._paintProcedural(this.source.getContext('2d'), this.outW, this.outH, n || 7);
    if (!this._raf) this.render((typeof performance !== 'undefined' ? performance.now() : 0));
  };

  InkGarden.prototype.loadReference = function (path) {
    var self = this;
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { self.setImage(img); res(true); };
      img.onerror = function () { res(false); };
      img.src = path;
    });
  };

  InkGarden.prototype.start = function () {
    if (this._raf) return;
    var self = this;
    var loop = function (t) {
      self.render(t);
      if (self.onFrame) self.onFrame();
      if (typeof requestAnimationFrame !== 'undefined') self._raf = requestAnimationFrame(loop);
      else self._raf = 0;
    };
    if (typeof requestAnimationFrame !== 'undefined') this._raf = requestAnimationFrame(loop);
    else this._raf = 0;
  };

  InkGarden.prototype.stop = function () {
    if (this._raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._raf);
    this._raf = 0;
  };

  /* ------------------------------- sampling ------------------------------- */
  InkGarden.prototype._sample = function (cols, rows) {
    if (!this._samp || this._samp.width !== cols || this._samp.height !== rows) {
      this._samp = this._makeCanvas(cols, rows);
    }
    var c = this._samp.getContext('2d');
    c.clearRect(0, 0, cols, rows);
    if (this.source) {
      try { c.drawImage(this.source, 0, 0, cols, rows); } catch (e) {}
    } else {
      c.fillRect(0, 0, cols, rows);
    }
    return c.getImageData(0, 0, cols, rows);
  };

  InkGarden.prototype._edge = function (lum, cols, rows) {
    var e = new Float32Array(cols * rows);
    for (var r = 1; r < rows - 1; r++) {
      for (var c = 1; c < cols - 1; c++) {
        var i = r * cols + c;
        var gx = lum[i + 1] - lum[i - 1];
        var gy = lum[i + cols] - lum[i - cols];
        e[i] = Math.sqrt(gx * gx + gy * gy) * 255;
      }
    }
    return e;
  };

  /* ----------------------------- adjustments ------------------------------ */
  InkGarden.prototype._adjustColor = function (r, g, b, p) {
    var br = (p.brightness || 0) / 100;
    r += br * 255; g += br * 255; b += br * 255;
    var cf = (p.contrast || 128) / 128;
    r = (r - 128) * cf + 128; g = (g - 128) * cf + 128; b = (b - 128) * cf + 128;
    var s = (p.saturation != null ? p.saturation : 100) / 100;
    var l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * s; g = l + (g - l) * s; b = l + (b - l) * s;
    var gy = (p.grayscale || 0) / 100;
    if (gy > 0) { var gl = 0.299 * r + 0.587 * g + 0.114 * b; r = r + (gl - r) * gy; g = g + (gl - g) * gy; b = b + (gl - b) * gy; }
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
  };

  InkGarden.prototype._applyTint = function (r, g, b, p) {
    var op = (p.tintOpacity || 0) / 100;
    if (!op) return [r, g, b];
    var t = hexToRgb(p.tint || '#ffffff');
    var out;
    switch (p.overlayBlend) {
      case 'multiply': out = [r * t[0] / 255, g * t[1] / 255, b * t[2] / 255]; break;
      case 'screen': out = [255 - (255 - r) * (255 - t[0]) / 255, 255 - (255 - g) * (255 - t[1]) / 255, 255 - (255 - b) * (255 - t[2]) / 255]; break;
      case 'overlay': out = [overlayC(r, t[0]), overlayC(g, t[1]), overlayC(b, t[2])]; break;
      case 'soft-light': out = [softLightC(r, t[0]), softLightC(g, t[1]), softLightC(b, t[2])]; break;
      case 'tint': out = [t[0], t[1], t[2]]; break;
      default: out = [r * t[0] / 255, g * t[1] / 255, b * t[2] / 255];
    }
    return [r + (out[0] - r) * op, g + (out[1] - g) * op, b + (out[2] - b) * op];
  };

  /* ------------------------------- shapes --------------------------------- */
  InkGarden.prototype._charset = function (p) {
    var cs = InkGardenCharSets;
    var name = p.charSet;
    var s = (name && cs[name]) ? cs[name] : cs.standard;
    if (p.customChars) s = p.customChars;
    return s && s.length ? s : cs.standard;
  };

  InkGarden.prototype._drawCell = function (f, mode, x, y, cx, cy, cell, L, density, cr, cg, cb, charset, c, r, time, amp, spd, p) {
    var col = 'rgb(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ')';
    var k = clamp01(L) * (0.55 + 0.6 * density);
    f.fillStyle = col; f.strokeStyle = col;
    var half = cell * k / 2;
    var i;

    if (mode === 'characters') {
      var ci = Math.min(charset.length - 1, Math.floor(clamp01(L) * charset.length));
      var ch = charset.charAt(ci) || ' ';
      if (ch !== ' ') {
        f.font = Math.floor(cell * 0.95) + 'px monospace';
        f.textAlign = 'center'; f.textBaseline = 'middle';
        f.fillText(ch, cx, cy);
      }
      return;
    }
    if (mode === 'dither' || mode === 'dots') {
      var rad = Math.max(0.5, cell * 0.5 * k);
      f.beginPath(); f.arc(cx, cy, rad, 0, 7); f.fill();
      return;
    }
    if (mode === 'mosaic') {
      var g = Math.max(1, cell * 0.06);
      var w = cell - g;
      f.fillRect(x + g / 2, y + g / 2, w, w);
      return;
    }
    if (mode === 'pixel') {
      var pg = cell * 0.22;
      f.fillRect(x + pg / 2, y + pg / 2, cell - pg, cell - pg);
      return;
    }
    if (mode === 'cross' || mode === 'lines' || mode === 'diagonal') {
      var hl = cell * 0.5 * k;
      f.lineWidth = Math.max(1, cell * 0.16);
      f.beginPath();
      if (mode === 'lines') { f.moveTo(cx, cy - hl); f.lineTo(cx, cy + hl); }
      else if (mode === 'diagonal') { f.moveTo(cx - hl, cy - hl); f.lineTo(cx + hl, cy + hl); }
      else { f.moveTo(cx, cy - hl); f.lineTo(cx, cy + hl); f.moveTo(cx - hl, cy); f.lineTo(cx + hl, cy); }
      f.stroke();
      return;
    }
    if (mode === 'diamond') {
      var hd = cell * 0.5 * k;
      f.beginPath();
      f.moveTo(cx, cy - hd); f.lineTo(cx + hd, cy); f.lineTo(cx, cy + hd); f.lineTo(cx - hd, cy);
      f.closePath(); f.fill();
      return;
    }
    if (mode === 'voxel') {
      var hv = cell * 0.5 * k;
      f.fillRect(cx - hv, cy - hv, hv * 2, hv * 2);
      f.fillStyle = 'rgba(255,255,255,0.22)';
      f.fillRect(cx - hv, cy - hv, hv * 2, hv * 0.4);
      f.fillStyle = col;
      return;
    }
    if (mode === 'lego') {
      var hl2 = cell * 0.5 * k;
      f.fillStyle = col;
      roundRect(f, cx - hl2, cy - hl2 * 0.7, hl2 * 2, hl2 * 1.7, hl2 * 0.4); f.fill();
      f.beginPath(); f.arc(cx, cy - hl2 * 0.7, hl2 * 0.5, 0, 7); f.fill();
      return;
    }
    if (mode === 'braille') {
      var dots = Math.round(clamp01(L) * 4);
      var step = cell / 3;
      f.fillStyle = col;
      for (i = 0; i < dots; i++) {
        var dx = (i % 2), dy = Math.floor(i / 2);
        f.beginPath();
        f.arc(x + step + dx * step, y + step + dy * step, Math.max(0.6, cell * 0.1), 0, 7);
        f.fill();
      }
      return;
    }
    if (mode === 'disco') {
      var hue = (c * 8 + r * 8 + time * spd * 90) % 360;
      f.fillStyle = 'hsl(' + hue + ',85%,' + (38 + clamp01(L) * 32) + '%)';
      f.save();
      f.translate(cx, cy);
      f.rotate(time * spd + c * 0.3);
      var sd = cell * 0.5 * k;
      f.fillRect(-sd, -sd, sd * 2, sd * 2);
      f.restore();
      return;
    }
    if (mode === 'mixed') {
      var sub = (c * 7 + r * 13) % 4;
      var sm = ['dither', 'dots', 'diamond', 'cross'][sub];
      this._drawCell(f, sm, x, y, cx, cy, cell, L, density, cr, cg, cb, charset, c, r, time, amp, spd, p);
      return;
    }
    var fr = Math.max(0.5, cell * 0.5 * k);
    f.beginPath(); f.arc(cx, cy, fr, 0, 7); f.fill();
  };

  /* ------------------------------ animation ------------------------------- */
  InkGarden.prototype._anim = function (c, r, cols, rows, time, spd, amp, style) {
    var cx = cols / 2, cy = rows / 2;
    var dx = c - cx, dy = r - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    switch (style) {
      case 'wave': return Math.sin(time * spd + r * 0.25) * amp;
      case 'pulse': return Math.sin(time * spd) * amp;
      case 'shimmer': return Math.sin(time * spd * 1.3 + c * 0.3 + r * 0.2) * amp;
      case 'ripple': return Math.sin(time * spd - dist * 0.06) * amp;
      case 'flicker': return (hash2(c * 3 + Math.floor(time * spd * 6), r) - 0.5) * 2 * amp;
      default: return 0;
    }
  };

  /* ------------------------------- render --------------------------------- */
  InkGarden.prototype.render = function (t) {
    var p = this.params;
    var ctx = this.ctx;
    if (!ctx) return;
    var W = this.canvas.width, H = this.canvas.height;
    if (!W || !H) return;
    var cell = Math.max(1, p.cellSize | 0);
    var cols = Math.max(1, Math.floor(W / cell));
    var rows = Math.max(1, Math.floor(H / cell));

    this._drawBackground(ctx, W, H);

    var samp = this._sample(cols, rows);
    var data = samp.data;
    var n = cols * rows;
    var lum = new Float32Array(n);
    var base = new Uint8ClampedArray(n * 3);
    for (var i = 0; i < n; i++) {
      var rr = data[i * 4], gg = data[i * 4 + 1], bb = data[i * 4 + 2];
      base[i * 3] = rr; base[i * 3 + 1] = gg; base[i * 3 + 2] = bb;
      lum[i] = lumOf(rr, gg, bb);
    }
    var edge = (p.edgeEmphasis > 0) ? this._edge(lum, cols, rows) : null;

    var tspeed = (p.animSpeed && p.animSpeed.enabled) ? p.animSpeed.intensity / 100 : 0;
    if (!tspeed && p.animated) tspeed = 1;
    var tinten = (p.animIntensity && p.animIntensity.enabled) ? p.animIntensity.intensity / 100 : 0;
    var time = (typeof t === 'number' ? t : 0) * 0.001;
    var spd = 2.0 * tspeed;
    var amp = 0.5 * tinten;
    var animOn = p.animated && spd > 0 && amp > 0;

    var coverage = (p.coverage != null ? p.coverage : 100) / 100;
    var density = (p.density != null ? p.density : 20) / 100;
    var mode = p.renderMode;
    var charset = this._charset(p);

    var fx = this._fx(W, H);
    var f = fx.getContext('2d');
    f.clearRect(0, 0, W, H);
    f.globalCompositeOperation = (p.styleBlend && p.styleBlend !== 'source-over') ? p.styleBlend : 'source-over';

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var idx = r * cols + c;
        if (coverage < 1 && hash2(c, r) > coverage) continue;
        var L = lum[idx];
        if (p.invert) L = 1 - L;
        if (edge) L = clamp01(L + (edge[idx] / 255) * (p.edgeEmphasis / 100) * 1.3);
        if (animOn) L = clamp01(L + this._anim(c, r, cols, rows, time, spd, amp, p.animStyle));
        var x = c * cell, y = r * cell, cx = x + cell / 2, cy = y + cell / 2;
        var col = this._adjustColor(base[idx * 3], base[idx * 3 + 1], base[idx * 3 + 2], p);
        col = this._applyTint(col[0], col[1], col[2], p);
        this._drawCell(f, mode, x, y, cx, cy, cell, L, density, col[0], col[1], col[2], charset, c, r, time, amp, spd, p);
      }
    }

    ctx.save();
    if (p.blurType && p.blurType !== 'off' && (p.blurAmount || 0) > 0) {
      ctx.filter = 'blur(' + (p.blurAmount | 0) + 'px)';
    }
    ctx.drawImage(fx, 0, 0);
    ctx.restore();

    this._postFx(ctx, W, H, p);
    this._lights(ctx, W, H, p);
    this._mask(ctx, W, H, p);
  };

  InkGarden.prototype._drawBackground = function (ctx, W, H) {
    var p = this.params;
    var bg = p.bgMode || 'none';
    ctx.clearRect(0, 0, W, H);
    if (bg === 'color') {
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, W, H);
    } else if (bg === 'original' || bg === 'blur') {
      if (this.source) {
        ctx.save();
        if (bg === 'blur') ctx.filter = 'blur(' + (p.bgBlur || 0) + 'px)';
        ctx.globalAlpha = ((p.bgOpacity != null ? p.bgOpacity : 100) / 100);
        ctx.drawImage(this.source, 0, 0, W, H);
        ctx.restore();
      }
    }
  };

  InkGarden.prototype._fx = function (W, H) {
    if (!this._fxC || this._fxC.width !== W || this._fxC.height !== H) {
      this._fxC = this._makeCanvas(W, H);
    }
    return this._fxC;
  };
  InkGarden.prototype._tmpC = function (W, H) {
    if (!this._tmp || this._tmp.width !== W || this._tmp.height !== H) {
      this._tmp = this._makeCanvas(W, H);
    }
    return this._tmp;
  };

  /* ------------------------------ post-FX --------------------------------- */
  InkGarden.prototype._postFx = function (ctx, W, H, p) {
    var fx = p.pfx || {};
    var self = this;
    function on(key) { return fx[key] && fx[key].enabled; }
    function inten(key) { return (fx[key] && fx[key].intensity != null) ? fx[key].intensity : 0; }

    if (on('scanLines')) {
      var a = inten('scanLines') / 100 * 0.5;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000';
      for (var y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.restore();
    }
    if (on('vignette')) {
      var va = inten('vignette') / 100;
      var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,' + va + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (on('bloom')) {
      var ba = inten('bloom') / 100 * 0.7;
      var tmp = self._tmpC(W, H); var tctx = tmp.getContext('2d');
      tctx.clearRect(0, 0, W, H); tctx.drawImage(self.canvas, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ba;
      ctx.filter = 'blur(10px)';
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
    }
    if (on('chromatic')) {
      var ca = inten('chromatic') / 100 * 0.6;
      var off = 1 + inten('chromatic') / 18;
      var tmp2 = self._tmpC(W, H); var c2 = tmp2.getContext('2d');
      c2.clearRect(0, 0, W, H); c2.drawImage(self.canvas, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ca;
      ctx.drawImage(tmp2, off, 0);
      ctx.drawImage(tmp2, -off, 0);
      ctx.restore();
    }
    if (on('filmGrain')) {
      if (!self._noise) self._noise = self._makeNoiseTile(128);
      ctx.save();
      ctx.globalAlpha = inten('filmGrain') / 100 * 0.12;
      ctx.fillStyle = ctx.createPattern(self._noise, 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (on('glitch')) {
      var gi = inten('glitch');
      var slices = Math.max(1, Math.floor(gi / 8));
      ctx.save();
      for (var s = 0; s < slices; s++) {
        var sy = Math.random() * H;
        var sh = 4 + Math.random() * 22;
        var dx = (Math.random() - 0.5) * gi;
        try { ctx.drawImage(self.canvas, 0, sy, W, sh, dx, sy, W, sh); } catch (e) {}
      }
      ctx.restore();
    }
    if (on('halftone')) {
      var ha = inten('halftone') / 100 * 0.18;
      var step = 6;
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + ha + ')';
      for (var hy = step / 2; hy < H; hy += step)
        for (var hx = step / 2; hx < W; hx += step) {
          ctx.beginPath(); ctx.arc(hx, hy, step * 0.22, 0, 7); ctx.fill();
        }
      ctx.restore();
    }
    if (on('pixelate')) {
      var sc = 1 / (1 + inten('pixelate') / 12);
      var tw = Math.max(1, Math.floor(W * sc)), th = Math.max(1, Math.floor(H * sc));
      var tmp3 = self._tmpC(tw, th); var c3 = tmp3.getContext('2d');
      c3.imageSmoothingEnabled = false; c3.drawImage(self.canvas, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp3, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
    }
    if (on('filmDust')) {
      var dn = Math.floor(inten('filmDust') / 2);
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,' + (inten('filmDust') / 100 * 0.5) + ')';
      for (var d = 0; d < dn; d++) {
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5 + 0.3, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  InkGarden.prototype._makeNoiseTile = function (size) {
    var cv = this._makeCanvas(size, size);
    var c = cv.getContext('2d');
    var img = c.createImageData(size, size);
    for (var i = 0; i < size * size; i++) {
      var v = (Math.random() * 255) | 0;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return cv;
  };

  /* ------------------------------- lights --------------------------------- */
  InkGarden.prototype._lights = function (ctx, W, H, p) {
    if (!p.lights || !p.lights.enabled) return;
    var pts = p.lights.points || [];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < pts.length; i++) {
      var pt = pts[i];
      var x = pt.x * W, y = pt.y * H;
      var rad = (pt.radius || 0.2) * Math.min(W, H);
      var inten = (pt.intensity != null ? pt.intensity : 50) / 100;
      var col = pt.color || '#ffd9a0';
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rgba(col, 0.9 * inten));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  /* -------------------------------- mask ---------------------------------- */
  InkGarden.prototype._mask = function (ctx, W, H, p) {
    if (!p.mask || !p.mask.enabled || !p.mask.dataUrl) return;
    if (!this._maskImg) {
      var self = this;
      var img = new Image();
      img.onload = function () { self._maskReady = true; };
      img.onerror = function () { self._maskReady = false; };
      img.src = p.mask.dataUrl;
      this._maskImg = img;
    }
    if (!this._maskReady) return;
    var m = this._maskImg;
    var tmp = this._tmpC(W, H);
    var tctx = tmp.getContext('2d');
    tctx.clearRect(0, 0, W, H);
    tctx.drawImage(this.source, 0, 0, W, H);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(m, 0, 0, W, H);
    tctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  };

  /* ------------------------------ exports --------------------------------- */
  var api = { InkGarden: InkGarden, InkGardenDefaults: InkGardenDefaults, InkGardenCharSets: InkGardenCharSets };
  root.InkGarden = InkGarden;
  root.InkGardenDefaults = InkGardenDefaults;
  root.InkGardenCharSets = InkGardenCharSets;
  return api;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

export default __inkgarden;
export const InkGarden = __inkgarden.InkGarden;
export const InkGardenDefaults = __inkgarden.InkGardenDefaults;
export const InkGardenCharSets = __inkgarden.InkGardenCharSets;
