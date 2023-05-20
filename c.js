import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfffae5) // set backgournd color

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 6;
scene.add( camera );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

// Create the bloom pass
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 2;
bloomPass.radius = 1;

// Add the bloom pass to the composer
const composer = new EffectComposer( renderer );
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);


const app = document.getElementById("app");
app.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping=true
controls.rotateSpeed = 1

const radius = 3;
const sphereGeometry = new THREE.SphereGeometry( radius, 128, 128 ); 
const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } ); 
sphereMaterial.transparent = true;
sphereMaterial.opacity = 0.5;
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
scene.add( sphere );



function animate() {
    controls.update();
	requestAnimationFrame( animate );
    
	composer.render();
}


animate();