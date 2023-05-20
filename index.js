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

const renderPass = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.6, 0.1, 0.1 );

const composer = new EffectComposer( renderer );
composer.addPass( renderPass );
composer.addPass( bloomPass );


const app = document.getElementById("app");
app.appendChild(renderer.domElement);

const desc = document.getElementById('info');
// const modal = document.getElementById('modal-bg');

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping=true
controls.rotateSpeed = 1

// const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const client = new THREE.Vector2();
let selectedObject;

const raycaster = new THREE.Raycaster();

const radius = 3;
const sphereGeometry = new THREE.SphereGeometry( radius, 128, 128 ); 
const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
sphereMaterial.transparent = true;
sphereMaterial.opacity = 0.5;
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
scene.add( sphere );


app.addEventListener( 'mousemove', onMouseMove, false );
app.addEventListener( 'mousedown', onMouseDown, false );

addPoints();

function addPoints() {
    for ( let i = 0; i < 100; i ++ ) 
    {
        const object = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 32, 32),
            new THREE.MeshLambertMaterial( { color: 0xfafabe } )
        );

        
        let x = Math.random()*radius*2-radius;
        
        let y = (radius*radius-x*x);
        y = Math.random() * y * 2 - y;
    
        while (x*x+y*y >= radius*radius) y = THREE.MathUtils.randFloatSpread( radius*2 );
        let z = Math.sqrt(radius*radius-x*x-y*y)
        if (Math.random() > 0.5) z = -z
        
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;

        scene.add( object );
    }
}
function onMouseMove( event ) {

    event.preventDefault();

    client.x = event.clientX;
    client.y = event.clientY;
    
    mouse.x = ((event.offsetX)/( app.clientWidth )) * 2 - 1;
    mouse.y = -((event.offsetY)/( app.clientHeight )) * 2 + 1;

}
function onMouseDown( event ) {

    event.preventDefault();
    
    if ( selectedObject && selectedObject != sphere) {
    //     console.log('modal')
    //     modal.style.visibility = 'visible';
    //     document.getElementById('box').style.visibility = 'visible';

        console.log('clicked')
        composer.render()

        // desc.style.visibility = 'hidden';
    }

}

function handleHover() {
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );
    let ratio = 2;

    if ( intersects.length > 0 && intersects[0].object != sphere) {
        if ( selectedObject ) selectedObject.material.emissive.setHex( selectedObject.currentHex );

        if (selectedObject == intersects[0].object) {
            selectedObject.currentHex = selectedObject.material.emissive.getHex();
            selectedObject.material.emissive.setHex( 0x00ff00 );
        } else {
            selectedObject = intersects[0].object;
            if (selectedObject.scale.x != ratio) selectedObject.scale.multiplyScalar(ratio);
            
            app.style.cursor = 'pointer';

            desc.style.visibility = 'visible';
            desc.style.top = `${client.y - 30}px`;
            desc.style.left = `${client.x + 40}px`;
            desc.classList.add('zoom');
        }
    } 
    else if ( selectedObject ) {
        if ( selectedObject ) selectedObject.material.emissive.setHex( selectedObject.currentHex );
        selectedObject.scale.multiplyScalar(1/ratio);
        selectedObject = null;
        app.style.cursor = 'auto';
        
        desc.style.visibility = 'hidden';
        desc.classList.remove('zoom');
    }

}

function animate() {
	requestAnimationFrame( animate );
    handleHover();

    composer.render();
	renderer.render( scene, camera );
    controls.update();
}


animate();