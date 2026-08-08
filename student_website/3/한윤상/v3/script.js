// --------------------------------------------------
// 백룸 3D 공포 생존 게임 (v3 Engine - 초고속 최적화 & 박테리아 괴물)
// --------------------------------------------------

let scene, camera, renderer;
let flashLight, ambientLight, flickerLight;

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
    bobbingTime: 0
};

// 👾 박테리아(Bacteria) 괴물 상태
const monster = {
    group: null,
    position: new THREE.Vector3(45, 0, 45),
    targetWaypoint: new THREE.Vector3(45, 0, 45),
    speed: 2.5,
    chaseSpeed: 4.2,
    state: 'PATROL',
    alertDistance: 12.0,
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

// 🚀 최적화를 위한 24x24 대형 맵 설정 & 인스턴스드 메쉬
const GRID_SIZE = 24; // 24x24 광활한 미로
const ROOM_SIZE = 4.0;
const wallBoxes = [];
const items = [];
let exitDoorMesh = null;

// FPS 측정기 변수
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
// 1. 고화질 리얼리스틱 텍스처 생성기 (1024x1024)
// --------------------------------------------------
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 빈티지 노란 벽지
    ctx.fillStyle = '#cbb048'; ctx.fillRect(0, 0, 1024, 1024);

    // 디테일 수직 스트라이프
    ctx.fillStyle = 'rgba(150, 115, 30, 0.2)';
    for (let x = 0; x < 1024; x += 32) {
        ctx.fillRect(x, 0, 16, 1024);
    }

    // 얼룩 및 노이즈 효과
    for (let i = 0; i < 8000; i++) {
        const rx = Math.random() * 1024;
        const ry = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 60, 15, 0.1)' : 'rgba(235, 205, 110, 0.12)';
        ctx.fillRect(rx, ry, 4, 4);
    }

    // 하단 수분/곰팡이 얼룩 (리얼리스틱 연출)
    for (let x = 0; x < 1024; x += 20) {
        const stainHeight = 60 + Math.random() * 80;
        ctx.fillStyle = 'rgba(50, 40, 20, 0.35)';
        ctx.fillRect(x, 1024 - stainHeight, 24, stainHeight);
    }

    // 검은 몰딩 걸레받이
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
// 3. THREE.JS 3D미로 (InstancedMesh 60FPS 초고속 최적화)
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

    // 플레이어 손전등
    flashLight = new THREE.SpotLight(0xfffae6, 2.8, 22, Math.PI / 5.5, 0.45, 1);
    flashLight.position.copy(camera.position);
    scene.add(flashLight);
    scene.add(flashLight.target);

    // 지직거리는 형광등 조명
    flickerLight = new THREE.PointLight(0xffeaa7, 1.2, 10);
    scene.add(flickerLight);

    buildOptimizedMaze();
    buildBacteriaMonster();

    window.addEventListener('resize', onWindowResize);
}

// ⚡ InstancedMesh로 1,000개 벽을 드로우콜 1개로 합쳐서 최적화!
function buildOptimizedMaze() {
    const wallTex = createWallTexture();
    const carpetTex = createCarpetTexture();
    const ceilingTex = createCeilingTexture();

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.6 });

    const totalWidth = GRID_SIZE * ROOM_SIZE;

    // 바닥 & 천장
    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, carpetMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.2, totalWidth / 2);
    scene.add(ceiling);

    // 미로 지형 인스턴스 배열 계산
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

                // 구멍 난 은신 벽 시각화
                if (isHollow) {
                    const alcove = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                    alcove.position.set(posX, 0.9, posZ);
                    scene.add(alcove);
                }
            }

            if ((x > 1 || z > 1) && Math.random() < 0.05) spawnItem(posX, posZ);
        }
    }

    // 외곽 경계 벽 추가
    const instancedMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallTransforms.length + 4);

    for (let i = 0; i < wallTransforms.length; i++) {
        instancedMesh.setMatrixAt(i, wallTransforms[i].matrix);

        // 물리 충돌 박스 저장
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

    // 탈출문
    const exitGeo = new THREE.BoxGeometry(1.2, 2.4, 0.2);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.6 });
    exitDoorMesh = new THREE.Mesh(exitGeo, exitMat);
    exitDoorMesh.position.set(totalWidth - 4, 1.2, totalWidth - 4);
    scene.add(exitDoorMesh);
}

function spawnItem(x, z) {
    const isWater = Math.random() > 0.5;
    const geo = isWater ? new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12) : new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const mat = new THREE.MeshStandardMaterial({
        color: isWater ? 0x06b6d4 : 0xf97316,
        roughness: 0.3,
        emissive: isWater ? 0x06b6d4 : 0xf97316,
        emissiveIntensity: 0.3
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.2, z);
    scene.add(mesh);
    items.push({ mesh: mesh, type: isWater ? 'water' : 'food', pos: mesh.position, name: isWater ? '💧 아몬드 워터' : '🍔 생존 빵' });
}

// 👾 백룸 Level 0 정통 박테리아(Bacteria) 괴물 3D 모델링
function buildBacteriaMonster() {
    const group = new THREE.Group();
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x08080a });

    // 기괴한 꼬인 케이블 몸체
    for (let i = 0; i < 8; i++) {
        const height = 2.4 + Math.random() * 0.4;
        const strandGeo = new THREE.CylinderGeometry(0.04, 0.04, height, 6);
        const strand = new THREE.Mesh(strandGeo, blackMat);
        strand.position.set((Math.random() - 0.5) * 0.3, height / 2, (Math.random() - 0.5) * 0.3);
        strand.rotation.z = (Math.random() - 0.5) * 0.2;
        group.add(strand);
    }

    // 길게 왜곡된 팔
    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6);
    const leftArm = new THREE.Mesh(armGeo, blackMat); leftArm.position.set(-0.35, 1.2, 0); leftArm.rotation.z = 0.3; group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, blackMat); rightArm.position.set(0.35, 1.2, 0); rightArm.rotation.z = -0.3; group.add(rightArm);

    // 뒤틀린 머리 및 하얀 섬광 눈
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
// 4. 이벤트 및 조작
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

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (player.position.distanceTo(item.pos) < 1.8) {
            if (item.type === 'water') {
                player.thirst = Math.min(100, player.thirst + 40);
                player.health = Math.min(100, player.health + 10);
                statusMessage.textContent = '💧 아몬드 워터를 마셨습니다! (+40 목마름)';
            } else {
                player.hunger = Math.min(100, player.hunger + 40);
                player.health = Math.min(100, player.health + 10);
                statusMessage.textContent = '🍔 생존 빵을 먹었습니다! (+40 배고픔)';
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
        statusMessage.textContent = '🤫 박테리아 괴물이 그냥 지나갑니다...';
        playClickSound(900);
    } else {
        rhythm.failCount++;
        statusMessage.textContent = '⚠️ 헉! 거친 숨소리를 냈습니다!';
        playClickSound(150);

        if (rhythm.failCount >= 2) {
            player.isHiding = false;
            rhythm.active = false;
            rhythmGameUI.classList.add('hidden');
            monster.state = 'CHASE';
            statusMessage.textContent = '💥 박테리아 괴물에게 위치를 들켰습니다!';
        }
    }
}

// --------------------------------------------------
// 5. 박테리아 괴물 AI & 헤드보빙 물리
// --------------------------------------------------
function updateBacteriaAI(delta) {
    if (gameState !== 'PLAYING' || !monster.group) return;

    const distToPlayer = monster.group.position.distanceTo(player.position);

    // 박테리아 괴물 기괴한 떨림 애니메이션
    monster.twitchTimer += delta * 15;
    monster.group.rotation.y += Math.sin(monster.twitchTimer) * 0.05;

    // 형광등 깜빡임 효과 (플레이어 근처)
    flickerLight.position.set(player.position.x, 3.0, player.position.z);
    if (Math.random() < 0.05) {
        flickerLight.intensity = 0.2;
    } else {
        flickerLight.intensity = 1.2;
    }

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
        currentSpeed = monster.chaseSpeed;
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
        gameOver('💥 박테리아 괴물에게 붙잡혔습니다!');
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

    // 걸을 때 카메라 헤드보빙 (리얼리스틱 물리 연출)
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

// 60FPS 애니메이션 루프 및 FPS 모니터링
function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    // FPS 카운터 계산
    frameCount++;
    if (currentTime > fpsLastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - fpsLastTime));
        fpsDisplay.textContent = `⚡ ${fps} FPS (초고속 최적화됨)`;
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
