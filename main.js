import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/OutputPass.js";

const HDR_ENVIRONMENT_URL = "./hdr/studio_small_04_1k.hdr";

const CinematicGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 1.08 },
    saturation: { value: 0.94 },
    vignette: { value: 0.42 },
    tint: { value: new THREE.Vector3(1.02, 0.98, 0.92) }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float contrast;
    uniform float saturation;
    uniform float vignette;
    uniform vec3 tint;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, saturation);
      color = ((color - 0.5) * contrast) + 0.5;
      color *= tint;

      float distanceFromCenter = distance(vUv, vec2(0.5));
      float edge = smoothstep(0.34, 0.78, distanceFromCenter);
      color *= 1.0 - edge * vignette;

      gl_FragColor = vec4(color, texel.a);
    }
  `
};

const SWORDS = [
  {
    id: "sword1",
    name: "Rapier",
    shortName: "Rapier",
    model: "./models/sword1.glb",
    rarity: "Mythic",
    lore: "A duelist's blade with a needle profile, built for fast camera reads and elegant reflective highlights.",
    origin: "Moonlit court",
    material: "Polished steel",
    camera: [2.9, 1.6, 9.5],
    targetSize: 3.15,
    previewSize: 2.85,
    fullViewDistance: 11.0
  },
  {
    id: "sword2",
    name: "Short Sword",
    shortName: "Short Sword",
    model: "./models/sword2.glb",
    rarity: "Rare",
    lore: "A compact knightly weapon designed for close-quarters movement and readable silhouette in the viewer.",
    origin: "Border keep",
    material: "Iron and leather",
    camera: [3.0, 1.25, 5.8],
    targetSize: 3.05,
    previewSize: 2.7,
    fullViewDistance: 9.05
  },
  {
    id: "sword3",
    name: "Zweihander",
    shortName: "Zweihander",
    model: "./models/sword3.glb",
    rarity: "Legendary",
    lore: "A heavy greatsword made for dramatic rim lighting, slow rotation, and a strong boss-menu presence.",
    origin: "Fallen citadel",
    material: "Dark steel",
    camera: [3.6, 1.35, 7.15],
    targetSize: 3.45,
    previewSize: 3.05,
    fullViewDistance: 9.25
  },
  {
    id: "sword4",
    name: "Greatsword",
    shortName: "Greatsword",
    model: "./models/sword4.glb",
    rarity: "Epic",
    lore: "A colossal two-handed blade forged for conquest — its broad fuller catches every light as the edge cleaves the air.",
    origin: "Iron highlands",
    material: "Tempered iron",
    camera: [3.8, 1.4, 7.5],
    targetSize: 3.6,
    previewSize: 3.2,
    fullViewDistance: 9.5
  }
];

const LIGHT_RIGS = {
  material: {
    label: "Material",
    exposure: 0.92,
    bloom: 0.1,
    ambient: 0.28,
    hemi: 0.65,
    key: 4.5,
    fill: 1.1,
    rim: 4.2,
    ember: 0.85,
    head: 0.28,
    bladeFront: 3.2,
    edgeLeft: 1.8,
    edgeRight: 1.8,
    keyColor: 0xffedd2,
    fillColor: 0x6f9fac,
    rimColor: 0xb8ecf2
  },
  forge: {
    label: "Forge",
    exposure: 0.88,
    bloom: 0.16,
    ambient: 0.18,
    hemi: 0.45,
    key: 3.4,
    fill: 0.65,
    rim: 4.4,
    ember: 1.95,
    head: 0.22,
    bladeFront: 2.6,
    edgeLeft: 1.5,
    edgeRight: 1.5,
    keyColor: 0xffead0,
    fillColor: 0x5f8792,
    rimColor: 0x9fced8
  },
  studio: {
    label: "Studio",
    exposure: 1.0,
    bloom: 0.06,
    ambient: 0.34,
    hemi: 0.75,
    key: 3.8,
    fill: 1.2,
    rim: 3.2,
    ember: 0.18,
    head: 0.32,
    bladeFront: 3.8,
    edgeLeft: 2.2,
    edgeRight: 2.2,
    keyColor: 0xffffff,
    fillColor: 0xb9d4d8,
    rimColor: 0xc6d4d8
  }
};

const CAMERA_VIEWS = {
  full: {
    label: "Full",
    position: null,
    target: [0, 0.05, 0]
  },
  blade: {
    label: "Blade",
    position: [1.5, 1.7, 4.25],
    target: [0, 0.95, 0]
  },
  hilt: {
    label: "Hilt",
    position: [2.35, -0.3, 3.65],
    target: [0, -1.02, 0]
  },
  profile: {
    label: "Profile",
    position: [5.1, 0.55, 0.2],
    target: [0, 0.05, 0]
  }
};

const swordById = new Map(SWORDS.map((sword) => [sword.id, sword]));
const loader = new GLTFLoader();
const clock = new THREE.Clock();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const viewerState = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  bloomPass: null,
  gradePass: null,
  outputPass: null,
  controls: null,
  currentModel: null,
  currentSword: SWORDS[0],
  autoRotate: !prefersReducedMotion,
  userInteracting: false,
  wireframe: false,
  currentLighting: "material",
  currentCameraView: "full",
  particles: null,
  particleSpeeds: null,
  fogPlane: null,
  atmosphereVeils: [],
  contactShadow: null,
  lights: null,
  pmrem: null,
  environmentTexture: null,
  metalRoughnessTexture: null,
  targetCamera: new THREE.Vector3(...SWORDS[0].camera),
  targetControls: new THREE.Vector3(0, 0, 0),
  cameraDrift: new THREE.Vector3(),
  controlsDrift: new THREE.Vector3(),
  cameraLerpTarget: new THREE.Vector3(),
  controlsLerpTarget: new THREE.Vector3()
};

const heroState = {
  scene: null,
  camera: null,
  renderer: null,
  model: null,
  targetMouse: new THREE.Vector2(0, 0),
  mouse: new THREE.Vector2(0, 0)
};

const previewScenes = [];

class BladeAudio {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.muted = true;
    this.ambientElement = new Audio("./audio/ambient.mp3");
    this.ambientElement.loop = true;
    this.ambientElement.volume = 0.16;
    this.hoverElement = new Audio("./audio/hover.mp3");
    this.hoverElement.volume = 0.2;
    this.unsheathElement = new Audio("./audio/sword-unsheath.mp3");
    this.unsheathElement.volume = 0.32;
    this.syntheticAmbient = null;
    this.useSyntheticHover = false;
    this.useSyntheticUnsheath = false;
  }

  async toggle() {
    if (this.muted) {
      await this.enable();
    } else {
      this.mute();
    }

    updateAudioButton();
  }

  async enable() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.enabled = true;
    this.muted = false;

    try {
      await this.ambientElement.play();
    } catch (error) {
      this.startSyntheticAmbient();
    }
  }

  mute() {
    this.muted = true;
    this.ambientElement.pause();

    if (this.syntheticAmbient) {
      this.syntheticAmbient.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.25);
    }
  }

  startSyntheticAmbient() {
    if (!this.context || this.syntheticAmbient) return;

    const gain = this.context.createGain();
    const low = this.context.createOscillator();
    const high = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();

    low.type = "sine";
    low.frequency.value = 55;
    high.type = "triangle";
    high.frequency.value = 110;
    filter.type = "lowpass";
    filter.frequency.value = 520;
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 90;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    low.connect(filter);
    high.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    gain.gain.value = this.muted ? 0 : 0.035;

    low.start();
    high.start();
    lfo.start();
    this.syntheticAmbient = { gain, low, high, lfo };
  }

  playHover() {
    if (!this.enabled || this.muted) return;

    if (!this.useSyntheticHover) {
      this.playElement(this.hoverElement, () => {
        this.useSyntheticHover = true;
        this.playHoverTone();
      });
      return;
    }

    this.playHoverTone();
  }

  playUnsheath() {
    if (!this.enabled || this.muted) return;

    if (!this.useSyntheticUnsheath) {
      this.playElement(this.unsheathElement, () => {
        this.useSyntheticUnsheath = true;
        this.playUnsheathTone();
      });
      return;
    }

    this.playUnsheathTone();
  }

  playElement(element, fallback) {
    const clone = element.cloneNode();
    clone.volume = element.volume;
    clone.play().catch(fallback);
  }

  playHoverTone() {
    if (!this.context) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }

  playUnsheathTone() {
    if (!this.context) return;

    const now = this.context.currentTime;
    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.32, this.context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);

    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }

    const noise = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const scrapeGain = this.context.createGain();
    const ring = this.context.createOscillator();
    const ringGain = this.context.createGain();

    noise.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(3800, now + 0.18);
    filter.Q.value = 1.7;
    scrapeGain.gain.setValueAtTime(0.001, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    scrapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    ring.type = "triangle";
    ring.frequency.setValueAtTime(310, now);
    ring.frequency.exponentialRampToValueAtTime(155, now + 0.34);
    ringGain.gain.setValueAtTime(0.04, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    noise.connect(filter);
    filter.connect(scrapeGain);
    scrapeGain.connect(this.context.destination);
    ring.connect(ringGain);
    ringGain.connect(this.context.destination);
    noise.start(now);
    ring.start(now);
    ring.stop(now + 0.4);
  }
}

const bladeAudio = new BladeAudio();

function init() {
  document.body.classList.add("reveal-ready");
  initRevealAnimations();
  initNavbar();
  initViewer();
  initHeroPreview();
  initCollectionPreviews();
  initUI();
  animate();
}

function initNavbar() {
  const nav = document.querySelector(".blade-navbar");
  const collapse = document.getElementById("mainNav");
  const bsCollapse = collapse && window.bootstrap ? new bootstrap.Collapse(collapse, { toggle: false }) : null;

  const updateNav = () => {
    nav.classList.toggle("navbar-scrolled", window.scrollY > 24);
  };

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (bsCollapse && collapse.classList.contains("show")) {
        bsCollapse.hide();
      }
    });
  });

  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });
}

function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function initViewer() {
  const canvas = document.getElementById("viewerCanvas");
  const frame = document.getElementById("viewerFrame");

  viewerState.scene = new THREE.Scene();
  viewerState.scene.fog = new THREE.FogExp2(0x050607, 0.058);

  viewerState.camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  viewerState.camera.position.set(...viewerState.currentSword.camera);

  viewerState.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  viewerState.renderer.setPixelRatio(getPixelRatio());
  viewerState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewerState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewerState.renderer.toneMappingExposure = 0.85;
  viewerState.renderer.shadowMap.enabled = true;
  viewerState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewerState.renderer.useLegacyLights = false;

  viewerState.pmrem = new THREE.PMREMGenerator(viewerState.renderer);
  viewerState.pmrem.compileEquirectangularShader();
  loadHDREnvironment();

  viewerState.controls = new OrbitControls(viewerState.camera, canvas);
  viewerState.controls.enableDamping = true;
  viewerState.controls.dampingFactor = 0.075;
  viewerState.controls.minDistance = 2.35;
  viewerState.controls.maxDistance = 12.5;
  viewerState.controls.maxPolarAngle = Math.PI * 0.84;
  viewerState.controls.target.set(0, 0.08, 0);

  // When the user starts dragging, stop lerping the camera so it doesn't fight OrbitControls
  viewerState.controls.addEventListener('start', () => {
    viewerState.userInteracting = true;
  });

  // When the user releases, sync the lerp targets to the current position so there is no snap-back
  viewerState.controls.addEventListener('end', () => {
    viewerState.userInteracting = false;
    viewerState.targetCamera.copy(viewerState.camera.position);
    viewerState.targetControls.copy(viewerState.controls.target);
  });

  addViewerLighting(viewerState.scene);
  addViewerStage(viewerState.scene);
  addAtmosphereVeils(viewerState.scene);
  viewerState.particles = createParticleField(viewerState.scene, 210, 8.8);

  viewerState.composer = new EffectComposer(viewerState.renderer);
  viewerState.composer.addPass(new RenderPass(viewerState.scene, viewerState.camera));
  viewerState.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), LIGHT_RIGS.material.bloom, 0.12, 0.92);
  viewerState.composer.addPass(viewerState.bloomPass);
  viewerState.gradePass = new ShaderPass(CinematicGradeShader);
  viewerState.composer.addPass(viewerState.gradePass);
  viewerState.outputPass = new OutputPass();
  viewerState.composer.addPass(viewerState.outputPass);
  applyLightingRig("material");

  const resizeObserver = new ResizeObserver(() => resizeViewer());
  resizeObserver.observe(frame);
  resizeViewer();
  loadSword("sword1", { playSound: false });
}

function loadHDREnvironment() {
  const rgbeLoader = new RGBELoader();

  rgbeLoader.load(
    HDR_ENVIRONMENT_URL,
    (hdrTexture) => {
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

      if (viewerState.environmentTexture) {
        viewerState.environmentTexture.dispose();
      }

      viewerState.environmentTexture = viewerState.pmrem.fromEquirectangular(hdrTexture).texture;
      viewerState.scene.environment = viewerState.environmentTexture;
      viewerState.scene.environmentIntensity = 1.1;
      hdrTexture.dispose();
    },
    undefined,
    () => {
      viewerState.environmentTexture = viewerState.pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
      viewerState.scene.environment = viewerState.environmentTexture;
      viewerState.scene.environmentIntensity = 0.65;
    }
  );
}

function addViewerLighting(scene) {
  const ambient = new THREE.AmbientLight(0x9ca9ab, 0.1);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0x9fb5bb, 0x0b0705, 0.38);
  scene.add(hemisphere);

  // Key light repositioned to a 3/4 front angle so it hits the blade face
  const keyLight = new THREE.DirectionalLight(0xffedd2, 3.2);
  keyLight.position.set(2.5, 4.0, 5.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.2;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.radius = 3;
  keyLight.shadow.bias = -0.00018;
  keyLight.shadow.normalBias = 0.018;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x6f9fac, 0.42);
  fillLight.position.set(-4.6, 1.4, 2.9);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xb8ecf2, 2.85);
  rimLight.position.set(-5.4, 2.8, -5.2);
  scene.add(rimLight);

  // Front light — SpotLight aimed directly at the sword centre so it does not
  // graze the floor at a shallow angle and create a large bright arc via bloom.
  const bladeFront = new THREE.SpotLight(0xdce8ec, 2.2, 22, Math.PI * 0.18, 0.35, 1.2);
  bladeFront.position.set(0.6, 1.8, 6.0);
  bladeFront.target.position.set(0, 0.5, 0);
  scene.add(bladeFront);
  scene.add(bladeFront.target);

  // Edge strip lights — PointLights positioned to the sides so intensity
  // falls off before reaching the floor (avoids grazing bloom arcs)
  const edgeLeft = new THREE.PointLight(0xb0d4e8, 4.5, 5.0, 2.0);
  edgeLeft.position.set(-5.0, 1.8, 0.5);
  scene.add(edgeLeft);

  const edgeRight = new THREE.PointLight(0xd8eaee, 4.5, 5.0, 2.0);
  edgeRight.position.set(5.0, 1.8, 0.5);
  scene.add(edgeRight);

  const bladeKick = new THREE.PointLight(0xf0f4f8, 1.2, 5.5, 1.8);
  bladeKick.position.set(0.8, 0.8, 3.5);
  scene.add(bladeKick);

  const emberLight = new THREE.PointLight(0xd1843e, 0.22, 4.5, 2.2);
  emberLight.position.set(-2.45, -1.06, 1.85);
  scene.add(emberLight);

  const underGlow = new THREE.PointLight(0x6ba9b8, 0.36, 5.5, 2.4);
  underGlow.position.set(1.6, -1.55, -0.8);
  scene.add(underGlow);

  const headLight = new THREE.PointLight(0xf4f1e8, 0.18, 8, 1.8);
  headLight.position.copy(viewerState.camera.position);
  scene.add(headLight);

  viewerState.lights = { ambient, hemisphere, keyLight, fillLight, rimLight, bladeFront, edgeLeft, edgeRight, bladeKick, emberLight, underGlow, headLight };
}

function addViewerStage(scene) {
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0d0f,
    metalness: 0.05,
    roughness: 0.88,
    clearcoat: 0.0,
    envMapIntensity: 0.15,
    transparent: true,
    opacity: 0.92
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.9, 160), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.78;
  floor.receiveShadow = true;
  scene.add(floor);

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x101214,
    metalness: 0.0,
    roughness: 0.96,
    envMapIntensity: 0.05
  });
  const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(1.54, 1.78, 0.24, 128), stoneMaterial);
  plinthBase.position.y = -1.66;
  plinthBase.receiveShadow = true;
  plinthBase.castShadow = true;
  scene.add(plinthBase);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.04, 1.28, 0.32, 128),
    new THREE.MeshStandardMaterial({ color: 0x141818, metalness: 0.0, roughness: 0.96, envMapIntensity: 0.05 })
  );
  plinth.position.y = -1.43;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  scene.add(plinth);

  const plinthTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 1.02, 0.08, 128),
    new THREE.MeshStandardMaterial({ color: 0x1e2220, metalness: 0.05, roughness: 0.88, envMapIntensity: 0.08 })
  );
  plinthTop.position.y = -1.22;
  plinthTop.receiveShadow = true;
  plinthTop.castShadow = true;
  scene.add(plinthTop);

  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.72, 96),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.58,
      alphaMap: createRadialGradientTexture("shadow"),
      depthWrite: false
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -1.165;
  scene.add(contactShadow);
  viewerState.contactShadow = contactShadow;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.94, 0.008, 8, 192),
    new THREE.MeshBasicMaterial({ color: 0x8bbfca, transparent: true, opacity: 0.28 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.12;
  scene.add(ring);

  const emberRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.012, 8, 144),
    new THREE.MeshBasicMaterial({ color: 0xd1843e, transparent: true, opacity: 0.2 })
  );
  emberRing.rotation.x = Math.PI / 2;
  emberRing.position.y = -1.1;
  scene.add(emberRing);

  const fogMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fbfc6,
    transparent: true,
    opacity: 0.022,
    alphaMap: createRadialGradientTexture("fog"),
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const fogPlane = new THREE.Mesh(new THREE.CircleGeometry(4.4, 128), fogMaterial);
  fogPlane.rotation.x = -Math.PI / 2;
  fogPlane.position.y = -1.06;
  scene.add(fogPlane);
  viewerState.fogPlane = fogPlane;
}

function createRadialGradientTexture(type) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  if (type === "shadow") {
    gradient.addColorStop(0, "rgba(255,255,255,0.86)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.38)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
  } else {
    gradient.addColorStop(0, "rgba(255,255,255,0.42)");
    gradient.addColorStop(0.54, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function addAtmosphereVeils(scene) {
  const texture = createRadialGradientTexture("fog");
  const material = new THREE.MeshBasicMaterial({
    color: 0x7fa5ac,
    transparent: true,
    opacity: 0.022,
    alphaMap: texture,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const veilPositions = [
    [-2.6, 0.2, -2.9, 0.12],
    [2.8, 0.9, -3.6, -0.18],
    [0.2, -0.5, -4.2, 0.04]
  ];

  viewerState.atmosphereVeils = veilPositions.map(([x, y, z, rotation]) => {
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), material.clone());
    veil.position.set(x, y, z);
    veil.rotation.y = rotation;
    scene.add(veil);
    return veil;
  });
}

function createParticleField(scene, count, radius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const colorA = new THREE.Color(0xd1843e);
  const colorB = new THREE.Color(0x88b8c4);

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * (0.24 + Math.random() * 0.76);
    positions[i * 3] = Math.cos(angle) * distance;
    positions[i * 3 + 1] = -2 + Math.random() * 5.2;
    positions[i * 3 + 2] = Math.sin(angle) * distance;
    speeds[i] = 0.12 + Math.random() * 0.32;

    const color = Math.random() > 0.72 ? colorA : colorB;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  viewerState.particleSpeeds = speeds;
  return particles;
}

function loadSword(id, options = {}) {
  const sword = swordById.get(id) || SWORDS[0];
  viewerState.currentSword = sword;
  setLoading(true, `Loading ${sword.shortName}...`);
  updateSwordUI(sword);
  setSelectorState(sword.id);

  if (options.playSound !== false) {
    bladeAudio.playUnsheath();
  }

  loader.load(
    sword.model,
    (gltf) => {
      if (viewerState.currentModel) {
        disposeObject(viewerState.currentModel);
        viewerState.scene.remove(viewerState.currentModel);
      }

      const model = gltf.scene;
      prepareModel(model);
      normalizeModel(model, sword.targetSize);
      model.position.y += 0.28;
      applyPresentationPose(model);
      applyWireframe(model, viewerState.wireframe);
      viewerState.scene.add(model);
      viewerState.currentModel = model;
      setCameraView(viewerState.currentCameraView, { immediateSword: sword, immediateModel: model });
      setLoading(false);
    },
    (event) => {
      if (!event.total) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setLoading(true, `Loading ${sword.shortName} ${progress}%`);
    },
    () => {
      if (viewerState.currentModel) {
        disposeObject(viewerState.currentModel);
        viewerState.scene.remove(viewerState.currentModel);
      }

      const fallback = createFallbackSword();
      normalizeModel(fallback, sword.targetSize);
      fallback.position.y += 0.28;
      applyPresentationPose(fallback);
      viewerState.scene.add(fallback);
      viewerState.currentModel = fallback;
      setCameraView(viewerState.currentCameraView, { immediateSword: sword, immediateModel: fallback });
      setLoading(false);
    }
  );
}

function applyPresentationPose(model) {
  model.rotation.x = THREE.MathUtils.degToRad(2.2);
  model.rotation.z = THREE.MathUtils.degToRad(-7.0);
  model.userData.baseTiltX = model.rotation.x;
  model.userData.baseTiltZ = model.rotation.z;
}

function prepareModel(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    // DEBUG: log material names so we can verify keyword matching
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((m) => console.log('[Material]', JSON.stringify(m?.name), 'metalness:', m?.metalness?.toFixed(2), 'roughness:', m?.roughness?.toFixed(2), 'color:', m?.color?.getHexString()));

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => enhanceMaterial(material));
    } else {
      child.material = enhanceMaterial(child.material);
    }
  });
}

function enhanceMaterial(material) {
  if (!material) return material;

  const enhanced = material.clone();
  const name = (enhanced.name || "").toLowerCase();
  const profile = getMaterialProfile(name);

  // Detect which PBR channels have embedded texture maps from the GLB
  const hasColorMap    = Boolean(enhanced.map);
  const hasMetalMap    = Boolean(enhanced.metalnessMap);
  const hasRoughMap    = Boolean(enhanced.roughnessMap);

  // ── Colour ───────────────────────────────────────────────────────────────
  // When an albedo texture is embedded, the base-colour factor must stay white
  // (1,1,1) so the texture renders at full fidelity. Tinting a dark texture
  // with a dark colour makes it even darker → black blade.
  // Only override colour when there is NO embedded colour texture.
  if (profile.color && enhanced.color && !hasColorMap) {
    enhanced.color.setHex(profile.color);
  }

  // ── Metalness ────────────────────────────────────────────────────────────
  // If the GLB has a metalness map, the factor of 1.0 means "use the map
  // at full strength". Overriding the factor would scale down the texture.
  // When NO map is present, apply the profile value outright.
  if ("metalness" in enhanced) {
    if (hasMetalMap) {
      // Keep factor = 1.0 so the texture drives metalness fully.
      // Nothing to change – leave as exported.
    } else if (typeof profile.metalness === "number") {
      enhanced.metalness = profile.metalness;
    }
  }

  // ── Roughness ────────────────────────────────────────────────────────────
  // Same logic: if there is a roughnessMap, trust it.
  // If not, apply the profile roughness (and optionally a synthetic noise map).
  if ("roughness" in enhanced) {
    if (hasRoughMap) {
      // Trust the embedded texture. Keep factor = 1.0.
    } else {
      if (typeof profile.roughness === "number") {
        enhanced.roughness = profile.roughness;
      }
      if (profile.useRoughnessNoise) {
        enhanced.roughnessMap = getMetalRoughnessTexture();
      }
    }
  }

  // ── Clearcoat / specular extras ──────────────────────────────────────────
  if ("clearcoat" in enhanced && typeof profile.clearcoat === "number") {
    enhanced.clearcoat = profile.clearcoat;
  }

  if ("clearcoatRoughness" in enhanced && typeof profile.clearcoatRoughness === "number") {
    enhanced.clearcoatRoughness = profile.clearcoatRoughness;
  }

  if ("specularIntensity" in enhanced && typeof profile.specularIntensity === "number") {
    enhanced.specularIntensity = profile.specularIntensity;
  }

  if ("ior" in enhanced && typeof profile.ior === "number") {
    enhanced.ior = profile.ior;
  }

  if (enhanced.normalMap && enhanced.normalScale && typeof profile.normalScale === "number") {
    enhanced.normalScale.setScalar(profile.normalScale);
  }

  // Ensure embedded colour textures are tagged with the correct colour space
  if (enhanced.map) {
    enhanced.map.colorSpace = THREE.SRGBColorSpace;
  }

  // envMapIntensity is a factor on top of the IBL – always apply
  enhanced.envMapIntensity = profile.envMapIntensity ?? 1.2;

  // Safety net: any NON-TEXTURED material that is still very dark AND highly metallic
  // after all profile overrides will render near-black in a dark scene.
  // Skip this for texture-driven materials — their appearance is controlled by their maps.
  if ("metalness" in enhanced && "color" in enhanced && !hasColorMap && !hasMetalMap) {
    const luma = 0.2126 * enhanced.color.r + 0.7152 * enhanced.color.g + 0.0722 * enhanced.color.b;
    if (enhanced.metalness > 0.55 && luma < 0.22) {
      enhanced.color.setHex(0x606866);
      enhanced.roughness = Math.max(enhanced.roughness, 0.32);
    }
  }

  enhanced.needsUpdate = true;
  return enhanced;
}

function getMetalRoughnessTexture() {
  if (viewerState.metalRoughnessTexture) {
    return viewerState.metalRoughnessTexture;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const directionalGrain = Math.sin((x + y * 0.35) * 0.45) * 18;
      const fineNoise = (Math.random() - 0.5) * 34;
      const value = THREE.MathUtils.clamp(138 + directionalGrain + fineNoise, 82, 202);
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  viewerState.metalRoughnessTexture = new THREE.CanvasTexture(canvas);
  viewerState.metalRoughnessTexture.wrapS = THREE.RepeatWrapping;
  viewerState.metalRoughnessTexture.wrapT = THREE.RepeatWrapping;
  viewerState.metalRoughnessTexture.repeat.set(2.4, 2.4);
  viewerState.metalRoughnessTexture.needsUpdate = true;
  return viewerState.metalRoughnessTexture;
}

function getMaterialProfile(name) {
  if (!name) {
    return { color: 0x5c6260, metalness: 0.85, roughness: 0.36, envMapIntensity: 1.2, useRoughnessNoise: true };
  }

  // Common Blender default material name
  if (name === "material" || name === "material.001" || name === "material.002") {
    return { color: 0x5c6260, metalness: 0.85, roughness: 0.36, envMapIntensity: 1.2, useRoughnessNoise: true };
  }

  if (name.includes("blade") || name.includes("sword") || name.includes("rapier") || name.includes("zweihander")) {
    return { color: 0x6a7270, metalness: 0.85, roughness: 0.36, envMapIntensity: 1.45, clearcoat: 0.1, clearcoatRoughness: 0.22, specularIntensity: 0.9, ior: 1.55, useRoughnessNoise: true };
  }

  if (name.includes("steel") && !name.includes("dark")) {
    return { color: 0x7e8482, metalness: 0.88, roughness: 0.34, envMapIntensity: 1.5, clearcoat: 0.12, clearcoatRoughness: 0.2, specularIntensity: 0.92, ior: 1.56, useRoughnessNoise: true };
  }

  if (name.includes("dark steel")) {
    return { color: 0x626866, metalness: 0.82, roughness: 0.40, envMapIntensity: 1.45, clearcoat: 0.08, clearcoatRoughness: 0.28, specularIntensity: 0.88, ior: 1.55, useRoughnessNoise: true, normalScale: 0.8 };
  }

  if (name.includes("damascus")) {
    return { color: 0x787468, metalness: 0.88, roughness: 0.30, envMapIntensity: 1.55, clearcoat: 0.18, clearcoatRoughness: 0.18, specularIntensity: 0.95, ior: 1.58, useRoughnessNoise: true, normalScale: 0.7 };
  }

  if (name.includes("light iron") || name.includes("iron")) {
    return { color: 0x8d8a80, metalness: 0.88, roughness: 0.32, envMapIntensity: 1.25, clearcoat: 0.08, clearcoatRoughness: 0.26, specularIntensity: 0.86, ior: 1.52, tintTextured: true, useRoughnessNoise: true };
  }

  if (name.includes("silver")) {
    return { color: 0x9a9e9c, metalness: 0.92, roughness: 0.28, envMapIntensity: 1.38, clearcoat: 0.12, clearcoatRoughness: 0.22, specularIntensity: 0.92, ior: 1.55, useRoughnessNoise: true };
  }

  if (name.includes("diamond")) {
    return { color: 0xa49a8a, metalness: 0.12, roughness: 0.56, envMapIntensity: 0.44, specularIntensity: 0.35 };
  }

  if (name.includes("gold")) {
    return { color: 0xb8822e, metalness: 0.90, roughness: 0.28, envMapIntensity: 1.15, clearcoat: 0.12, clearcoatRoughness: 0.28, specularIntensity: 0.78, useRoughnessNoise: true };
  }

  if (name.includes("carbon")) {
    return { color: 0x191d1c, metalness: 0.42, roughness: 0.48, envMapIntensity: 0.85 };
  }

  if (name.includes("metallic pattern")) {
    return { color: 0x444842, metalness: 0.9, roughness: 0.32, envMapIntensity: 1.15, useRoughnessNoise: true };
  }

  if (name.includes("leather fabric") || name.includes("leather")) {
    return { color: 0x3b2417, metalness: 0.0, roughness: 0.74, envMapIntensity: 0.28, tintTextured: true };
  }

  if (name.includes("bondage") || name.includes("fabric")) {
    return { color: 0x262626, metalness: 0.0, roughness: 0.76, envMapIntensity: 0.24 };
  }

  // Unknown material — default to a visible steel so nothing renders black
  return { color: 0x5c6260, metalness: 0.85, roughness: 0.36, envMapIntensity: 1.2, useRoughnessNoise: true };
}

function normalizeModel(model, targetSize) {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.setScalar(1);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxAxis;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

function getFullViewFrame(model, sword) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const fov = THREE.MathUtils.degToRad(viewerState.camera.fov);
  const aspect = Math.max(viewerState.camera.aspect || 1, 0.5);
  const padding = 1.34;
  const verticalFit = (size.y * padding) / (2 * Math.tan(fov / 2));
  const horizontalFit = (Math.max(size.x, size.z) * padding) / (2 * Math.tan(fov / 2) * aspect);
  const distance = Math.max(verticalFit, horizontalFit, sword.fullViewDistance ?? 9.05);
  const target = center.clone().add(new THREE.Vector3(-0.12, 0.04, 0));
  const direction = new THREE.Vector3(0.42, 0.18, 1).normalize();
  const position = target.clone().addScaledVector(direction, distance);

  return { position, target };
}

function createFallbackSword() {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xcfd5d8, metalness: 0.85, roughness: 0.28 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x332219, roughness: 0.72 });
  const ember = new THREE.MeshStandardMaterial({ color: 0xd1843e, emissive: 0x7a3716, emissiveIntensity: 0.35 });

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.8, 0.055), steel);
  blade.position.y = 0.72;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 4), steel);
  tip.position.y = 2.31;
  tip.rotation.y = Math.PI * 0.25;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.09), steel);
  guard.position.y = -0.76;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.72, 18), grip);
  handle.position.y = -1.14;
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), ember);
  pommel.position.y = -1.55;

  [blade, tip, guard, handle, pommel].forEach((part) => {
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
  });

  return group;
}

function updateSwordUI(sword) {
  document.getElementById("viewerSwordName").textContent = sword.name;
  document.getElementById("viewerSwordLore").textContent = sword.lore;
  document.getElementById("statOrigin").textContent = sword.origin;
  document.getElementById("statMaterial").textContent = sword.material;
  const rigLabel = LIGHT_RIGS[viewerState.currentLighting].label;
  document.getElementById("statMode").textContent = viewerState.wireframe ? `Wireframe + ${rigLabel}` : `${rigLabel} rig`;
}

function setSelectorState(id) {
  document.querySelectorAll("[data-load-sword]").forEach((button) => {
    button.classList.toggle("active", button.dataset.loadSword === id);
  });

  document.querySelectorAll("[data-sword-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.swordCard === id);
  });
}

function setLoading(show, message = "Loading model...") {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  text.textContent = message;
  overlay.classList.toggle("is-hidden", !show);
}

function initHeroPreview() {
  const canvas = document.getElementById("heroCanvas");
  heroState.scene = new THREE.Scene();
  heroState.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  heroState.camera.position.set(0.25, 0.1, 6.1);

  heroState.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  heroState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
  heroState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  heroState.renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const ambient = new THREE.AmbientLight(0xd5dde0, 0.42);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3.2, 4.5, 4.2);
  const rim = new THREE.DirectionalLight(0xd1843e, 1.7);
  rim.position.set(-3.8, 1.2, -2.8);
  heroState.scene.add(ambient, key, rim);

  loader.load(SWORDS[2].model, (gltf) => {
    heroState.model = gltf.scene;
    prepareModel(heroState.model);
    normalizeModel(heroState.model, 3.85);
    heroState.model.position.x += 1.25;
    heroState.model.rotation.z = -0.12;
    heroState.scene.add(heroState.model);
  }, undefined, () => {
    heroState.model = createFallbackSword();
    normalizeModel(heroState.model, 3.85);
    heroState.model.position.x += 1.25;
    heroState.scene.add(heroState.model);
  });

  window.addEventListener("pointermove", (event) => {
    heroState.targetMouse.x = (event.clientX / window.innerWidth - 0.5) * 0.7;
    heroState.targetMouse.y = (event.clientY / window.innerHeight - 0.5) * 0.45;
  }, { passive: true });

  const resizeObserver = new ResizeObserver(() => resizeHero());
  resizeObserver.observe(canvas.parentElement);
  resizeHero();
}

function initCollectionPreviews() {
  const previewObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const preview = previewScenes.find((item) => item.canvas === entry.target);
      if (preview) {
        preview.active = entry.isIntersecting;
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".weapon-preview").forEach((canvas) => {
    const sword = swordById.get(canvas.dataset.previewModel);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.2, 5.1);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    scene.add(new THREE.AmbientLight(0xdfe8e8, 0.26));
    const key = new THREE.DirectionalLight(0xf2eee4, 1.15);
    key.position.set(2.3, 3.5, 4.2);
    const rim = new THREE.DirectionalLight(0x88b8c4, 0.85);
    rim.position.set(-2.5, 1, -2.5);
    scene.add(key, rim);

    const preview = { canvas, scene, camera, renderer, model: null, active: false };
    previewScenes.push(preview);
    resizePreview(preview);
    previewObserver.observe(canvas);

    loader.load(sword.model, (gltf) => {
      preview.model = gltf.scene;
      prepareModel(preview.model);
      normalizeModel(preview.model, sword.previewSize);
      scene.add(preview.model);
    }, undefined, () => {
      preview.model = createFallbackSword();
      normalizeModel(preview.model, sword.previewSize);
      scene.add(preview.model);
    });

    const resizeObserver = new ResizeObserver(() => resizePreview(preview));
    resizeObserver.observe(canvas.parentElement);
  });
}

function initUI() {
  document.querySelectorAll("[data-load-sword]").forEach((button) => {
    button.addEventListener("click", () => {
      loadSword(button.dataset.loadSword);
      document.getElementById("viewer").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-sound='hover'], .btn, .selector-button").forEach((element) => {
    element.addEventListener("pointerenter", () => bladeAudio.playHover());
  });

  document.getElementById("audioToggle").addEventListener("click", () => {
    bladeAudio.toggle();
  });

  document.getElementById("openViewerButton").addEventListener("click", () => {
    bladeAudio.playUnsheath();
  });

  document.getElementById("autoRotateToggle").addEventListener("click", (event) => {
    viewerState.autoRotate = !viewerState.autoRotate;
    event.currentTarget.classList.toggle("active", viewerState.autoRotate);
    event.currentTarget.setAttribute("aria-pressed", String(viewerState.autoRotate));
  });

  document.getElementById("wireframeToggle").addEventListener("click", (event) => {
    viewerState.wireframe = !viewerState.wireframe;
    event.currentTarget.classList.toggle("active", viewerState.wireframe);
    event.currentTarget.setAttribute("aria-pressed", String(viewerState.wireframe));
    applyWireframe(viewerState.currentModel, viewerState.wireframe);
    updateSwordUI(viewerState.currentSword);
  });

  document.getElementById("resetCamera").addEventListener("click", () => {
    setCameraView("full");
  });

  document.getElementById("fullscreenViewer").addEventListener("click", () => {
    const frame = document.getElementById("viewerFrame");
    if (!document.fullscreenElement) {
      frame.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  document.querySelectorAll("[data-lighting-rig]").forEach((button) => {
    button.addEventListener("click", () => {
      applyLightingRig(button.dataset.lightingRig);
    });
  });

  document.getElementById("exposureSlider").addEventListener("input", (event) => {
    setExposure(Number(event.currentTarget.value));
  });

  document.querySelectorAll("[data-camera-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setCameraView(button.dataset.cameraView);
    });
  });

  window.addEventListener("resize", () => {
    resizeViewer();
    resizeHero();
    previewScenes.forEach(resizePreview);
  }, { passive: true });
}

function applyLightingRig(id) {
  const rig = LIGHT_RIGS[id] || LIGHT_RIGS.material;
  viewerState.currentLighting = id in LIGHT_RIGS ? id : "material";

  setExposure(rig.exposure);

  if (viewerState.bloomPass) {
    viewerState.bloomPass.strength = rig.bloom;
  }

  if (viewerState.lights) {
    viewerState.lights.ambient.intensity = rig.ambient;
    viewerState.lights.hemisphere.intensity = rig.hemi;
    viewerState.lights.keyLight.intensity = rig.key;
    viewerState.lights.keyLight.color.setHex(rig.keyColor);
    viewerState.lights.fillLight.intensity = rig.fill;
    viewerState.lights.fillLight.color.setHex(rig.fillColor);
    viewerState.lights.rimLight.intensity = rig.rim;
    viewerState.lights.rimLight.color.setHex(rig.rimColor);
    viewerState.lights.bladeKick.intensity = Math.max(0.35, rig.key * 0.22);
    viewerState.lights.bladeFront.intensity = rig.bladeFront ?? 2.2;
    viewerState.lights.edgeLeft.intensity = rig.edgeLeft ?? 1.8;
    viewerState.lights.edgeRight.intensity = rig.edgeRight ?? 1.8;
    viewerState.lights.emberLight.intensity = rig.ember;
    viewerState.lights.emberLight.userData.baseIntensity = rig.ember;
    viewerState.lights.underGlow.intensity = rig.ember * 0.42;
    viewerState.lights.headLight.intensity = rig.head;
  }

  document.querySelectorAll("[data-lighting-rig]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lightingRig === viewerState.currentLighting);
  });

  updateSwordUI(viewerState.currentSword);
}

function setExposure(value) {
  const exposure = THREE.MathUtils.clamp(value, 0.68, 1.35);

  if (viewerState.renderer) {
    viewerState.renderer.toneMappingExposure = exposure;
  }

  const slider = document.getElementById("exposureSlider");
  const output = document.getElementById("exposureValue");

  if (slider && Number(slider.value) !== exposure) {
    slider.value = exposure.toFixed(2);
  }

  if (output) {
    output.value = exposure.toFixed(2);
    output.textContent = exposure.toFixed(2);
  }
}

function setCameraView(id, options = {}) {
  const view = CAMERA_VIEWS[id] || CAMERA_VIEWS.full;
  const sword = options.immediateSword || viewerState.currentSword;
  const model = options.immediateModel || viewerState.currentModel;
  viewerState.currentCameraView = id in CAMERA_VIEWS ? id : "full";
  const fullFrame = viewerState.currentCameraView === "full" && model ? getFullViewFrame(model, sword) : null;
  const position = fullFrame?.position.toArray() || view.position || sword.camera;
  const target = fullFrame?.target.toArray() || view.target;

  viewerState.targetCamera.set(...position);
  viewerState.targetControls.set(...target);

  document.querySelectorAll("[data-camera-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.cameraView === viewerState.currentCameraView);
  });
}

function updateAudioButton() {
  const button = document.getElementById("audioToggle");
  const icon = button.querySelector("i");
  icon.className = bladeAudio.muted ? "bi bi-volume-mute" : "bi bi-volume-up";
  button.classList.toggle("active", !bladeAudio.muted);
  button.setAttribute("aria-pressed", String(!bladeAudio.muted));
}

function applyWireframe(object, enabled) {
  if (!object) return;

  object.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material) {
        material.wireframe = enabled;
      }
    });
  });
}

function resizeViewer() {
  if (!viewerState.renderer) return;

  const frame = document.getElementById("viewerFrame");
  const width = Math.max(320, Math.floor(frame.clientWidth));
  const height = Math.max(360, Math.floor(frame.clientHeight));

  viewerState.renderer.setPixelRatio(getPixelRatio());
  viewerState.renderer.setSize(width, height, false);
  viewerState.camera.aspect = width / height;
  viewerState.camera.updateProjectionMatrix();
  viewerState.composer.setSize(width, height);
  viewerState.bloomPass.setSize(width, height);

  if (viewerState.currentCameraView === "full" && viewerState.currentModel) {
    setCameraView("full");
  }
}

function resizeHero() {
  if (!heroState.renderer) return;

  const canvas = document.getElementById("heroCanvas");
  const width = Math.max(320, Math.floor(canvas.clientWidth));
  const height = Math.max(420, Math.floor(canvas.clientHeight));

  heroState.renderer.setSize(width, height, false);
  heroState.camera.aspect = width / height;
  heroState.camera.updateProjectionMatrix();
}

function resizePreview(preview) {
  const rect = preview.canvas.getBoundingClientRect();
  const width = Math.max(220, Math.floor(rect.width));
  const height = Math.max(220, Math.floor(rect.height));
  preview.renderer.setSize(width, height, false);
  preview.camera.aspect = width / height;
  preview.camera.updateProjectionMatrix();
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  requestAnimationFrame(animate);

  animateViewer(delta);
  animateHero(delta);
  animatePreviews(delta);
}

function animateViewer(delta) {
  if (!viewerState.renderer) return;

  const time = performance.now() * 0.001;
  const driftStrength = viewerState.autoRotate && !prefersReducedMotion ? 1 : 0;
  viewerState.cameraDrift.set(
    Math.sin(time * 0.28) * 0.11 * driftStrength,
    Math.sin(time * 0.2 + 1.4) * 0.035 * driftStrength,
    Math.cos(time * 0.22) * 0.08 * driftStrength
  );
  viewerState.controlsDrift.set(
    Math.sin(time * 0.24 + 0.8) * 0.045 * driftStrength,
    Math.sin(time * 0.18) * 0.018 * driftStrength,
    0
  );

  if (!viewerState.userInteracting) {
    viewerState.cameraLerpTarget.copy(viewerState.targetCamera).add(viewerState.cameraDrift);
    viewerState.controlsLerpTarget.copy(viewerState.targetControls).add(viewerState.controlsDrift);
    viewerState.camera.position.lerp(viewerState.cameraLerpTarget, 0.035);
    viewerState.controls.target.lerp(viewerState.controlsLerpTarget, 0.04);
  }
  viewerState.controls.update();

  if (viewerState.lights?.headLight) {
    viewerState.lights.headLight.position.copy(viewerState.camera.position);
  }

  if (viewerState.currentModel && viewerState.autoRotate && !viewerState.userInteracting) {
    viewerState.currentModel.rotation.y += delta * 0.22;
  }

  if (viewerState.currentModel && !viewerState.userInteracting) {
    viewerState.currentModel.rotation.x = viewerState.currentModel.userData.baseTiltX + Math.sin(time * 0.75) * 0.012;
    viewerState.currentModel.rotation.z = viewerState.currentModel.userData.baseTiltZ + Math.sin(time * 0.55) * 0.01;
  }

  if (viewerState.contactShadow) {
    const pulse = 1 + Math.sin(time * 0.9) * 0.025;
    viewerState.contactShadow.scale.set(pulse, pulse, 1);
  }

  if (viewerState.fogPlane) {
    viewerState.fogPlane.rotation.z += delta * 0.045;
    viewerState.fogPlane.material.opacity = 0.043 + Math.sin(time * 0.7) * 0.012;
  }

  viewerState.atmosphereVeils.forEach((veil, index) => {
    veil.position.x += Math.sin(time * 0.25 + index) * delta * 0.018;
    veil.material.opacity = 0.04 + Math.sin(time * 0.34 + index * 1.7) * 0.014;
    veil.lookAt(viewerState.camera.position);
  });

  if (viewerState.lights?.emberLight) {
    const baseIntensity = viewerState.lights.emberLight.userData.baseIntensity ?? viewerState.lights.emberLight.intensity;
    viewerState.lights.emberLight.intensity = baseIntensity + Math.sin(time * 2.2) * 0.035;
  }

  if (viewerState.particles) {
    const positions = viewerState.particles.geometry.attributes.position.array;
    for (let i = 0; i < viewerState.particleSpeeds.length; i += 1) {
      positions[i * 3 + 1] += viewerState.particleSpeeds[i] * delta;
      if (positions[i * 3 + 1] > 3.2) {
        positions[i * 3 + 1] = -2;
      }
    }
    viewerState.particles.geometry.attributes.position.needsUpdate = true;
    viewerState.particles.rotation.y += delta * 0.025;
  }

  viewerState.composer.render();
}

function animateHero(delta) {
  if (!heroState.renderer) return;

  heroState.mouse.lerp(heroState.targetMouse, 0.035);
  heroState.camera.position.x = heroState.mouse.x;
  heroState.camera.position.y = 0.12 - heroState.mouse.y;
  heroState.camera.lookAt(0, 0, 0);

  if (heroState.model && !prefersReducedMotion) {
    heroState.model.rotation.y += delta * 0.16;
    heroState.model.rotation.x = Math.sin(performance.now() * 0.0005) * 0.035;
  }

  heroState.renderer.render(heroState.scene, heroState.camera);
}

function animatePreviews(delta) {
  previewScenes.forEach((preview) => {
    if (!preview.active) return;

    if (preview.model && !prefersReducedMotion) {
      preview.model.rotation.y += delta * 0.34;
    }

    preview.renderer.render(preview.scene, preview.camera);
  });
}

function disposeObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;

    if (child.geometry) {
      child.geometry.dispose();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      Object.keys(material).forEach((key) => {
        const value = material[key];
        if (value && typeof value === "object" && typeof value.dispose === "function") {
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}

function getPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 1.7);
}

document.addEventListener("DOMContentLoaded", init);
