import * as THREE from "three";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

//disolve shader
import vs from "./vs.js";
import fs from "./fs.js";

//GUI parameters
const params = {
  fade: 0.70,
  thickness: 4.0,
  brightness: 35.0,
  autoRotate: true,
  metalness: 0.13,
  roughness: 0.33,
  exposure: 0.2,
  resolution: "2k",
  type: "HalfFloatType",
};

// Create amera
const camera = createCamera();

// Create the scene
const scene = new THREE.Scene();

// add lights
addSceneLights();



//create renderer
const renderer = createRenderer();

//load 360 background (not hdr)
loadSceneBackground();

// create base torus material
let torusMaterial = new THREE.MeshStandardMaterial({
    roughness: params.roughness,
    metalness: params.metalness,
    side: THREE.DoubleSide,
});

//load noise texture for dissolve shader
let directionNoiseURL = "../../Assets/Textures/doubleNoise2.png";
let directionNoise = new THREE.TextureLoader().load(directionNoiseURL);

//create dissolve shader material
let dissolveShaderMaterial = new CustomShaderMaterial({
  baseMaterial: torusMaterial,
  uniforms: {
    brightness: { value: 35.0 },
    time: { value: 0.8 },
    threshold: { value: 0.70 },
    edgeColor: { value:  new THREE.Color().setHex( 0xdc1818 )}, // Add a uniform for the color
    thickness: { value: 4.0 },
    dim: { value: false },
    noiseTexture: { value: directionNoise },
  },
  vertexShader: vs,
  fragmentShader: fs,
});

//add shader material to torus
let torusMesh = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 128, 128, 1, 3),
  dissolveShaderMaterial
);

//add torus to scene
scene.add(torusMesh);

//post processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
// renderPass.alpha = 0;
// renderPass.clear = true;
// renderPass.clearDepth = true;
composer.addPass(renderPass);

//bloom pass for post processing
var bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.128,
  0.0,
  0.985
);
composer.addPass(bloomPass);

//orbit controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

//gui
const gui = new GUI();
configureGUI();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  torusMesh.material.roughness = params.roughness;
  torusMesh.material.metalness = params.metalness;
  renderer.toneMappingExposure = params.exposure;
  composer.render();
}

animate();
















//scene setup functions
function createRenderer() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.colorManagement = true;
  return renderer;
}

function createCamera() {
  var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  return camera;
}

function loadSceneBackground() {
  let backgroundTexture = new THREE.TextureLoader().load(
    "../../Assets/Textures/Equirectangular/spruit_sunrise_2k.hdr.jpg"
  );
  scene.background = backgroundTexture;
}

function addSceneLights() {
  let light = new THREE.DirectionalLight(0xffffff, 1.1);
  light.position.set(0, 0, 1);
  scene.add(light);
  let AmbientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(AmbientLight);
}


function configureGUI() {
 const dissolveFolder = gui.addFolder("Dissolve Shader");
 dissolveFolder.add(params, "fade", 0, 1, 0.01).onChange((value) => {
    dissolveShaderMaterial.uniforms.threshold.value = value;
  });
  dissolveFolder.add(params, "thickness", 0, 10, 0.01).onChange((value) => {
    dissolveShaderMaterial.uniforms.thickness.value = value;
  });
  dissolveFolder.add(params, "brightness", 0, 100, 0.01).onChange((value) => {
    dissolveShaderMaterial.uniforms.brightness.value = value;
  });
  const baseMaterialFolder = gui.addFolder("Base Material");
  baseMaterialFolder.add(params, "metalness", 0, 1, 0.01);
  baseMaterialFolder.add(params, "roughness", 0, 1, 0.01);
  const lightingFolder = gui.addFolder("Lighting");
  lightingFolder.add(params, "exposure", 0, 1.5, 0.01);


  // Create color pickers for multiple color formats
  const colorFormats = {
    string: "#dc1818",
    int: 0xdc1818,
    object: { r: 0.863, g: 0.094, b: 0.094  },
    array: [1, 1, 1],
  };

  dissolveFolder
    .addColor(colorFormats, "string")
    .name("Emissive Edge Color")
    .onChange(function (value) {
      // Convert the value to a THREE.Color object
      const color = new THREE.Color(value);
      // Update the material's uniform with the new color
      dissolveShaderMaterial.uniforms.edgeColor.value = color;
      console.log("color changed to:", color);
    });

  const folder = gui.addFolder("Post Processing");
  folder.add(bloomPass, "enabled").onChange(function (value) {
    bloomPass.enabled = value;
  });
  folder.add(bloomPass, "strength", 0, 2).onChange(function (value) {
    bloomPass.strength = value;
  });
  folder.add(bloomPass, "radius", 0, 2).onChange(function (value) {
    bloomPass.radius = value;
  });
  folder.add(bloomPass, "threshold", 0, 1).onChange(function (value) {
    bloomPass.threshold = value;
  });
  gui.open();
}

window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
