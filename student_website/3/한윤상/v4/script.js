// --------------------------------------------------
// 백룸 3D 공포 생존 게임 (v4 Engine - 괴물 둔화 & 햄버거/피자/콜라 음식 적용)
// --------------------------------------------------

let scene, camera, renderer;
let flashLight, ambientLight, flickerLight;

// 플레이어 물리 및 상태
const player = {
    height: 1.6,
    speed: 4.2,
    sprintMultiplier: 1.75, // 달리기는 7.35로 괴물(2.4)보다 3배 이상 빠름!
    position: new THREE.Vector3(2, 1.6, 2),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    health: 100,
    stamina: 100,
    hunger: 100,
    thirst: 100,
    isHiding: false,
    isCamcorderOn: false,
    isFlashlightOn: true,
    bobbingTime: 0
};

// 👾 박테리아(Bacteria) 괴물 상태 (v4: 속도 대폭 감소!)
const monster = {
    group: null,
    position: new THREE.Vector3(45, 0, 45),
    targetWaypoint: new THREE.Vector3(45, 0, 45),
    speed: 1.2,       // 배회 속도: 1.2 (매우 엉금엉금)
    chaseSpeed: 2.4,  // 추격 속도: 2.4 (플레이어 걷기 4.2 및 뛰기 7.35보다 훨씬 느림!)
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
let exitDoorMesh = null;

let frameCount = 0;
let fpsLastTime = performance.now();
const fpsDisplay = document.getElementById('fpsDisplay');

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
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// --------------------------------------------------
// 1. 고화질 텍스처 생성기
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

    for (let x = 0; x < 1024; x += 20) {
        const stainHeight = 60 + Math.random() * 80;
        ctx.fillStyle = 'rgba(50, 40, 20, 0.35)';
        ctx.fillRect(x, 1024 - stainHeight, 24, stainHeight);
    }

    ctx.fillStyle = '#181714'; ctx.fillRect(0, 960, 1024, 64);

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
// 2. Web Audio API 오디오 엔진
// --------------------------------------------------
let audioCtx = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer; whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 85; filter.Q.value = 3;

    const buzzGainNode = audioCtx.createGain();
    buzzGainNode.gain.value = 0.08;

    whiteNoise.connect(filter); filter.connect(buzzGainNode); buzzGainNode.connect(audioCtx.destination);
    whiteNoise.start();
}

function playClickSound(freq = 400) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playHeartbeatSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}

// --------------------------------------------------
// 3. THREE.JS 3D 미로 & 현실적 음식 아이템 스폰
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

    buildOptimizedMaze();
    buildBacteriaMonster();

    window.addEventListener('resize', onWindowResize);
}

function buildOptimizedMaze() {
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
            }

            // 현실적인 4가지 아이템 무작위 스폰
            if ((x > 1 || z > 1) && Math.random() < 0.07) spawnRealisticItem(posX, posZ);
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

    const exitGeo = new THREE.BoxGeometry(1.2, 2.4, 0.2);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.6 });
    exitDoorMesh = new THREE.Mesh(exitGeo, exitMat);
    exitDoorMesh.position.set(totalWidth - 4, 1.2, totalWidth - 4);
    scene.add(exitDoorMesh);
}

// 🍔 🍕 🥤 💧 현실적 3D 아이템 모델링 스폰
function spawnRealisticItem(x, z) {
    const roll = Math.floor(Math.random() * 4);
    let group = new THREE.Group();
    let type = '';
    let name = '';

    if (roll === 0) { // 🍔 햄버거
        type = 'burger'; name = '🍔 따끈한 햄버거';
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 });
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.9 });
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 });

        const bunBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), bunMat);
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 12), pattyMat); patty.position.y = 0.045;
        const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.22), cheeseMat); cheese.position.y = 0.07;
        const bunTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 12), bunMat); bunTop.position.y = 0.11;

        group.add(bunBottom, patty, cheese, bunTop);
    } else if (roll === 1) { // 🍕 피자 조각
        type = 'pizza'; name = '🍕 고소한 피자';
        const crustMat = new THREE.MeshStandardMaterial({ color: 0xe09f3e, roughness: 0.6 });
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 });
        const pepMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.5 });

        const base = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 3), cheeseMat);
        base.rotation.x = Math.PI / 2; base.scale.set(1, 1, 0.15);

        const pep1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), pepMat); pep1.position.set(0, 0.02, 0.05);
        const pep2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), pepMat); pep2.position.set(0.05, 0.02, -0.05);

        group.add(base, pep1, pep2);
    } else if (roll === 2) { // 🥤 콜라 캔
        type = 'cola'; name = '🥤 톡 쏘는 콜라';
        const canMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.2, metalness: 0.6 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });

        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), canMat);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12), capMat); cap.position.y = 0.16;

        group.add(can, cap);
    } else { // 💧 아몬드 워터
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
        strand.rotation.z = (Math.random() - 0.5) * 0.2;
        group.add(strand);
    }

    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6);
    const leftArm = new THREE.Mesh(armGeo, blackMat); leftArm.position.set(-0.35, 1.2, 0); leftArm.rotation.z = 0.3; group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, blackMat); rightArm.position.set(0.35, 1.2, 0); rightArm.rotation.z = -0.3; group.add(rightArm);

    const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const head = new THREE.Mesh(headGeo, blackMat); head.position.set(0, 2.3, 0); group.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eye = new THREE.Mesh(eyeGeo, eyeMat); eye.position.set(0, 2.32, 0.15); group.add(eye);

    monster.group = group;
    monster.group.position.copy(monster.position);
    scene.add(monster.group);
}

// --------------------------------------------------
// 4. 이벤트 및 아이템 먹기
// --------------------------------------------------
document.addEventListener('keydown', (e) => {
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
    if (gameState === 'PLAYING' && document.pointerLockElement !== document.body) {
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

    if (player.isHiding) {
        player.isHiding = false;
        rhythm.active = false;
        rhythmGameUI.classList.add('hidden');
        statusMessage.textContent = '은신처에서 나왔습니다.';
        playClickSound(400);
        return;
    }

    for (let w of wallBoxes) {
        if (w.isHollow && player.position.distanceTo(w.pos) < 2.2) {
            player.isHiding = true;
            statusMessage.textContent = '구멍 난 벽에 숨었습니다! [E] 키로 나가기';
            playClickSound(200);
            return;
        }
    }

    // 🍔 🍕 🥤 💧 다양한 현실적 아이템 효능 적용
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (player.position.distanceTo(item.pos) < 1.8) {
            if (item.type === 'burger') {
                player.hunger = Math.min(100, player.hunger + 50);
                player.health = Math.min(100, player.health + 15);
                statusMessage.textContent = '🍔 맛있는 햄버거를 먹었습니다! (+50 배고픔, +15 체력)';
            } else if (item.type === 'pizza') {
                player.hunger = Math.min(100, player.hunger + 45);
                player.health = Math.min(100, player.health + 10);
                statusMessage.textContent = '🍕 피자 조각을 먹었습니다! (+45 배고픔)';
            } else if (item.type === 'cola') {
                player.thirst = Math.min(100, player.thirst + 50);
                player.stamina = Math.min(100, player.stamina + 20);
                statusMessage.textContent = '🥤 톡 쏘는 콜라를 마셨습니다! (+50 목마름, +20 기력)';
            } else if (item.type === 'water') {
                player.thirst = Math.min(100, player.thirst + 40);
                player.health = Math.min(100, player.health + 10);
                statusMessage.textContent = '💧 아몬드 워터를 마셨습니다! (+40 목마름)';
            }

            scene.remove(item.mesh);
            items.splice(i, 1);
            playClickSound(800);
            return;
        }
    }
}

function handleRhythmCheck() {
    if (!rhythm.active) return;

    if (rhythm.pointerPos >= 40 && rhythm.pointerPos <= 60) {
        statusMessage.textContent = '🤫 박테리아 괴물이 무사히 지나쳐갑니다...';
        playClickSound(900);
    } else {
        rhythm.failCount++;
        statusMessage.textContent = '⚠️ 헉! 숨소리를 냈습니다!';
        playClickSound(150);

        if (rhythm.failCount >= 2) {
            player.isHiding = false;
            rhythm.active = false;
            rhythmGameUI.classList.add('hidden');
            monster.state = 'CHASE';
            statusMessage.textContent = '💥 들켰습니다! 괴물이 천천히 다가옵니다!';
        }
    }
}

// --------------------------------------------------
// 5. 둔화된 박테리아 괴물 AI & 루프
// --------------------------------------------------
function updateBacteriaAI(delta) {
    if (gameState !== 'PLAYING' || !monster.group) return;

    const distToPlayer = monster.group.position.distanceTo(player.position);

    monster.twitchTimer += delta * 12;
    monster.group.rotation.y += Math.sin(monster.twitchTimer) * 0.04;

    flickerLight.position.set(player.position.x, 3.0, player.position.z);
    if (Math.random() < 0.05) flickerLight.intensity = 0.2;
    else flickerLight.intensity = 1.2;

    if (player.isHiding && distToPlayer < 7.0) {
        if (!rhythm.active) {
            rhythm.active = true;
            rhythm.failCount = 0;
            rhythmGameUI.classList.remove('hidden');
        }
        playHeartbeatSound();
    } else if (!player.isHiding && rhythm.active) {
        rhythm.active = false;
        rhythmGameUI.classList.add('hidden');
    }

    if (rhythm.active) {
        if (rhythm.movingRight) {
            rhythm.pointerPos += rhythm.speed * delta;
            if (rhythm.pointerPos >= 100) rhythm.movingRight = false;
        } else {
            rhythm.pointerPos -= rhythm.speed * delta;
            if (rhythm.pointerPos <= 0) rhythm.movingRight = true;
        }
        rhythmPointer.style.left = rhythm.pointerPos + '%';
    }

    if (!player.isHiding && distToPlayer < monster.alertDistance) {
        monster.state = 'CHASE';
    }

    let moveTarget = monster.targetWaypoint;
    let currentSpeed = monster.speed;

    if (monster.state === 'CHASE' && !player.isHiding) {
        moveTarget = player.position;
        currentSpeed = monster.chaseSpeed; // 2.4 (느린 추격 속도!)
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

    if (!player.isHiding && distToPlayer < 1.3) {
        gameOver('💥 천천히 다가온 박테리아 괴물에게 붙잡혔습니다!');
    }
}

function updateMovement(delta) {
    if (player.isHiding || gameState !== 'PLAYING') return;

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
        if (wall.box.intersectsBox(playerBox)) {
            canMove = false;
            break;
        }
    }

    if (canMove) {
        player.position.x = nextPos.x;
        player.position.z = nextPos.z;
    }

    if (isMoving) {
        player.bobbingTime += delta * (keys.shift ? 14 : 9);
        camera.position.y = player.position.y + Math.sin(player.bobbingTime) * 0.05;
    } else {
        camera.position.y = player.position.y;
    }

    camera.position.x = player.position.x;
    camera.position.z = player.position.z;
    camera.rotation.copy(player.rotation);

    flashLight.position.copy(camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    flashLight.target.position.copy(camera.position.clone().add(dir));

    if (exitDoorMesh && player.position.distanceTo(exitDoorMesh.position) < 2.0) {
        gameWin();
    }
}

function updateSurvivalStats(delta) {
    if (gameState !== 'PLAYING') return;

    player.hunger = Math.max(0, player.hunger - 0.7 * delta);
    player.thirst = Math.max(0, player.thirst - 1.0 * delta);

    if (player.hunger <= 0 || player.thirst <= 0) {
        player.health = Math.max(0, player.health - 5 * delta);
        hurtVignette.classList.add('active');
    } else {
        hurtVignette.classList.remove('active');
    }

    if (player.health <= 0) gameOver('💥 기력을 잃고 쓰러졌습니다...');

    healthBar.style.width = player.health + '%';
    staminaBar.style.width = player.stamina + '%';
    hungerBar.style.width = player.hunger + '%';
    thirstBar.style.width = player.thirst + '%';

    healthVal.textContent = Math.round(player.health);
    staminaVal.textContent = Math.round(player.stamina);
    hungerVal.textContent = Math.round(player.hunger);
    thirstVal.textContent = Math.round(player.thirst);

    clockSeconds += delta;
    const mins = Math.floor(clockSeconds / 60);
    const secs = Math.floor(clockSeconds % 60);
    clockText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    frameCount++;
    if (currentTime > fpsLastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - fpsLastTime));
        fpsDisplay.textContent = `⚡ ${fps} FPS (최적화됨)`;
        frameCount = 0;
        fpsLastTime = currentTime;
    }

    if (gameState === 'PLAYING') {
        updateMovement(delta);
        updateBacteriaAI(delta);
        updateSurvivalStats(delta);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
    initAudio();
    gameState = 'PLAYING';
    clockSeconds = 0;
    player.health = 100;
    player.stamina = 100;
    player.hunger = 100;
    player.thirst = 100;
    player.position.set(2, 1.6, 2);

    monster.position.set(45, 0, 45);
    if (monster.group) monster.group.position.copy(monster.position);

    startOverlay.classList.add('hidden');
    endOverlay.classList.add('hidden');
    document.body.requestPointerLock();
}

function gameOver(msg = '💥 쓰러졌습니다...') {
    gameState = 'GAMEOVER';
    document.exitPointerLock();
    document.getElementById('endTitle').textContent = '💥 게임 오버';
    document.getElementById('endMessage').textContent = msg;
    endOverlay.classList.remove('hidden');
}

function gameWin() {
    gameState = 'WIN';
    document.exitPointerLock();
    document.getElementById('endTitle').textContent = '🎉 백룸 탈출 성공!';
    document.getElementById('endMessage').textContent = `축하합니다! 무사히 백룸 탈출구를 찾아 빠져나왔습니다! (소요 시간: ${clockText.textContent})`;
    endOverlay.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

init3D();
requestAnimationFrame(animate);
