import * as THREE from "three";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { UltraHDRLoader } from "three/addons/loaders/UltraHDRLoader.js";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


//dissolve shader
import { vs } from "./vs.glsl";
import { fs } from "./fs.glsl";
// Create the scene
const scene = new THREE.Scene();
const params = {
  fade: 1.0,
  thickness: 2.0,
  brightness: 10.0,
  autoRotate: true,
  metalness: 0.1,
  roughness: 0.0,
  exposure: 0.5,
  resolution: "2k",
  type: "HalfFloatType",
};
// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Create a renderer and add it to the DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;  
renderer.toneMappingExposure = 1;
renderer.colorManagement = true;

// add torus

let torusMaterial = new THREE.MeshStandardMaterial({
  roughness: params.roughness,
  metalness: params.metalness,
  emissive: new THREE.Color(0, 0.57, 1),
});

let directionNoiseURL = "../../Assets/Textures/doubleNoise2.png";
let directionNoise = new THREE.TextureLoader().load(directionNoiseURL);

let extendedTorusMaterial = new CustomShaderMaterial({
  baseMaterial: torusMaterial,
  uniforms: {
    growFade: { value: false },
    brightness: { value: 10.0 },
    time: { value: 0.8 },
    threshold: { value: 0.0 },
    edgeColor: { value: new THREE.Color(0, 0.57, 1) }, // Add a uniform for the color
    thickness: { value: 2.0 },
    dim: { value: false },
    noiseTexture: { value: directionNoise },
  },
  vertexShader: `
    uniform bool growFade;
    varying vec2 vUv;
        uniform float brightness;
    void main() {
        vUv = uv;
        if(growFade){
          csm_Position = vec3(csm_Position.x, csm_Position.y, csm_Position.z + (0.004 * brightness));
        }
    }
  `,
  fragmentShader: `
  uniform bool dim;
  uniform float brightness;
  uniform float thickness;
  uniform bool growFade;
  uniform float time;
  uniform vec3 edgeColor; // Declare the uniform
  varying vec2 vUv;
  uniform float threshold;
  uniform sampler2D noiseTexture; //alpha noise texture for diffuse effect
      void main() {


        vec3 noise = texture2D(noiseTexture, vUv).rgb;
        float dissolve = noise.g;


        if (dissolve < threshold) {
          discard;
        }
       float edge = threshold + (thickness / 100.0);

        if(threshold > 0.1){

        if (dissolve < edge ) {

           csm_Emissive = edgeColor * brightness;

        } else{


      }

    }
      csm_UnlitFac =  csm_UnlitFac;

  }
`,
});

let boxGeometry = new THREE.BoxGeometry(1, 1, 1);
let boxMesh = new THREE.Mesh(boxGeometry, extendedTorusMaterial);
scene.add(boxMesh);


let torusMesh = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 128, 128, 1, 3),
  extendedTorusMaterial
);
scene.add(torusMesh);

let ultraHDRLoader = new UltraHDRLoader();
ultraHDRLoader.setDataType(THREE.FloatType);

const loadEnvironment = function (resolution = "2k", type = "HalfFloatType") {
  ultraHDRLoader.setDataType(THREE[type]);

  ultraHDRLoader.load(
    `../../Assets/Textures/equirectangular/spruit_sunrise_${resolution}.hdr.jpg`,
    function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.needsUpdate = true;
      scene.background = texture;
      scene.environment = texture;
    }
  );
};
//renderer for post processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
renderPass.alpha = 0;
renderPass.clear = true;
renderPass.clearDepth = true;
composer.addPass(renderPass);

//bloom pass for post processing
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.05, 0.4, 50000.2);
composer.addPass(bloomPass);



loadEnvironment(params.resolution, params.type);

let pheonixPath = "../../Assets/3D Models/phoenix.glb"
let loader = new GLTFLoader();

loader.load(pheonixPath, function (gltf) {
    gltf.scene.scale.set(0.01, 0.01, 0.01);
    scene.add(gltf.scene);
    console.log("pheonix loaded");
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const gui = new GUI();

gui.add(params, "fade", 0, 1, 0.01).onChange((value) => {
    extendedTorusMaterial.uniforms.threshold.value = value;
})
gui.add(params, "thickness", 0, 10, 2.00).onChange((value) => {
    extendedTorusMaterial.uniforms.thickness.value = value;
})
gui.add(params, "brightness", 0, 100000000, 10.00).onChange((value) => {
    extendedTorusMaterial.uniforms.brightness.value = value;
})
gui.add(params, "autoRotate");
gui.add(params, "metalness", 0, 1, 0.01);
gui.add(params, "roughness", 0, 1, 0.01);
gui.add(params, "exposure", 0, 4, 0.01);
gui.add(params, "resolution", ["2k", "4k"]).onChange((value) => {
  loadEnvironment(value, params.type);
});
gui.add(params, "type", ["HalfFloatType", "FloatType"]).onChange((value) => {
  loadEnvironment(params.resolution, value);
});

gui.open();

window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  torusMesh.material.roughness = params.roughness;
  torusMesh.material.metalness = params.metalness;
  renderer.toneMappingExposure = params.exposure;
  // Rotate the cube for some basic animation
  composer.render();
    // renderer.render(scene, camera);
}

// Start the animation loop
animate();
