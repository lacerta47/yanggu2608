// --------------------------------------------------
// 백룸 3D 공포 생존 게임 (Three.js 기반 v1 Engine)
// --------------------------------------------------

// 1. 기본 글로벌 변수 선언
let scene, camera, renderer;
let flashLight, ambientLight;

// 플레이어 물리 & 능력치 변수
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
    hidePos: null,
    isCamcorderOn: false,
    isFlashlightOn: true
};

const keys = { w: false, a: false, s: false, d: false, shift: false };

// 게임 상태
let gameState = 'START'; // START, PLAYING, GAMEOVER, WIN
let clockSeconds = 0;
let lastTime = performance.now();

// 맵 크기 및 물리 콜라이더 배열
const GRID_SIZE = 12;
const ROOM_SIZE = 4.0;
const walls = [];
const items = [];
let exitDoorMesh = null;

// UI 엘리먼트 참조
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

const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// --------------------------------------------------
// 2. 절차적 텍스처 생성기 (Canvas 2D -> THREE.CanvasTexture)
// --------------------------------------------------

// (1) 노란색 젖은 벽지 텍스처
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 노스탤직 노란 벽지 배경
    ctx.fillStyle = '#cca843';
    ctx.fillRect(0, 0, 512, 512);

    // 수직 무늬 패턴
    ctx.fillStyle = 'rgba(160, 125, 35, 0.25)';
    for (let x = 0; x < 512; x += 16) {
        ctx.fillRect(x, 0, 8, 512);
    }

    // 얼룩 및 노이즈
    for (let i = 0; i < 3000; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(100, 70, 20, 0.12)' : 'rgba(230, 200, 100, 0.15)';
        ctx.fillRect(rx, ry, 3, 3);
    }

    // 하단 검은 걸레받이 (Baseboard)
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(0, 480, 512, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// (2) 축축한 카펫 바닥 텍스처
function createCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#6b663b';
    ctx.fillRect(0, 0, 512, 512);

    // 카펫 격자무늬 노이즈
    for (let x = 0; x < 512; x += 4) {
        for (let y = 0; y < 512; y += 4) {
            if ((x + y) % 8 === 0) {
                ctx.fillStyle = 'rgba(40, 40, 20, 0.15)';
                ctx.fillRect(x, y, 4, 4);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE, GRID_SIZE);
    return texture;
}

// (3) 천장 텍스처
function createCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#dcd4b8';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#a89f82';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE, GRID_SIZE);
    return texture;
}

// --------------------------------------------------
// 3. Web Audio API 오디오 효과음 생성기 (외부 파일 없이 작동)
// --------------------------------------------------
let audioCtx = null;
let buzzGainNode = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 백룸 특유의 형광등 웅웅거리는 험(Hum) 사운드
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // 대역통과 필터로 웅웅거림 구현 (60Hz ~ 120Hz)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 90;
    filter.Q.value = 3;

    buzzGainNode = audioCtx.createGain();
    buzzGainNode.gain.value = 0.08;

    whiteNoise.connect(filter);
    filter.connect(buzzGainNode);
    buzzGainNode.connect(audioCtx.destination);
    whiteNoise.start();
}

function playClickSound(freq = 400, type = 'sine') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// --------------------------------------------------
// 4. THREE.JS 3D 씬 및 미로 구축
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
    renderer.shadowMap.enabled = true;

    // 조명 세팅
    ambientLight = new THREE.AmbientLight(0xfff5cc, 0.4);
    scene.add(ambientLight);

    // 플레이어 손전등
    flashLight = new THREE.SpotLight(0xfffae6, 2.5, 18, Math.PI / 6, 0.4, 1);
    flashLight.position.copy(camera.position);
    scene.add(flashLight);
    scene.add(flashLight.target);

    // 맵 생성
    buildBackroomsMap();

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

    // 바닥 Mesh
    const floorGeo = new THREE.PlaneGeometry(totalWidth, totalWidth);
    const floor = new THREE.Mesh(floorGeo, carpetMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(totalWidth / 2, 0, totalWidth / 2);
    scene.add(floor);

    // 천장 Mesh
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(totalWidth / 2, 3.2, totalWidth / 2);
    scene.add(ceiling);

    // 외곽 벽 및 미로 벽 배치
    const wallGeo = new THREE.BoxGeometry(ROOM_SIZE, 3.2, 0.3);

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = x * ROOM_SIZE + ROOM_SIZE / 2;
            const posZ = z * ROOM_SIZE + ROOM_SIZE / 2;

            // 형광등 등기구 배치 (격자마다 간헐적 설치)
            if ((x + z) % 3 === 0) {
                const light = new THREE.PointLight(0xffeaa7, 1.2, 8);
                light.position.set(posX, 3.0, posZ);
                scene.add(light);

                const lightFixtureGeo = new THREE.BoxGeometry(1.2, 0.1, 0.6);
                const lightFixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const fixture = new THREE.Mesh(lightFixtureGeo, lightFixtureMat);
                fixture.position.set(posX, 3.15, posZ);
                scene.add(fixture);
            }

            // 미로 벽 무작위 생성 (시작점 제외)
            if ((x > 1 || z > 1) && Math.random() < 0.3) {
                const isRotated = Math.random() > 0.5;
                const isHollow = Math.random() < 0.25; // 구멍 난 숨기 벽

                const wallMesh = new THREE.Mesh(wallGeo, wallMat);
                wallMesh.position.set(posX, 1.6, posZ);
                if (isRotated) wallMesh.rotation.y = Math.PI / 2;

                scene.add(wallMesh);

                const box = new THREE.Box3().setFromObject(wallMesh);
                walls.push({ box: box, isHollow: isHollow, pos: wallMesh.position });

                // 구멍 난 벽 은신 표시 (어두운 통로 느낌)
                if (isHollow) {
                    const alcoveGeo = new THREE.BoxGeometry(0.8, 1.8, 0.4);
                    const alcoveMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    const alcove = new THREE.Mesh(alcoveGeo, alcoveMat);
                    alcove.position.set(posX, 0.9, posZ);
                    scene.add(alcove);
                }
            }

            // 아이템 스폰 (무작위)
            if ((x > 1 || z > 1) && Math.random() < 0.08) {
                spawnItem(posX, posZ);
            }
        }
    }

    // 외곽 경계 벽 추가
    createBoundaryWalls(totalWidth);

    // 탈출문 스폰 (미로 제일 구석)
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

// 아이템 스폰 (아몬드 워터, 음식)
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

    items.push({
        mesh: mesh,
        type: isWater ? 'water' : 'food',
        pos: mesh.position,
        name: isWater ? '💧 아몬드 워터' : '🍔 생존 빵'
    });
}

// --------------------------------------------------
// 5. 키보드 & 마우스 조작 관리
// --------------------------------------------------
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.shift = true; break;
        case 'KeyE': handleInteract(); break;
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
    if (player.isCamcorderOn) {
        camcorderOverlay.classList.remove('hidden');
    } else {
        camcorderOverlay.classList.add('hidden');
    }
    playClickSound(300);
}

// --------------------------------------------------
// 6. 플레이어 이동 및 상호작용 로직
// --------------------------------------------------
function handleInteract() {
    if (gameState !== 'PLAYING') return;

    // (1) 숨기 기능 켜기/끄기
    if (player.isHiding) {
        player.isHiding = false;
        statusMessage.textContent = '은신처에서 나왔습니다.';
        playClickSound(400);
        return;
    }

    // (2) 가까운 아이템 또는 숨기 벽 확인
    let promptActive = false;

    // 근처 은신처 벽 확인
    for (let w of walls) {
        if (w.isHollow && player.position.distanceTo(w.pos) < 2.0) {
            player.isHiding = true;
            statusMessage.textContent = '구멍 난 벽에 숨었습니다! [E] 키로 나가기';
            playClickSound(200);
            return;
        }
    }

    // 근처 아이템 줍기
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

function checkNearbyPrompts() {
    let near = false;
    for (let item of items) {
        if (player.position.distanceTo(item.pos) < 1.8) {
            promptText.textContent = `[E] ${item.name} 줍기`;
            interactionPrompt.classList.add('active');
            near = true;
            break;
        }
    }

    if (!near) {
        for (let w of walls) {
            if (w.isHollow && player.position.distanceTo(w.pos) < 2.0) {
                promptText.textContent = '[E] 구멍 난 벽에 숨기';
                interactionPrompt.classList.add('active');
                near = true;
                break;
            }
        }
    }

    if (!near) interactionPrompt.classList.remove('active');
}

function updateMovement(delta) {
    if (player.isHiding || gameState !== 'PLAYING') return;

    // 이동 속도 및 스태미나 계산
    let speed = player.speed;
    const isMoving = keys.w || keys.a || keys.s || keys.d;

    if (keys.shift && isMoving && player.stamina > 0) {
        speed *= player.sprintMultiplier;
        player.stamina = Math.max(0, player.stamina - 25 * delta);
    } else {
        if (player.stamina < 100) player.stamina = Math.min(100, player.stamina + 15 * delta);
    }

    // WASD 이동 벡터 계산
    const moveDir = new THREE.Vector3();
    if (keys.w) moveDir.z -= 1;
    if (keys.s) moveDir.z += 1;
    if (keys.a) moveDir.x -= 1;
    if (keys.d) moveDir.x += 1;
    moveDir.normalize();
    moveDir.applyEuler(new THREE.Euler(0, player.rotation.y, 0));

    const nextPos = player.position.clone().add(moveDir.multiplyScalar(speed * delta));

    // 충돌 검사 (벽)
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

    // 카메라 위치 & 시선 반영
    camera.position.copy(player.position);
    camera.rotation.copy(player.rotation);

    // 손전등 시선 추적
    flashLight.position.copy(camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    flashLight.target.position.copy(camera.position.clone().add(dir));

    // 탈출문 도달 검사 (승리 조건)
    if (exitDoorMesh && player.position.distanceTo(exitDoorMesh.position) < 2.0) {
        gameWin();
    }
}

// --------------------------------------------------
// 7. 게임 상태 & 생존 수치 루프
// --------------------------------------------------
function updateSurvivalStats(delta) {
    if (gameState !== 'PLAYING') return;

    // 배고픔 & 목마름 시간에 따라 감소
    player.hunger = Math.max(0, player.hunger - 0.7 * delta);
    player.thirst = Math.max(0, player.thirst - 1.0 * delta);

    // 배고픔이나 목마름이 0이면 체력 감소
    if (player.hunger <= 0 || player.thirst <= 0) {
        player.health = Math.max(0, player.health - 5 * delta);
        hurtVignette.classList.add('active');
    } else {
        hurtVignette.classList.remove('active');
    }

    // 체력 0일 때 게임 오버
    if (player.health <= 0) {
        gameOver();
    }

    // UI 갱신
    healthBar.style.width = player.health + '%';
    staminaBar.style.width = player.stamina + '%';
    hungerBar.style.width = player.hunger + '%';
    thirstBar.style.width = player.thirst + '%';

    healthVal.textContent = Math.round(player.health);
    staminaVal.textContent = Math.round(player.stamina);
    hungerVal.textContent = Math.round(player.hunger);
    thirstVal.textContent = Math.round(player.thirst);

    // 시간 경과 갱신
    clockSeconds += delta;
    const mins = Math.floor(clockSeconds / 60);
    const secs = Math.floor(clockSeconds % 60);
    clockText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// --------------------------------------------------
// 8. 메인 애니메이션 렌더링 루프
// --------------------------------------------------
function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (gameState === 'PLAYING') {
        updateMovement(delta);
        updateSurvivalStats(delta);
        checkNearbyPrompts();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --------------------------------------------------
// 9. 게임 시작 / 종료 처리
// --------------------------------------------------
function startGame() {
    initAudio();
    gameState = 'PLAYING';
    clockSeconds = 0;
    player.health = 100;
    player.stamina = 100;
    player.hunger = 100;
    player.thirst = 100;
    player.position.set(2, 1.6, 2);

    startOverlay.classList.add('hidden');
    endOverlay.classList.add('hidden');
    document.body.requestPointerLock();
}

function gameOver() {
    gameState = 'GAMEOVER';
    document.exitPointerLock();
    document.getElementById('endTitle').textContent = '💥 게임 오버';
    document.getElementById('endMessage').textContent = '미로 속에서 기력을 잃고 쓰러졌습니다...';
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

// 3D 엔진 초기화 및 루프 스타트
init3D();
requestAnimationFrame(animate);
