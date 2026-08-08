// 1. DOM Elements
const homeOverlay = document.getElementById('homeOverlay');
const closetOverlay = document.getElementById('closetOverlay');
const victoryOverlay = document.getElementById('victoryOverlay');

const startGameHomeBtn = document.getElementById('startGameHomeBtn');
const specialStageHomeBtn = document.getElementById('specialStageHomeBtn');
const closetHomeBtn = document.getElementById('closetHomeBtn');
const closeClosetBtn = document.getElementById('closeClosetBtn');
const homeNavBtn = document.getElementById('homeNavBtn');
const returnHomeBtn = document.getElementById('returnHomeBtn');
const specialStageHudBtn = document.getElementById('specialStageHudBtn');

const stageNumDisplay = document.getElementById('stageNum');
const themeNameDisplay = document.getElementById('themeNameDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const wallBadge = document.getElementById('wallBadge');
const slideBadge = document.getElementById('slideBadge');
const boosterBadge = document.getElementById('boosterBadge');
const checkpointBadge = document.getElementById('checkpointBadge');
const unlockNoticeBanner = document.getElementById('unlockNoticeBanner');
const crosshair = document.getElementById('crosshair');

const cardBasic = document.getElementById('cardBasic');
const cardRainbow = document.getElementById('cardRainbow');
const equipBasicBtn = document.getElementById('equipBasicBtn');
const equipRainbowBtn = document.getElementById('equipRainbowBtn');
const rainbowStatusTag = document.getElementById('rainbowStatusTag');

const victoryTitle = document.getElementById('victoryTitle');
const victoryMessage = document.getElementById('victoryMessage');
const finalTimeDisplay = document.getElementById('finalTimeDisplay');
const nextStageBtn = document.getElementById('nextStageBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// 2. Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(25, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd5 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(40, 80, -350);
scene.add(sunMesh);

// 3. PointerLock Controls & State Manager
const controls = new THREE.PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.01;
controls.maxPolarAngle = Math.PI - 0.01;

let gameState = 'home'; // 'home', 'playing', 'closet', 'victory'
let isRainbowUnlocked = localStorage.getItem('isRainbowUnlocked') === 'true';
let equippedCharacter = localStorage.getItem('equippedCharacter') || 'basic';

// 4. Biome Theme Sets
const biomeThemes = {
    1: {
        name: "☀️ 맑은 낮 파란 하늘",
        sky: 0x87ceeb, fog: 0xbae6fd, sun: 0xfffcd5,
        platBody: 0x334155, platGrid: 0x38bdf8, wallBody: 0x475569
    },
    2: {
        name: "🌇 붉은 노을 석양",
        sky: 0x881111, fog: 0x7f1d1d, sun: 0xef4444,
        platBody: 0x450a0a, platGrid: 0xef4444, wallBody: 0x7f1d1d
    },
    3: {
        name: "🌌 사이버 우주 은하수",
        sky: 0x090514, fog: 0x1e1b4b, sun: 0xc084fc,
        platBody: 0x1e1b4b, platGrid: 0xa855f7, wallBody: 0x312e81
    },
    4: {
        name: "🌲 신비한 에메랄드 숲",
        sky: 0x064e3b, fog: 0x022c22, sun: 0x84cc16,
        platBody: 0x064e3b, platGrid: 0x22c55e, wallBody: 0x047857
    },
    5: {
        name: "⚡ 골든 황금 산맥",
        sky: 0x78350f, fog: 0x451a03, sun: 0xfde047,
        platBody: 0x451a03, platGrid: 0xeab308, wallBody: 0x92400e
    },
    special: {
        name: "⭐ 스페셜 무지개 은하수",
        sky: 0x2e1065, fog: 0x3b0764, sun: 0xfacc15,
        platBody: 0x4c1d95, platGrid: 0xec4899, wallBody: 0x6b21a8
    }
};

function getThemeForStage(stage) {
    if (stage === 'special') return biomeThemes.special;
    if (stage <= 4) return biomeThemes[1];
    if (stage <= 8) return biomeThemes[2];
    if (stage <= 12) return biomeThemes[3];
    if (stage <= 16) return biomeThemes[4];
    return biomeThemes[5];
}

// 5. Game Physics Variables
let currentStage = 1;
let startTime = 0;
let elapsedTime = 0;
let isTimerRunning = false;

let platforms = [];
let walls = [];
let boosterPads = [];
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

// Keyboard Event Handlers
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
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
    if (gameState !== 'playing') return;
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

// 6. Level Generators & Builder
function clearSceneObjects() {
    platforms.forEach(p => scene.remove(p));
    walls.forEach(w => scene.remove(w));
    boosterPads.forEach(b => scene.remove(b));
    checkpoints.forEach(c => scene.remove(c.mesh));
    if (goalMesh) scene.remove(goalMesh);

    platforms = [];
    walls = [];
    boosterPads = [];
    checkpoints = [];
    goalMesh = null;
}

function applyStageTheme(stageKey) {
    const theme = getThemeForStage(stageKey);
    themeNameDisplay.textContent = theme.name;
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

function createBoosterPad(x, y, z) {
    const geo = new THREE.BoxGeometry(4, 0.4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.1, z);

    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    scene.add(mesh);
    boosterPads.push(mesh);
    return mesh;
}

function createCheckpointPlatform(x, y, z, theme) {
    const platGeo = new THREE.BoxGeometry(8, 2, 8);
    const platMat = new THREE.MeshLambertMaterial({ color: 0x14532d });
    const platMesh = new THREE.Mesh(platGeo, platMat);
    platMesh.position.set(x, y, z);

    const wireGeo = new THREE.WireframeGeometry(platGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x22c55e });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    platMesh.add(wireframe);

    scene.add(platMesh);
    platforms.push(platMesh);

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

// Stage Maps Setup
function loadStage(stage) {
    clearSceneObjects();
    currentStage = stage;
    stageNumDisplay.textContent = currentStage;

    applyStageTheme(stage);
    const theme = getThemeForStage(stage);

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 12, 2, 12, theme);

    if (stage === 1) {
        createPlatform(0, 2, -18, 8, 2, 8, theme);
        createPlatform(0, 6, -36, 8, 2, 8, theme);
        createCheckpointPlatform(0, 7, -36, theme);
        createPlatform(10, 10, -54, 8, 2, 8, theme);
        createPlatform(0, 14, -72, 8, 2, 8, theme);
        createGoal(0, 16, -88);
    } else if (stage === 2) {
        createWall(6, 8, -22, 1, 16, 20, theme);
        createPlatform(0, 8, -38, 8, 2, 8, theme);
        createCheckpointPlatform(0, 9, -38, theme);
        createWall(-6, 14, -54, 1, 16, 20, theme);
        createWall(6, 20, -70, 1, 16, 20, theme);
        createPlatform(0, 24, -86, 10, 2, 10, theme);
        createGoal(0, 26, -100);
    } else if (stage === 4) {
        createPlatform(0, 2, -16, 8, 2, 8, theme);
        createWall(-6, 8, -32, 1, 16, 20, theme);
        createPlatform(0, 8, -48, 8, 2, 8, theme);
        createCheckpointPlatform(0, 9, -48, theme);
        createWall(6, 14, -64, 1, 16, 20, theme);
        createPlatform(0, 16, -80, 8, 2, 8, theme);
        createGoal(0, 18, -94);
    } else {
        // Procedural Stages 3, 5 to 20
        let currentZ = -14;
        let currentY = 1;
        let currentX = 0;

        const numSteps = 5 + Math.floor(stage * 0.4);

        for (let i = 0; i < numSteps; i++) {
            createPlatform(currentX, currentY, currentZ, 8, 2, 8, theme);

            if (i % 2 === 1) {
                const wallSideX = currentX + (Math.random() > 0.5 ? 6 : -6);
                createWall(wallSideX, currentY + 6, currentZ - 6, 1, 16, 16, theme);
            }

            if (i === Math.floor(numSteps / 2)) {
                createCheckpointPlatform(currentX, currentY + 1, currentZ, theme);
            }

            currentZ -= 12 + Math.random() * 3;
            currentY += 1.5 + Math.random() * 1.5;
            currentX += (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
        }

        createGoal(currentX, currentY + 1.5, currentZ - 10);
    }

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

// ⭐ EXTREME LONG EPIC SPECIAL STAGE BUILDER ⭐
function loadSpecialStage() {
    clearSceneObjects();
    currentStage = 'special';
    stageNumDisplay.textContent = '⭐';

    applyStageTheme('special');
    const theme = biomeThemes.special;

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 14, 2, 14, theme); // Start Platform

    // Section 1: First Booster Jump
    createPlatform(0, 2, -22, 8, 2, 8, theme);
    createBoosterPad(0, 2, -22); // Booster 1!

    // Section 2: High Platform & Checkpoint 1
    createPlatform(0, 20, -48, 8, 2, 8, theme);
    createCheckpointPlatform(0, 21, -48, theme);

    // Section 3: Wall Run Canyon
    createWall(-7, 26, -68, 1, 20, 24, theme);
    createWall(7, 32, -92, 1, 20, 24, theme);

    // Section 4: Second Booster Pad
    createPlatform(0, 34, -114, 8, 2, 8, theme);
    createBoosterPad(0, 34, -114); // Booster 2!

    // Section 5: Sky High Checkpoint 2
    createPlatform(0, 52, -140, 8, 2, 8, theme);
    createCheckpointPlatform(0, 53, -140, theme);

    // Section 6: Double Wall Jump & Third Booster
    createWall(-8, 58, -162, 1, 20, 24, theme);
    createPlatform(0, 60, -184, 8, 2, 8, theme);
    createBoosterPad(0, 60, -184); // Booster 3!

    // Section 7: Grand Rainbow Victory Tower
    createPlatform(0, 78, -210, 10, 2, 10, theme);
    createGoal(0, 80, -230); // Final Rainbow Gold Goal!

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
    boosterBadge.classList.add('hidden');
}

// 7. Character & Closet UI Logic
function updateClosetUI() {
    if (isRainbowUnlocked) {
        cardRainbow.classList.remove('locked');
        cardRainbow.classList.add('unlocked');
        rainbowStatusTag.textContent = '✅ 해금 완료!';
        rainbowStatusTag.className = 'char-status unlocked-tag';
        equipRainbowBtn.disabled = false;
        equipRainbowBtn.classList.add('unlocked-btn');
        equipRainbowBtn.textContent = equippedCharacter === 'rainbow' ? '장착 중' : '장착하기';
    } else {
        cardRainbow.classList.add('locked');
        rainbowStatusTag.textContent = '🔒 스페셜 코스 완주 시 해금';
        rainbowStatusTag.className = 'char-status locked-tag';
        equipRainbowBtn.disabled = true;
        equipRainbowBtn.textContent = '잠김 🔒';
    }

    if (equippedCharacter === 'basic') {
        cardBasic.classList.add('selected');
        cardRainbow.classList.remove('selected');
        equipBasicBtn.classList.add('active');
        equipBasicBtn.textContent = '장착 중';
        crosshair.style.color = 'rgba(255, 255, 255, 0.85)';
    } else {
        cardRainbow.classList.add('selected');
        cardBasic.classList.remove('selected');
        equipBasicBtn.classList.remove('active');
        equipBasicBtn.textContent = '장착하기';
        equipRainbowBtn.textContent = '장착 중';
        crosshair.style.color = '#ec4899'; // Rainbow Pink Glow Crosshair!
    }
}

equipBasicBtn.addEventListener('click', () => {
    equippedCharacter = 'basic';
    localStorage.setItem('equippedCharacter', 'basic');
    updateClosetUI();
});

equipRainbowBtn.addEventListener('click', () => {
    if (!isRainbowUnlocked) return;
    equippedCharacter = 'rainbow';
    localStorage.setItem('equippedCharacter', 'rainbow');
    updateClosetUI();
});

// 8. Navigation & State Management
function goToHome() {
    controls.unlock();
    gameState = 'home';
    isTimerRunning = false;
    homeOverlay.classList.remove('hidden');
    closetOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    // Camera Lobby Cinematic Position
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
}

function startPlaying(stage = 1) {
    gameState = 'playing';
    homeOverlay.classList.add('hidden');
    closetOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    if (stage === 'special') {
        loadSpecialStage();
    } else {
        loadStage(stage);
    }
    controls.lock();
}

function openCloset() {
    gameState = 'closet';
    updateClosetUI();
    homeOverlay.classList.add('hidden');
    closetOverlay.classList.remove('hidden');
}

// Button Click Event Binds
startGameHomeBtn.addEventListener('click', () => startPlaying(1));
specialStageHomeBtn.addEventListener('click', () => startPlaying('special'));
closetHomeBtn.addEventListener('click', openCloset);
closeClosetBtn.addEventListener('click', goToHome);
homeNavBtn.addEventListener('click', goToHome);
returnHomeBtn.addEventListener('click', goToHome);
specialStageHudBtn.addEventListener('click', () => startPlaying('special'));

document.body.addEventListener('click', (e) => {
    if (gameState === 'home' || gameState === 'closet') return;
    if (e.target.closest('.overlay') || e.target.closest('#hudContainer')) return;
    if (gameState === 'playing' && !controls.isLocked) {
        controls.lock();
    }
});

// 9. Timer & Checkpoint Updates
function updateTimer() {
    if (isTimerRunning) {
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000;
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }
}

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

    camera.rotation.z = 0;

    if (isWallRunning) {
        wallBadge.classList.remove('hidden');
    } else {
        wallBadge.classList.add('hidden');
    }
}

function checkBoosterPads() {
    boosterPads.forEach((pad) => {
        const box = new THREE.Box3().setFromObject(pad);
        const px = camera.position.x;
        const py = camera.position.y;
        const pz = camera.position.z;

        if (px >= box.min.x - 1.0 && px <= box.max.x + 1.0 &&
            pz >= box.min.z - 1.0 && pz <= box.max.z + 1.0 &&
            py >= box.min.y && py <= box.max.y + 3.0) {
            
            velocity.y = 28; // High Booster Jump!
            boosterBadge.classList.remove('hidden');
            setTimeout(() => boosterBadge.classList.add('hidden'), 1500);
        }
    });
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
                cp.mesh.material.color.setHex(0xfacc15);
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
    gameState = 'victory';
    isTimerRunning = false;

    const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
    finalTimeDisplay.textContent = `${mins}:${secs}`;

    if (currentStage === 'special') {
        // Unlock Rainbow Hero Character!
        if (!isRainbowUnlocked) {
            isRainbowUnlocked = true;
            localStorage.setItem('isRainbowUnlocked', 'true');
            unlockNoticeBanner.classList.remove('hidden');
        } else {
            unlockNoticeBanner.classList.add('hidden');
        }

        victoryTitle.textContent = '⭐ 스페셜 완주 성공!';
        victoryMessage.textContent = '축하합니다! 장대 무지개 스페셜 스테이지를 완파하셨습니다!';
        nextStageBtn.textContent = '1단계로 시작 ▶';
        nextStageBtn.style.display = 'block';
    } else if (currentStage < 20) {
        unlockNoticeBanner.classList.add('hidden');
        victoryTitle.textContent = `🎉 스테이지 ${currentStage} 클리어!`;
        victoryMessage.textContent = '훌륭합니다! 다음 스테이지 도전 준비가 되셨나요?';
        nextStageBtn.textContent = '다음 스테이지 ▶';
        nextStageBtn.style.display = 'block';
    } else {
        unlockNoticeBanner.classList.add('hidden');
        victoryTitle.textContent = '🏆 20단계 완주! 파쿠르 마스터 등극!';
        victoryMessage.textContent = '축하합니다! 20개의 모든 파쿠르 코스를 완파하셨습니다!';
        nextStageBtn.style.display = 'none';
    }

    victoryOverlay.classList.remove('hidden');
}

// Victory Modal Buttons
nextStageBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    if (currentStage === 'special') {
        startPlaying(1);
    } else {
        startPlaying(currentStage + 1);
    }
});

restartGameBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    startTime = performance.now();
    isTimerRunning = true;
    if (currentStage === 'special') {
        startPlaying('special');
    } else {
        startPlaying(1);
    }
});

// 10. Main Game Loop (Cinematic Home Rotation + Parkour Loop)
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'home') {
        // Slow Cinematic Lobby Orbit Camera
        const angle = performance.now() * 0.0003;
        camera.position.x = Math.sin(angle) * 30;
        camera.position.z = Math.cos(angle) * 30;
        camera.position.y = 12;
        camera.lookAt(0, 5, 0);
        renderer.render(scene, camera);
        return;
    }

    if (controls.isLocked && gameState === 'playing') {
        if (!isTimerRunning) {
            startTime = performance.now() - (elapsedTime * 1000);
            isTimerRunning = true;
        }

        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        updateTimer();
        checkWallRun();
        checkBoosterPads();
        checkCheckpoints();
        checkGoal();

        const targetEyeHeight = isSliding ? slideHeight : normalHeight;

        if (isSliding) {
            slideBadge.classList.remove('hidden');
        } else {
            slideBadge.classList.add('hidden');
        }

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        if (isWallRunning) {
            velocity.y = Math.max(velocity.y - 8.0 * delta, -3.0);
        } else {
            velocity.y -= gravity * delta;
        }

        const direction = new THREE.Vector3();
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speedMultiplier = isSliding ? 180.0 : 160.0;

        if (moveForward || moveBackward) velocity.z -= direction.z * speedMultiplier * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speedMultiplier * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;

        resolveWallCollisions();

        if (camera.position.y < -25) {
            respawnPlayer();
        } else {
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

// Initial Launch to Main Home Lobby
updateClosetUI();
loadStage(1);
goToHome();
animate();
