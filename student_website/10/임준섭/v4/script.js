// 1. DOM Elements & UI State
const stageNumDisplay = document.getElementById('stageNum');
const timerDisplay = document.getElementById('timerDisplay');
const wallBadge = document.getElementById('wallBadge');
const slideBadge = document.getElementById('slideBadge');
const checkpointBadge = document.getElementById('checkpointBadge');
const victoryOverlay = document.getElementById('victoryOverlay');
const victoryTitle = document.getElementById('victoryTitle');
const victoryMessage = document.getElementById('victoryMessage');
const finalTimeDisplay = document.getElementById('finalTimeDisplay');
const nextStageBtn = document.getElementById('nextStageBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// 2. Three.js Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
const skyColor = new THREE.Color(0x87ceeb); // Realistic Sky Blue
scene.background = skyColor;
scene.fog = new THREE.FogExp2(0xbae6fd, 0.008);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; // Clamp Euler order to prevent gimbal roll spinning

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 3. Realistic Sunlight & Sun Mesh
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.0);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(25, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd5 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(40, 80, -300);
scene.add(sunMesh);

// 4. PointerLock Controls
const controls = new THREE.PointerLockControls(camera, document.body);

// Limit Vertical Pitch strictly between -90 deg (-PI/2) and +90 deg (+PI/2)
controls.minPolarAngle = 0.01; // Limit looking straight down (0 deg)
controls.maxPolarAngle = Math.PI - 0.01; // Limit looking straight up (180 deg)

document.body.addEventListener('click', () => {
    if (!victoryOverlay.classList.contains('hidden')) return;
    controls.lock();
});

// 5. Game Data & Mechanics
let currentStage = 1;
let startTime = 0;
let elapsedTime = 0;
let isTimerRunning = false;

let platforms = [];
let walls = [];
let checkpoints = [];
let goalMesh = null;

let spawnPoint = new THREE.Vector3(0, 3, 0);
let activeCheckpointPos = new THREE.Vector3(0, 3, 0);

// Physics & Movement Variables
let velocity = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isSprinting = false;
let isSliding = false;
let isWallRunning = false;
let canJump = false;
let currentWallNormal = new THREE.Vector3();

const normalHeight = 3.0;
const slideHeight = 1.5;
const gravity = 30;

camera.position.copy(spawnPoint);

// Keyboard Event Handlers
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isSprinting = true;
            break;
        case 'KeyC':
        case 'ControlLeft':
            isSliding = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = 15;
                canJump = false;
            } else if (isWallRunning) {
                // Wall Jump Push
                velocity.y = 15;
                velocity.x += currentWallNormal.x * 14;
                velocity.z += currentWallNormal.z * 14;
                isWallRunning = false;
                wallBadge.classList.add('hidden');
            }
            break;
        case 'KeyR':
            respawnPlayer();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isSprinting = false;
            break;
        case 'KeyC':
        case 'ControlLeft':
            isSliding = false;
            break;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Level Generator Functions
function clearSceneObjects() {
    platforms.forEach(p => scene.remove(p));
    walls.forEach(w => scene.remove(w));
    checkpoints.forEach(c => scene.remove(c.mesh));
    if (goalMesh) scene.remove(goalMesh);

    platforms = [];
    walls = [];
    checkpoints = [];
    goalMesh = null;
}

function createPlatform(x, y, z, w, h, d, color = 0x334155, isGrid = true) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);

    if (isGrid) {
        const wireGeo = new THREE.WireframeGeometry(geo);
        const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 1 });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        mesh.add(wireframe);
    }

    scene.add(mesh);
    platforms.push(mesh);
    return mesh;
}

function createWall(x, y, z, w, h, d, color = 0x475569) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    walls.push(mesh);
    return mesh;
}

function createCheckpoint(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 3, z);
    scene.add(mesh);

    checkpoints.push({ mesh, pos: new THREE.Vector3(x, y + 3, z), triggered: false });
}

function createGoal(x, y, z) {
    const geo = new THREE.BoxGeometry(12, 2, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    goalMesh = new THREE.Mesh(geo, mat);
    goalMesh.position.set(x, y, z);

    const beamGeo = new THREE.CylinderGeometry(2, 2, 40, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.35 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 20, 0);
    goalMesh.add(beam);

    scene.add(goalMesh);
    platforms.push(goalMesh);
}

// Build Specific Stages
function loadStage(stage) {
    clearSceneObjects();
    currentStage = stage;
    stageNumDisplay.textContent = currentStage;

    if (stage === 1) {
        // Stage 1: Basic Parkour Course
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 12, 2, 12);
        createPlatform(0, 2, -18, 8, 2, 8);
        createPlatform(0, 6, -36, 8, 2, 8);
        
        createCheckpoint(0, 7, -36);

        createPlatform(10, 10, -54, 8, 2, 8);
        createPlatform(0, 14, -72, 8, 2, 8);
        createGoal(0, 18, -94);
    } else if (stage === 2) {
        // Stage 2: Wall Run & Sliding Tunnel Course
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 10, 2, 10);
        
        // Wall Run Section
        createWall(6, 8, -25, 1, 16, 24);
        createPlatform(0, 8, -40, 8, 2, 8);

        createCheckpoint(0, 9, -40);

        // Low Ceiling Sliding Barrier
        createPlatform(0, 12, -60, 10, 2, 16);
        createWall(0, 16.5, -60, 10, 5, 16, 0x1e293b); // Overhead roof forcing slide!

        createGoal(0, 16, -88);
    } else if (stage === 3) {
        // Stage 3: Master Parkour Challenge
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 10, 2, 10);

        createPlatform(-12, 4, -20, 7, 2, 7);
        createWall(-18, 10, -35, 1, 16, 20);

        createPlatform(0, 10, -48, 8, 2, 8);
        createCheckpoint(0, 11, -48);

        createWall(7, 16, -65, 1, 16, 20);
        createPlatform(-8, 20, -82, 8, 2, 8);

        createGoal(0, 24, -108);
    }

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

function respawnPlayer() {
    camera.position.copy(activeCheckpointPos);
    camera.rotation.set(0, 0, 0); // Reset camera tilt
    velocity.set(0, 0, 0);
    isWallRunning = false;
    wallBadge.classList.add('hidden');
    slideBadge.classList.add('hidden');
}

// 7. Timer Handling
function updateTimer() {
    if (isTimerRunning) {
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000;
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }
}

// 8. Wall Running Check (Stable Camera Rotation - No Wild Spinning!)
function checkWallRun() {
    isWallRunning = false;
    const playerPos = camera.position.clone();
    playerPos.y -= 0.8;

    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];

    const raycaster = new THREE.Raycaster();
    for (const dir of directions) {
        raycaster.set(playerPos, dir);
        const intersects = raycaster.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 2.5) {
            if (!canJump && (moveForward || moveLeft || moveRight || moveBackward)) {
                isWallRunning = true;
                currentWallNormal.copy(intersects[0].face.normal);
                break;
            }
        }
    }

    // Keep camera roll locked to 0 for rock-solid stability!
    camera.rotation.z = 0;

    if (isWallRunning) {
        wallBadge.classList.remove('hidden');
    } else {
        wallBadge.classList.add('hidden');
    }
}

// Solid Wall Horizontal Collision Resolution
function resolveWallCollisions() {
    const playerRadius = 0.9;

    walls.forEach((w) => {
        const box = new THREE.Box3().setFromObject(w);

        if (camera.position.y >= box.min.y - 1.5 && camera.position.y <= box.max.y + 1.5) {
            const expMinX = box.min.x - playerRadius;
            const expMaxX = box.max.x + playerRadius;
            const expMinZ = box.min.z - playerRadius;
            const expMaxZ = box.max.z + playerRadius;

            if (camera.position.x > expMinX && camera.position.x < expMaxX &&
                camera.position.z > expMinZ && camera.position.z < expMaxZ) {

                const dLeft = Math.abs(camera.position.x - expMinX);
                const dRight = Math.abs(camera.position.x - expMaxX);
                const dBack = Math.abs(camera.position.z - expMinZ);
                const dFront = Math.abs(camera.position.z - expMaxZ);

                const minDist = Math.min(dLeft, dRight, dBack, dFront);

                if (minDist === dLeft) camera.position.x = expMinX;
                else if (minDist === dRight) camera.position.x = expMaxX;
                else if (minDist === dBack) camera.position.z = expMinZ;
                else if (minDist === dFront) camera.position.z = expMaxZ;
            }
        }
    });
}

function checkCheckpoints() {
    checkpoints.forEach(cp => {
        if (!cp.triggered) {
            const dist = camera.position.distanceTo(cp.pos);
            if (dist < 3.5) {
                cp.triggered = true;
                activeCheckpointPos.copy(cp.pos);
                cp.mesh.material.color.setHex(0xfacc15);

                checkpointBadge.classList.remove('hidden');
                setTimeout(() => checkpointBadge.classList.add('hidden'), 2000);
            }
        }
    });
}

function checkGoal() {
    if (goalMesh) {
        const box = new THREE.Box3().setFromObject(goalMesh);
        const px = camera.position.x;
        const py = camera.position.y;
        const pz = camera.position.z;

        if (px >= box.min.x && px <= box.max.x &&
            pz >= box.min.z && pz <= box.max.z &&
            py >= box.min.y && py <= box.max.y + 4.0) {
            stageComplete();
        }
    }
}

function stageComplete() {
    controls.unlock();
    isTimerRunning = false;

    const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
    finalTimeDisplay.textContent = `${mins}:${secs}`;

    if (currentStage < 3) {
        victoryTitle.textContent = `🎉 스테이지 ${currentStage} 클리어!`;
        victoryMessage.textContent = '아주 훌륭합니다! 다음 스테이지 도전 준비가 되셨나요?';
        nextStageBtn.textContent = '다음 스테이지 ▶';
        nextStageBtn.style.display = 'block';
    } else {
        victoryTitle.textContent = '🏆 파쿠르 마스터 완주!';
        victoryMessage.textContent = '모든 스테이지를 돌파하셨습니다!';
        nextStageBtn.style.display = 'none';
    }

    victoryOverlay.classList.remove('hidden');
}

// Button Events
nextStageBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    loadStage(currentStage + 1);
    controls.lock();
});

restartGameBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    startTime = performance.now();
    isTimerRunning = true;
    loadStage(1);
    controls.lock();
});

// 9. Main Game Loop
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        if (!isTimerRunning) {
            startTime = performance.now() - (elapsedTime * 1000);
            isTimerRunning = true;
        }

        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        updateTimer();
        checkWallRun();
        checkCheckpoints();
        checkGoal();

        const targetEyeHeight = isSliding ? slideHeight : normalHeight;

        if (isSliding) {
            slideBadge.classList.remove('hidden');
        } else {
            slideBadge.classList.add('hidden');
        }

        // Apply Friction & Speed Modifications
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        if (isWallRunning) {
            velocity.y = Math.max(velocity.y - 8.0 * delta, -3.0);
        } else {
            velocity.y -= gravity * delta;
        }

        // Direction Calculations
        const direction = new THREE.Vector3();
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speedMultiplier = isSprinting ? 160.0 : (isSliding ? 180.0 : 100.0);

        if (moveForward || moveBackward) velocity.z -= direction.z * speedMultiplier * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speedMultiplier * delta;

        // Move Controls
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;

        // Resolve Horizontal Wall Collisions
        resolveWallCollisions();

        // Fall & Respawn Check
        if (camera.position.y < -25) {
            respawnPlayer();
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
                    py <= box.max.y + targetEyeHeight &&
                    velocity.y <= 0
                ) {
                    velocity.y = 0;
                    camera.position.y = box.max.y + targetEyeHeight;
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

// Initial Game Load
loadStage(1);
animate();
