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

const modalBg = document.getElementById('modal-bg')

const ratio = window.innerHeight/150;
renderer.domElement.style.width = `${window.innerWidth/ratio}px`
renderer.domElement.style.height = `${window.innerHeight/ratio}px`

const windowReduceSize = 200

renderer.domElement.addEventListener('click', (e)=> {
    renderer.domElement.style.position = 'fixed'
    renderer.domElement.style.top = `${windowReduceSize/2}px`
    renderer.domElement.style.left = `${windowReduceSize/2}px`
    renderer.domElement.style.width = `${window.innerWidth-windowReduceSize}px`
    renderer.domElement.style.height = `${window.innerHeight-windowReduceSize}px`

    modalBg.style.display = 'block'
})

document.addEventListener('click', (e)=> {
    if (e.target != renderer.domElement) {
        renderer.domElement.style.position = 'relative'
        renderer.domElement.style.top = `0px`
        renderer.domElement.style.left = `0px`
        renderer.domElement.style.width = `${window.innerWidth/ratio}px`
        renderer.domElement.style.height = `${window.innerHeight/ratio}px`

        modalBg.style.display = 'none'
    }
})

const desc = document.getElementById('info')
const contrast = document.getElementById('contrast')

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');

btn1.addEventListener('click', hide);
btn2.addEventListener('click', hide);

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

const embeddingObjects = []

const colorAxis = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
const referenceColor = [[204, 102, 102], [153, 204, 102], [102, 204, 204], [153, 102, 204]]
const maxDist = 1.9106332362490184

const embeddings = getEmbeddings()

setupScene();

let selectedObject;
let clicked = false;

function onMouseMove(event) {    
    mouse.x = ((event.offsetX)/( renderer.domElement.clientWidth )) * 2 - 1;
    mouse.y = -((event.offsetY)/( renderer.domElement.clientHeight )) * 2 + 1;

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
    mouse.x = ((event.offsetX)/( renderer.domElement.clientWidth )) * 2 - 1;
    mouse.y = -((event.offsetY)/( renderer.domElement.clientHeight )) * 2 + 1;

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

    // renderer.setSize( width, height );
    // bloomComposer.setSize( width, height );
    // finalComposer.setSize( width, height );

    
    renderer.setSize( width, height );
    bloomComposer.setSize( width, height );
    finalComposer.setSize( width, height );

    render();

};


function normalize(pos) {
    let norm = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1] + pos[2]*pos[2])
    return [pos[0]/norm, pos[1]/norm, pos[2]/norm]
}

function getEmbeddings() {
    let em = []
    for (let i =0;i<100;i++) em.push(normalize([Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5]))
    return em;
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

    for ( let i = 0; i < embeddings.length; i ++ ) {


        let [x, y, z] = embeddings[i]
        
        const material = new THREE.MeshBasicMaterial( { color: calcColor(embeddings[i]) } );
        const sphere = new THREE.Mesh( geometry, material );

        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;
        
        scene.add( sphere );
        embeddingObjects.push(sphere)
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

function onCheckboxClicked(e, idx) {
    let checkbox = e.target

    if (embeddingObjects.length > 0) {
        // controls.target = embeddingObjects[idx].position;

        embeddingObjects[idx].layers.toggle( BLOOM_SCENE );
        render();
    }
    
    let c = calcColor(embeddings[idx])
    let co = [parseInt(c.substring(1, 3), 16), parseInt(c.substring(3, 5), 16), parseInt(c.substring(5, 7), 16)]
    let col = changeColorByLuminosity(co, 0.3)
    let colo = '#' + col[0].toString(16).padStart(2, '0') + col[1].toString(16).padStart(2, '0') + col[2].toString(16).padStart(2, '0')
    
    if (checkbox.style.fill == '' || checkbox.style.fill == 'white') checkbox.style.fill = colo
    else checkbox.style.fill = 'white'
}

function processBold(data) {
    let res = ''
    let idx = 0

    for (let i =0;i<data['bold'].length; i++) {
        let b = data['bold'][i]
        if (idx < b[0]) res += data['content'].substring(idx, b[0])
        
        let c = calcColor(data['embedding'][i])
        let co = [parseInt(c.substring(1, 3), 16), parseInt(c.substring(3, 5), 16), parseInt(c.substring(5, 7), 16)]
        let col = changeColorByLuminosity(co, 0.3)
        let colo = '#' + col[0].toString(16).padStart(2, '0') + col[1].toString(16).padStart(2, '0') + col[2].toString(16).padStart(2, '0')

        res += `<b style="color:${colo}">`+data['content'].substring(b[0],b[0]+b[1])+'</b>'
        idx = b[0] + b[1]
    }
    res += data['content'].substring(idx, data['content'].length)

    return res
}
function changeColorByLuminosity(rgbColor, luminosityChange) {
    // Convert RGB to HSL
    const r = rgbColor[0] / 255;
    const g = rgbColor[1] / 255;
    const b = rgbColor[2] / 255;
  
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
  
    let h, s, l;
    
    // Calculate hue (H)
    if (max === min) {
      h = 0; // No hue for grayscale
    } else if (max === r) {
      h = ((g - b) / (max - min)) % 6;
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  
    // Calculate lightness (L)
    l = (max + min) / 2;
  
    // Calculate saturation (S)
    if (max === min) {
      s = 0; // No saturation for grayscale
    } else if (l <= 0.5) {
      s = (max - min) / (max + min);
    } else {
      s = (max - min) / (2 - max - min);
    }
  
    // Adjust luminosity
    l = Math.min(Math.max(l + luminosityChange, 0), 1);
  
    // Convert HSL to RGB
    s = Math.min(Math.max(s, 0), 1);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
  
    let r1, g1, b1;
    if (0 <= h && h < 60) {
      r1 = c;
      g1 = x;
      b1 = 0;
    } else if (60 <= h && h < 120) {
      r1 = x;
      g1 = c;
      b1 = 0;
    } else if (120 <= h && h < 180) {
      r1 = 0;
      g1 = c;
      b1 = x;
    } else if (180 <= h && h < 240) {
      r1 = 0;
      g1 = x;
      b1 = c;
    } else if (240 <= h && h < 300) {
      r1 = x;
      g1 = 0;
      b1 = c;
    } else if (300 <= h && h < 360) {
      r1 = c;
      g1 = 0;
      b1 = x;
    }
  
    const red = Math.round((r1 + m) * 255);
    const green = Math.round((g1 + m) * 255);
    const blue = Math.round((b1 + m) * 255);
  
    return [red, green, blue];
}

function addNews(data, idx) {
    let checkbox = document.createElement('div')

    checkbox.classList.add('check-box')
    checkbox.onclick = (e) => onCheckboxClicked(e, idx)
    checkbox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><g id="Shape / Square"><path id="Vector" d="M3 6.2002V17.8002C3 18.9203 3 19.4796 3.21799 19.9074C3.40973 20.2837 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H17.8031C18.921 21 19.48 21 19.9074 20.7822C20.2837 20.5905 20.5905 20.2837 20.7822 19.9074C21 19.48 21 18.921 21 17.8031V6.19691C21 5.07899 21 4.5192 20.7822 4.0918C20.5905 3.71547 20.2837 3.40973 19.9074 3.21799C19.4796 3 18.9203 3 17.8002 3H6.2002C5.08009 3 4.51962 3 4.0918 3.21799C3.71547 3.40973 3.40973 3.71547 3.21799 4.0918C3 4.51962 3 5.08009 3 6.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'

    let news = document.createElement('div')
    news.classList.add('news')

    let newsCard = document.createElement('div')
    newsCard.classList.add('news-card')

    let newsTitle = document.createElement('div')
    newsTitle.classList.add('news-title')
    newsTitle.textContent = data['title']

    let newsContent = document.createElement('div')
    newsContent.classList.add('news-content')
    newsContent.innerHTML = data['content']


    // let json = {[
    //     'title': '',
    //     'content': '',
    //     'embedding': [],
    //     'bold': [(idx, length)]
    // ]}

    news.appendChild(newsTitle)
    news.appendChild(newsContent)

    newsCard.appendChild(checkbox)
    newsCard.append(news)

    document.getElementById('news-container').appendChild(newsCard)
}

function addResultCnt(x) {
    let resultCnt = document.createElement('div')
    resultCnt.classList.add('result-cnt')
    resultCnt.textContent = `${x} results`

    document.getElementById('news-container').appendChild(resultCnt)
}

let qreviousSearchWord = ''
function query(searchWord) {
    if (qreviousSearchWord != searchWord) {
        qreviousSearchWord = searchWord

        // query to server
        fetch(`https://cors-anywhere.herokuapp.com/https://5f5c-58-233-13-194.ngrok-free.app/query?q=${searchWord}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            document.getElementById('news-container').innerHTML = ''

            

            addResultCnt(data.length);

            for (let i=0; data.length ; i++) {
                data[i]['content'] = processBold(data[i])
                addNews(data[i], i)
            }

        });

        console.log(searchWord)
    }
}
function repeat() {
    query(document.getElementById('search-word').value)
    setTimeout(repeat, 500);
}

repeat();

