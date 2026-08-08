// 1. DOM Elements
const homeOverlay = document.getElementById('homeOverlay');
const closetOverlay = document.getElementById('closetOverlay');
const victoryOverlay = document.getElementById('victoryOverlay');

const startGameHomeBtn = document.getElementById('startGameHomeBtn');
const specialStageHomeBtn = document.getElementById('specialStageHomeBtn');
const closetHomeBtn = document.getElementById('closetHomeBtn');
const resetStageHomeBtn = document.getElementById('resetStageHomeBtn');
const closeClosetBtn = document.getElementById('closeClosetBtn');
const homeNavBtn = document.getElementById('homeNavBtn');
const bgmToggleBtn = document.getElementById('bgmToggleBtn');
const returnHomeBtn = document.getElementById('returnHomeBtn');
const specialStageHudBtn = document.getElementById('specialStageHudBtn');

const stageNumDisplay = document.getElementById('stageNum');
const themeNameDisplay = document.getElementById('themeNameDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const wallBadge = document.getElementById('wallBadge');
const wallCdBadge = document.getElementById('wallCdBadge');
const slideBadge = document.getElementById('slideBadge');
const boosterBadge = document.getElementById('boosterBadge');
const checkpointBadge = document.getElementById('checkpointBadge');
const unlockNoticeBanner = document.getElementById('unlockNoticeBanner');
const crosshair = document.getElementById('crosshair');

const cardBasic = document.getElementById('cardBasic');
const cardThunder = document.getElementById('cardThunder');
const cardEmerald = document.getElementById('cardEmerald');
const cardDiamond = document.getElementById('cardDiamond');
const cardRainbow = document.getElementById('cardRainbow');

const equipBasicBtn = document.getElementById('equipBasicBtn');
const equipThunderBtn = document.getElementById('equipThunderBtn');
const equipEmeraldBtn = document.getElementById('equipEmeraldBtn');
const equipDiamondBtn = document.getElementById('equipDiamondBtn');
const equipRainbowBtn = document.getElementById('equipRainbowBtn');

const thunderStatusTag = document.getElementById('thunderStatusTag');
const emeraldStatusTag = document.getElementById('emeraldStatusTag');
const diamondStatusTag = document.getElementById('diamondStatusTag');
const rainbowStatusTag = document.getElementById('rainbowStatusTag');

const victoryTitle = document.getElementById('victoryTitle');
const victoryMessage = document.getElementById('victoryMessage');
const finalTimeDisplay = document.getElementById('finalTimeDisplay');
const nextStageBtn = document.getElementById('nextStageBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// 2. Modern Electronic EDM Sound Engine (Web Audio API)
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmTimer = null;
        this.noteIndex = 0;
        this.isBgmPlaying = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleBgm() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            bgmToggleBtn.textContent = '🔇 BGM OFF';
            bgmToggleBtn.classList.add('muted');
            this.stopBgm();
        } else {
            bgmToggleBtn.textContent = '🎵 BGM ON';
            bgmToggleBtn.classList.remove('muted');
            this.startBgm();
        }
    }

    startBgm() {
        if (this.isBgmPlaying || this.isMuted) return;
        this.isBgmPlaying = true;
        this.noteIndex = 0;

        const bassNotes = [110, 110, 146.8, 146.8, 164.8, 164.8, 130.8, 130.8];
        const synthNotes = [440, 554.37, 659.25, 880, 659.25, 554.37, 440, 329.63];

        this.bgmTimer = setInterval(() => {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(bassNotes[this.noteIndex % bassNotes.length], now);

            bassGain.gain.setValueAtTime(0.08, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.2);

            const arpOsc = this.ctx.createOscillator();
            const arpGain = this.ctx.createGain();
            arpOsc.type = 'triangle';
            arpOsc.frequency.setValueAtTime(synthNotes[this.noteIndex % synthNotes.length], now);

            arpGain.gain.setValueAtTime(0.04, now);
            arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            arpOsc.connect(arpGain);
            arpGain.connect(this.ctx.destination);
            arpOsc.start(now);
            arpOsc.stop(now + 0.16);

            this.noteIndex++;
        }, 200);
    }

    stopBgm() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    playSFX(freq, duration, type = 'sine', volume = 0.15) {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playJumpSound() { this.playSFX(350, 0.12, 'sine', 0.12); }
    playBoostSound() { this.playSFX(600, 0.25, 'triangle', 0.2); }
    playCheckpointSound() { this.playSFX(880, 0.3, 'sine', 0.25); }
    playVictorySound() {
        this.playSFX(523.25, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playSFX(659.25, 0.15, 'triangle', 0.2), 150);
        setTimeout(() => this.playSFX(783.99, 0.3, 'triangle', 0.25), 300);
    }
}

const audioEngine = new SoundEngine();
bgmToggleBtn.addEventListener('click', () => audioEngine.toggleBgm());

// 3. Three.js Scene Setup with Specular Lighting & Realistic Shadows
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
dirLight.position.set(60, 120, 60);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(32, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd5 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(50, 100, -450);
scene.add(sunMesh);

// 4. PointerLock Controls & State Manager
const controls = new THREE.PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.01;
controls.maxPolarAngle = Math.PI - 0.01;

let gameState = 'home';
let savedStage = parseInt(localStorage.getItem('savedStage') || '1', 10);
let highestStageCleared = parseInt(localStorage.getItem('highestStageCleared') || '0', 10);
let isRainbowUnlocked = localStorage.getItem('isRainbowUnlocked') === 'true';
let equippedSkin = localStorage.getItem('equippedSkin') || 'basic';

// 5. Realistic Multi-Tone Biome Theme Sets & Canvas Sky Gradient Generator
function createSkyGradientTexture(topColor, bottomColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.7, bottomColor);
    gradient.addColorStop(1, topColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const biomeThemes = {
    1: {
        name: "☀️ 실제 맑은 햇살 파란 하늘",
        skyTop: "#1e40af", skyBottom: "#93c5fd", fog: 0xbae6fd, sun: 0xfffcd5,
        platBody: 0x334155, platGrid: 0x38bdf8, wallBody: 0x475569, bldgColor: 0x1e293b,
        cpPlat: 0x0369a1, cpPillar: 0x38bdf8, cpEmissive: 0x0284c7,
        roughness: 0.3, metalness: 0.4
    },
    2: {
        name: "🌇 화려한 석양 노을 하늘",
        skyTop: "#4c1d95", skyBottom: "#f97316", fog: 0x7f1d1d, sun: 0xffedd5,
        platBody: 0x450a0a, platGrid: 0xef4444, wallBody: 0x7f1d1d, bldgColor: 0x3f0707,
        cpPlat: 0x991b1b, cpPillar: 0xef4444, cpEmissive: 0xd97706,
        roughness: 0.2, metalness: 0.5
    },
    3: {
        name: "🌌 신비로운 코스믹 은하수",
        skyTop: "#090514", skyBottom: "#6b21a8", fog: 0x1e1b4b, sun: 0xe9d5ff,
        platBody: 0x1e1b4b, platGrid: 0xc084fc, wallBody: 0x312e81, bldgColor: 0x140c2b,
        cpPlat: 0x581c87, cpPillar: 0xc084fc, cpEmissive: 0x9333ea,
        roughness: 0.1, metalness: 0.7
    },
    4: {
        name: "🌲 에메랄드 오로라 숲",
        skyTop: "#022c22", skyBottom: "#10b981", fog: 0x022c22, sun: 0xdcfce7,
        platBody: 0x064e3b, platGrid: 0x34d399, wallBody: 0x047857, bldgColor: 0x022c22,
        cpPlat: 0x065f46, cpPillar: 0x34d399, cpEmissive: 0x059669,
        roughness: 0.3, metalness: 0.3
    },
    5: {
        name: "⚡ 황금 빛깔 메탈릭 산맥",
        skyTop: "#451a03", skyBottom: "#f59e0b", fog: 0x451a03, sun: 0xfef08a,
        platBody: 0x451a03, platGrid: 0xfacc15, wallBody: 0x92400e, bldgColor: 0x291002,
        cpPlat: 0x854d0e, cpPillar: 0xfacc15, cpEmissive: 0xd97706,
        roughness: 0.2, metalness: 0.6
    },
    special: {
        name: "⭐ 스페셜 무지개 은하수",
        skyTop: "#2e1065", skyBottom: "#ec4899", fog: 0x3b0764, sun: 0xfde047,
        platBody: 0x4c1d95, platGrid: 0xf43f5e, wallBody: 0x6b21a8, bldgColor: 0x3b0764,
        cpPlat: 0x9f1239, cpPillar: 0xf43f5e, cpEmissive: 0xe11d48,
        roughness: 0.1, metalness: 0.8
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

// 6. Physics Variables
let currentStage = 1;
let startTime = 0;
let elapsedTime = 0;
let isTimerRunning = false;

let platforms = [];
let walls = [];
let cityBuildings = [];
let clouds = [];
let boosterPads = [];
let checkpoints = [];
let goalMesh = null;

let spawnPoint = new THREE.Vector3(0, 3, 0);
let activeCheckpointPos = new THREE.Vector3(0, 3, 0);

let velocity = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isSliding = false;
let canJump = false;

let isWallRunning = false;
let wallRunStamina = 2.0;
let wallRunCooldown = 0;
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
                audioEngine.playJumpSound();
            } else if (isWallRunning && wallRunStamina > 0) {
                velocity.y = 15;
                velocity.x += currentWallNormal.x * 14;
                velocity.z += currentWallNormal.z * 14;
                isWallRunning = false;
                wallBadge.classList.add('hidden');
                audioEngine.playJumpSound();
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

// 7. Realistic 3D Clouds Generator
function create3DClouds() {
    clouds.forEach(c => scene.remove(c));
    clouds = [];

    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88
    });

    for (let i = 0; i < 28; i++) {
        const cloudGroup = new THREE.Group();
        const sphereCount = 6 + Math.floor(Math.random() * 5);

        for (let j = 0; j < sphereCount; j++) {
            const r = 7 + Math.random() * 9;
            const geo = new THREE.SphereGeometry(r, 16, 16);
            const mesh = new THREE.Mesh(geo, cloudMat);
            mesh.position.set(
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 14
            );
            cloudGroup.add(mesh);
        }

        const cx = (Math.random() - 0.5) * 380;
        const cy = 60 + Math.random() * 70;
        const cz = -40 - Math.random() * 500;
        cloudGroup.position.set(cx, cy, cz);

        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

// 8. Level Builder & Clean 3D Mesh Generator
function clearSceneObjects() {
    platforms.forEach(p => scene.remove(p));
    walls.forEach(w => scene.remove(w));
    cityBuildings.forEach(b => scene.remove(b));
    boosterPads.forEach(b => scene.remove(b));
    checkpoints.forEach(c => scene.remove(c.mesh));
    if (goalMesh) scene.remove(goalMesh);

    platforms = [];
    walls = [];
    cityBuildings = [];
    boosterPads = [];
    checkpoints = [];
    goalMesh = null;
}

function create3DCityEnvironment(theme) {
    for (let z = -20; z >= -550; z -= 28) {
        const sides = [-48, 48];
        sides.forEach(x => {
            const h = 45 + Math.random() * 65;
            const w = 16 + Math.random() * 12;
            const d = 16 + Math.random() * 12;

            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshStandardMaterial({
                color: theme.bldgColor,
                roughness: 0.4,
                metalness: 0.5
            });
            const bldg = new THREE.Mesh(geo, mat);
            bldg.position.set(x, h / 2 - 20, z);
            bldg.receiveShadow = true;
            bldg.castShadow = true;

            scene.add(bldg);
            cityBuildings.push(bldg);
        });
    }
}

function applyStageTheme(stageKey) {
    const theme = getThemeForStage(stageKey);
    themeNameDisplay.textContent = theme.name;

    const skyTexture = createSkyGradientTexture(theme.skyTop, theme.skyBottom);
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(theme.fog, 0.004);
    sunMat.color.setHex(theme.sun);

    create3DCityEnvironment(theme);
    create3DClouds();
}

function createPlatform(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
        color: theme.platBody,
        roughness: theme.roughness,
        metalness: theme.metalness
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);
    platforms.push(mesh);
    return mesh;
}

function createWall(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
        color: theme.wallBody,
        roughness: 0.3,
        metalness: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);
    walls.push(mesh);
    return mesh;
}

function createBoosterPad(x, y, z) {
    const geo = new THREE.BoxGeometry(4, 0.4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9, emissive: 0x0284c7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.1, z);

    scene.add(mesh);
    boosterPads.push(mesh);
    return mesh;
}

function createCheckpointPlatform(x, y, z, theme) {
    const platGeo = new THREE.BoxGeometry(8, 2, 8);
    const platMat = new THREE.MeshStandardMaterial({
        color: theme.cpPlat,
        roughness: 0.2,
        metalness: 0.5
    });
    const platMesh = new THREE.Mesh(platGeo, platMat);
    platMesh.position.set(x, y, z);
    platMesh.receiveShadow = true;
    platMesh.castShadow = true;

    scene.add(platMesh);
    platforms.push(platMesh);

    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
        color: theme.cpPillar,
        roughness: 0.1,
        metalness: 0.8,
        emissive: theme.cpEmissive
    });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.set(x, y + 4, z);
    scene.add(pillarMesh);

    checkpoints.push({
        mesh: pillarMesh,
        pos: new THREE.Vector3(x, y + 3, z),
        triggered: false
    });
}

function createGoal(x, y, z) {
    const geo = new THREE.BoxGeometry(12, 2, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.1, metalness: 0.9 });
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

// Stage Builder
function loadStage(stage) {
    clearSceneObjects();
    currentStage = stage;
    stageNumDisplay.textContent = currentStage;

    if (typeof stage === 'number') {
        savedStage = stage;
        localStorage.setItem('savedStage', savedStage.toString());
    }

    applyStageTheme(stage);
    const theme = getThemeForStage(stage);

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 12, 2, 12, theme);

    let currentZ = -16;
    let currentY = 1;
    let currentX = 0;

    const numSteps = 15 + Math.floor(stage * 1.0);

    for (let i = 0; i < numSteps; i++) {
        const isCheckpointStep = (i === Math.floor(numSteps * 0.25) || i === Math.floor(numSteps * 0.5) || i === Math.floor(numSteps * 0.75));
        const isLastStepBeforeGoal = (i === numSteps - 1);

        if (isCheckpointStep) {
            createCheckpointPlatform(currentX, currentY, currentZ, theme);
        } else {
            const platWidth = 6.0;
            createPlatform(currentX, currentY, currentZ, platWidth, 2, platWidth, theme);

            if (isLastStepBeforeGoal || stage === 1 && i % 4 === 3) {
                createBoosterPad(currentX, currentY, currentZ);
            } else if (i % 3 === 1) {
                const wallSideX = currentX + (Math.random() > 0.5 ? 5.5 : -5.5);
                createWall(wallSideX, currentY + 6, currentZ - 6, 1, 16, 18, theme);
            } else if (i % 4 === 2) {
                createBoosterPad(currentX, currentY, currentZ);
            }
        }

        currentZ -= 16 + Math.random() * 4;
        currentY += 2.2 + Math.random() * 2.0;
        currentX += (Math.random() > 0.5 ? 1 : -1) * (3.0 + Math.random() * 3.5);
    }

    createGoal(currentX, currentY + 4, currentZ - 12);

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

// ⭐ DYNAMIC EXTREME SPECIAL STAGE BUILDER (18 STEPS MARATHON PARKOUR!) ⭐
function loadSpecialStage() {
    clearSceneObjects();
    currentStage = 'special';
    stageNumDisplay.textContent = '⭐';

    applyStageTheme('special');
    const theme = biomeThemes.special;

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 14, 2, 14, theme);

    // Section 1: Initial Booster Flight
    createPlatform(0, 2, -22, 6, 2, 6, theme);
    createBoosterPad(0, 2, -22);

    // Section 2: High Checkpoint 1
    createCheckpointPlatform(0, 12, -48, theme);

    // Section 3: Dual Zigzag Wall Jump Canyon
    createWall(-6.5, 16, -68, 1, 18, 22, theme);
    createWall(6.5, 20, -92, 1, 18, 22, theme);

    // Section 4: Super Launch Pad 2
    createPlatform(0, 22, -114, 6, 2, 6, theme);
    createBoosterPad(0, 22, -114);

    // Section 5: High Checkpoint 2
    createCheckpointPlatform(0, 28, -140, theme);

    // Section 6: Triple Wall-Run Challenge
    createWall(-7.5, 32, -162, 1, 18, 22, theme);
    createPlatform(0, 34, -184, 6, 2, 6, theme);
    createBoosterPad(0, 34, -184);

    createWall(7.5, 38, -206, 1, 18, 22, theme);
    createPlatform(0, 42, -228, 6, 2, 6, theme);
    createBoosterPad(0, 42, -228);

    // Section 7: High Checkpoint 3
    createCheckpointPlatform(0, 48, -252, theme);

    // Section 8: Sky High Zigzag Walls & Final Booster Pad
    createWall(-8.0, 52, -276, 1, 18, 22, theme);
    createWall(8.0, 56, -300, 1, 18, 22, theme);

    createPlatform(0, 58, -324, 7, 2, 7, theme);
    createBoosterPad(0, 58, -324);

    // Section 9: Checkpoint 4 & Grand Golden Victory Beam Tower
    createCheckpointPlatform(0, 64, -348, theme);
    createPlatform(0, 66, -368, 10, 2, 10, theme);
    createBoosterPad(0, 66, -368);

    createGoal(0, 70, -392);

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

function respawnPlayer() {
    camera.position.copy(activeCheckpointPos);
    camera.rotation.set(0, 0, 0);
    velocity.set(0, 0, 0);

    isWallRunning = false;
    wallRunStamina = 2.0;
    wallRunCooldown = 0;

    wallBadge.classList.add('hidden');
    wallCdBadge.classList.add('hidden');
    slideBadge.classList.add('hidden');
    boosterBadge.classList.add('hidden');
}

// 9. Closet UI Manager & Awesome Skin Aura Effects!
function updateClosetUI() {
    const isThunderUnlocked = highestStageCleared >= 5;
    const isEmeraldUnlocked = highestStageCleared >= 10;
    const isDiamondUnlocked = highestStageCleared >= 15;

    if (isThunderUnlocked) {
        cardThunder.className = 'char-card unlocked skin-thunder';
        thunderStatusTag.textContent = '✅ 해금 완료!';
        thunderStatusTag.className = 'char-status unlocked-tag';
        equipThunderBtn.disabled = false;
        equipThunderBtn.className = 'equip-btn unlocked-btn';
    }

    if (isEmeraldUnlocked) {
        cardEmerald.className = 'char-card unlocked skin-emerald';
        emeraldStatusTag.textContent = '✅ 해금 완료!';
        emeraldStatusTag.className = 'char-status unlocked-tag';
        equipEmeraldBtn.disabled = false;
        equipEmeraldBtn.className = 'equip-btn unlocked-btn';
    }

    if (isDiamondUnlocked) {
        cardDiamond.className = 'char-card unlocked skin-diamond';
        diamondStatusTag.textContent = '✅ 해금 완료!';
        diamondStatusTag.className = 'char-status unlocked-tag';
        equipDiamondBtn.disabled = false;
        equipDiamondBtn.className = 'equip-btn unlocked-btn';
    }

    if (isRainbowUnlocked) {
        cardRainbow.className = 'char-card unlocked full-width skin-rainbow';
        rainbowStatusTag.textContent = '✅ 해금 완료!';
        rainbowStatusTag.className = 'char-status unlocked-tag';
        equipRainbowBtn.disabled = false;
        equipRainbowBtn.className = 'equip-btn unlocked-btn';
    }

    [cardBasic, cardThunder, cardEmerald, cardDiamond, cardRainbow].forEach(c => c.classList.remove('selected'));
    [equipBasicBtn, equipThunderBtn, equipEmeraldBtn, equipDiamondBtn, equipRainbowBtn].forEach(b => {
        b.classList.remove('active');
        if (!b.disabled) b.textContent = '장착하기';
    });

    if (equippedSkin === 'thunder') {
        cardThunder.classList.add('selected');
        equipThunderBtn.classList.add('active');
        equipThunderBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#ef4444';
        crosshair.style.boxShadow = '0 0 15px #ef4444, 0 0 25px #f97316';
    } else if (equippedSkin === 'emerald') {
        cardEmerald.classList.add('selected');
        equipEmeraldBtn.classList.add('active');
        equipEmeraldBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#10b981';
        crosshair.style.boxShadow = '0 0 15px #10b981, 0 0 25px #34d399';
    } else if (equippedSkin === 'diamond') {
        cardDiamond.classList.add('selected');
        equipDiamondBtn.classList.add('active');
        equipDiamondBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#06b6d4';
        crosshair.style.boxShadow = '0 0 15px #06b6d4, 0 0 25px #38bdf8';
    } else if (equippedSkin === 'rainbow') {
        cardRainbow.classList.add('selected');
        equipRainbowBtn.classList.add('active');
        equipRainbowBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#ec4899';
        crosshair.style.boxShadow = '0 0 18px #ec4899, 0 0 30px #f59e0b, 0 0 40px #38bdf8';
    } else {
        cardBasic.classList.add('selected');
        equipBasicBtn.classList.add('active');
        equipBasicBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#38bdf8';
        crosshair.style.boxShadow = '0 0 12px #38bdf8';
    }
}

equipBasicBtn.addEventListener('click', () => { equippedSkin = 'basic'; localStorage.setItem('equippedSkin', 'basic'); updateClosetUI(); });
equipThunderBtn.addEventListener('click', () => { equippedSkin = 'thunder'; localStorage.setItem('equippedSkin', 'thunder'); updateClosetUI(); });
equipEmeraldBtn.addEventListener('click', () => { equippedSkin = 'emerald'; localStorage.setItem('equippedSkin', 'emerald'); updateClosetUI(); });
equipDiamondBtn.addEventListener('click', () => { equippedSkin = 'diamond'; localStorage.setItem('equippedSkin', 'diamond'); updateClosetUI(); });
equipRainbowBtn.addEventListener('click', () => { equippedSkin = 'rainbow'; localStorage.setItem('equippedSkin', 'rainbow'); updateClosetUI(); });

// 10. Home Lobby UI Update & Navigation State Manager
function updateHomeLobbyUI() {
    if (savedStage > 1) {
        startGameHomeBtn.textContent = `🚀 이어서 도전 (스테이지 ${savedStage})`;
        resetStageHomeBtn.classList.remove('hidden');
    } else {
        startGameHomeBtn.textContent = '⚡ 1단계 도전 시작';
        resetStageHomeBtn.classList.add('hidden');
    }
}

function goToHome() {
    controls.unlock();
    gameState = 'home';
    isTimerRunning = false;
    audioEngine.stopBgm();

    updateHomeLobbyUI();

    homeOverlay.classList.remove('hidden');
    closetOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    camera.position.set(0, 10, 25);
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
    audioEngine.startBgm();
}

function openCloset() {
    gameState = 'closet';
    updateClosetUI();
    homeOverlay.classList.add('hidden');
    closetOverlay.classList.remove('hidden');
}

// Binds for Stage Save & Resume
startGameHomeBtn.addEventListener('click', () => startPlaying(savedStage));
resetStageHomeBtn.addEventListener('click', () => {
    savedStage = 1;
    localStorage.setItem('savedStage', '1');
    updateHomeLobbyUI();
    startPlaying(1);
});

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
        audioEngine.startBgm();
    }
});

// 11. Timer & Checkpoints
function updateTimer() {
    if (isTimerRunning) {
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000;
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }
}

// 12. Wall Running with Cooldown & Stamina Calculation
function checkWallRun(delta) {
    let nearWall = false;
    let wallNormal = new THREE.Vector3();

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
            nearWall = true;
            wallNormal.copy(intersects[0].face.normal);
            break;
        }
    }

    if (wallRunCooldown > 0) {
        wallRunCooldown -= delta;
        wallCdBadge.classList.remove('hidden');
        wallCdBadge.textContent = `⏳ 벽 타기 쿨타임 중... (${Math.max(0, wallRunCooldown).toFixed(1)}초)`;
        isWallRunning = false;
        wallBadge.classList.add('hidden');
        return;
    } else {
        wallCdBadge.classList.add('hidden');
    }

    if (nearWall && !canJump && (moveForward || moveLeft || moveRight || moveBackward)) {
        if (wallRunStamina > 0) {
            isWallRunning = true;
            currentWallNormal.copy(wallNormal);
            wallRunStamina -= delta;
            wallBadge.classList.remove('hidden');

            if (wallRunStamina <= 0) {
                isWallRunning = false;
                wallRunCooldown = 1.5;
                wallBadge.classList.add('hidden');
            }
        }
    } else {
        isWallRunning = false;
        wallBadge.classList.add('hidden');
    }

    camera.rotation.z = 0;
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
            
            velocity.y = 28;
            boosterBadge.classList.remove('hidden');
            setTimeout(() => boosterBadge.classList.add('hidden'), 1500);
            audioEngine.playBoostSound();
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

                checkpointBadge.classList.remove('hidden');
                setTimeout(() => checkpointBadge.classList.add('hidden'), 2000);
                audioEngine.playCheckpointSound();
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
    audioEngine.playVictorySound();

    const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
    finalTimeDisplay.textContent = `${mins}:${secs}`;

    if (currentStage !== 'special') {
        if (currentStage > highestStageCleared) {
            highestStageCleared = currentStage;
            localStorage.setItem('highestStageCleared', highestStageCleared.toString());
            unlockNoticeBanner.classList.remove('hidden');
            unlockNoticeBanner.textContent = `🎉 스테이지 ${currentStage} 클리어! 드레스룸에서 새로 해금된 스킨을 확인하세요!`;
        } else {
            unlockNoticeBanner.classList.add('hidden');
        }

        savedStage = currentStage + 1;
        if (savedStage > 20) savedStage = 1;
        localStorage.setItem('savedStage', savedStage.toString());
    } else {
        if (!isRainbowUnlocked) {
            isRainbowUnlocked = true;
            localStorage.setItem('isRainbowUnlocked', 'true');
            unlockNoticeBanner.classList.remove('hidden');
            unlockNoticeBanner.textContent = '🎉 ⭐ 특별 한정판 레인보우 히어로 캐릭터 해금 성공!';
        } else {
            unlockNoticeBanner.classList.add('hidden');
        }
    }

    if (currentStage === 'special') {
        victoryTitle.textContent = '⭐ 스페셜 무지개 완주 성공!';
        victoryMessage.textContent = '축하합니다! 장대 무지개 스페셜 코스를 완파하셨습니다!';
        nextStageBtn.textContent = '1단계로 시작 ▶';
        nextStageBtn.style.display = 'block';
    } else if (currentStage < 20) {
        victoryTitle.textContent = `🎉 스테이지 ${currentStage} 클리어!`;
        victoryMessage.textContent = '훌륭합니다! 다음 고난도 스테이지 도전 준비가 되셨나요?';
        nextStageBtn.textContent = '다음 스테이지 ▶';
        nextStageBtn.style.display = 'block';
    } else {
        victoryTitle.textContent = '🏆 20단계 완주! 파쿠르 전설 마스터 등극!';
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

// 13. Main Game Loop
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    clouds.forEach(c => {
        c.position.x += 0.03;
        if (c.position.x > 180) c.position.x = -180;
    });

    if (gameState === 'home') {
        const angle = performance.now() * 0.0003;
        camera.position.x = Math.sin(angle) * 35;
        camera.position.z = Math.cos(angle) * 35;
        camera.position.y = 15;
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
        checkWallRun(delta);
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

        const speedMultiplier = isSliding ? 240.0 : 220.0;

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
                    wallRunStamina = 2.0;
                    wallRunCooldown = 0;
                }
            });
        }

        prevTime = time;
    } else {
        prevTime = performance.now();
    }

    renderer.render(scene, camera);
}

// Launch to Home
updateClosetUI();
loadStage(savedStage);
goToHome();
animate();
