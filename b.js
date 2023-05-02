import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
const app = document.getElementById("app");
const desc = document.getElementById('info');

const controls = new OrbitControls( camera, renderer.domElement );

const raycaster = new THREE.Raycaster();

const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass( renderScene );




// objectes
const radius = 3;

const sphereGeometry = new THREE.SphereGeometry( radius, 128, 128 );
const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );


let particles;

// const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const client = new THREE.Vector2();
let selectedObject;


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

function init() {
    controls.enableDamping=true

    camera.position.z = 5;

    scene.background = new THREE.Color(0xfffae5) // set backgournd color
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    
    app.appendChild(renderer.domElement);

    controls.rotateSpeed = 1
    
    // when the mouse moves, call the given function
    // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // window.addEventListener( 'mousemove', onMouseMove, false );
    scene.add( camera );

    addObjects();

    //controls.update() must be called after any manual changes to the camera's transform
    // controls.update();
    // renderer.render( scene, camera );
}
function addObjects() {
    addLight();
    addSphere();
    addPoints();
    // addParticles();
}

function addParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for ( let i = 0; i < 10000; i ++ ) {

        vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
        vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
        vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z

    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x56382d } ) );
    scene.add( particles );

}

function addLight() {
    //Create a DirectionalLight and turn on shadows for the light
    // const light = new THREE.DirectionalLight( 0xffffff, 1 );
    // light.position.set( -0.5, 1, 3 ); //default; light shining from top
    // light.castShadow = true; // default false
    // camera.add(light);
    

    // Set up shadow properties for the light
    // light.shadow.mapSize.width = 512; // default
    // light.shadow.mapSize.height = 512; // default
    // light.shadow.camera.near = 0.5; // default
    // light.shadow.camera.far = 500; // default
}

function addSphere() {
    //Create a sphere that cast shadows (but does not receive them)
    sphereMaterial.transparent = true
    sphereMaterial.opacity = 0.5
    // sphere.castShadow = true; //default is false
    // sphere.receiveShadow = false; //default
    scene.add( sphere );
}

function addPoints() {
    let geometry = new THREE.SphereGeometry( 0.03, 128, 128 );

    for ( let i = 0; i < 100; i ++ ) 
    {
        let object = new THREE.Mesh( 
            geometry, 
            new THREE.MeshLambertMaterial({ 
                color: 0xFAFABE
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

    client.x = event.clientX;
    client.y = event.clientY;
    
    mouse.x = ((event.offsetX)/( app.clientWidth )) * 2 - 1;
    mouse.y = -((event.offsetY)/( app.clientHeight )) * 2 + 1;

}
function onDocumentMouseDown( event ) {

    event.preventDefault();
    
    if ( selectedObject && selectedObject != sphere) {
    //     console.log('modal')
    //     modal.style.visibility = 'visible';
    //     document.getElementById('box').style.visibility = 'visible';
        desc.style.visibility = 'hidden';
    }

}

function handleHover() {
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children );
    let ratio = 2;

    if ( intersects.length > 0 && intersects[0].object != sphere && intersects[0].object != particles ) {
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

	renderer.render( scene, camera );
    controls.update();
}

init();
animate();

