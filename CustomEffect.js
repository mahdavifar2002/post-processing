import { NearestFilter as NearestFilter6, RepeatWrapping, RGBAFormat as RGBAFormat3, Uniform as Uniform32, Vector2 as Vector220 } from "three";
import {Effect,NoiseTexture, GlitchMode} from './postprocessing.esm.js';



// src/effects/glsl/glitch.frag
var glitch_default = `
uniform lowp sampler2D perturbationMap;
uniform bool active;
uniform float columns;
uniform float random;
uniform vec2 seeds;
uniform vec2 distortion;
void mainUv(inout vec2 uv) {
  if (active) {
    if (uv.y < distortion.x + columns && uv.y > distortion.x - columns * random) {
      float sx = clamp(ceil(seeds.x), 0.0, 1.0);
      uv.y = sx * (1.0 - (uv.y + distortion.y)) + (1.0 - sx) * distortion.y;
    }
    if (uv.x < distortion.y + columns && uv.x > distortion.y - columns * random) {
      float sy = clamp(ceil(seeds.y), 0.0, 1.0);
      uv.x = sy * distortion.x + (1.0 - sy) * (1.0 - (uv.x + distortion.x));
    }
    vec2 normal = texture2D(perturbationMap, uv * random * random).rg;
    uv += normal * seeds * (random * 0.2);
  }
}
`;

var glitch_default = `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	outputColor = vec4(1.0 - inputColor.x, 1.0 - inputColor.y, 1.0 - inputColor.z, inputColor.w);
}
`;



// src/effects/GlitchEffect.js
var textureTag = "Glitch.Generated";
function randomFloat(low, high) {
  return low + Math.random() * (high - low);
}

var NewGlitchEffect = class extends Effect {
  /**
   * Constructs a new glitch effect.
   *
   * TODO Change ratio to 0.15.
   * @param {Object} [options] - The options.
   * @param {Vector2} [options.chromaticAberrationOffset] - A chromatic aberration offset. If provided, the glitch effect will influence this offset.
   * @param {Vector2} [options.delay] - The minimum and maximum delay between glitch activations in seconds.
   * @param {Vector2} [options.duration] - The minimum and maximum duration of a glitch in seconds.
   * @param {Vector2} [options.strength] - The strength of weak and strong glitches.
   * @param {Texture} [options.perturbationMap] - A perturbation map. If none is provided, a noise texture will be created.
   * @param {Number} [options.dtSize=64] - The size of the generated noise map. Will be ignored if a perturbation map is provided.
   * @param {Number} [options.columns=0.05] - The scale of the blocky glitch columns.
   * @param {Number} [options.ratio=0.85] - The threshold for strong glitches.
   */
  constructor({
    chromaticAberrationOffset = null,
    delay = new Vector220(1.5, 3.5),
    duration = new Vector220(0.6, 1),
    strength = new Vector220(0.3, 1),
    columns = 0.05,
    ratio = 0.85,
    perturbationMap = null,
    dtSize = 64
  } = {}) {
    super("NewGlitchEffect", glitch_default, {
    uniforms: /* @__PURE__ */ new Map([
      ["perturbationMap", new Uniform32(null)],
      ["columns", new Uniform32(columns)],
      ["active", new Uniform32(false)],
      ["random", new Uniform32(1)],
      ["seeds", new Uniform32(new Vector220())],
      ["distortion", new Uniform32(new Vector220())]
    ])
    });
    if (perturbationMap === null) {
    const map = new NoiseTexture(dtSize, dtSize, RGBAFormat3);
    map.name = textureTag;
    this.perturbationMap = map;
    } else {
    this.perturbationMap = perturbationMap;
    }
    this.time = 0;
    this.distortion = this.uniforms.get("distortion").value;
    this.delay = delay;
    this.duration = duration;
    this.breakPoint = new Vector220(
    randomFloat(this.delay.x, this.delay.y),
    randomFloat(this.duration.x, this.duration.y)
    );
    this.strength = strength;
    this.mode = GlitchMode.SPORADIC;
    this.ratio = ratio;
    this.chromaticAberrationOffset = chromaticAberrationOffset;
  }
  /**
   * Random number seeds.
   *
   * @type {Vector2}
   * @private
   */
  get seeds() {
    return this.uniforms.get("seeds").value;
  }
  /**
   * Indicates whether the glitch effect is currently active.
   *
   * @type {Boolean}
   */
  get active() {
    return this.uniforms.get("active").value;
  }
  /**
   * Indicates whether the glitch effect is currently active.
   *
   * @deprecated Use active instead.
   * @return {Boolean} Whether the glitch effect is active.
   */
  isActive() {
    return this.active;
  }
  /**
   * The perturbation map.
   *
   * @type {Texture}
   */
  get perturbationMap() {
    return this.uniforms.get("perturbationMap").value;
  }
  set perturbationMap(value) {
    const currentMap = this.perturbationMap;
    if (currentMap !== null && currentMap.name === textureTag) {
    currentMap.dispose();
    }
    value.minFilter = value.magFilter = NearestFilter6;
    value.wrapS = value.wrapT = RepeatWrapping;
    value.generateMipmaps = false;
    this.uniforms.get("perturbationMap").value = value;
  }
  /**
   * Returns the current perturbation map.
   *
   * @deprecated Use perturbationMap instead.
   * @return {Texture} The current perturbation map.
   */
  getPerturbationMap() {
    return this.perturbationMap;
  }
  /**
   * Replaces the current perturbation map with the given one.
   *
   * The current map will be disposed if it was generated by this effect.
   *
   * @deprecated Use perturbationMap instead.
   * @param {Texture} value - The new perturbation map.
   */
  setPerturbationMap(value) {
    this.perturbationMap = value;
  }
  /**
   * Generates a perturbation map.
   *
   * @deprecated Use NoiseTexture instead.
   * @param {Number} [value=64] - The texture size.
   * @return {DataTexture} The perturbation map.
   */
  generatePerturbationMap(value = 64) {
    const map = new NoiseTexture(value, value, RGBAFormat3);
    map.name = textureTag;
    return map;
  }
  /**
   * Updates this effect.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
   * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
   */
  update(renderer, inputBuffer, deltaTime) {
    const mode = this.mode;
    const breakPoint = this.breakPoint;
    const offset = this.chromaticAberrationOffset;
    const s = this.strength;
    let time = this.time;
    let active = false;
    let r = 0, a = 0;
    let trigger;
    if (mode !== GlitchMode.DISABLED) {
    if (mode === GlitchMode.SPORADIC) {
      time += deltaTime;
      trigger = time > breakPoint.x;
      if (time >= breakPoint.x + breakPoint.y) {
      breakPoint.set(
        randomFloat(this.delay.x, this.delay.y),
        randomFloat(this.duration.x, this.duration.y)
      );
      time = 0;
      }
    }
    r = Math.random();
    this.uniforms.get("random").value = r;
    if (trigger && r > this.ratio || mode === GlitchMode.CONSTANT_WILD) {
      active = true;
      r *= s.y * 0.03;
      a = randomFloat(-Math.PI, Math.PI);
      this.seeds.set(randomFloat(-s.y, s.y), randomFloat(-s.y, s.y));
      this.distortion.set(randomFloat(0, 1), randomFloat(0, 1));
    } else if (trigger || mode === GlitchMode.CONSTANT_MILD) {
      active = true;
      r *= s.x * 0.03;
      a = randomFloat(-Math.PI, Math.PI);
      this.seeds.set(randomFloat(-s.x, s.x), randomFloat(-s.x, s.x));
      this.distortion.set(randomFloat(0, 1), randomFloat(0, 1));
    }
    this.time = time;
    }
    if (offset !== null) {
    if (active) {
      offset.set(Math.cos(a), Math.sin(a)).multiplyScalar(r);
    } else {
      offset.set(0, 0);
    }
    }
    this.uniforms.get("active").value = active;
  }
  /**
   * Deletes generated resources.
   */
  dispose() {
    const map = this.perturbationMap;
    if (map !== null && map.name === textureTag) {
    map.dispose();
    }
  }
};

export {
	NewGlitchEffect
};