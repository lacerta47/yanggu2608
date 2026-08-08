// --------------------------------------------------
// 백룸 3D 공포 생존 게임 (v10 Engine - 레벨 4 버려진 사무실 & 현실 복귀 엔딩)
// --------------------------------------------------

let scene, camera, renderer;
let flashLight, ambientLight, flickerLight;

// 레벨 상태 관리 (1: 백룸, 2: 수영장, 3: 배선시설, 4: 버려진 사무실)
let currentLevel = 1;
let hasKey = false;
let valvesTurned = 0;
const TOTAL_VALVES = 4;

let wiresFixed = 0;
const TOTAL_WIRES = 3;
let gateOpening = false;
let gateTimer = 30;
let gateFullyOpen = false;

// 레벨 4 수집 및 컴퓨터 상태
let booksCollected = 0;
const TOTAL_BOOKS = 4;
let hasFoundHint = false;
let isFallingToReality = false;
let fallTimer = 0;

// 플레이어 물리 및 상태
const player = {
    height: 1.6,
    speed: 4.2,
    sprintMultiplier: 1.75,
    position: new THREE.Vector3(2, 1.6, 2),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    health: 100,
    stamina: 100,
    hunger: 100,
    thirst: 100,
    isHiding: false,
    isCamcorderOn: false,
    isFlashlightOn: true,
    bobbingTime: 0,
    stepTimer: 0
};

// 👾 박테리아(Bacteria) 괴물 상태
const monster = {
    group: null,
    position: new THREE.Vector3(45, 0, 45),
    targetWaypoint: new THREE.Vector3(45, 0, 45),
    speed: 1.2,
    chaseSpeed: 2.4,
    state: 'PATROL',
    alertDistance: 10.0,
    twitchTimer: 0
};

// 숨참기 미니게임 상태
const rhythm = {
    active: false,
    pointerPos: 0,
    movingRight: true,
    speed: 130,
    failCount: 0
};

const keys = { w: false, a: false, s: false, d: false, shift: false };

let gameState = 'START';
let clockSeconds = 0;
let lastTime = performance.now();

const GRID_SIZE = 24;
const ROOM_SIZE = 4.0;
const wallBoxes = [];
const items = [];
const valves = [];
const wiringPanels = [];
const books = [];
let hintPaper = null;
let centralComputer = null;

let keyMesh = null;
let exitDoorMesh = null;
let slideDoorMesh = null;
let stationGateMesh = null;
let waterMesh = null;
let waterTime = 0;

// 미니맵 및 안개(Fog of War) 탐험 기록 2D 배열
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
let visitedGrid = [];

function initVisitedGrid() {
    visitedGrid = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        visitedGrid[x] = [];
        for (let z = 0; z < GRID_SIZE; z++) {
            visitedGrid[x][z] = false;
        }
    }
}

let frameCount = 0;
let fpsLastTime = performance.now();
const fpsDisplay = document.getElementById('fpsDisplay');
const missionText = document.getElementById('missionText');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingProgress = document.getElementById('loadingProgress');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSubtext = document.getElementById('loadingSubtext');

const gateCountdownHUD = document.getElementById('gateCountdownHUD');
const countdownTimerText = document.getElementById('countdownTimerText');

// 터미널 모달 UI
const computerTerminalModal = document.getElementById('computerTerminalModal');
const computerPassInput = document.getElementById('computerPassInput');
const submitPassBtn = document.getElementById('submitPassBtn');
const closeTerminalBtn = document.getElementById('closeTerminalBtn');
const terminalMsg = document.getElementById('terminalMsg');

// UI 엘리먼트
const healthBar = document.getElementById('healthBar');
const staminaBar = document.getElementById('staminaBar');
const hungerBar = document.getElementById('hungerBar');
const thirstBar = document.getElementById('thirstBar');

const healthVal = document.getElementById('healthVal');
const staminaVal = document.getElementById('staminaVal');
const hungerVal = document.getElementById('hungerVal');
const thirstVal = document.getElementById('thirstVal');

const clockText = document.getElementById('clockText');
const statusMessage = document.getElementById('statusMessage');
const interactionPrompt = document.getElementById('interactionPrompt');
const promptText = document.getElementById('promptText');
const camcorderOverlay = document.getElementById('camcorderOverlay');
const hurtVignette = document.getElementById('hurtVignette');

const rhythmGameUI = document.getElementById('rhythmGameUI');
const rhythmPointer = document.getElementById('rhythmPointer');

const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endingCreditsOverlay = document.getElementById('endingCreditsOverlay');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const creditsRestartBtn = document.getElementById('creditsRestartBtn');

const checkpointNotice = document.getElementById('checkpointNotice');
const checkpointNoticeText = document.getElementById('checkpointNoticeText');

const checkpointStartLvl2Btn = document.getElementById('checkpointStartLvl2Btn');
const checkpointStartLvl3Btn = document.getElementById('checkpointStartLvl3Btn');
const checkpointStartLvl4Btn = document.getElementById('checkpointStartLvl4Btn');

const checkpointRestartLvl2Btn = document.getElementById('checkpointRestartLvl2Btn');
const checkpointRestartLvl3Btn = document.getElementById('checkpointRestartLvl3Btn');
const checkpointRestartLvl4Btn = document.getElementById('checkpointRestartLvl4Btn');

// --------------------------------------------------
// 1. 텍스처 생성기
// --------------------------------------------------
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cbb048'; ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = 'rgba(150, 115, 30, 0.2)';
    for (let x = 0; x < 1024; x += 32) ctx.fillRect(x, 0, 16, 1024);

    for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 60, 15, 0.1)' : 'rgba(235, 205, 110, 0.12)';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 4, 4);
    }

    ctx.fillStyle = '#181714'; ctx.fillRect(0, 960, 1024, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createPoolTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;

    for (let x = 0; x < 512; x += 32) {
        for (let y = 0; y < 512; y += 32) {
            ctx.strokeRect(x, y, 32, 32);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createIndustrialMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < 512; i += 64) ctx.fillRect(i, 0, 8, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createOfficeWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 480, 512, 32);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6e6939'; ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
            if ((x + y) % 8 === 0) {
                ctx.fillStyle = 'rgba(35, 35, 15, 0.18)';
                ctx.fillRect(x, y, 4, 4);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE, GRID_SIZE);
    return texture;
}

function createCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d6ceb2'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#9c9377'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE, GRID_SIZE);
    return texture;
}

// --------------------------------------------------
// 2. Web Audio API 및 MP3 오디오
// --------------------------------------------------
let audioCtx = null;
let noiseBufferShared = null;

const drinkAudioFile = new Audio('../assets/sounds/물먹는 소리.mp3');
const eatAudioFile = new Audio('../assets/sounds/음식먹는 소리.mp3');

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bufferSize = audioCtx.sampleRate * 2;
    noiseBufferShared = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBufferShared.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBufferShared; whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 85; filter.Q.value = 3;

    const buzzGainNode = audioCtx.createGain();
    buzzGainNode.gain.value = 0.08;

    whiteNoise.connect(filter); filter.connect(buzzGainNode); buzzGainNode.connect(audioCtx.destination);
    whiteNoise.start();
}

function playWaterDrinkSound() {
    if (drinkAudioFile) {
        drinkAudioFile.currentTime = 0;
        drinkAudioFile.play().catch(() => playSynthWaterDrinkSound());
    } else playSynthWaterDrinkSound();
}

function playFoodEatSound() {
    if (eatAudioFile) {
        eatAudioFile.currentTime = 0;
        eatAudioFile.play().catch(() => playSynthFoodEatSound());
    } else playSynthFoodEatSound();
}

function playSynthWaterDrinkSound() {
    if (!audioCtx) return;
    try {
        const time = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450 + i * 150, time + i * 0.12);
            osc.frequency.exponentialRampToValueAtTime(750 + i * 180, time + i * 0.12 + 0.08);

            gain.gain.setValueAtTime(0.25, time + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.12 + 0.08);

            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(time + i * 0.12); osc.stop(time + i * 0.12 + 0.08);
        }
    } catch(e) {}
}

function playSynthFoodEatSound() {
    if (!audioCtx || !noiseBufferShared) return;
    try {
        const time = audioCtx.currentTime;
        for (let i = 0; i < 4; i++) {
            const source = audioCtx.createBufferSource();
            source.buffer = noiseBufferShared;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600 + Math.random() * 400, time + i * 0.1);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.3, time + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.07);

            source.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
            source.start(time + i * 0.1); source.stop(time + i * 0.1 + 0.07);
        }
    } catch(e) {}
}

function playLevel1Footstep() {
    if (!audioCtx || !noiseBufferShared) return;
    try {
        const source = audioCtx.createBufferSource();
        source.buffer = noiseBufferShared;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350 + Math.random() * 100, audioCtx.currentTime);

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 + Math.random() * 30, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.08);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

        source.connect(filter);
        filter.connect(gain);
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        source.start();
        osc.start();
        source.stop(audioCtx.currentTime + 0.08);
        osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {}
}

let isRightFoot = false;
function playLevel2WaterFootstep() {
    if (!audioCtx || !noiseBufferShared) return;
    try {
        const time = audioCtx.currentTime;
        isRightFoot = !isRightFoot;
        const pitchVar = (Math.random() - 0.5) * 120;

        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime((isRightFoot ? 140 : 125) + pitchVar * 0.2, time);
        subOsc.frequency.exponentialRampToValueAtTime(28, time + 0.2);

        subGain.gain.setValueAtTime(0.42, time);
        subGain.gain.exponentialRampToValueAtTime(0.005, time + 0.2);

        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start();
        subOsc.stop(time + 0.2);

        const splashSource = audioCtx.createBufferSource();
        splashSource.buffer = noiseBufferShared;

        const splashFilter = audioCtx.createBiquadFilter();
        splashFilter.type = 'bandpass';
        splashFilter.frequency.setValueAtTime(1400 + pitchVar, time);
        splashFilter.Q.value = 3.2;

        const splashGain = audioCtx.createGain();
        splashGain.gain.setValueAtTime(0.38, time);
        splashGain.gain.exponentialRampToValueAtTime(0.005, time + 0.14);

        splashSource.connect(splashFilter);
        splashFilter.connect(splashGain);
        splashGain.connect(audioCtx.destination);

        splashSource.start();
        splashSource.stop(time + 0.14);
    } catch(e) {}
}

function playClickSound(freq = 400) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
}

function playFallToRealitySound() {
    if (!audioCtx || !noiseBufferShared) return;
    try {
        const time = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 1.4);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 1.4);

        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(time + 1.4);
    } catch(e) {}
}

// --------------------------------------------------
// 3. THREE.JS 씬 & 레벨 빌더
// --------------------------------------------------
function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.05);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.copy(player.position);

    const canvas = document.getElementById('bgCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);

    ambientLight = new THREE.AmbientLight(0xfff5cc, 0.35);
    scene.add(ambientLight);

    flashLight = new THREE.SpotLight(0xfffae6, 2.8, 22, Math.PI / 5.5, 0.45, 1);
    flashLight.position.copy(camera.position);
    scene.add(flashLight);
    scene.add(flashLight.target);

    flickerLight = new THREE.PointLight(0xffeaa7, 1.2, 10);
    scene.add(flickerLight);

    checkCheckpointStatus();
    window.addEventListener('resize', onWindowResize);
}

function checkCheckpointStatus() {
    const hasLvl2 = localStorage.getItem('backroomsCheckpointLvl2') === 'true';
    const hasLvl3 = localStorage.getItem('backroomsCheckpointLvl3') === 'true';
    const hasLvl4 = localStorage.getItem('backroomsCheckpointLvl4') === 'true';

    if (hasLvl2 || hasLvl3 || hasLvl4) {
        if (checkpointNotice) checkpointNotice.classList.remove('hidden');
        let lvlName = '레벨 2 수영장';
        if (hasLvl4) lvlName = '레벨 4 버려진 사무실';
        else if (hasLvl3) lvlName = '레벨 3 배선시설';
        if (checkpointNoticeText) checkpointNoticeText.innerHTML = `🚩 <strong>체크포인트 보관됨</strong>: ${lvlName}에서 이어서 진행할 수 있습니다!`;
    }

    if (hasLvl2) {
        if (checkpointStartLvl2Btn) checkpointStartLvl2Btn.classList.remove('hidden');
        if (checkpointRestartLvl2Btn) checkpointRestartLvl2Btn.classList.remove('hidden');
    }
    if (hasLvl3) {
        if (checkpointStartLvl3Btn) checkpointStartLvl3Btn.classList.remove('hidden');
        if (checkpointRestartLvl3Btn) checkpointRestartLvl3Btn.classList.remove('hidden');
    }
    if (hasLvl4) {
        if (checkpointStartLvl4Btn) checkpointStartLvl4Btn.classList.remove('hidden');
        if (checkpointRestartLvl4Btn) checkpointRestartLvl4Btn.classList.remove('hidden');
    }
}

function loadLevel1() {
    clearCurrentScene();
    initVisitedGrid();
    currentLevel = 1;
    hasKey = false;
    if (missionText) missionText.textContent = '🔑 백룸 열쇠 찾기 (미니맵 🔑 표시)';
    if (fpsDisplay) fpsDisplay.textContent = '⚡ 60 FPS | 📍 레벨 1 백룸';

    const wallTex = createWallTexture();
    const carpetTex = createCarpetTexture();
    const ceilingTex = createCeilingTexture();

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.6 });

    const totalWidth = GRID_SIZE * ROOM_SIZE;

    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, carpetMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.2, totalWidth / 2);
    scene.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(ROOM_SIZE, 3.2, 0.3);
    const wallTransforms = [];
    const availablePositions = [];

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            if ((x > 1 || z > 1) && Math.random() < 0.32) {
                const isRotated = Math.random() > 0.5;
                const isHollow = Math.random() < 0.2;

                const dummy = new THREE.Object3D();
                dummy.position.set(posX, 1.6, posZ);
                if (isRotated) dummy.rotation.y = Math.PI / 2;
                dummy.updateMatrix();

                wallTransforms.push({ matrix: dummy.matrix.clone(), pos: dummy.position, isHollow: isHollow, isRotated: isRotated });

                if (isHollow) {
                    const alcove = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                    alcove.position.set(posX, 0.9, posZ);
                    scene.add(alcove);
                }
            } else if (x > 3 && z > 3) {
                availablePositions.push({ x: posX, z: posZ });
            }

            if ((x > 1 || z > 1) && Math.random() < 0.06) spawnRealisticItem(posX, posZ);
        }
    }

    const instancedMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallTransforms.length);
    for (let i = 0; i < wallTransforms.length; i++) {
        instancedMesh.setMatrixAt(i, wallTransforms[i].matrix);

        const dummy = new THREE.Object3D();
        dummy.matrix.copy(wallTransforms[i].matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const box = new THREE.Box3().setFromCenterAndSize(
            dummy.position,
            wallTransforms[i].isRotated ? new THREE.Vector3(0.3, 3.2, ROOM_SIZE) : new THREE.Vector3(ROOM_SIZE, 3.2, 0.3)
        );
        wallBoxes.push({ box: box, isHollow: wallTransforms[i].isHollow, pos: dummy.position });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    const keySpot = availablePositions.length > 0 ? availablePositions[Math.floor(Math.random() * availablePositions.length)] : { x: 12, z: 12 };
    const keyGroup = new THREE.Group();

    const keyGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 16);
    const keyMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2, emissive: 0xffd166, emissiveIntensity: 0.8 });
    const keyMeshObj = new THREE.Mesh(keyGeo, keyMat);
    keyGroup.add(keyMeshObj);

    const keyLight = new THREE.PointLight(0xffd166, 3.5, 12);
    keyLight.position.set(0, 0.2, 0);
    keyGroup.add(keyLight);

    const keyBeamGeo = new THREE.CylinderGeometry(0.25, 0.25, 12, 16);
    const keyBeamMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.5 });
    const keyBeam = new THREE.Mesh(keyBeamGeo, keyBeamMat);
    keyBeam.position.set(0, 6, 0);
    keyGroup.add(keyBeam);

    keyGroup.position.set(keySpot.x, 0.6, keySpot.z);
    scene.add(keyGroup);
    keyMesh = keyGroup;

    const doorGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), frameMat); leftFrame.position.set(-0.75, 0, 0);
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), frameMat); rightFrame.position.set(0.75, 0, 0);
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.4), frameMat); topFrame.position.set(0, 1.2, 0);
    doorGroup.add(leftFrame, rightFrame, topFrame);

    const exitGeo = new THREE.BoxGeometry(1.2, 2.4, 0.15);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x15803d, emissive: 0x15803d, emissiveIntensity: 0.4, roughness: 0.4 });
    const door = new THREE.Mesh(exitGeo, exitMat);
    door.position.set(0, -0.4, 0);
    doorGroup.add(door);

    const knobGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.set(0.45, -0.4, 0.1);
    doorGroup.add(knob);

    const signGeo = new THREE.BoxGeometry(1.3, 0.35, 0.25);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.0, 0.1);
    doorGroup.add(sign);

    const exitLight = new THREE.PointLight(0x22c55e, 2.5, 8);
    exitLight.position.set(0, 0.9, 0.6);
    doorGroup.add(exitLight);

    doorGroup.position.set(totalWidth - 4, 1.6, totalWidth - 0.3);
    scene.add(doorGroup);
    exitDoorMesh = doorGroup;

    buildBacteriaMonster();
}

function loadLevel2() {
    clearCurrentScene();
    initVisitedGrid();
    currentLevel = 2;
    valvesTurned = 0;

    localStorage.setItem('backroomsCheckpointLvl2', 'true');
    checkCheckpointStatus();

    if (missionText) missionText.textContent = `🔧 파이프 밸브 돌리기 (0/${TOTAL_VALVES}) - 미니맵 🔧`;
    if (fpsDisplay) fpsDisplay.textContent = '⚡ 60 FPS | 📍 레벨 2 풀룸 수영장';
    if (statusMessage) statusMessage.textContent = '수영장 미로 속 미니맵의 🔧밸브 4개를 돌리세요!';

    const poolTileTex = createPoolTileTexture();
    const tileMat = new THREE.MeshStandardMaterial({ map: poolTileTex, roughness: 0.2 });

    const totalWidth = GRID_SIZE * ROOM_SIZE;

    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, tileMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, -0.6, totalWidth / 2);
    scene.add(floor);

    const waterGeo = new THREE.PlaneGeometry(totalWidth, totalWidth, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        metalness: 0.1
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(totalWidth / 2, 0.1, totalWidth / 2);
    scene.add(waterMesh);

    const ceiling = new THREE.Mesh(floorGeo, tileMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.5, totalWidth / 2);
    scene.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(ROOM_SIZE, 4.0, 0.4);
    const wallTransforms = [];
    const valvePositions = [];

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            if ((x > 1 || z > 1) && Math.random() < 0.28) {
                const isRotated = Math.random() > 0.5;

                const dummy = new THREE.Object3D();
                dummy.position.set(posX, 1.8, posZ);
                if (isRotated) dummy.rotation.y = Math.PI / 2;
                dummy.updateMatrix();

                wallTransforms.push({ matrix: dummy.matrix.clone(), pos: dummy.position, isRotated: isRotated });
            } else if (x > 2 && z > 2) {
                if (Math.random() < 0.06) spawnRealisticItem(posX, posZ);
                if (valvePositions.length < TOTAL_VALVES && Math.random() < 0.08) {
                    valvePositions.push({ x: posX, z: posZ });
                }
            }
        }
    }

    while (valvePositions.length < TOTAL_VALVES) {
        const rx = (3 + Math.floor(Math.random() * (GRID_SIZE - 4))) * ROOM_SIZE + ROOM_SIZE / 2;
        const rz = (3 + Math.floor(Math.random() * (GRID_SIZE - 4))) * ROOM_SIZE + ROOM_SIZE / 2;
        valvePositions.push({ x: rx, z: rz });
    }

    const instancedMesh = new THREE.InstancedMesh(wallGeo, tileMat, wallTransforms.length);
    for (let i = 0; i < wallTransforms.length; i++) {
        instancedMesh.setMatrixAt(i, wallTransforms[i].matrix);

        const dummy = new THREE.Object3D();
        dummy.matrix.copy(wallTransforms[i].matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const box = new THREE.Box3().setFromCenterAndSize(
            dummy.position,
            wallTransforms[i].isRotated ? new THREE.Vector3(0.4, 4.0, ROOM_SIZE) : new THREE.Vector3(ROOM_SIZE, 4.0, 0.4)
        );
        wallBoxes.push({ box: box, isHollow: false, pos: dummy.position });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    for (let i = 0; i < valvePositions.length; i++) {
        const vPos = valvePositions[i];
        const valveGroup = new THREE.Group();

        const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 12);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.y = 0.6;
        valveGroup.add(pipe);

        const wheelGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5 });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.y = 1.1;
        valveGroup.add(wheel);

        valveGroup.position.set(vPos.x, 0, vPos.z);
        scene.add(valveGroup);

        valves.push({ mesh: valveGroup, wheel: wheel, isTurned: false, pos: valveGroup.position });
    }

    const slideGroup = new THREE.Group();
    const slideGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.0, 16, 1, true);
    const slideMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, side: THREE.DoubleSide, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    const slide = new THREE.Mesh(slideGeo, slideMat);
    slide.rotation.x = Math.PI / 3;
    slideGroup.add(slide);

    const slideLight = new THREE.PointLight(0x38bdf8, 3, 10);
    slideLight.position.set(0, 1, 0);
    slideGroup.add(slideLight);

    slideGroup.position.set(totalWidth - 4, 1.2, totalWidth - 4);
    slideGroup.visible = false;
    scene.add(slideGroup);
    slideDoorMesh = slideGroup;

    player.position.set(2, 1.6, 2);
}

function loadLevel3() {
    clearCurrentScene();
    initVisitedGrid();
    currentLevel = 3;
    wiresFixed = 0;
    gateOpening = false;
    gateTimer = 30;
    gateFullyOpen = false;

    localStorage.setItem('backroomsCheckpointLvl3', 'true');
    checkCheckpointStatus();

    if (missionText) missionText.textContent = `⚡ 배선 상자 고치기 (0/${TOTAL_WIRES}) - 미니맵 ⚡`;
    if (fpsDisplay) fpsDisplay.textContent = '⚡ 60 FPS | 📍 레벨 3 배선 시설';
    if (statusMessage) statusMessage.textContent = '미로 속 발광하는 3개의 배선 상자를 찾아 고치세요!';
    if (gateCountdownHUD) gateCountdownHUD.classList.add('hidden');

    const metalTex = createIndustrialMetalTexture();
    const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.4, metalness: 0.6 });

    const totalWidth = GRID_SIZE * ROOM_SIZE;

    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, metalMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, metalMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.6, totalWidth / 2);
    scene.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(ROOM_SIZE, 3.6, 0.4);
    const wallTransforms = [];
    const wiringSpotPositions = [];

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            if ((x > 1 || z > 1) && Math.random() < 0.3) {
                const isRotated = Math.random() > 0.5;

                const dummy = new THREE.Object3D();
                dummy.position.set(posX, 1.8, posZ);
                if (isRotated) dummy.rotation.y = Math.PI / 2;
                dummy.updateMatrix();

                wallTransforms.push({ matrix: dummy.matrix.clone(), pos: dummy.position, isRotated: isRotated });
            } else if (x > 3 && z > 3) {
                if (Math.random() < 0.06) spawnRealisticItem(posX, posZ);
                if (wiringSpotPositions.length < TOTAL_WIRES && Math.random() < 0.08) {
                    wiringSpotPositions.push({ x: posX, z: posZ });
                }
            }
        }
    }

    while (wiringSpotPositions.length < TOTAL_WIRES) {
        const rx = (3 + Math.floor(Math.random() * (GRID_SIZE - 4))) * ROOM_SIZE + ROOM_SIZE / 2;
        const rz = (3 + Math.floor(Math.random() * (GRID_SIZE - 4))) * ROOM_SIZE + ROOM_SIZE / 2;
        wiringSpotPositions.push({ x: rx, z: rz });
    }

    const instancedMesh = new THREE.InstancedMesh(wallGeo, metalMat, wallTransforms.length);
    for (let i = 0; i < wallTransforms.length; i++) {
        instancedMesh.setMatrixAt(i, wallTransforms[i].matrix);

        const dummy = new THREE.Object3D();
        dummy.matrix.copy(wallTransforms[i].matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const box = new THREE.Box3().setFromCenterAndSize(
            dummy.position,
            wallTransforms[i].isRotated ? new THREE.Vector3(0.4, 3.6, ROOM_SIZE) : new THREE.Vector3(ROOM_SIZE, 3.6, 0.4)
        );
        wallBoxes.push({ box: box, isHollow: false, pos: dummy.position });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    for (let i = 0; i < wiringSpotPositions.length; i++) {
        const wPos = wiringSpotPositions[i];
        const panelGroup = new THREE.Group();

        const boxGeo = new THREE.BoxGeometry(0.8, 1.0, 0.3);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        panelGroup.add(boxMesh);

        const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.0 });
        const panelLightMesh = new THREE.Mesh(lightGeo, lightMat);
        panelLightMesh.position.set(0, 0.2, 0.16);
        panelGroup.add(panelLightMesh);

        const lightNode = new THREE.PointLight(0xfacc15, 3.0, 10);
        lightNode.position.set(0, 0.2, 0.3);
        panelGroup.add(lightNode);

        const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 16);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.45 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 6, 0);
        panelGroup.add(beam);

        panelGroup.position.set(wPos.x, 1.2, wPos.z);
        scene.add(panelGroup);

        wiringPanels.push({ mesh: panelGroup, isFixed: false, pos: panelGroup.position, lightMesh: panelLightMesh, lightNode: lightNode });
    }

    const gateGroup = new THREE.Group();
    const gateFrameGeo = new THREE.BoxGeometry(3.6, 3.6, 0.6);
    const gateFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const gateFrame = new THREE.Mesh(gateFrameGeo, gateFrameMat);
    gateGroup.add(gateFrame);

    const gateDoorGeo = new THREE.BoxGeometry(2.8, 3.2, 0.3);
    const gateDoorMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.3, metalness: 0.7 });
    const gateDoor = new THREE.Mesh(gateDoorGeo, gateDoorMat);
    gateDoor.position.set(0, -0.2, 0);
    gateGroup.add(gateDoor);

    const gateLight = new THREE.PointLight(0xef4444, 3.0, 12);
    gateLight.position.set(0, 1.4, 0.5);
    gateGroup.add(gateLight);

    gateGroup.position.set(totalWidth - 4, 1.8, totalWidth - 4);
    scene.add(gateGroup);
    stationGateMesh = { group: gateGroup, door: gateDoor, light: gateLight, pos: gateGroup.position };

    player.position.set(2, 1.6, 2);
}

// 📌 레벨 4: 버려진 사무실 (Abandoned Office - 📚 4권의 책 + 📄 힌트 종이 + 💻 중앙 컴퓨터)
function loadLevel4() {
    clearCurrentScene();
    initVisitedGrid();
    currentLevel = 4;
    booksCollected = 0;
    hasFoundHint = false;
    isFallingToReality = false;
    fallTimer = 0;

    localStorage.setItem('backroomsCheckpointLvl4', 'true');
    checkCheckpointStatus();

    if (missionText) missionText.textContent = `📚 비밀 서적 찾기 (0/${TOTAL_BOOKS}) - 미니맵 📚`;
    if (fpsDisplay) fpsDisplay.textContent = '⚡ 60 FPS | 📍 레벨 4 버려진 사무실';
    if (statusMessage) statusMessage.textContent = '사무실 속 발광하는 4권의 책과 📄 힌트 종이를 찾아 중앙 컴퓨터에 암호를 입력하세요!';
    if (gateCountdownHUD) gateCountdownHUD.classList.add('hidden');

    const officeWallTex = createOfficeWallTexture();
    const carpetTex = createCarpetTexture();
    const ceilingTex = createCeilingTexture();

    const wallMat = new THREE.MeshStandardMaterial({ map: officeWallTex, roughness: 0.7 });
    const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.6 });

    const totalWidth = GRID_SIZE * ROOM_SIZE;

    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, carpetMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.2, totalWidth / 2);
    scene.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(ROOM_SIZE, 3.2, 0.3);
    const wallTransforms = [];
    const availableBookPositions = [];

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            if ((x > 1 || z > 1) && Math.random() < 0.3) {
                const isRotated = Math.random() > 0.5;

                const dummy = new THREE.Object3D();
                dummy.position.set(posX, 1.6, posZ);
                if (isRotated) dummy.rotation.y = Math.PI / 2;
                dummy.updateMatrix();

                wallTransforms.push({ matrix: dummy.matrix.clone(), pos: dummy.position, isRotated: isRotated });
            } else if (x > 3 && z > 3) {
                availableBookPositions.push({ x: posX, z: posZ });
            }
            // 🚨 레벨 4에는 음식과 물이 없습니다!
        }
    }

    const instancedMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallTransforms.length);
    for (let i = 0; i < wallTransforms.length; i++) {
        instancedMesh.setMatrixAt(i, wallTransforms[i].matrix);

        const dummy = new THREE.Object3D();
        dummy.matrix.copy(wallTransforms[i].matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const box = new THREE.Box3().setFromCenterAndSize(
            dummy.position,
            wallTransforms[i].isRotated ? new THREE.Vector3(0.3, 3.2, ROOM_SIZE) : new THREE.Vector3(ROOM_SIZE, 3.2, 0.3)
        );
        wallBoxes.push({ box: box, isHollow: false, pos: dummy.position });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    // 📚 4권의 발광하는 비밀 서적 스폰 (미니맵 📚 표시)
    for (let i = 0; i < TOTAL_BOOKS; i++) {
        const bPos = availableBookPositions.length > 0 ?
            availableBookPositions.splice(Math.floor(Math.random() * availableBookPositions.length), 1)[0] :
            { x: (5 + i * 4) * ROOM_SIZE, z: (5 + i * 4) * ROOM_SIZE };

        const bookGroup = new THREE.Group();
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.12), new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xeab308, emissiveIntensity: 0.6 }));
        bookGroup.add(bMesh);

        const bLight = new THREE.PointLight(0xfde047, 3.0, 10);
        bLight.position.set(0, 0.3, 0);
        bookGroup.add(bLight);

        const bBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 16), new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.4 }));
        bBeam.position.set(0, 5, 0);
        bookGroup.add(bBeam);

        bookGroup.position.set(bPos.x, 0.5, bPos.z);
        scene.add(bookGroup);

        books.push({ mesh: bookGroup, isCollected: false, pos: bookGroup.position });
    }

    // 📄 1개의 힌트 종이 스폰 ("컴퓨터 암호: 준섭 게이")
    const hPos = availableBookPositions.length > 0 ?
        availableBookPositions.splice(Math.floor(Math.random() * availableBookPositions.length), 1)[0] :
        { x: 10 * ROOM_SIZE, z: 10 * ROOM_SIZE };

    const hintGroup = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f5d4, emissiveIntensity: 0.8, side: THREE.DoubleSide }));
    paper.rotation.x = -Math.PI / 2;
    hintGroup.add(paper);

    const hLight = new THREE.PointLight(0x00f5d4, 3.5, 10);
    hLight.position.set(0, 0.4, 0);
    hintGroup.add(hLight);

    const hBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 16), new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.4 }));
    hBeam.position.set(0, 5, 0);
    hintGroup.add(hBeam);

    hintGroup.position.set(hPos.x, 0.3, hPos.z);
    scene.add(hintGroup);
    hintPaper = { mesh: hintGroup, pos: hintGroup.position, isFound: false };

    // 💻 맵 중앙의 중앙 컴퓨터 터미널 스폰 (책 4권 수집 시 발광)
    const compGroup = new THREE.Group();
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    desk.position.set(0, 0.45, 0); compGroup.add(desk);

    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.1), new THREE.MeshStandardMaterial({ color: 0x022c22, emissive: 0x22c55e, emissiveIntensity: 0.6 }));
    monitor.position.set(0, 1.15, 0); compGroup.add(monitor);

    const compLight = new THREE.PointLight(0x38bdf8, 0, 15);
    compLight.position.set(0, 1.5, 0.3); compGroup.add(compLight);

    const compBeamGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
    const compBeamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    const compBeam = new THREE.Mesh(compBeamGeo, compBeamMat);
    compBeam.position.set(0, 6, 0); compGroup.add(compBeam);

    compGroup.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(compGroup);
    centralComputer = { group: compGroup, pos: compGroup.position, light: compLight, beamMat: compBeamMat };

    player.position.set(2, 1.6, 2);
    buildBacteriaMonster();
}

function clearCurrentScene() {
    wallBoxes.length = 0;
    items.length = 0;
    valves.length = 0;
    wiringPanels.length = 0;
    books.length = 0;
    hintPaper = null;
    centralComputer = null;
    keyMesh = null;
    exitDoorMesh = null;
    slideDoorMesh = null;
    stationGateMesh = null;

    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    scene.add(ambientLight);
    scene.add(flashLight);
    scene.add(flashLight.target);
    scene.add(flickerLight);
}

function spawnRealisticItem(x, z) {
    if (currentLevel === 4) return; // 🚨 레벨 4에는 음식과 물이 없습니다!

    const roll = Math.floor(Math.random() * 4);
    let group = new THREE.Group();
    let type = ''; let name = '';

    if (roll === 0) {
        type = 'burger'; name = '🍔 따끈한 햄버거';
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 });
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.9 });
        const bunBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), bunMat);
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 12), pattyMat); patty.position.y = 0.045;
        group.add(bunBottom, patty);
    } else if (roll === 1) {
        type = 'pizza'; name = '🍕 고소한 피자';
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 });
        const base = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 3), cheeseMat); base.rotation.x = Math.PI / 2; base.scale.set(1, 1, 0.15);
        group.add(base);
    } else if (roll === 2) {
        type = 'cola'; name = '🥤 톡 쏘는 콜라';
        const canMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2, metalness: 0.6 });
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), canMat);
        group.add(can);
    } else {
        type = 'water'; name = '💧 아몬드 워터';
        const bottleMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, emissive: 0x06b6d4, emissiveIntensity: 0.4 });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.38, 12), bottleMat);
        group.add(bottle);
    }

    group.position.set(x, 0.2, z);
    scene.add(group);
    items.push({ mesh: group, type: type, pos: group.position, name: name });
}

function buildBacteriaMonster() {
    const group = new THREE.Group();
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x08080a });

    for (let i = 0; i < 8; i++) {
        const height = 2.4 + Math.random() * 0.4;
        const strandGeo = new THREE.CylinderGeometry(0.04, 0.04, height, 6);
        const strand = new THREE.Mesh(strandGeo, blackMat);
        strand.position.set((Math.random() - 0.5) * 0.3, height / 2, (Math.random() - 0.5) * 0.3);
        group.add(strand);
    }

    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eye = new THREE.Mesh(eyeGeo, eyeMat); eye.position.set(0, 2.32, 0.15); group.add(eye);

    monster.group = group;
    monster.group.position.copy(monster.position);
    scene.add(monster.group);
}

// --------------------------------------------------
// 4. 이벤트 및 상호작용
// --------------------------------------------------
document.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && computerTerminalModal && !computerTerminalModal.classList.contains('hidden')) {
        submitComputerPassword();
        return;
    }

    switch (e.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.shift = true; break;
        case 'KeyE': handleInteract(); break;
        case 'Space': handleRhythmCheck(); break;
        case 'KeyF': toggleFlashlight(); break;
        case 'KeyQ': toggleCamcorder(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.shift = false; break;
    }
});

document.body.addEventListener('click', () => {
    if (gameState === 'PLAYING' && document.pointerLockElement !== document.body && (!computerTerminalModal || computerTerminalModal.classList.contains('hidden'))) {
        document.body.requestPointerLock();
    }
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body && !player.isHiding) {
        player.rotation.y -= e.movementX * 0.0025;
        player.rotation.x -= e.movementY * 0.0025;
        player.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.rotation.x));
    }
});

function toggleFlashlight() {
    player.isFlashlightOn = !player.isFlashlightOn;
    flashLight.visible = player.isFlashlightOn;
    playClickSound(600);
}

function toggleCamcorder() {
    player.isCamcorderOn = !player.isCamcorderOn;
    if (player.isCamcorderOn) camcorderOverlay.classList.remove('hidden');
    else camcorderOverlay.classList.add('hidden');
    playClickSound(300);
}

function handleInteract() {
    if (gameState !== 'PLAYING') return;

    if (currentLevel === 1 && keyMesh && player.position.distanceTo(keyMesh.position) < 2.2) {
        hasKey = true;
        scene.remove(keyMesh);
        keyMesh = null;
        if (missionText) missionText.textContent = '🔑 백룸 열쇠 획득! 🌟 빛나는 EXIT 문으로 가세요 (1/1)';
        if (statusMessage) statusMessage.textContent = '🔑 황금 열쇠 획득! 멀리서 초록색으로 강하게 발광하는 EXIT 탈출문을 찾으세요!';
        playClickSound(1000);

        if (exitDoorMesh) {
            exitDoorMesh.traverse((child) => {
                if (child.isPointLight) {
                    child.intensity = 18.0;
                    child.distance = 50.0;
                }
            });

            const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, 15, 16);
            const beamMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.65 });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(0, 7.5, 0);
            exitDoorMesh.add(beam);
        }
        return;
    }

    if (currentLevel === 1 && exitDoorMesh && player.position.distanceTo(exitDoorMesh.position) < 2.8) {
        if (hasKey) triggerLoadingTransition(2);
        else if (statusMessage) statusMessage.textContent = '🔑 문이 잠겨있습니다! 먼저 미로 속 황금 열쇠를 찾으세요.';
        return;
    }

    if (currentLevel === 2) {
        for (let v of valves) {
            if (!v.isTurned && player.position.distanceTo(v.pos) < 2.0) {
                v.isTurned = true;
                v.wheel.rotation.z += Math.PI;
                valvesTurned++;
                if (missionText) missionText.textContent = `🔧 파이프 밸브 돌리기 (${valvesTurned}/${TOTAL_VALVES}) - 미니맵 🔧`;
                if (statusMessage) statusMessage.textContent = `🔧 [${valvesTurned}/${TOTAL_VALVES}] 파이프 밸브를 돌렸습니다!`;
                playClickSound(750);

                if (valvesTurned >= TOTAL_VALVES && slideDoorMesh) {
                    slideDoorMesh.visible = true;
                    if (statusMessage) statusMessage.textContent = '🛝 4개의 밸브 작동 완료! 파란빛으로 강하게 발광하는 미끄럼틀 탈출문이 열렸습니다!';
                    playClickSound(1200);

                    slideDoorMesh.traverse((child) => {
                        if (child.isPointLight) {
                            child.intensity = 18.0;
                            child.distance = 50.0;
                        }
                    });

                    const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 16);
                    const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
                    const beam = new THREE.Mesh(beamGeo, beamMat);
                    beam.position.set(0, 7.5, 0);
                    slideDoorMesh.add(beam);
                }
                return;
            }
        }

        if (slideDoorMesh && slideDoorMesh.visible && player.position.distanceTo(slideDoorMesh.position) < 2.8) {
            triggerLoadingTransition(3);
            return;
        }
    }

    if (currentLevel === 3) {
        for (let w of wiringPanels) {
            if (!w.isFixed && player.position.distanceTo(w.pos) < 2.2) {
                w.isFixed = true;
                w.lightMesh.material.color.setHex(0x22c55e);
                w.lightMesh.material.emissive.setHex(0x22c55e);
                w.lightNode.color.setHex(0x22c55e);
                wiresFixed++;

                if (missionText) missionText.textContent = `⚡ 배선 상자 고치기 (${wiresFixed}/${TOTAL_WIRES}) - 미니맵 ⚡`;
                if (statusMessage) statusMessage.textContent = `⚡ [${wiresFixed}/${TOTAL_WIRES}] 배선 수리 완료!`;
                playClickSound(950);

                if (wiresFixed >= TOTAL_WIRES) {
                    gateOpening = true;
                    gateTimer = 30;
                    if (statusMessage) statusMessage.textContent = '⏳ 모든 배선 수리 완료! 탈출문이 30초 동안 천천히 열립니다!';
                    if (gateCountdownHUD) gateCountdownHUD.classList.remove('hidden');
                    playClickSound(1300);
                }
                return;
            }
        }

        if (stationGateMesh && player.position.distanceTo(stationGateMesh.pos) < 3.0) {
            if (gateFullyOpen) {
                triggerLoadingTransition(4);
            } else {
                if (statusMessage) statusMessage.textContent = `⏳ 문이 완전히 열릴 때까지 기다려야 합니다! (남은 시간: ${Math.ceil(gateTimer)}초)`;
            }
            return;
        }
    }

    // 📌 레벨 4: 📚 4권의 책 + 📄 힌트 종이 + 💻 중앙 컴퓨터
    if (currentLevel === 4) {
        for (let i = books.length - 1; i >= 0; i--) {
            const b = books[i];
            if (!b.isCollected && player.position.distanceTo(b.pos) < 2.2) {
                b.isCollected = true;
                scene.remove(b.mesh);
                booksCollected++;
                if (missionText) missionText.textContent = `📚 비밀 서적 찾기 (${booksCollected}/${TOTAL_BOOKS}) - 미니맵 📚`;
                if (statusMessage) statusMessage.textContent = `📚 [${booksCollected}/${TOTAL_BOOKS}] 비밀 서적을 발견했습니다!`;
                playClickSound(1100);

                if (booksCollected >= TOTAL_BOOKS && centralComputer) {
                    centralComputer.light.intensity = 25.0;
                    centralComputer.beamMat.opacity = 0.7;
                    if (statusMessage) statusMessage.textContent = '💻 4권의 책을 모두 수집했습니다! 맵 중앙에서 빛나는 컴퓨터에 접속하세요!';
                }
                return;
            }
        }

        if (hintPaper && !hintPaper.isFound && player.position.distanceTo(hintPaper.pos) < 2.2) {
            hintPaper.isFound = true;
            if (statusMessage) statusMessage.textContent = '📄 힌트 종이 획득: 컴퓨터 암호는 [준섭 게이] 입니다!';
            playClickSound(850);
            return;
        }

        if (centralComputer && player.position.distanceTo(centralComputer.pos) < 2.8) {
            if (booksCollected >= TOTAL_BOOKS) {
                openComputerTerminal();
            } else {
                if (statusMessage) statusMessage.textContent = `📚 아직 책이 부족합니다! 4권의 책을 먼저 모으세요. (${booksCollected}/${TOTAL_BOOKS})`;
            }
            return;
        }
    }

    if (player.isHiding) {
        player.isHiding = false;
        rhythm.active = false;
        rhythmGameUI.classList.add('hidden');
        if (statusMessage) statusMessage.textContent = '은신처에서 나왔습니다.';
        playClickSound(400);
        return;
    }

    for (let w of wallBoxes) {
        if (w.isHollow && player.position.distanceTo(w.pos) < 2.2) {
            player.isHiding = true;
            if (statusMessage) statusMessage.textContent = '구멍 난 벽에 숨었습니다! [E] 키로 나가기';
            playClickSound(200);
            return;
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (player.position.distanceTo(item.pos) < 1.8) {
            if (item.type === 'burger') {
                player.hunger = Math.min(100, player.hunger + 50); player.health = Math.min(100, player.health + 15);
                if (statusMessage) statusMessage.textContent = '🍔 햄버거를 먹었습니다!';
                playFoodEatSound();
            } else if (item.type === 'pizza') {
                player.hunger = Math.min(100, player.hunger + 45);
                if (statusMessage) statusMessage.textContent = '🍕 피자를 먹었습니다!';
                playFoodEatSound();
            } else if (item.type === 'cola') {
                player.thirst = Math.min(100, player.thirst + 50); player.stamina = Math.min(100, player.stamina + 20);
                if (statusMessage) statusMessage.textContent = '🥤 콜라를 마셨습니다!';
                playWaterDrinkSound();
            } else if (item.type === 'water') {
                player.thirst = Math.min(100, player.thirst + 40); player.health = Math.min(100, player.health + 10);
                if (statusMessage) statusMessage.textContent = '💧 아몬드 워터를 마셨습니다!';
                playWaterDrinkSound();
            }
            scene.remove(item.mesh); items.splice(i, 1);
            return;
        }
    }
}

// 💻 컴퓨터 터미널 열기 & 암호 검증
function openComputerTerminal() {
    document.exitPointerLock();
    if (computerTerminalModal) computerTerminalModal.classList.remove('hidden');
    if (computerPassInput) {
        computerPassInput.value = '';
        computerPassInput.focus();
    }
    if (terminalMsg) terminalMsg.textContent = '';
}

function submitComputerPassword() {
    if (!computerPassInput) return;
    const inputVal = computerPassInput.value.trim();

    if (inputVal === '준섭 게이') {
        if (terminalMsg) {
            terminalMsg.className = 'terminal-msg success';
            terminalMsg.textContent = '✅ AUTHENTICATION SUCCESSFUL! FALLING TO REALITY...';
        }
        playClickSound(1400);

        setTimeout(() => {
            if (computerTerminalModal) computerTerminalModal.classList.add('hidden');
            triggerFallToRealityEnding();
        }, 800);
    } else {
        if (terminalMsg) {
            terminalMsg.className = 'terminal-msg error';
            terminalMsg.textContent = '❌ ACCESS DENIED! 암호가 틀렸습니다. (힌트 종이를 확인하세요)';
        }
        playClickSound(250);
    }
}

function triggerFallToRealityEnding() {
    isFallingToReality = true;
    fallTimer = 0;
    playFallToRealitySound();
    if (statusMessage) statusMessage.textContent = '🌀 바닥이 꺼지며 현실 세계로 낙하 중...';
}

if (submitPassBtn) submitPassBtn.addEventListener('click', submitComputerPassword);
if (closeTerminalBtn) closeTerminalBtn.addEventListener('click', () => {
    if (computerTerminalModal) computerTerminalModal.classList.add('hidden');
    document.body.requestPointerLock();
});

function triggerLoadingTransition(targetLvl) {
    gameState = 'LOADING';
    document.exitPointerLock();
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    if (loadingProgress) loadingProgress.style.width = '0%';

    if (loadingTitle) {
        if (targetLvl === 2) loadingTitle.textContent = '🏊‍♂️ 레벨 2: 풀룸(Poolrooms) 수영장으로 이동 중...';
        else if (targetLvl === 3) loadingTitle.textContent = '⚙️ 레벨 3: 배선 시설(Electrical Station)로 이동 중...';
        else if (targetLvl === 4) loadingTitle.textContent = '🏢 레벨 4: 버려진 사무실(Abandoned Office)로 이동 중...';
    }
    if (loadingSubtext) {
        loadingSubtext.textContent = `🚩 ${targetLvl}레벨 체크포인트가 보관되었습니다!`;
    }

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (loadingProgress) loadingProgress.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            if (targetLvl === 2) loadLevel2();
            else if (targetLvl === 3) loadLevel3();
            else if (targetLvl === 4) loadLevel4();
            gameState = 'PLAYING';
            document.body.requestPointerLock();
        }
    }, 120);
}

function handleRhythmCheck() {
    if (!rhythm.active) return;
    if (rhythm.pointerPos >= 40 && rhythm.pointerPos <= 60) {
        if (statusMessage) statusMessage.textContent = '🤫 박테리아 괴물이 지나쳐갑니다...';
        playClickSound(900);
    } else {
        rhythm.failCount++;
        if (rhythm.failCount >= 2) {
            player.isHiding = false; rhythm.active = false;
            rhythmGameUI.classList.add('hidden');
            monster.state = 'CHASE';
            if (statusMessage) statusMessage.textContent = '💥 들켰습니다!';
        }
    }
}

function checkNearbyPrompts() {
    let near = false;

    if (currentLevel === 1 && keyMesh && player.position.distanceTo(keyMesh.position) < 2.2) {
        if (promptText) promptText.textContent = '[E] 🔑 황금 열쇠 줍기';
        if (interactionPrompt) interactionPrompt.classList.add('active');
        return;
    }

    if (currentLevel === 1 && exitDoorMesh && player.position.distanceTo(exitDoorMesh.position) < 2.8) {
        if (promptText) promptText.textContent = hasKey ? '[E] 🚪 EXIT 문 열고 레벨 2 이동' : '🔒 [열쇠 필요] EXIT 문';
        if (interactionPrompt) interactionPrompt.classList.add('active');
        return;
    }

    if (currentLevel === 2) {
        for (let v of valves) {
            if (!v.isTurned && player.position.distanceTo(v.pos) < 2.0) {
                if (promptText) promptText.textContent = '[E] 🔧 파이프 밸브 돌리기';
                if (interactionPrompt) interactionPrompt.classList.add('active');
                return;
            }
        }

        if (slideDoorMesh && slideDoorMesh.visible && player.position.distanceTo(slideDoorMesh.position) < 2.8) {
            if (promptText) promptText.textContent = '[E] 🛝 미끄럼틀 타고 레벨 3 이동!';
            if (interactionPrompt) interactionPrompt.classList.add('active');
            return;
        }
    }

    if (currentLevel === 3) {
        for (let w of wiringPanels) {
            if (!w.isFixed && player.position.distanceTo(w.pos) < 2.2) {
                if (promptText) promptText.textContent = '[E] ⚡ 배선 고치기';
                if (interactionPrompt) interactionPrompt.classList.add('active');
                return;
            }
        }

        if (stationGateMesh && player.position.distanceTo(stationGateMesh.pos) < 3.0) {
            if (gateFullyOpen) {
                if (promptText) promptText.textContent = '[E] 🚪 레벨 4 이동하기';
            } else {
                if (promptText) promptText.textContent = `⏳ 문이 열리는 중 (${Math.ceil(gateTimer)}초)`;
            }
            if (interactionPrompt) interactionPrompt.classList.add('active');
            return;
        }
    }

    if (currentLevel === 4) {
        for (let b of books) {
            if (!b.isCollected && player.position.distanceTo(b.pos) < 2.2) {
                if (promptText) promptText.textContent = '[E] 📚 비밀 서적 획득';
                if (interactionPrompt) interactionPrompt.classList.add('active');
                return;
            }
        }

        if (hintPaper && !hintPaper.isFound && player.position.distanceTo(hintPaper.pos) < 2.2) {
            if (promptText) promptText.textContent = '[E] 📄 힌트 종이 읽기';
            if (interactionPrompt) interactionPrompt.classList.add('active');
            return;
        }

        if (centralComputer && player.position.distanceTo(centralComputer.pos) < 2.8) {
            if (promptText) promptText.textContent = booksCollected >= TOTAL_BOOKS ? '[E] 💻 중앙 컴퓨터 암호 입력' : `🔒 [책 ${booksCollected}/4] 중앙 컴퓨터`;
            if (interactionPrompt) interactionPrompt.classList.add('active');
            return;
        }
    }

    for (let item of items) {
        if (player.position.distanceTo(item.pos) < 1.8) {
            if (promptText) promptText.textContent = `[E] ${item.name} 먹기`;
            if (interactionPrompt) interactionPrompt.classList.add('active');
            near = true; break;
        }
    }

    if (!near && interactionPrompt) interactionPrompt.classList.remove('active');
}

// 🧭 미니맵 렌더링
function updateMinimapVisited() {
    if (!visitedGrid || visitedGrid.length === 0) return;
    const pGridX = Math.floor(player.position.x / ROOM_SIZE);
    const pGridZ = Math.floor(player.position.z / ROOM_SIZE);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const gx = pGridX + dx;
            const gz = pGridZ + dz;
            if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
                visitedGrid[gx][gz] = true;
            }
        }
    }
}

function drawMinimap() {
    if (!minimapCtx || !visitedGrid || visitedGrid.length === 0) return;

    const size = 130;
    const cellSize = size / GRID_SIZE;

    minimapCtx.clearRect(0, 0, size, size);

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            if (visitedGrid[x] && visitedGrid[x][z]) {
                const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
                const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

                let isWall = false;
                for (let w of wallBoxes) {
                    if (w && w.pos && Math.abs(w.pos.x - posX) < 0.5 && Math.abs(w.pos.z - posZ) < 0.5) {
                        isWall = true;
                        break;
                    }
                }

                minimapCtx.fillStyle = isWall ? (currentLevel === 1 ? '#d4b248' : (currentLevel === 2 ? '#94a3b8' : (currentLevel === 3 ? '#334155' : '#475569'))) : '#1e293b';
                minimapCtx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);
            } else {
                minimapCtx.fillStyle = '#05060a';
                minimapCtx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);
            }
        }
    }

    if (currentLevel === 1 && keyMesh) {
        const kx = Math.floor(keyMesh.position.x / ROOM_SIZE);
        const kz = Math.floor(keyMesh.position.z / ROOM_SIZE);
        minimapCtx.fillStyle = '#ffd166';
        minimapCtx.beginPath();
        minimapCtx.arc(kx * cellSize + cellSize / 2, kz * cellSize + cellSize / 2, cellSize * 1.1, 0, Math.PI * 2);
        minimapCtx.fill();
    }

    if (currentLevel === 2 && valves.length > 0) {
        for (let v of valves) {
            const vx = Math.floor(v.pos.x / ROOM_SIZE);
            const vz = Math.floor(v.pos.z / ROOM_SIZE);
            minimapCtx.fillStyle = v.isTurned ? '#22c55e' : '#ef4444';
            minimapCtx.fillRect(vx * cellSize + 1, vz * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    }

    if (currentLevel === 3 && wiringPanels.length > 0) {
        for (let w of wiringPanels) {
            const wx = Math.floor(w.pos.x / ROOM_SIZE);
            const wz = Math.floor(w.pos.z / ROOM_SIZE);
            minimapCtx.fillStyle = w.isFixed ? '#22c55e' : '#facc15';
            minimapCtx.fillRect(wx * cellSize + 1, wz * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    }

    // 📚 레벨 4: 책 4권 & 📄 힌트 종이 & 💻 중앙 컴퓨터 미니맵 마커 표시
    if (currentLevel === 4) {
        for (let b of books) {
            if (!b.isCollected) {
                const bx = Math.floor(b.pos.x / ROOM_SIZE);
                const bz = Math.floor(b.pos.z / ROOM_SIZE);
                minimapCtx.fillStyle = '#fde047';
                minimapCtx.fillRect(bx * cellSize + 1, bz * cellSize + 1, cellSize - 2, cellSize - 2);
            }
        }

        if (hintPaper && !hintPaper.isFound) {
            const hx = Math.floor(hintPaper.pos.x / ROOM_SIZE);
            const hz = Math.floor(hintPaper.pos.z / ROOM_SIZE);
            minimapCtx.fillStyle = '#00f5d4';
            minimapCtx.fillRect(hx * cellSize + 1, hz * cellSize + 1, cellSize - 2, cellSize - 2);
        }

        if (centralComputer) {
            const cx = Math.floor(centralComputer.pos.x / ROOM_SIZE);
            const cz = Math.floor(centralComputer.pos.z / ROOM_SIZE);
            minimapCtx.fillStyle = booksCollected >= TOTAL_BOOKS ? '#38bdf8' : '#64748b';
            minimapCtx.fillRect(cx * cellSize, cz * cellSize, cellSize, cellSize);
        }
    }

    const doorMeshObj = currentLevel === 1 ? exitDoorMesh : (currentLevel === 2 ? slideDoorMesh : (stationGateMesh ? stationGateMesh.group : null));
    if (doorMeshObj && currentLevel < 4) {
        const dx = Math.floor(doorMeshObj.position.x / ROOM_SIZE);
        const dz = Math.floor(doorMeshObj.position.z / ROOM_SIZE);
        minimapCtx.fillStyle = currentLevel === 1 ? '#22c55e' : (currentLevel === 2 ? '#38bdf8' : (gateFullyOpen ? '#22c55e' : '#ef4444'));
        minimapCtx.fillRect(dx * cellSize, dz * cellSize, cellSize, cellSize);
    }

    const px = (player.position.x / (GRID_SIZE * ROOM_SIZE)) * size;
    const pz = (player.position.z / (GRID_SIZE * ROOM_SIZE)) * size;

    minimapCtx.fillStyle = '#00f5d4';
    minimapCtx.beginPath();
    minimapCtx.arc(px, pz, 3.5, 0, Math.PI * 2);
    minimapCtx.fill();

    const dirX = Math.sin(-player.rotation.y) * 7;
    const dirZ = -Math.cos(-player.rotation.y) * 7;

    minimapCtx.strokeStyle = '#00f5d4';
    minimapCtx.lineWidth = 2;
    minimapCtx.beginPath();
    minimapCtx.moveTo(px, pz);
    minimapCtx.lineTo(px + dirX, pz + dirZ);
    minimapCtx.stroke();
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (currentLevel === 1 && keyMesh) {
        keyMesh.rotation.y += delta * 1.5;
    }

    if (currentLevel === 2 && waterMesh) {
        waterTime += delta * 2;
        const pos = waterMesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const u = pos.getX(i);
            const v = pos.getY(i);
            const z = Math.sin(waterTime + u * 0.5 + v * 0.3) * 0.08;
            pos.setZ(i, z);
        }
        pos.needsUpdate = true;
    }

    if (currentLevel === 3 && gateOpening && !gateFullyOpen) {
        gateTimer -= delta;
        if (stationGateMesh && stationGateMesh.door) {
            stationGateMesh.door.position.y += delta * 0.08;
        }

        if (countdownTimerText) {
            countdownTimerText.textContent = `${Math.max(0, Math.ceil(gateTimer))}초`;
        }

        if (gateTimer <= 0) {
            gateTimer = 0;
            gateFullyOpen = true;
            gateOpening = false;
            if (gateCountdownHUD) gateCountdownHUD.classList.add('hidden');
            if (statusMessage) statusMessage.textContent = '🌟 30초 경과! 탈출문이 강한 초록빛을 발광하며 완전히 열렸습니다! 미니맵과 빛 기둥을 따라 탈출하세요!';

            if (stationGateMesh && stationGateMesh.group) {
                if (stationGateMesh.light) {
                    stationGateMesh.light.color.setHex(0x22c55e);
                    stationGateMesh.light.intensity = 25.0;
                    stationGateMesh.light.distance = 60.0;
                }

                const exitBeamGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 16);
                const exitBeamMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.75 });
                const exitBeam = new THREE.Mesh(exitBeamGeo, exitBeamMat);
                exitBeam.position.set(0, 7.5, 0);
                stationGateMesh.group.add(exitBeam);
            }

            playClickSound(1600);
        }
    }

    // 🌀 현실 세계 낙하 애니메이션 (암호 정답 시)
    if (isFallingToReality) {
        fallTimer += delta;
        player.position.y -= delta * 18.0; // 아래로 빠르게 낙하
        player.rotation.x -= delta * 3.0;  // 시야가 아래로 곤두박질침
        flashLight.intensity = Math.random() * 5.0; // 화면 지직거림

        if (fallTimer >= 1.6) {
            isFallingToReality = false;
            gameWinEnding();
        }
    }

    frameCount++;
    if (currentTime > fpsLastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - fpsLastTime));
        let lvlName = '레벨 1 백룸';
        if (currentLevel === 2) lvlName = '레벨 2 풀룸 수영장';
        else if (currentLevel === 3) lvlName = '레벨 3 배선 시설';
        else if (currentLevel === 4) lvlName = '레벨 4 버려진 사무실';

        if (fpsDisplay) fpsDisplay.textContent = `⚡ ${fps} FPS | 📍 ${lvlName}`;
        frameCount = 0; fpsLastTime = currentTime;
    }

    if (gameState === 'PLAYING') {
        try {
            updateMovement(delta);
            if (currentLevel === 1 || currentLevel === 4) updateBacteriaAI(delta);
            updateSurvivalStats(delta);
            updateMinimapVisited();
            drawMinimap();
            checkNearbyPrompts();
        } catch(err) {
            console.error("Game loop error:", err);
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateBacteriaAI(delta) {
    if (gameState !== 'PLAYING' || !monster.group) return;
    const distToPlayer = monster.group.position.distanceTo(player.position);

    monster.twitchTimer += delta * 12;
    monster.group.rotation.y += Math.sin(monster.twitchTimer) * 0.04;

    flickerLight.position.set(player.position.x, 3.0, player.position.z);
    if (Math.random() < 0.04) {
        flickerLight.intensity = 0.15;
    } else {
        flickerLight.intensity = 1.2;
    }

    let moveTarget = monster.targetWaypoint;
    let currentSpeed = currentLevel === 4 ? 1.0 : monster.speed; // 🚨 레벨 4 몬스터 속도는 천천히!

    if (monster.state === 'CHASE' && !player.isHiding) {
        moveTarget = player.position;
        currentSpeed = currentLevel === 4 ? 2.0 : monster.chaseSpeed;
    } else {
        if (monster.group.position.distanceTo(monster.targetWaypoint) < 1.5) {
            const rx = Math.floor(Math.random() * GRID_SIZE) * ROOM_SIZE + ROOM_SIZE / 2;
            const rz = Math.floor(Math.random() * GRID_SIZE) * ROOM_SIZE + ROOM_SIZE / 2;
            monster.targetWaypoint.set(rx, 0, rz);
        }
    }

    const dir = moveTarget.clone().sub(monster.group.position).setY(0).normalize();
    monster.group.position.add(dir.multiplyScalar(currentSpeed * delta));
    monster.group.lookAt(moveTarget.x, 0, moveTarget.z);

    if (!player.isHiding && distToPlayer < 1.3 && !isFallingToReality) gameOver('💥 버려진 사무실 괴물에게 붙잡혔습니다!');
}

function updateMovement(delta) {
    if (player.isHiding || gameState !== 'PLAYING' || isFallingToReality) return;

    let speed = player.speed;
    const isMoving = keys.w || keys.a || keys.s || keys.d;

    if (keys.shift && isMoving && player.stamina > 0) {
        speed *= player.sprintMultiplier;
        player.stamina = Math.max(0, player.stamina - 25 * delta);
    } else {
        if (player.stamina < 100) player.stamina = Math.min(100, player.stamina + 15 * delta);
    }

    const moveDir = new THREE.Vector3();
    if (keys.w) moveDir.z -= 1;
    if (keys.s) moveDir.z += 1;
    if (keys.a) moveDir.x -= 1;
    if (keys.d) moveDir.x += 1;
    moveDir.normalize();
    moveDir.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

    const nextPos = player.position.clone().add(moveDir.multiplyScalar(speed * delta));

    let canMove = true;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(nextPos.x, 1.6, nextPos.z),
        new THREE.Vector3(0.6, 1.8, 0.6)
    );

    for (let wall of wallBoxes) {
        if (wall && wall.box && wall.box.intersectsBox(playerBox)) {
            canMove = false; break;
        }
    }

    if (canMove) {
        player.position.x = nextPos.x; player.position.z = nextPos.z;
    }

    if (isMoving) {
        player.bobbingTime += delta * (keys.shift ? 14 : 9);
        camera.position.y = player.position.y + Math.sin(player.bobbingTime) * 0.05;

        player.stepTimer += delta * (keys.shift ? 2.2 : 1.4);
        if (player.stepTimer >= 1.0) {
            player.stepTimer = 0;
            if (currentLevel === 1) playLevel1Footstep();
            else if (currentLevel === 2) playLevel2WaterFootstep();
            else playLevel1Footstep();
        }
    } else {
        camera.position.y = player.position.y;
        player.stepTimer = 0;
    }

    camera.position.x = player.position.x; camera.position.z = player.position.z;
    camera.rotation.copy(player.rotation);

    flashLight.position.copy(camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    flashLight.target.position.copy(camera.position.clone().add(dir));
}

function updateSurvivalStats(delta) {
    if (gameState !== 'PLAYING' || isFallingToReality) return;

    player.hunger = Math.max(0, player.hunger - 0.7 * delta);
    player.thirst = Math.max(0, player.thirst - 1.0 * delta);

    if (player.hunger <= 0 || player.thirst <= 0) {
        player.health = Math.max(0, player.health - 5 * delta);
        if (hurtVignette) hurtVignette.classList.add('active');
    } else {
        if (hurtVignette) hurtVignette.classList.remove('active');
    }

    if (player.health <= 0) gameOver('💥 기력을 잃고 쓰러졌습니다...');

    if (healthBar) healthBar.style.width = player.health + '%';
    if (staminaBar) staminaBar.style.width = player.stamina + '%';
    if (hungerBar) hungerBar.style.width = player.hunger + '%';
    if (thirstBar) thirstBar.style.width = player.thirst + '%';

    if (healthVal) healthVal.textContent = Math.round(player.health);
    if (staminaVal) staminaVal.textContent = Math.round(player.stamina);
    if (hungerVal) hungerVal.textContent = Math.round(player.hunger);
    if (thirstVal) thirstVal.textContent = Math.round(player.thirst);

    clockSeconds += delta;
    const mins = Math.floor(clockSeconds / 60);
    const secs = Math.floor(clockSeconds % 60);
    if (clockText) clockText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function startFromLevel(lvl) {
    initAudio();
    gameState = 'PLAYING';
    clockSeconds = 0;
    player.health = 100;
    player.stamina = 100;
    player.hunger = 100;
    player.thirst = 100;

    if (startOverlay) startOverlay.classList.add('hidden');
    if (endOverlay) endOverlay.classList.add('hidden');
    if (endingCreditsOverlay) endingCreditsOverlay.classList.add('hidden');
    if (computerTerminalModal) computerTerminalModal.classList.add('hidden');

    if (lvl === 1) loadLevel1();
    else if (lvl === 2) loadLevel2();
    else if (lvl === 3) loadLevel3();
    else if (lvl === 4) loadLevel4();

    document.body.requestPointerLock();
}

function gameOver(msg = '💥 쓰러졌습니다...') {
    gameState = 'GAMEOVER';
    document.exitPointerLock();
    const endTitle = document.getElementById('endTitle');
    const endMsg = document.getElementById('endMessage');
    if (endTitle) endTitle.textContent = '💥 게임 오버';
    if (endMsg) endMsg.textContent = msg;
    checkCheckpointStatus();
    if (endOverlay) endOverlay.classList.remove('hidden');
}

// 🎉 레벨 4 암호 해독 후 현실 세계 복귀 엔딩 크레딧!
function gameWinEnding() {
    gameState = 'WIN';
    document.exitPointerLock();
    playClickSound(1800);
    if (endingCreditsOverlay) endingCreditsOverlay.classList.remove('hidden');
}

if (startBtn) startBtn.addEventListener('click', () => startFromLevel(1));
if (restartBtn) restartBtn.addEventListener('click', () => startFromLevel(1));
if (creditsRestartBtn) creditsRestartBtn.addEventListener('click', () => startFromLevel(1));

if (checkpointStartLvl2Btn) checkpointStartLvl2Btn.addEventListener('click', () => startFromLevel(2));
if (checkpointRestartLvl2Btn) checkpointRestartLvl2Btn.addEventListener('click', () => startFromLevel(2));

if (checkpointStartLvl3Btn) checkpointStartLvl3Btn.addEventListener('click', () => startFromLevel(3));
if (checkpointRestartLvl3Btn) checkpointRestartLvl3Btn.addEventListener('click', () => startFromLevel(3));

if (checkpointStartLvl4Btn) checkpointStartLvl4Btn.addEventListener('click', () => startFromLevel(4));
if (checkpointRestartLvl4Btn) checkpointRestartLvl4Btn.addEventListener('click', () => startFromLevel(4));

init3D();
requestAnimationFrame(animate);
