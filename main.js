import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
const app = document.getElementById("app");

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping=true

// const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject;

const raycaster = new THREE.Raycaster();

const radius = 3;

const sphereGeometry = new THREE.SphereGeometry( radius, 128, 128 );
const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );

function init() {
    camera.position.z = 5;

    scene.background = new THREE.Color(0xffffff) // set backgournd color
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    
    app.appendChild(renderer.domElement);

    controls.rotateSpeed = 1
    
    // when the mouse moves, call the given function
    // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // window.addEventListener( 'mousemove', onMouseMove, false );

    addObjects();

    //controls.update() must be called after any manual changes to the camera's transform
    // controls.update();
    // renderer.render( scene, camera );
}
function addObjects() {
    addLight();
    addSphere();
    addPoints();
}

function addLight() {
    //Create a DirectionalLight and turn on shadows for the light
    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( -0.5, 1, 3 ); //default; light shining from top
    light.castShadow = true; // default false
    camera.add(light);
    scene.add( camera );

    // Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
}

function addSphere() {
    //Create a sphere that cast shadows (but does not receive them)
    sphereMaterial.transparent = true
    sphereMaterial.opacity = 0.7
    sphere.castShadow = true; //default is false
    sphere.receiveShadow = false; //default
    scene.add( sphere );
}

function addPoints() {
    let geometry = new THREE.BoxGeometry( 0.05, 0.05, 0.05 );

    for ( let i = 0; i < 100; i ++ ) 
    {
        let object = new THREE.Mesh( 
            geometry, 
            new THREE.MeshLambertMaterial({ 
                color: 0x000000 
            })
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

    app.addEventListener( 'mousemove', onDocumentMouseMove, false );
    app.addEventListener( 'mousedown', onDocumentMouseDown, false );
    // app.addEventListener( 'resize', onWindowResize, false );
}
function onDocumentMouseMove( event ) {

    event.preventDefault();

    let gapX = event.clientX - event.offsetX;
    let gapY = event.clientY - event.offsetY;
    
    mouse.x = ((event.clientX - gapX)/( app.clientWidth )) * 2 - 1;
    mouse.y = -((event.clientY - gapY)/( app.clientHeight )) * 2 + 1;

}
function onDocumentMouseDown( event ) {

    event.preventDefault();
    if ( selectedObject )
    {
        console.log('object clicked')        
        // selectedObject.currentHex = 0x00ff00 * Math.random();
        // selectedObject.material.emissive.setHex( selectedObject.currentHex );
    }

}

function handleHover() {
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );
    let ratio = 2;

    if ( intersects.length > 0 && intersects[0].object != sphere) {
        if ( selectedObject ) selectedObject.material.emissive.setHex( selectedObject.currentHex );

        selectedObject = intersects[0].object;
        selectedObject.currentHex = selectedObject.material.emissive.getHex();
        selectedObject.material.emissive.setHex( 0x00ff00 );
        if (selectedObject.scale.x != ratio) selectedObject.scale.multiplyScalar(ratio);
        // console.log(selectedObject.scale)
        app.style.cursor = 'pointer';
    } 
    else if ( selectedObject ) {
        if ( selectedObject ) selectedObject.material.emissive.setHex( selectedObject.currentHex );
        selectedObject.scale.multiplyScalar(1/ratio);
        selectedObject = null;
        app.style.cursor = 'auto';
    }

}

function animate() {
	requestAnimationFrame( animate );
    handleHover();

	renderer.render( scene, camera );
    controls.update();
}

init();
animate();