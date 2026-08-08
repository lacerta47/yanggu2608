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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; // Lock rotation order for gimbal stability

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting & Sun Mesh
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(25, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd5 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(40, 80, -300);
scene.add(sunMesh);

// 3. PointerLock Controls
const controls = new THREE.PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.01;
controls.maxPolarAngle = Math.PI - 0.01;

document.body.addEventListener('click', () => {
    if (!victoryOverlay.classList.contains('hidden')) return;
    controls.lock();
});

// 4. Stage Themes (Sky, Fog, Sun, Platforms & Grid Lines)
const stageThemes = {
    1: {
        sky: 0x87ceeb,       // Realistic Sky Blue
        fog: 0xbae6fd,
        sun: 0xfffcd5,       // Warm Sun
        platBody: 0x334155,  // Slate Blue
        platGrid: 0x38bdf8,  // Cyan Neon
        wallBody: 0x475569
    },
    2: {
        sky: 0x881111,       // Deep Sunset Red
        fog: 0x7f1d1d,
        sun: 0xef4444,       // Fiery Red Sun
        platBody: 0x450a0a,  // Volcanic Dark Red
        platGrid: 0xef4444,  // Flame Red Neon
        wallBody: 0x7f1d1d
    },
    3: {
        sky: 0x090514,       // Cosmic Midnight
        fog: 0x1e1b4b,
        sun: 0xc084fc,       // Neon Purple Moon
        platBody: 0x1e1b4b,  // Dark Purple
        platGrid: 0xa855f7,  // Neon Purple Grid
        wallBody: 0x312e81
    }
};

// 5. Game Variables & Physics
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

let velocity = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isSliding = false;
let isWallRunning = false;
let canJump = false;
let currentWallNormal = new THREE.Vector3();

const normalHeight = 3.0;
const slideHeight = 1.5;
const gravity = 30;

camera.position.copy(spawnPoint);

// Keyboard Handlers
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
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

// 6. Level Generator & Theme Applier
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

function applyStageTheme(stage) {
    const theme = stageThemes[stage] || stageThemes[1];
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.FogExp2(theme.fog, 0.008);
    sunMat.color.setHex(theme.sun);
}

function createPlatform(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: theme.platBody });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);

    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: theme.platGrid, linewidth: 1 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    scene.add(mesh);
    platforms.push(mesh);
    return mesh;
}

function createWall(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: theme.wallBody });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);

    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: theme.platGrid, linewidth: 1 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    scene.add(mesh);
    walls.push(mesh);
    return mesh;
}

// Dedicated Respawn Checkpoint Platform
function createCheckpointPlatform(x, y, z, theme) {
    // 1. Sturdy Respawn Platform
    const platGeo = new THREE.BoxGeometry(8, 2, 8);
    const platMat = new THREE.MeshLambertMaterial({ color: 0x14532d }); // Dark Green Base
    const platMesh = new THREE.Mesh(platGeo, platMat);
    platMesh.position.set(x, y, z);

    const wireGeo = new THREE.WireframeGeometry(platGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x22c55e }); // Glowing Green Wireframe
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    platMesh.add(wireframe);

    scene.add(platMesh);
    platforms.push(platMesh);

    // 2. Checkpoint Glowing Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.set(x, y + 4, z);
    scene.add(pillarMesh);

    checkpoints.push({
        mesh: pillarMesh,
        wireframe: wireframe,
        pos: new THREE.Vector3(x, y + 3, z),
        triggered: false
    });
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

// Build Stages
function loadStage(stage) {
    clearSceneObjects();
    currentStage = stage;
    stageNumDisplay.textContent = currentStage;

    applyStageTheme(stage);
    const theme = stageThemes[stage];

    if (stage === 1) {
        // Stage 1: Daytime Blue Sky Course
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 12, 2, 12, theme);
        createPlatform(0, 2, -18, 8, 2, 8, theme);
        createPlatform(0, 6, -36, 8, 2, 8, theme);
        
        createCheckpointPlatform(0, 7, -36, theme);

        createPlatform(10, 10, -54, 8, 2, 8, theme);
        createPlatform(0, 14, -72, 8, 2, 8, theme);
        createGoal(0, 18, -94);
    } else if (stage === 2) {
        // Stage 2: Fiery Sunset Red Course
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 10, 2, 10, theme);
        
        createWall(6, 8, -25, 1, 16, 24, theme);
        createPlatform(0, 8, -40, 8, 2, 8, theme);

        createCheckpointPlatform(0, 9, -40, theme);

        createPlatform(0, 12, -60, 10, 2, 16, theme);
        createWall(0, 16.5, -60, 10, 5, 16, theme); // Sliding roof

        createGoal(0, 16, -88);
    } else if (stage === 3) {
        // Stage 3: Cosmic Galaxy Midnight Course
        spawnPoint.set(0, 3, 0);
        createPlatform(0, -1, 0, 10, 2, 10, theme);

        createPlatform(-12, 4, -20, 7, 2, 7, theme);
        createWall(-18, 10, -35, 1, 16, 20, theme);

        createCheckpointPlatform(0, 10, -48, theme);

        createWall(7, 16, -65, 1, 16, 20, theme);
        createPlatform(-8, 20, -82, 8, 2, 8, theme);

        createGoal(0, 24, -108);
    }

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

function respawnPlayer() {
    camera.position.copy(activeCheckpointPos);
    camera.rotation.set(0, 0, 0);
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

// 8. Wall Running & Solid Collision Check
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

    camera.rotation.z = 0; // Lock roll for stability

    if (isWallRunning) {
        wallBadge.classList.remove('hidden');
    } else {
        wallBadge.classList.add('hidden');
    }
}

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
                cp.mesh.material.color.setHex(0xfacc15); // Turn gold!
                cp.wireframe.material.color.setHex(0xfacc15);

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

// 9. Main Game Loop (Auto-Sprint Movement Speed)
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

        // Apply Friction
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        if (isWallRunning) {
            velocity.y = Math.max(velocity.y - 8.0 * delta, -3.0);
        } else {
            velocity.y -= gravity * delta;
        }

        // Direction Calculations (DEFAULT AUTO-SPRINT SPEED 160.0!)
        const direction = new THREE.Vector3();
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speedMultiplier = isSliding ? 180.0 : 160.0; // Auto-Sprint speed!

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
