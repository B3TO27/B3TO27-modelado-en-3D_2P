// main.js
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/FBXLoader.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/RGBELoader.js';
import { PlayerControls } from './controls.js';

let scene, camera, renderer, player, mixer, controls, playerControls;
const clock = new THREE.Clock();
const collidables = [];
const keyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let isDay = true;

// Música
const bgMusic = new Audio('recursos/SONIDOS DEL MAR Y GAVIOTAS HD.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;
document.addEventListener('click', () => {
  if (bgMusic.paused) bgMusic.play();
});

// Escena
scene = new THREE.Scene();

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.3;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Cámara
camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(20, 15, 60);
camera.lookAt(0, 5, 0);

// Controles
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 4;

// HDRI
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load('recursos/fondo_playa.hdr', texture => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.background = envMap;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  });

// Piso
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('recursos/arena.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1, 1);
const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
collidables.push(floor);

// Luz
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 40, 20);
scene.add(ambientLight);
scene.add(sun);

function toggleDayNight() {
  isDay = !isDay;
  if (isDay) {
    ambientLight.color.set(0xffffff);
    ambientLight.intensity = 0.6;
    sun.color.set(0xffffff);
    sun.intensity = 1;
  } else {
    ambientLight.color.set(0x222244);
    ambientLight.intensity = 0.2;
    sun.color.set(0x99ccff);
    sun.intensity = 0.3;
  }
}

// Personaje FBX
const fbxLoader = new FBXLoader();
player = new THREE.Object3D();
player.position.set(0, 0.5, 0);
scene.add(player);

fbxLoader.load('recursos/verano_personaje.fbx', fbx => {
  fbx.scale.set(0.08, 0.08, 0.08);
  player.add(fbx);
  collidables.push(fbx);

  if (fbx.animations.length > 0) {
    mixer = new THREE.AnimationMixer(fbx);
    const clip = fbx.animations[0];
    const action = mixer.clipAction(clip);
    action.play();
  }

  playerControls = new PlayerControls(player, 100, collidables);
});

window.addEventListener('keydown', e => {
  if (e.code in keyState) keyState[e.code] = true;
  if (e.code === 'KeyG') player.rotation.y += THREE.MathUtils.degToRad(45);
  if (e.code === 'KeyL') toggleDayNight();
});

window.addEventListener('keyup', e => {
  if (e.code in keyState) keyState[e.code] = false;
});

function updatePlayer(delta) {
  const speed = 10;
  const velocity = new THREE.Vector3();
  if (keyState.ArrowUp)    velocity.z -= speed * delta;
  if (keyState.ArrowDown)  velocity.z += speed * delta;
  if (keyState.ArrowLeft)  velocity.x -= speed * delta;
  if (keyState.ArrowRight) velocity.x += speed * delta;
  player.position.add(velocity);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (playerControls) playerControls.update();
  updatePlayer(delta);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// PANEL DE FUNCIONES (HUD lateral)
const panel = document.createElement('div');
panel.style = `
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  font-family: Arial;
  font-size: 14px;
  border-radius: 8px;
  max-width: 240px;
  z-index: 100;
`;
panel.innerHTML = `
  <b>Controles de Escena:</b><br>
  🎵 Música de fondo (se activa con clic)<br>
  🕹️ Mover personaje: Flechas ← ↑ ↓ →<br>
  🔁 Girar personaje: tecla G<br>
  🌞/🌙 Alternar Día/Noche: tecla L<br>
  📸 Cámara orbital con mouse
`;
document.body.appendChild(panel);
