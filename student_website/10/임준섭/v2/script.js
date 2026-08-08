// 1. Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb22222); // Firebrick Red
scene.fog = new THREE.FogExp2(0xb22222, 0.015); // Red Fog Effect

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 2. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffaaaa, 0.8);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// 3. Pointer Lock Controls (First-Person Perspective)
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => {
    controls.lock();
});

// 4. Create Parkour Platforms
const platforms = [];

function createPlatform(x, y, z, w, h, d, color = 0x333333) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    platforms.push(mesh);
    return mesh;
}

// Starting Platform & Parkour Jump Platforms
createPlatform(0, -1, 0, 10, 2, 10, 0x444444);
createPlatform(0, 2, -15, 8, 2, 8, 0x333333);
createPlatform(10, 6, -30, 8, 2, 8, 0x333333);
createPlatform(0, 10, -45, 10, 2, 10, 0x333333);
createPlatform(-12, 14, -60, 8, 2, 8, 0x333333);
createPlatform(0, 18, -75, 12, 2, 12, 0xffd700); // Gold Goal Platform!

// 5. Physics & Movement Variables
let velocity = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
const gravity = 30;

camera.position.set(0, 3, 0);

// Keyboard Event Handlers
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y += 15;
                canJump = false;
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
});

// Window Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Game Loop (Animation Loop)
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000; // Frame interval in seconds

        // Apply Friction & Gravity
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= gravity * delta;

        // Movement Direction Vector
        const direction = new THREE.Vector3();
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        // Update Player Position
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;

        // Fall & Respawn Check
        if (camera.position.y < -20) {
            camera.position.set(0, 3, 0);
            velocity.set(0, 0, 0);
        } else {
            // Platform Floor Collision Check
            platforms.forEach((p) => {
                const px = camera.position.x;
                const py = camera.position.y;
                const pz = camera.position.z;
                const box = new THREE.Box3().setFromObject(p);

                if (
                    px >= box.min.x &&
                    px <= box.max.x &&
                    pz >= box.min.z &&
                    pz <= box.max.z &&
                    py >= box.max.y &&
                    py <= box.max.y + 2.5 &&
                    velocity.y <= 0
                ) {
                    velocity.y = 0;
                    camera.position.y = box.max.y + 2.5;
                    canJump = true;
                }
            });
        }

        prevTime = time;
    } else {
        prevTime = performance.now();
    }

    renderer.render(scene, camera);
}

animate();
