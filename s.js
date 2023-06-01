import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

THREE.ColorManagement.enabled = false; // TODO: Confirm correct color management.

const BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const params = {
    exposure: 1,
    bloomStrength: 5,
    bloomThreshold: 0,
    bloomRadius: 0,
    scene: 'Scene with Glow'
};

const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const materials = {};

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );

renderer.setSize( window.innerWidth, window.innerHeight );


renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.ReinhardToneMapping;

const app = document.getElementById('app')
app.appendChild(renderer.domElement);

const desc = document.getElementById('info')
const contrast = document.getElementById('contrast')

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');

btn1.addEventListener('click', hide);
btn2.addEventListener('click', hide);

const colorAxis = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
const referenceColor = [[204, 102, 102], [153, 204, 102], [102, 204, 204], [153, 102, 204]]
const maxDist = 1.9106332362490184

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xfffae5) // set backgournd color

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 2;
scene.add( camera );

const controls = new OrbitControls( camera, renderer.domElement );
// controls.maxPolarAngle = Math.PI * 0.5;
controls.enablePan = false
controls.enableDamping=true
controls.dampingFactor = 0.05
controls.rotateSpeed = 0.4
controls.minDistance = 1;
controls.maxDistance = 100;
// controls.addEventListener( 'change', render );

const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

const bloomComposer = new EffectComposer( renderer );
bloomComposer.renderToScreen = false;
bloomComposer.addPass( renderScene );
bloomComposer.addPass( bloomPass );

const finalPass = new ShaderPass(
    new THREE.ShaderMaterial( {
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        defines: {}
    } ), 'baseTexture'
);
finalPass.needsSwap = true;

const finalComposer = new EffectComposer( renderer );
finalComposer.addPass( renderScene );
finalComposer.addPass( finalPass );

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

window.addEventListener( 'pointerdown', onPointerDown );
window.addEventListener( 'mousemove', onMouseMove );

const radius = 1;
const sphereGeometry = new THREE.SphereGeometry( radius, 128, 128 ); 
const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
sphereMaterial.transparent = true;
sphereMaterial.opacity = 0.5;
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial ); 

setupScene();

let selectedObject;
let clicked = false;

function onMouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( scene.children, false );

    if ( intersects.length > 0 && intersects[0].object != sphere) {
        if (!selectedObject) {
            selectedObject = intersects[ 0 ].object;
            selectedObject.layers.toggle( BLOOM_SCENE );
            render();
            
            app.style.cursor = 'pointer';

            desc.style.visibility = 'visible';
            desc.style.top = `${event.clientY - 30}px`;
            desc.style.left = `${event.clientX + 40}px`;
            desc.classList.add('zoom');
        }
    } else if (clicked == false){
        selectedObject.layers.toggle( BLOOM_SCENE );
        selectedObject = null;
        app.style.cursor = 'auto';
        

        desc.style.visibility = 'hidden';
        desc.classList.remove('zoom');
    }
}
function onPointerDown( event ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( scene.children, false );
    if ( intersects.length > 0 && intersects[0].object != sphere) {
        clicked = true;

        contrast.style.visibility = 'visible';
        contrast.style.top = `${event.clientY - 330}px`;
        contrast.style.left = `${event.clientX + 45}px`;
        contrast.classList.add('up');
    }
}

function hide() {
    clicked = false;
    selectedObject.layers.toggle( BLOOM_SCENE );
    render();

    desc.style.visibility = 'hidden';
    contrast.style.visibility = 'hidden';

    desc.classList.remove('zoom');
    contrast.classList.remove('up');

    selectedObject = null;
}

window.onresize = function () {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    bloomComposer.setSize( width, height );
    finalComposer.setSize( width, height );

    render();

};

function normalize(pos) {
    let norm = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1] + pos[2]*pos[2])
    return [pos[0]/norm, pos[1]/norm, pos[2]/norm]
}

function calculateDistance(pos1, pos2, radius = 1) {
    const [x1, y1, z1] = pos1
    const [x2, y2, z2] = pos2

    const [lat1, lon1] = cartesianToSpherical(x1, y1, z1);
    const [lat2, lon2] = cartesianToSpherical(x2, y2, z2);
  
    const lat1Rad = lat1* (Math.PI / 180);
    const lon1Rad = lon1* (Math.PI / 180);
    const lat2Rad = lat2* (Math.PI / 180);
    const lon2Rad = lon2* (Math.PI / 180);
  
    const deltaLat = lat2Rad - lat1Rad;
    const deltaLon = lon2Rad - lon1Rad;
  
    const centralAngle = Math.acos(
      Math.sin(lat1Rad) * Math.sin(lat2Rad) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon)
    );
  
    const distance = radius * centralAngle;
  
    return distance;
  }
  
  // Helper function to convert Cartesian coordinates to spherical coordinates
  function cartesianToSpherical(x, y, z) {
    const radius = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    const latitude = Math.asin(z / radius) * (180 / Math.PI);
    const longitude = Math.atan2(y, x) * (180 / Math.PI);
    return [latitude, longitude];
  }
  

function calcColor(pos) {
    let dist = []
    for (let i of colorAxis) dist.push(calculateDistance(pos, i))

    let color = [0,0,0]
    for (let i=0;i<referenceColor.length;i++) {
        for (let j=0;j<3;j++) color[j] += referenceColor[i][j]*(maxDist - dist[i])
    }

    color = [Math.ceil(color[0]/4), Math.ceil(color[1]/4), Math.ceil(color[2]/4)]

    return '#' + color[0].toString(16).padStart(2, '0') + color[1].toString(16).padStart(2, '0') + color[2].toString(16).padStart(2, '0')
}

function setupScene() {

    scene.traverse( disposeMaterial );
    scene.children.length = 0;

    scene.add( sphere );

    const geometry = new THREE.IcosahedronGeometry( 0.02, 15 );


    let pointsPos = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]

    for (let i of pointsPos) {
        const m = new THREE.MeshBasicMaterial( { color: calcColor(i) } );
        const s = new THREE.Mesh( geometry, m );

        i = normalize(i)

        s.position.x = i[0];
        s.position.y = i[1];
        s.position.z = i[2];
        scene.add( s );
    }

    for ( let i = 0; i < 300; i ++ ) {

        // const color = new THREE.Color();
        // color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );


        let radius = 1;
        let x = Math.random()*radius*2-radius;
        let y = (radius*radius-x*x);
        y = Math.random() * y * 2 - y;
        while (x*x+y*y >= radius*radius) y = THREE.MathUtils.randFloatSpread( radius*2 );
        let z = Math.sqrt(radius*radius-x*x-y*y)
        if (Math.random() > 0.5) z = -z

        const material = new THREE.MeshBasicMaterial( { color: calcColor([x, y, z]) } );
        const sphere = new THREE.Mesh( geometry, material );
        
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;
        
        scene.add( sphere );
    }

    render();
}

function disposeMaterial( obj ) {

    if ( obj.material ) {

        obj.material.dispose();

    }

}

function render() {
    scene.traverse( darkenNonBloomed );
    bloomComposer.render();
    scene.traverse( restoreMaterial );

    // render the entire scene, then render bloom scene on top
    finalComposer.render();
}

function darkenNonBloomed( obj ) {
    if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
        materials[ obj.uuid ] = obj.material;
        obj.material = darkMaterial;
    }
}

function restoreMaterial( obj ) {
    if ( materials[ obj.uuid ] ) {
        obj.material = materials[ obj.uuid ];
        delete materials[ obj.uuid ];
    }
}

function animate() {
    controls.update();
	requestAnimationFrame( animate );
    
    render();
	// composer.render();
}


animate();