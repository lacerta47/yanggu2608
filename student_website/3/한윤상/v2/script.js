// --------------------------------------------------
// 백룸 3D 공포 생존 게임 (Three.js 기반 v2 - 괴물 및 숨참기 엔진)
// --------------------------------------------------

let scene, camera, renderer;
let flashLight, ambientLight;

// 플레이어 상태
const player = {
    height: 1.6,
    speed: 4.0,
    sprintMultiplier: 1.7,
    position: new THREE.Vector3(2, 1.6, 2),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    health: 100,
    stamina: 100,
    hunger: 100,
    thirst: 100,
    isHiding: false,
    isCamcorderOn: false,
    isFlashlightOn: true
};

// 괴물 엔티티 상태 (v2 신규)
const monster = {
    mesh: null,
    eyeLight: null,
    position: new THREE.Vector3(20, 1.2, 20),
    targetWaypoint: new THREE.Vector3(20, 1.2, 20),
    speed: 2.2,
    chaseSpeed: 3.8,
    state: 'PATROL', // PATROL, CHASE
    alertDistance: 8.0
};

// 숨참기 미니게임 상태
const rhythm = {
    active: false,
    pointerPos: 0,
    movingRight: true,
    speed: 120,
    failCount: 0
};

const keys = { w: false, a: false, s: false, d: false, shift: false };

let gameState = 'START'; // START, PLAYING, GAMEOVER, WIN
let clockSeconds = 0;
let lastTime = performance.now();

const GRID_SIZE = 12;
const ROOM_SIZE = 4.0;
const walls = [];
const items = [];
let exitDoorMesh = null;

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
// 절차적 텍스처 생성기
// --------------------------------------------------
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cca843'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(160, 125, 35, 0.25)';
    for (let x = 0; x < 512; x += 16) ctx.fillRect(x, 0, 8, 512);

    for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(100, 70, 20, 0.12)' : 'rgba(230, 200, 100, 0.15)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }

    ctx.fillStyle = '#1c1b18'; ctx.fillRect(0, 480, 512, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6b663b'; ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
            if ((x + y) % 8 === 0) {
                ctx.fillStyle = 'rgba(40, 40, 20, 0.15)';
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
    ctx.fillStyle = '#dcd4b8'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#a89f82'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE, GRID_SIZE);
    return texture;
}

// --------------------------------------------------
// Web Audio API 사운드 효과음
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
    filter.type = 'bandpass'; filter.frequency.value = 90; filter.Q.value = 3;

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
    osc.frequency.setValueAtTime(55, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}

// --------------------------------------------------
// THREE.JS 3D 미로 & 괴물 생성
// --------------------------------------------------
function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.06);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.copy(player.position);

    const canvas = document.getElementById('bgCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    ambientLight = new THREE.AmbientLight(0xfff5cc, 0.4);
    scene.add(ambientLight);

    flashLight = new THREE.SpotLight(0xfffae6, 2.5, 18, Math.PI / 6, 0.4, 1);
    flashLight.position.copy(camera.position);
    scene.add(flashLight);
    scene.add(flashLight.target);

    buildBackroomsMap();
    buildMonsterEntity();

    window.addEventListener('resize', onWindowResize);
}

function buildBackroomsMap() {
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

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            if ((x + z) % 3 === 0) {
                const light = new THREE.PointLight(0xffeaa7, 1.2, 8);
                light.position.set(posX, 3.0, posZ);
                scene.add(light);
            }

            if ((x > 1 || z > 1) && Math.random() < 0.3) {
                const isRotated = Math.random() > 0.5;
                const isHollow = Math.random() < 0.25;

                const wallMesh = new THREE.Mesh(wallGeo, wallMat);
                wallMesh.position.set(posX, 1.6, posZ);
                if (isRotated) wallMesh.rotation.y = Math.PI / 2;
                scene.add(wallMesh);

                walls.push({ box: new THREE.Box3().setFromObject(wallMesh), isHollow: isHollow, pos: wallMesh.position });

                if (isHollow) {
                    const alcove = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                    alcove.position.set(posX, 0.9, posZ);
                    scene.add(alcove);
                }
            }

            if ((x > 1 || z > 1) && Math.random() < 0.08) spawnItem(posX, posZ);
        }
    }

    createBoundaryWalls(totalWidth);

    const exitGeo = new THREE.BoxGeometry(1.2, 2.4, 0.2);
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.6 });
    exitDoorMesh = new THREE.Mesh(exitGeo, exitMat);
    exitDoorMesh.position.set(totalWidth - 3, 1.2, totalWidth - 3);
    scene.add(exitDoorMesh);
}

function createBoundaryWalls(size) {
    const wallMat = new THREE.MeshStandardMaterial({ map: createWallTexture() });
    const hWallGeo = new THREE.BoxGeometry(size, 3.2, 0.4);
    const vWallGeo = new THREE.BoxGeometry(0.4, 3.2, size);

    const south = new THREE.Mesh(hWallGeo, wallMat); south.position.set(size / 2, 1.6, 0); scene.add(south);
    walls.push({ box: new THREE.Box3().setFromObject(south) });

    const north = new THREE.Mesh(hWallGeo, wallMat); north.position.set(size / 2, 1.6, size); scene.add(north);
    walls.push({ box: new THREE.Box3().setFromObject(north) });

    const west = new THREE.Mesh(vWallGeo, wallMat); west.position.set(0, 1.6, size / 2); scene.add(west);
    walls.push({ box: new THREE.Box3().setFromObject(west) });

    const east = new THREE.Mesh(vWallGeo, wallMat); east.position.set(size, 1.6, size / 2); scene.add(east);
    walls.push({ box: new THREE.Box3().setFromObject(east) });
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

// 👾 백룸 괴물 (Entity) Mesh 생성
function buildMonsterEntity() {
    const group = new THREE.Group();

    // 괴물 검은 형체 몸통
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 2.2, 8), bodyMat);
    body.position.y = 1.1;
    group.add(body);

    // 붉은 눈빛
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(-0.12, 1.8, 0.3); group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(0.12, 1.8, 0.3); group.add(rightEye);

    monster.eyeLight = new THREE.PointLight(0xef4444, 1.5, 5);
    monster.eyeLight.position.set(0, 1.8, 0.4);
    group.add(monster.eyeLight);

    monster.mesh = group;
    monster.mesh.position.copy(monster.position);
    scene.add(monster.mesh);
}

// --------------------------------------------------
// 키보드 & 숨참기 미니게임
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

    for (let w of walls) {
        if (w.isHollow && player.position.distanceTo(w.pos) < 2.0) {
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

// 숨참기 미니게임 타격 검사
function handleRhythmCheck() {
    if (!rhythm.active) return;

    // 포인터가 40% ~ 60% 하얀 타겟 존 안에 있는지 확인
    if (rhythm.pointerPos >= 40 && rhythm.pointerPos <= 60) {
        statusMessage.textContent = '🤫 숨을 잘 죽이고 있습니다...';
        playClickSound(900);
    } else {
        rhythm.failCount++;
        statusMessage.textContent = '⚠️ 헉! 숨소리가 들릴 뻔했습니다!';
        playClickSound(150);

        if (rhythm.failCount >= 2) {
            player.isHiding = false;
            rhythm.active = false;
            rhythmGameUI.classList.add('hidden');
            monster.state = 'CHASE';
            statusMessage.textContent = '💥 들켰습니다! 괴물이 공격해옵니다!';
        }
    }
}

// --------------------------------------------------
// 괴물 AI 로직 (배회 및 추격)
// --------------------------------------------------
function updateMonsterAI(delta) {
    if (gameState !== 'PLAYING' || !monster.mesh) return;

    const distToPlayer = monster.mesh.position.distanceTo(player.position);

    // 은신처 숨참기 미니게임 트리거
    if (player.isHiding && distToPlayer < 6.0) {
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

    // 미니게임 포인터 이동
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

    // 감지 및 상태 변경
    if (!player.isHiding && distToPlayer < monster.alertDistance) {
        monster.state = 'CHASE';
    }

    // 이동 처리
    let moveTarget = monster.targetWaypoint;
    let currentSpeed = monster.speed;

    if (monster.state === 'CHASE' && !player.isHiding) {
        moveTarget = player.position;
        currentSpeed = monster.chaseSpeed;
    } else {
        if (monster.mesh.position.distanceTo(monster.targetWaypoint) < 1.0) {
            const rx = Math.floor(Math.random() * GRID_SIZE) * ROOM_SIZE + ROOM_SIZE / 2;
            const rz = Math.floor(Math.random() * GRID_SIZE) * ROOM_SIZE + ROOM_SIZE / 2;
            monster.targetWaypoint.set(rx, 1.2, rz);
        }
    }

    const dir = moveTarget.clone().sub(monster.mesh.position).setY(0).normalize();
    monster.mesh.position.add(dir.multiplyScalar(currentSpeed * delta));
    monster.mesh.lookAt(moveTarget.x, 1.2, moveTarget.z);

    // 플레이어 잡힘 (게임 오버)
    if (!player.isHiding && distToPlayer < 1.2) {
        gameOver('💥 괴물에게 잡혔습니다!');
    }
}

// --------------------------------------------------
// 플레이어 이동 및 생존 루프
// --------------------------------------------------
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

    for (let wall of walls) {
        if (wall.box.intersectsBox(playerBox)) {
            canMove = false;
            break;
        }
    }

    if (canMove) {
        player.position.x = nextPos.x;
        player.position.z = nextPos.z;
    }

    camera.position.copy(player.position);
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

    if (gameState === 'PLAYING') {
        updateMovement(delta);
        updateMonsterAI(delta);
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

    monster.position.set(20, 1.2, 20);
    if (monster.mesh) monster.mesh.position.copy(monster.position);

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
