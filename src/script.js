/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
import { PlaneGeometry, Mesh, MeshBasicMaterial } from 'three';
import { Clock, Scene, LoadingManager, WebGLRenderer, sRGBEncoding, Group, PerspectiveCamera, DirectionalLight, PointLight, MeshPhongMaterial } from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/////////////////////////////////////////////////////////////////////////
//// LOADING MANAGER
const ftsLoader = document.querySelector(".lds-roller")
const looadingCover = document.getElementById("loading-text-intro")
const loadingManager = new LoadingManager()

loadingManager.onLoad = function() {

    document.querySelector(".main-container").style.visibility = 'visible'
    document.querySelector("body").style.overflow = 'block'

    const yPosition = {y: 0}
    
    new TWEEN.Tween(yPosition).to({y: 100}, 900).easing(TWEEN.Easing.Quadratic.InOut).start()
    .onUpdate(function(){ looadingCover.style.setProperty('transform', `translate( 0, ${yPosition.y}%)`)})
    .onComplete(function () {looadingCover.parentNode.removeChild(document.getElementById("loading-text-intro")); TWEEN.remove(this)})

    introAnimation()
    ftsLoader.parentNode.removeChild(ftsLoader)

    window.scroll(0, 0)

}

/////////////////////////////////////////////////////////////////////////
//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
dracoLoader.setDecoderConfig({ type: 'js' })
const loader = new GLTFLoader(loadingManager)
loader.setDRACOLoader(dracoLoader)

/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.getElementById('canvas-container')
const containerDetails = document.getElementById('canvas-container-details')

/////////////////////////////////////////////////////////////////////////
///// GENERAL VARIABLES
let oldMaterial
let secondContainer = false
let width = container.clientWidth
let height = container.clientHeight

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new Scene()

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance"})
renderer.autoClear = true
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
renderer.setSize( width, height)
renderer.outputEncoding = sRGBEncoding
container.appendChild(renderer.domElement)

const renderer2 = new WebGLRenderer({ antialias: false})
renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 1))
renderer2.setSize( width, height)
renderer2.outputEncoding = sRGBEncoding
containerDetails.appendChild(renderer2.domElement)

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const cameraGroup = new Group()
scene.add(cameraGroup)

const camera = new PerspectiveCamera(35, width / height, 1, 100)
camera.position.set(19,1.54,-0.1)
cameraGroup.add(camera)

const camera2 = new PerspectiveCamera(35, containerDetails.clientWidth / containerDetails.clientHeight, 1, 100)
camera2.position.set(1.9,2.7,2.7)
camera2.rotation.set(0,1.1,0)
scene.add(camera2)

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    
    camera2.aspect = containerDetails.clientWidth / containerDetails.clientHeight
    camera2.updateProjectionMatrix()

    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer2.setSize(containerDetails.clientWidth, containerDetails.clientHeight)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 1))
})


const hdrFilePath = 'models/gltf/fondo.hdr';

// Cargar el HDR
const rgbeLoader = new RGBELoader(loadingManager);
rgbeLoader.load(hdrFilePath, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Aplicar el HDR como fondo y entorno
    scene.background = texture; // Fondo visible
    scene.environment = texture; // Iluminación global para materiales físicos
}, undefined, (err) => {
    console.error('Error al cargar el HDR:', err);
});
/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const sunLight = new DirectionalLight(0x435c72, 0.5)
sunLight.position.set(0, 0, 0)
scene.add(sunLight)

const fillLight = new PointLight(0xffffff, 10, 20, 10)
fillLight.position.set(0, 0, 0)
scene.add(fillLight)

const glossyLight = new PointLight(0x90ee90, 8, 30, 15)
glossyLight.position.set(0, 0, 0)
scene.add(glossyLight)

const fantasyLight = new PointLight(0x7a00e6, 6, 20, 10)
fantasyLight.position.set(0, 0, 0)
scene.add(fantasyLight);
const planeGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight);

const planeTexture = new TextureLoader().load('textures/1.jpg', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(window.innerWidth / texture.image.width, window.innerHeight / texture.image.height);
});

const planeMaterial = new MeshBasicMaterial({
    map: planeTexture,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: -2,
});

const plane = new Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, -5); // Adjusted position to ensure visibility
scene.add(plane);
/////////////////////////////////////////////////////////////////////////
///// LOADING GLB/GLTF MODEL FROM BLENDER
loader.load('models/gltf/landing.glb', function (gltf) { //cargar cualquier modelo

    if (window.innerWidth < 768) {
        gltf.scene.scale.set(5,5,5)
        gltf.scene.position.set(0,1.5,0)
        gltf.scene.rotation.set(0,2,0)
    } else {
        gltf.scene.scale.set(10,10,10)
    }
    gltf.scene.rotation.set(0,0,0)

    if (window.innerWidth > 768) {
        gltf.scene.position.set(0,-0.5, 0)
    }

    gltf.scene.traverse((obj) => {
        if (obj.isMesh) {
            oldMaterial = obj.material
            obj.material = new MeshPhongMaterial({
                color: 0x000000, // Black color
                shininess: 300, // High shininess for glossy effect
                reflectivity: 1, // High reflectivity
            })
        }
    })
    scene.add(gltf.scene)
    clearScene()
})
function clearScene(){
    oldMaterial.dispose()
    renderer.renderLists.dispose()
}

/////////////////////////////////////////////////////////////////////////
//// INTRO CAMERA ANIMATION USING TWEEN
function introAnimation() {
    new TWEEN.Tween(camera.position.set(0,4,2.7)).to({ x: 0, y: 2.4, z: 8.8}, 3500).easing(TWEEN.Easing.Quadratic.InOut).start()
    .onComplete(function () {
        TWEEN.remove(this)
        document.querySelector('.header').classList.add('ended')
        document.querySelector('.first>p').classList.add('ended')
    })
    
}

//////////////////////////////////////////////////
//// CLICK LISTENERS
// document.getElementById('aglaea').addEventListener('click', () => {
//     document.getElementById('aglaea').classList.add('active')
//     document.getElementById('euphre').classList.remove('active')
//     document.getElementById('thalia').classList.remove('active')
//     document.getElementById('content').innerHTML = 'She was venerated as the goddess of beauty, splendor, glory, magnificence, and adornment. She is the youngest of the Charites according to Hesiod. Aglaea is one of three daughters of Zeus and either the Oceanid Eurynome, or of Eunomia, the goddess of good order and lawful conduct.'
//     animateCamera({ x: 1.9, y: 2.7, z: 2.7 },{ y: 1.1 })
// })

// document.getElementById('thalia').addEventListener('click', () => {
//     document.getElementById('thalia').classList.add('active')
//     document.getElementById('aglaea').classList.remove('active')
//     document.getElementById('euphre').classList.remove('active')
//     document.getElementById('content').innerHTML = 'Thalia, in Greek religion, one of the nine Muses, patron of comedy; also, according to the Greek poet Hesiod, a Grace (one of a group of goddesses of fertility). She is the mother of the Corybantes, celebrants of the Great Mother of the Gods, Cybele, the father being Apollo, a god related to music and dance. In her hands she carried the comic mask and the shepherd’s staff.'
//     animateCamera({ x: -0.9, y: 3.1, z: 2.6 },{ y: -0.1 })
// })

// document.getElementById('euphre').addEventListener('click', () => {
//     document.getElementById('euphre').classList.add('active')
//     document.getElementById('aglaea').classList.remove('active')
//     document.getElementById('thalia').classList.remove('active')
//     document.getElementById('content').innerHTML = 'Euphrosyne is a Goddess of Good Cheer, Joy and Mirth. Her name is the female version of a Greek word euphrosynos, which means "merriment". The Greek poet Pindar states that these goddesses were created to fill the world with pleasant moments and good will. Usually the Charites attended the goddess of beauty Aphrodite.'
//     animateCamera({ x: -0.4, y: 2.7, z: 1.9 },{ y: -0.6 })
// })

/////////////////////////////////////////////////////////////////////////
//// ANIMATE CAMERA
function animateCamera(position, rotation){
    new TWEEN.Tween(camera2.position).to(position, 1800).easing(TWEEN.Easing.Quadratic.InOut).start()
    .onComplete(function () {
        TWEEN.remove(this)
    })
    new TWEEN.Tween(camera2.rotation).to(rotation, 1800).easing(TWEEN.Easing.Quadratic.InOut).start()
    .onComplete(function () {
        TWEEN.remove(this)
    })
}

/////////////////////////////////////////////////////////////////////////
//// PARALLAX CONFIG
const cursor = {x:0, y:0}
const clock = new Clock()
let previousTime = 0

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION

function rendeLoop() {

    TWEEN.update()

    if (secondContainer){
        renderer2.render(scene, camera2)
    } else{
        renderer.render(scene, camera)
    }

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    const parallaxY = cursor.y
    fillLight.position.y -= ( parallaxY *9 + fillLight.position.y -2) * deltaTime
    sunLight.position.y -= (parallaxY *9 + sunLight.position.y -2) * deltaTime
    glossyLight.position.y -= (parallaxY *9 + glossyLight.position.y -2) * deltaTime
    fantasyLight.position.y -= (parallaxY *9 + fantasyLight.position.y -2) * deltaTime

    const parallaxX = cursor.x
    fillLight.position.x += (parallaxX *8 - fillLight.position.x) * 2 * deltaTime
    sunLight.position.x += (parallaxX *8 - sunLight.position.x) * 2 * deltaTime
    glossyLight.position.x += (parallaxX *8 - glossyLight.position.x) * 2 * deltaTime
    fantasyLight.position.x += (parallaxX *8 - fantasyLight.position.x) * 2 * deltaTime

    cameraGroup.position.z -= (parallaxY/3 + cameraGroup.position.z) * 2 * deltaTime
    cameraGroup.position.x += (parallaxX/3 - cameraGroup.position.x) * 2 * deltaTime

    requestAnimationFrame(rendeLoop)
}
rendeLoop()

//////////////////////////////////////////////////
//// ON MOUSE MOVE TO GET CAMERA POSITION
document.addEventListener('mousemove', (event) => {
    event.preventDefault()

    cursor.x = event.clientX / window.innerWidth -0.5
    cursor.y = event.clientY / window.innerHeight -0.5

    handleCursor(event)
}, false)
document.addEventListener('touchmove', (event) => {
    event.preventDefault()

    cursor.x = event.touches[0].clientX / window.innerWidth -0.5
    cursor.y = event.touches[0].clientY / window.innerHeight -0.5

    handleCursor(event)
}, false)

//////////////////////////////////////////////////
//// DISABLE RENDERER BASED ON CONTAINER VIEW
const watchedSection = document.querySelector('.second')

function obCallback(payload) {
    if (payload[0].intersectionRatio > 0.05){
        secondContainer = true
    }else{
        secondContainer = false
    }
}

const ob = new IntersectionObserver(obCallback, {
    threshold: 0.05
})

ob.observe(watchedSection)

//////////////////////////////////////////////////
//// MAGNETIC MENU
const btn = document.querySelectorAll('nav > .a')
const customCursor = document.querySelector('.cursor')

function update(e) {
    const span = this.querySelector('span')
    
    if(e.type === 'mouseleave' || e.type === 'touchend') {
        span.style.cssText = ''
    } else {
        const { offsetX: x, offsetY: y } = e,{ offsetWidth: width, offsetHeight: height } = this,
        walk = 10, xWalk = (x / width) * (walk * 2) - walk, yWalk = (y / height) * (walk * 2) - walk
        span.style.cssText = `transform: translate(${xWalk}px, ${yWalk}px);`
    }
}

const handleCursor = (e) => {
    const x = e.clientX || e.touches[0].clientX
    const y =  e.clientY || e.touches[0].clientY
    customCursor.style.cssText =`left: ${x}px; top: ${y}px;`
}

btn.forEach(b => b.addEventListener('mousemove', update))
btn.forEach(b => b.addEventListener('mouseleave', update))
btn.forEach(b => b.addEventListener('touchmove', update))
btn.forEach(b => b.addEventListener('touchend', update))


