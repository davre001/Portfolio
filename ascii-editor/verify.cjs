/* Headless execution harness for lib/inkgarden.js.
 * Stubs just enough DOM/Canvas2D so the real engine code runs end-to-end.
 * Goal: catch runtime/reference errors across every render mode + post-FX.
 * (This does NOT validate visual output — only that the code executes.) */

const fs = require('fs');
const path = require('path');
const MODULE = path.join(__dirname, 'lib', 'inkgarden.js');

// ---- Canvas2D context stub ----
function makeImageData(w, h) {
  return { data: new Uint8ClampedArray(Math.max(0, w * h * 4)), width: w, height: h };
}
function fillPhotoData(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      d[i] = (x * 7 + y * 13) % 256;
      d[i + 1] = (x * 3 + y * 5) % 256;
      d[i + 2] = (x * 11 + y * 2) % 256;
      d[i + 3] = 255;
    }
  }
  return d;
}
function makeCtx() {
  const store = {};
  const special = {
    getImageData: (x, y, w, h) => ({ data: fillPhotoData(w, h), width: w, height: h }),
    createImageData: (w, h) => makeImageData(w, h),
    putImageData: () => {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
    measureText: () => ({ width: 0 }),
    getContext: () => makeCtx(),
  };
  return new Proxy(special, {
    get(t, p) {
      if (p in t) return t[p];
      if (p in store) return store[p];
      return () => {}; // unknown -> no-op method
    },
    set(t, p, v) { store[p] = v; return true; },
  });
}
function makeCanvas(w, h) {
  const c = { width: w || 300, height: h || 150, style: {} };
  c.getContext = () => makeCtx();
  return c;
}

// ---- globals ----
global.window = global;
global.document = { createElement: (t) => (t === 'canvas' ? makeCanvas() : { style: {} }) };
global.Image = class { set src(v) { if (this.onload) this.onload(); } };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.navigator = { userAgent: 'node' };

// load engine
const m = require(MODULE);
const InkGarden = global.InkGarden || m.InkGarden;
const DEFAULTS = global.InkGardenDefaults || m.InkGardenDefaults;
if (!InkGarden) { console.error('FAIL: InkGarden not exported'); process.exit(1); }

// ---- drive the engine ----
const canvas = makeCanvas(640, 400);
const ig = new InkGarden(canvas, { params: JSON.parse(JSON.stringify(DEFAULTS)), maxOut: 900 });
ig.generateSampleScene(7);

const MODES = ['dither','characters','mosaic','pixel','dots','cross','diamond','voxel','lego','mixed','lines','diagonal','braille','disco'];
let pass = 0, fail = 0;
const fails = [];

function run(label, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; fails.push(label + ' -> ' + (e && e.stack || e)); }
}

// every render mode
for (const mode of MODES) {
  ig.params.renderMode = mode;
  run('renderMode=' + mode, () => { ig.render(0); ig.render(33); ig.render(66); });
}

// exercise optionals on a couple of modes
ig.params.renderMode = 'dither';
run('invert+dotGrid+customChars', () => {
  ig.params.invert = true; ig.params.dotGrid = true; ig.params.customChars = '.:-=+*#%@';
  ig.render(0); ig.params.invert = false; ig.params.dotGrid = false; ig.params.customChars = '';
});
run('grayscale+saturation+contrast', () => {
  ig.params.grayscale = 100; ig.params.saturation = 0; ig.params.contrast = 200; ig.params.brightness = -40;
  ig.render(0);
  ig.params.grayscale = 0; ig.params.saturation = 100; ig.params.contrast = 158; ig.params.brightness = 0;
});

// blur types
for (const bt of ['gaussian','box','motion']) {
  ig.params.blurType = bt; ig.params.blurAmount = 30;
  run('blurType=' + bt, () => { ig.render(0); });
}
ig.params.blurType = 'off'; ig.params.blurAmount = 0;

// background modes
for (const bm of ['none','blur','color','original']) {
  ig.params.bgMode = bm; ig.params.bgOpacity = 80; ig.params.bgBlur = 10;
  run('bgMode=' + bm, () => { ig.render(0); });
}
ig.params.bgMode = 'none';

// all post-FX enabled
ig.params.pfx && Object.keys(ig.params.pfx).forEach((k) => { ig.params.pfx[k].enabled = true; ig.params.pfx[k].intensity = 30; });
run('all postFX enabled', () => { ig.render(0); ig.render(40); });
ig.params.pfx && Object.keys(ig.params.pfx).forEach((k) => { ig.params.pfx[k].enabled = false; });

// lights
ig.params.lights.enabled = true;
ig.params.lights.points = [{ x: 0.3, y: 0.4, radius: 60, intensity: 70 }, { x: 0.7, y: 0.6, radius: 100, intensity: 40 }];
run('lights enabled', () => { ig.render(0); });
ig.params.lights.enabled = false; ig.params.lights.points = [];

// mask enabled but no image (guarded path)
ig.params.mask.enabled = true;
run('mask enabled (no img)', () => { ig.render(0); });
ig.params.mask.enabled = false;

// setImage with a plain object (loadReference path equivalent)
run('setImage(plain)', () => {
  ig.setImage({ width: 512, height: 320 });
  ig.render(0);
});

// every render mode again with animation styles
ig.generateSampleScene(3);
for (const style of ['wave','pulse','shimmer','ripple','flicker']) {
  ig.params.animStyle = style; ig.params.animated = true; ig.params.animSpeed.intensity = 100; ig.params.animIntensity.intensity = 80;
  run('animStyle=' + style, () => { ig.render(0); ig.render(120); });
}

console.log(`\nPASS ${pass}  FAIL ${fail}`);
if (fail) { console.log('\n--- failures ---'); fails.forEach((f) => console.log(f)); process.exit(1); }
else console.log('All engine render paths executed without errors.');
