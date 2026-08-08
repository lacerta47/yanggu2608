// -------------------------------------------------------------
// 3D 1인칭 용사의 모험 RPG v31 Engine
// (체력 0 즉시 사망 & 명예의 모험 결과창 시스템)
// -------------------------------------------------------------

// DOM UI 요소
const playerLevelSpan = document.getElementById('player-level');
const hpBarFill = document.getElementById('hp-bar');
const hpTextSpan = document.getElementById('hp-text');
const playerDamageSpan = document.getElementById('player-damage');
const playerCoinsSpan = document.getElementById('player-coins');
const expBarFill = document.getElementById('exp-bar');
const expTextSpan = document.getElementById('exp-text');
const shiftLockStatusSpan = document.getElementById('shift-lock-status');
const locationNameSpan = document.getElementById('location-name');
const questDescriptionSpan = document.getElementById('quest-description');

const startOverlay = document.getElementById('start-overlay');
const dialogueModal = document.getElementById('dialogue-modal');
const resultOverlay = document.getElementById('result-overlay');
const levelUpToast = document.getElementById('level-up-toast');

const voidWarningPrompt = document.getElementById('void-warning-prompt');
const npcProximityPrompt = document.getElementById('npc-proximity-prompt');
const proximityNpcText = document.getElementById('proximity-npc-text');
const deathCauseText = document.getElementById('death-cause-text');

const btnStartGame = document.getElementById('btn-start-game');
const btnFinishGame = document.getElementById('btn-finish-game');
const btnRestartGame = document.getElementById('btn-restart-game');

const btnQuickForge = document.getElementById('btn-quick-forge');
const btnFooterForge = document.getElementById('btn-footer-forge');

const npcAvatar = document.getElementById('npc-avatar');
const npcName = document.getElementById('npc-name');
const npcRole = document.getElementById('npc-role-tag');
const dialogueStory = document.getElementById('dialogue-story');
const dialogueText = document.getElementById('dialogue-text');
const btnAcceptQuest = document.getElementById('btn-accept-quest');
const btnCloseDialogue = document.getElementById('btn-close-dialogue');

// 🔨 대장간 강화 패널 요소
const forgePanel = document.getElementById('forge-panel');
const forgeCurrentDamageSpan = document.getElementById('forge-current-damage');
const forgeCostTextSpan = document.getElementById('forge-cost-text');
const forgeResultMsg = document.getElementById('forge-result-msg');
const btnForgeWeapon = document.getElementById('btn-forge-weapon');

const resultLevelSpan = document.getElementById('result-level');
const resultMaxHpSpan = document.getElementById('result-max-hp');
const resultMonstersSpan = document.getElementById('result-monsters');
const resultCoinsSpan = document.getElementById('result-coins');

const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnTalk = document.getElementById('btn-talk');
const btnShiftLock = document.getElementById('btn-shift-lock');
const btnAttack = document.getElementById('btn-attack');

// 게임 수치
let gameState = 'START';
let currentMap = 'VILLAGE';

let level = 1;
let hp = 150;
let maxHp = 150;
let lastRenderedHp = 150;
let exp = 0;
const targetExp = 100;
let swordDamage = 10;

// 💰 시작 코인 300코인
let coins = 300;
let totalCoinsEarned = 300;
let monstersSlain = 0;
let questsCompletedCount = 0;

// 📏 용사 키 높이 (2.5)
const PLAYER_HEIGHT = 2.5;

// 🔨 칼 강화 상태 (첫 강화 30코인)
let forgeAttempts = 0;
function getForgeCost() {
    return 30 + (forgeAttempts * 10);
}

const ATTACK_RANGE = 7.0;
const AGGRO_RANGE = 14.0;

// 쉬프트락 및 터치 드래그 변수
let isShiftLocked = false;
let isPointerDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;
let yaw = 0;
let pitch = 0;

// 산 정상 최초 등반 알림 플래그
let hasCelebratedSummit = false;

// 오디오 사운드
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
    }
}

function playCustomSound(type) {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'ching') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'fall') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'bbyong') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(1050, now + 0.16);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'yap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.08);
            osc.frequency.setValueAtTime(800, now + 0.16);
            osc.frequency.setValueAtTime(1200, now + 0.24);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'door') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(560, now + 0.15);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'hit') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.setValueAtTime(440, now + 0.1);
            osc.frequency.setValueAtTime(660, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(990, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch (e) {}
}

// -------------------------------------------------------------
// 3D 스프라이트 유틸리티
// -------------------------------------------------------------
function createNpcNameSprite(nameText) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.font = 'Bold 18px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffd32a';
    ctx.textAlign = 'center';
    ctx.fillText('💬 [터치/Space] 대화', 128, 24);

    ctx.font = 'Bold 22px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, 128, 58);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.0, 1);
    return sprite;
}

function updateNpcChatBubble(npc, messageText = '') {
    if (!npc.bubbleCanvas) {
        npc.bubbleCanvas = document.createElement('canvas');
        npc.bubbleCanvas.width = 300;
        npc.bubbleCanvas.height = 90;
        npc.bubbleTexture = new THREE.CanvasTexture(npc.bubbleCanvas);
        const mat = new THREE.SpriteMaterial({ map: npc.bubbleTexture, depthTest: false });
        npc.bubbleSprite = new THREE.Sprite(mat);
        npc.bubbleSprite.scale.set(3.8, 1.15, 1);
        npc.bubbleSprite.position.set(0, 3.2, 0);
        npc.mesh.add(npc.bubbleSprite);
    }

    const canvas = npc.bubbleCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (messageText) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 280, 70, 16);
        ctx.fill();
        ctx.strokeStyle = '#2ed573';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = 'Bold 20px "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#1e272e';
        ctx.textAlign = 'center';
        ctx.fillText(messageText, 150, 52);
        npc.bubbleSprite.visible = true;
    } else {
        npc.bubbleSprite.visible = false;
    }

    npc.bubbleTexture.needsUpdate = true;
}

function createTagSprite(tagText, colorStr = '#2ed573') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = 'Bold 20px "Noto Sans KR", sans-serif';
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.fillText(tagText, 128, 38);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.8, 1.0, 1);
    return sprite;
}

function updateMonsterHpSprite(m) {
    if (!m.hpSpriteCanvas) {
        m.hpSpriteCanvas = document.createElement('canvas');
        m.hpSpriteCanvas.width = 256;
        m.hpSpriteCanvas.height = 96;
        m.hpTexture = new THREE.CanvasTexture(m.hpSpriteCanvas);
        const spriteMat = new THREE.SpriteMaterial({ map: m.hpTexture, depthTest: false });
        m.hpSprite = new THREE.Sprite(spriteMat);
        m.hpSprite.scale.set(3.6, 1.35, 1);
        m.mesh.add(m.hpSprite);
        m.hpSprite.position.set(0, 2.5, 0);
    }

    const canvas = m.hpSpriteCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'Bold 19px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ff7675';
    ctx.textAlign = 'center';
    ctx.fillText(`[Lv.${level}] ${m.baseName} (⚔️${m.touchDmg})`, 128, 24);

    ctx.fillStyle = '#000000';
    ctx.fillRect(28, 42, 200, 20);

    const ratio = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = ratio > 0.4 ? '#2ed573' : '#ff7675';
    ctx.fillRect(30, 44, 196 * ratio, 16);

    ctx.font = 'Bold 13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.ceil(m.hp)} / ${m.maxHp}`, 128, 57);

    m.hpTexture.needsUpdate = true;
}

// -------------------------------------------------------------
// THREE.JS 3D WebGL 1인칭 엔진
// -------------------------------------------------------------
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(65, 900 / 500, 0.1, 1400);
camera.rotation.order = 'YXZ';
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(900, 500);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

function onResize() {
    const w = container.clientWidth || 900;
    const h = container.clientHeight || 500;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);
setTimeout(onResize, 100);

// 조명
const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.set(30, 60, 30);
scene.add(dirLight);

// 1인칭 용사의 칼 (FPS 뷰모델)
const fpSwordGroup = new THREE.Group();
const bladeGeo = new THREE.BoxGeometry(0.08, 0.9, 0.04);
const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2ed573, metalness: 0.8, roughness: 0.2, emissive: 0x2ed573, emissiveIntensity: 0.4 });
const blade = new THREE.Mesh(bladeGeo, bladeMat);
blade.position.set(0, 0.45, 0);
fpSwordGroup.add(blade);

const guardGeo = new THREE.BoxGeometry(0.28, 0.05, 0.08);
const guardMat = new THREE.MeshStandardMaterial({ color: 0xffd32a, metalness: 0.8, roughness: 0.3 });
const guard = new THREE.Mesh(guardGeo, guardMat);
guard.position.set(0, 0, 0);
fpSwordGroup.add(guard);

const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8);
const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const handle = new THREE.Mesh(handleGeo, handleMat);
handle.position.set(0, -0.15, 0);
fpSwordGroup.add(handle);

fpSwordGroup.position.set(0.45, -0.38, -0.7);
fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
camera.add(fpSwordGroup);

function updateSwordVisuals() {
    if (swordDamage >= 30) {
        bladeMat.color.setHex(0xff7675);
        bladeMat.emissive.setHex(0xff7675);
        bladeMat.emissiveIntensity = 0.8;
    } else if (swordDamage >= 20) {
        bladeMat.color.setHex(0xffd32a);
        bladeMat.emissive.setHex(0xffd32a);
        bladeMat.emissiveIntensity = 0.7;
    } else if (swordDamage >= 15) {
        bladeMat.color.setHex(0x0984e3);
        bladeMat.emissive.setHex(0x0984e3);
        bladeMat.emissiveIntensity = 0.5;
    }
}

// 플레이어 물리 좌표
const player3D = {
    x: -14,
    z: 0,
    baseSpeed: 0.18,
    runSpeed: 0.28,
    isAttacking: false,
    attackTimer: 0
};

// 맵 씬 그룹
const villageGroup = new THREE.Group();
const blacksmithInteriorGroup = new THREE.Group();
const forestGroup = new THREE.Group();

scene.add(villageGroup);
scene.add(blacksmithInteriorGroup);
scene.add(forestGroup);

blacksmithInteriorGroup.visible = false;
forestGroup.visible = false;

// -------------------------------------------------------------
// ⛰️ 3개의 언덕 및 🏔️ 2개의 거대한 산맥 지형 데이터 & 실시간 등반 높이 계산기
// -------------------------------------------------------------
const hillsData = [
    { x: 45, z: 25, radius: 26, height: 7.5, color: 0x7bed9f, name: '동쪽 연두 언덕' },
    { x: -45, z: -30, radius: 22, height: 6.0, color: 0x2ed573, name: '서쪽 초록 언덕' },
    { x: 10, z: -55, radius: 18, height: 4.5, color: 0x20bf6b, name: '남쪽 에메랄드 언덕' }
];

const mountainsData = [
    { x: 95, z: -65, radius: 42, height: 26.0, rockColor: 0x4b6584, name: '북동 대산맥' },
    { x: -95, z: 60, radius: 38, height: 22.0, rockColor: 0x57606f, name: '북서 산봉우리' }
];

// ⛰️ [핵심] 숲속 전체 지형(언덕 3개 + 거대한 산 2개) 등반 높이 맵 계산 함수
function getForestTerrainElevation(x, z) {
    let maxElevation = 0;

    // 1. 언덕 3개 높이
    for (let i = 0; i < hillsData.length; i++) {
        const h = hillsData[i];
        const dist = Math.hypot(x - h.x, z - h.z);
        if (dist < h.radius) {
            const elev = Math.cos((dist / h.radius) * (Math.PI / 2)) * h.height;
            if (elev > maxElevation) maxElevation = elev;
        }
    }

    // 2. 거대한 산 2개 등산 높이 (산기슭부터 정상까지 최대 26m까지 걸어서 등반!)
    for (let j = 0; j < mountainsData.length; j++) {
        const m = mountainsData[j];
        const dist = Math.hypot(x - m.x, z - m.z);
        if (dist < m.radius) {
            const ratio = 1 - (dist / m.radius);
            const elev = Math.pow(ratio, 1.15) * m.height;
            if (elev > maxElevation) maxElevation = elev;
        }
    }

    return maxElevation;
}

// -------------------------------------------------------------
// ☁️ 둥실둥실 몽실몽실 3D 뭉게구름 (Fluffy 3D Clouds Generator)
// -------------------------------------------------------------
const cloudsList = [];

function createFluffyCloudMesh(scaleRatio = 1.0) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        transparent: true,
        opacity: 0.90
    });

    const puffs = [
        { x: 0, y: 0, z: 0, r: 3.2 * scaleRatio },
        { x: 2.2 * scaleRatio, y: -0.4 * scaleRatio, z: 0.5 * scaleRatio, r: 2.4 * scaleRatio },
        { x: -2.2 * scaleRatio, y: -0.3 * scaleRatio, z: -0.4 * scaleRatio, r: 2.5 * scaleRatio },
        { x: 1.2 * scaleRatio, y: 1.0 * scaleRatio, z: -0.6 * scaleRatio, r: 2.2 * scaleRatio },
        { x: -1.0 * scaleRatio, y: 0.9 * scaleRatio, z: 0.6 * scaleRatio, r: 2.3 * scaleRatio },
        { x: 0, y: 0.5 * scaleRatio, z: 1.8 * scaleRatio, r: 2.0 * scaleRatio }
    ];

    puffs.forEach(p => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(p.r, 14, 14), cloudMat);
        puff.position.set(p.x, p.y, p.z);
        cloudGroup.add(puff);
    });

    return cloudGroup;
}

// 숲 하늘(높이 28~45m) 및 산맥 정상 주변(높이 18~28m)에 24개의 뭉게구름 배치
for (let c = 0; c < 24; c++) {
    const cScale = 0.85 + Math.random() * 0.7;
    const cloudMesh = createFluffyCloudMesh(cScale);

    let cx, cy, cz;
    if (c < 8) {
        cx = 95 + (Math.random() - 0.5) * 50;
        cz = -65 + (Math.random() - 0.5) * 50;
        cy = 18 + Math.random() * 12;
    } else if (c < 14) {
        cx = -95 + (Math.random() - 0.5) * 45;
        cz = 60 + (Math.random() - 0.5) * 45;
        cy = 16 + Math.random() * 10;
    } else {
        cx = (Math.random() - 0.5) * 260;
        cz = (Math.random() - 0.5) * 160;
        cy = 28 + Math.random() * 16;
    }

    cloudMesh.position.set(cx, cy, cz);
    forestGroup.add(cloudMesh);

    cloudsList.push({
        mesh: cloudMesh,
        speed: 0.015 + Math.random() * 0.02,
        baseY: cy,
        bobPhase: Math.random() * Math.PI * 2
    });
}

// 🐣 초롱초롱 큰 눈망울 & 발그레 핑크 볼터치 헬퍼 함수
function addCuteBigEyesAndBlush(parentGroup, eyeY, eyeZ, eyeSpacing = 0.18, eyeSize = 0.11) {
    const eyeWhiteGeo = new THREE.SphereGeometry(eyeSize, 14, 14);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    
    const pupilGeo = new THREE.SphereGeometry(eyeSize * 0.65, 14, 14);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e272e });

    const sparkleGeo1 = new THREE.SphereGeometry(eyeSize * 0.25, 8, 8);
    const sparkleGeo2 = new THREE.SphereGeometry(eyeSize * 0.15, 8, 8);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let s = -1; s <= 1; s += 2) {
        const eyeW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eyeW.position.set(s * eyeSpacing, eyeY, eyeZ);
        parentGroup.add(eyeW);

        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(s * eyeSpacing, eyeY, eyeZ + eyeSize * 0.55);
        parentGroup.add(pupil);

        const sp1 = new THREE.Mesh(sparkleGeo1, sparkleMat);
        sp1.position.set(s * eyeSpacing - eyeSize * 0.2, eyeY + eyeSize * 0.22, eyeZ + eyeSize * 0.9);
        parentGroup.add(sp1);

        const sp2 = new THREE.Mesh(sparkleGeo2, sparkleMat);
        sp2.position.set(s * eyeSpacing + eyeSize * 0.15, eyeY - eyeSize * 0.15, eyeZ + eyeSize * 0.9);
        parentGroup.add(sp2);

        // 💖 발그레 핑크 볼터치
        const blush = new THREE.Mesh(
            new THREE.SphereGeometry(eyeSize * 0.55, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xff7675 })
        );
        blush.scale.set(1.2, 0.6, 0.4);
        blush.position.set(s * (eyeSpacing + eyeSize * 0.85), eyeY - eyeSize * 0.55, eyeZ + eyeSize * 0.4);
        parentGroup.add(blush);
    }
}

// -------------------------------------------------------------
// 🏡 3D 평화로운 마을 맵 (Map 1)
// -------------------------------------------------------------
const villageFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 26),
    new THREE.MeshStandardMaterial({ color: 0x2ed573, roughness: 0.8 })
);
villageFloor.rotation.x = -Math.PI / 2;
villageGroup.add(villageFloor);

const villagePath = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 4),
    new THREE.MeshStandardMaterial({ color: 0xa4b0be, roughness: 0.6 })
);
villagePath.rotation.x = -Math.PI / 2;
villagePath.position.y = 0.02;
villageGroup.add(villagePath);

const bsExterior = new THREE.Group();
const bsWalls = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.7 })
);
bsWalls.position.y = 2.25;
bsExterior.add(bsWalls);

const bsRoof = new THREE.Mesh(
    new THREE.ConeGeometry(5.2, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0xff7675, roughness: 0.5 })
);
bsRoof.position.y = 5.75;
bsRoof.rotation.y = Math.PI / 4;
bsExterior.add(bsRoof);

const bsSign = createTagSprite('⚒️ 3D 대장간 (칼 강화소)', '#ffd32a');
bsSign.position.set(0, 5.0, 3.2);
bsExterior.add(bsSign);

bsExterior.position.set(0, 0, -6.5);
villageGroup.add(bsExterior);

// 숲 게이트
const forestGate = new THREE.Group();
const gatePillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x20bf6b }));
gatePillar1.position.set(-2.5, 2.5, 0);
forestGate.add(gatePillar1);

const gatePillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x20bf6b }));
gatePillar2.position.set(2.5, 2.5, 0);
forestGate.add(gatePillar2);

const gateTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x7bed9f }));
gateTop.position.set(0, 5.2, 0);
forestGate.add(gateTop);

const gateTag = createTagSprite('🌲 [Space] 구름 숲 & 산맥 등산', '#2ed573');
gateTag.position.set(0, 6.2, 0);
forestGate.add(gateTag);

forestGate.position.set(20, 0, 0);
villageGroup.add(forestGate);

// 🚶 마을 주민들
const npcsVillage = [
    { 
        id: 'villager0', 
        name: '이장님 성민', 
        role: '마을 이장', 
        avatar: '👴', 
        x: -12, 
        z: 0, 
        originX: -12,
        originZ: 0,
        patrolRadius: 5,
        color: 0xf39c12, 
        hatColor: 0xd35400,
        story: "허허, 어서오게 젊은 용사여!\n하늘 위로 둥실둥실 떠다니는 솜사탕 뭉게구름이 보이는가?\n체력이 다 닳지 않도록 조심하며 대산맥 꼭대기까지 신나게 등산해보게나!",
        chatLines: ["허허, 뭉게구름이 둥실둥실 흘러가는구려~", "주희 양, 구름이 솜사탕 같구려!", "민우야, 체력 안 닳게 조심하렴!", "철수 자네 망치 소리가 구름까지 울리는군!"],
        quest: { title: "이장님의 청부", desc: "아기 몬스터 2마리와 놀아주기 (진행: 0/2)", targetType: "kill", targetCount: 2, rewardExp: 50, active: false, completed: false } 
    },
    { 
        id: 'villager1', 
        name: '약초꾼 주희', 
        role: '마을 주민', 
        avatar: '👩‍🌾', 
        x: -6, 
        z: 0, 
        originX: -6,
        originZ: 0,
        patrolRadius: 4,
        color: 0x2ecc71, 
        hatColor: 0x27ae60,
        story: "안녕하세요 용사님! 체력이 0이 되면 쓰러져 휴식을 취하게 되니 항상 조심하세요!\n300코인으로 칼을 단련해서 몽실 구름 가득한 산맥으로 떠나보세요!",
        chatLines: ["하얀 구름이 머리 위로 지나가요!", "이장님, 구름이 참 예뻐요~", "영희 씨, 구름 아래로 마을이 보여요!"],
        quest: { title: "약초밭 지키기", desc: "아기 몬스터 4마리와 놀아주기 (진행: 0/4)", targetType: "kill", targetCount: 4, rewardExp: 60, active: false, completed: false } 
    },
    { 
        id: 'villager3', 
        name: '꼬마 민우', 
        role: '마을 주민', 
        avatar: '👦', 
        x: 6, 
        z: 0, 
        originX: 6,
        originZ: 0,
        patrolRadius: 5,
        color: 0xff7675, 
        hatColor: 0xd63031,
        story: "와! 하늘에 몽실몽실 뭉게구름이 떠다녀요!\n형, 체력 떨어지면 결과창으로 이동하니까 몬스터 펀치를 조심해요!",
        chatLines: ["구름 타고 하늘을 날고 싶어요!", "한스 아저씨, 구름 잡으러 가요!", "와아~ 구름이 둥실둥실 움직여요!"],
        quest: { title: "숲속 탐험", desc: "뭉게구름 숲과 산꼭대기를 탐험하기", targetType: "explore", rewardExp: 30, active: false, completed: false } 
    },
    { 
        id: 'villager4', 
        name: '정원사 영희', 
        role: '마을 주민', 
        avatar: '👩', 
        x: 10, 
        z: 0, 
        originX: 10,
        originZ: 0,
        patrolRadius: 4,
        color: 0x9b59b6, 
        hatColor: 0x8e44ad,
        story: "안녕하세요! 파란 하늘 아래 뭉게구름이 숲과 연못에 부드러운 그늘을 만들어줘요.\n반짝이는 칼로 구름 숲속 30마리 아기 몬스터들과 신나게 모험해 보세요!",
        chatLines: ["구름 그늘 아래 꽃들이 싱그러워요~", "주희 씨, 구름 냄새가 포근해요!", "마을과 하늘이 하얀 구름으로 가득해요~"],
        quest: { title: "장미밭 구하기", desc: "아기 몬스터 6마리와 놀아주기 (진행: 0/6)", targetType: "kill", targetCount: 6, rewardExp: 80, active: false, completed: false } 
    },
    { 
        id: 'villager5', 
        name: '모험가 한스', 
        role: '마을 주민', 
        avatar: '🧙‍♂️', 
        x: 14, 
        z: 0, 
        originX: 14,
        originZ: 0,
        patrolRadius: 4,
        color: 0x3498db, 
        hatColor: 0x2980b9,
        story: "반갑네 젊은 용사여! 대산맥 꼭대기에 올라 숲 전체를 조망해보게나!\n혹시 체력이 다 닳더라도 결과창에서 언제든 풀피로 다시 도전할 수 있네!",
        chatLines: ["구름 위에서 내려다보는 세상은 눈부시지...", "민우야, 절벽 근처 구름은 조심하렴!", "대장장이 철수 칼솜씨는 여전히 최고야."],
        quest: { title: "진정한 용사의 길", desc: "Lv.3 도달하기", targetType: "level", targetLevel: 3, rewardExp: 100, active: false, completed: false } 
    }
];

npcsVillage.forEach(npc => {
    const npcGroup = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.48, 1.2, 14),
        new THREE.MeshStandardMaterial({ color: npc.color, roughness: 0.5 })
    );
    body.position.y = 0.6;
    npcGroup.add(body);

    const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 0.12, 14),
        new THREE.MeshStandardMaterial({ color: 0x2d3436 })
    );
    belt.position.y = 0.55;
    npcGroup.add(belt);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.3 })
    );
    head.position.y = 1.45;
    npcGroup.add(head);

    addCuteBigEyesAndBlush(npcGroup, 1.5, 0.38, 0.14, 0.08);

    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: 0xf5cd79 })
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.42, 0.43);
    npcGroup.add(nose);

    const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 0.4, 14),
        new THREE.MeshStandardMaterial({ color: npc.hatColor, roughness: 0.4 })
    );
    hat.position.y = 1.8;
    npcGroup.add(hat);

    for (let s = -1; s <= 1; s += 2) {
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8),
            new THREE.MeshStandardMaterial({ color: npc.color })
        );
        arm.position.set(s * 0.55, 0.7, 0);
        arm.rotation.z = s * 0.2;
        npcGroup.add(arm);
    }

    npcGroup.position.set(npc.x, 0, npc.z);

    const nameSprite = createNpcNameSprite(`${npc.avatar} ${npc.name}`);
    nameSprite.position.set(0, 2.3, 0);
    npcGroup.add(nameSprite);

    villageGroup.add(npcGroup);
    npc.mesh = npcGroup;
    npc.targetX = npc.originX;
    npc.targetZ = npc.originZ;
    npc.patrolTimer = Math.floor(Math.random() * 80);
    npc.isTalkingWithNpc = false;
    npc.chatTimer = 0;
});

// -------------------------------------------------------------
// ⚒️ 3D 대장간 건물 내부 맵 (Map 2)
// -------------------------------------------------------------
const bsFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ color: 0x2f3542, roughness: 0.7 })
);
bsFloor.rotation.x = -Math.PI / 2;
blacksmithInteriorGroup.add(bsFloor);

function createWall(w, h, d, x, y, z) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.6 })
    );
    wall.position.set(x, y, z);
    blacksmithInteriorGroup.add(wall);
}
createWall(18, 6, 0.5, 0, 3, -9);
createWall(0.5, 6, 18, -9, 3, 0);
createWall(0.5, 6, 18, 9, 3, 0);

// 용광로
const forgeStoneGroup = new THREE.Group();
const forgeBase = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 2.6, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
);
forgeBase.position.set(0, 1.3, 0);
forgeStoneGroup.add(forgeBase);

const forgeCore = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2ed573, emissive: 0x2ed573, emissiveIntensity: 0.9 })
);
forgeCore.position.set(0, 1.3, 0.7);
forgeStoneGroup.add(forgeCore);

const forgeLight = new THREE.PointLight(0x2ed573, 2.5, 10);
forgeLight.position.set(0, 2.0, 1.0);
forgeStoneGroup.add(forgeLight);

forgeStoneGroup.position.set(-5.5, 0, -7);
blacksmithInteriorGroup.add(forgeStoneGroup);

// 모루 작업대
const workTableGroup = new THREE.Group();
const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.35, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x747d8c })
);
tableTop.position.set(0, 1.1, 0);
workTableGroup.add(tableTop);

for (let lx = -1.8; lx <= 1.8; lx += 3.6) {
    for (let lz = -0.8; lz <= 0.8; lz += 1.6) {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 1.1, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x2f3542 })
        );
        leg.position.set(lx, 0.55, lz);
        workTableGroup.add(leg);
    }
}

const anvilMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x1e272e, metalness: 0.95 })
);
anvilMesh.position.set(-0.5, 1.45, 0);
workTableGroup.add(anvilMesh);

workTableGroup.position.set(0, 0, -3.5);
blacksmithInteriorGroup.add(workTableGroup);

const exitDoorTag = createTagSprite('🚪 [Space] 마을로 나가기', '#ffd32a');
exitDoorTag.position.set(0, 2.2, 7.5);
blacksmithInteriorGroup.add(exitDoorTag);

// 🧔 대장장이 철수 NPC
const blacksmithNpc = {
    id: 'villager2',
    name: '대장장이 철수',
    role: '3D 대장간 장인',
    avatar: '🧔',
    x: 1.8,
    z: -3.5,
    color: 0xe67e22,
    story: "따뜻한 대장간에 잘 왔네 용사여!\n300코인으로 칼을 단련하면 체력을 지키며 몬스터들을 빠르게 물리칠 수 있네!\n첫 강화 비용은 30코인이며, 성공 확률이 75%로 아주 높다네!",
    quest: { title: "칼 단련 시험", desc: "Lv.2 도달하기", targetType: "level", targetLevel: 2, rewardExp: 40, active: false, completed: false }
};

const blacksmithGroup = new THREE.Group();
const bsBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.55, 1.3, 14),
    new THREE.MeshStandardMaterial({ color: blacksmithNpc.color })
);
bsBody.position.y = 0.65;
blacksmithGroup.add(bsBody);

const bsApron = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.85, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
);
bsApron.position.set(0, 0.65, 0.5);
blacksmithGroup.add(bsApron);

const bsHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdfba })
);
bsHead.position.y = 1.5;
blacksmithGroup.add(bsHead);

addCuteBigEyesAndBlush(blacksmithGroup, 1.55, 0.4, 0.15, 0.08);

const bsBeard = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.25, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x4b4b4b })
);
bsBeard.position.set(0, 1.32, 0.42);
blacksmithGroup.add(bsBeard);

const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x57606f }));
hammerHandle.position.set(0.65, 0.7, 0.2);
hammerHandle.rotation.x = Math.PI / 4;
blacksmithGroup.add(hammerHandle);

const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x2f3542, metalness: 0.9 }));
hammerHead.position.set(0.65, 0.95, 0.45);
blacksmithGroup.add(hammerHead);

blacksmithGroup.position.set(blacksmithNpc.x, 0, blacksmithNpc.z);

const bsNameSprite = createNpcNameSprite(`🧔 대장장이 철수`);
bsNameSprite.position.set(0, 2.3, 0);
blacksmithGroup.add(bsNameSprite);

blacksmithInteriorGroup.add(blacksmithGroup);
blacksmithNpc.mesh = blacksmithGroup;

const npcs3D = [...npcsVillage, blacksmithNpc];

// -------------------------------------------------------------
// 🌲 3D 대확장 숲 맵 (연두색/초록색 잔디, 언덕 3개, 거대한 산 2개, 파란 연못, 100그루 나무)
// -------------------------------------------------------------
const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 200),
    new THREE.MeshStandardMaterial({ color: 0x2ed573, roughness: 0.85 })
);
forestFloor.rotation.x = -Math.PI / 2;
forestGroup.add(forestFloor);

// 3개의 언덕 3D 돔 메쉬 생성
hillsData.forEach(h => {
    const hillGeo = new THREE.SphereGeometry(h.radius, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const hillMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.8 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.scale.set(1, h.height / h.radius, 1);
    hill.position.set(h.x, 0, h.z);
    forestGroup.add(hill);

    const hTag = createTagSprite(`⛰️ ${h.name}`, '#ffd32a');
    hTag.position.set(h.x, h.height + 2.0, h.z);
    forestGroup.add(hTag);
});

// 🏔️ 2개의 거대한 등산 가능 산맥 (Mountain Peaks)
mountainsData.forEach(m => {
    const mountainGroup = new THREE.Group();

    const coneGeo = new THREE.ConeGeometry(m.radius, m.height, 24);
    const coneMat = new THREE.MeshStandardMaterial({ color: m.rockColor, roughness: 0.9 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = m.height / 2;
    mountainGroup.add(cone);

    const skirtGeo = new THREE.ConeGeometry(m.radius * 1.25, m.height * 0.45, 24);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x10ac84, roughness: 0.85 });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = m.height * 0.22;
    mountainGroup.add(skirt);

    // 하얀 눈 덮인 정상 쉼터
    const peakGeo = new THREE.ConeGeometry(m.radius * 0.35, m.height * 0.35, 18);
    const peakMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const peak = new THREE.Mesh(peakGeo, peakMat);
    peak.position.y = m.height * 0.83;
    mountainGroup.add(peak);

    const mTag = createTagSprite(`🏔️ ${m.name} 정상`, '#0984e3');
    mTag.position.set(0, m.height + 2.5, 0);
    mountainGroup.add(mTag);

    mountainGroup.position.set(m.x, 0, m.z);
    forestGroup.add(mountainGroup);
});

// 💧 시원하고 맑은 파란색 연못 (Blue Pond)
const pondGroup = new THREE.Group();
const pondGeo = new THREE.CircleGeometry(16, 32);
const pondMat = new THREE.MeshStandardMaterial({
    color: 0x0984e3,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x74b9ff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.92
});
const pondMesh = new THREE.Mesh(pondGeo, pondMat);
pondMesh.rotation.x = -Math.PI / 2;
pondMesh.position.y = 0.05;
pondGroup.add(pondMesh);

for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const rockR = 16.2 + (Math.sin(a * 4) * 1.5);
    const rx = Math.cos(a) * rockR;
    const rz = Math.sin(a) * rockR;
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.0 + Math.random() * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.8 })
    );
    rock.position.set(rx, 0.4, rz);
    pondGroup.add(rock);
}

const lilyOffsets = [
    { x: -5, z: 4 }, { x: 6, z: -3 }, { x: -3, z: -6 }, { x: 5, z: 5 }, { x: 0, z: -2 }
];
lilyOffsets.forEach(pos => {
    const pad = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x2ed573, roughness: 0.5 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(pos.x, 0.08, pos.z);
    pondGroup.add(pad);

    const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff7675 })
    );
    flower.position.set(pos.x, 0.22, pos.z);
    pondGroup.add(flower);
});

const pondTag = createTagSprite('💧 [맑은 푸른 연못]', '#0984e3');
pondTag.position.set(0, 3.2, 0);
pondGroup.add(pondTag);

pondGroup.position.set(0, 0, 15);
forestGroup.add(pondGroup);

// 🌲 100그루의 울창한 다채로운 나무들 (100 Trees Generator)
function createDetailedTreeMesh(scaleRatio = 1.0, colorHex = 0x2ed573, type = 0) {
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 * scaleRatio, 0.5 * scaleRatio, 3.8 * scaleRatio, 8),
        new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 })
    );
    trunk.position.y = 1.9 * scaleRatio;
    treeGroup.add(trunk);

    if (type === 0) {
        for (let tier = 0; tier < 3; tier++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry((2.4 - tier * 0.5) * scaleRatio, (2.6 - tier * 0.4) * scaleRatio, 8),
                new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 })
            );
            cone.position.y = (3.5 + tier * 1.5) * scaleRatio;
            treeGroup.add(cone);
        }
    } else if (type === 1) {
        const crown = new THREE.Mesh(
            new THREE.DodecahedronGeometry(2.4 * scaleRatio),
            new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 })
        );
        crown.position.y = 4.6 * scaleRatio;
        treeGroup.add(crown);
    } else {
        const tallCone = new THREE.Mesh(
            new THREE.ConeGeometry(2.8 * scaleRatio, 5.8 * scaleRatio, 10),
            new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 })
        );
        tallCone.position.y = 5.2 * scaleRatio;
        treeGroup.add(tallCone);
    }

    return treeGroup;
}

const leafColors = [0x7bed9f, 0x2ed573, 0x20bf6b, 0x26de81, 0x10ac84, 0x1dd1a1, 0x55efc4];
for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2 * 7;
    const dist = 22 + (i % 10) * 11 + Math.sin(i * 3.5) * 8;
    let tx = Math.cos(angle) * dist * 1.25;
    let tz = Math.sin(angle) * dist * 0.8;

    if (Math.hypot(tx - 0, tz - 15) < 20) {
        tx += tx >= 0 ? 22 : -22;
    }
    if (Math.hypot(tx - (-60), tz - 0) < 12) {
        tz += tz >= 0 ? 16 : -16;
    }

    const tColor = leafColors[i % leafColors.length];
    const tType = i % 3;
    const tScale = 0.85 + (i % 5) * 0.12;

    const tree = createDetailedTreeMesh(tScale, tColor, tType);
    const elev = getForestTerrainElevation(tx, tz);
    tree.position.set(tx, elev, tz);
    forestGroup.add(tree);
}

// 마을 복귀 포탈
const villageGateInForest = new THREE.Group();
const vGateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0x2ed573 }));
vGateLeft.position.set(-2.5, 2.5, 0);
villageGateInForest.add(vGateLeft);

const vGateRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0x2ed573 }));
vGateRight.position.set(2.5, 2.5, 0);
villageGateInForest.add(vGateRight);

const vGateArch = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffd32a }));
vGateArch.position.set(0, 5.2, 0);
villageGateInForest.add(vGateArch);

const villagePortalTag = createTagSprite('🏡 [Space] 마을로 복귀', '#ffd32a');
villagePortalTag.position.set(0, 6.2, 0);
villageGateInForest.add(villagePortalTag);

villageGateInForest.position.set(-60, 0, 0);
forestGroup.add(villageGateInForest);

// -------------------------------------------------------------
// 🐣 포동포동 아기 동물 & 발그레 몬스터 3D 모델링 빌더
// -------------------------------------------------------------
function buildCuteBabyMonsterMesh(m) {
    const group = new THREE.Group();

    // 1. 🍮 발그레 젤리 슬라임
    if (m.type === 'slime') {
        const slimeBody = new THREE.Mesh(
            new THREE.SphereGeometry(m.scale || 0.85, 18, 18),
            new THREE.MeshStandardMaterial({ 
                color: m.color, 
                roughness: 0.1, 
                transparent: true, 
                opacity: 0.92 
            })
        );
        slimeBody.position.y = 0.75;
        slimeBody.scale.set(1.2, 0.88, 1.15);
        group.add(slimeBody);

        const sproutStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), new THREE.MeshBasicMaterial({ color: 0x2ed573 }));
        sproutStem.position.set(0, 1.45, 0);
        group.add(sproutStem);

        const sproutLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2ed573 }));
        sproutLeaf.scale.set(1.8, 0.5, 0.8);
        sproutLeaf.position.set(0.1, 1.55, 0);
        sproutLeaf.rotation.z = Math.PI / 6;
        group.add(sproutLeaf);

        addCuteBigEyesAndBlush(group, 0.8, 0.74, 0.26, 0.13);

        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x2d3436 }));
        smile.rotation.x = Math.PI;
        smile.position.set(0, 0.65, 0.84);
        group.add(smile);
    } 
    // 2. 🦖 아기 공룡 고블린 / 👻 꼬마 유령 / 🧸 테디 골렘
    else if (m.type === 'biped') {
        const isSkeleton = m.id.includes('skeleton') || m.id.includes('ghost');
        const isGolem = m.id.includes('golem');

        if (isSkeleton) {
            // 👻 꼬마 별요정 유령
            const ghostBody = new THREE.Mesh(
                new THREE.SphereGeometry(0.75, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.95 })
            );
            ghostBody.position.y = 1.1;
            ghostBody.scale.set(0.9, 1.25, 0.9);
            group.add(ghostBody);

            const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0xffd32a }));
            hat.position.set(0, 1.95, 0);
            group.add(hat);

            const starBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff7675 }));
            starBall.position.set(0, 2.25, 0);
            group.add(starBall);

            addCuteBigEyesAndBlush(group, 1.2, 0.62, 0.18, 0.12);

            for (let s = -1; s <= 1; s += 2) {
                const hand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                hand.scale.set(1.4, 0.7, 0.8);
                hand.position.set(s * 0.75, 0.95, 0.25);
                hand.rotation.z = s * 0.3;
                group.add(hand);
            }
        } else if (isGolem) {
            // 🧸 포근포근 테디 골렘
            const body = new THREE.Mesh(
                new THREE.SphereGeometry(1.0, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xcd84f1, roughness: 0.6 })
            );
            body.position.y = 1.1;
            group.add(body);

            const heart = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff7675 }));
            heart.scale.set(1.1, 1.0, 0.3);
            heart.position.set(0, 1.1, 0.92);
            group.add(heart);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), new THREE.MeshStandardMaterial({ color: 0xcd84f1 }));
            head.position.y = 2.0;
            group.add(head);

            for (let s = -1; s <= 1; s += 2) {
                const ear = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), new THREE.MeshStandardMaterial({ color: 0x9b59b6 }));
                ear.position.set(s * 0.55, 2.55, 0);
                group.add(ear);
            }

            addCuteBigEyesAndBlush(group, 2.05, 0.6, 0.22, 0.11);
        } else {
            // 🦖 아기 공룡 고블린
            const body = new THREE.Mesh(
                new THREE.SphereGeometry(0.65, 14, 14),
                new THREE.MeshStandardMaterial({ color: 0x55efc4, roughness: 0.4 })
            );
            body.position.y = 0.8;
            group.add(body);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), new THREE.MeshStandardMaterial({ color: 0x55efc4 }));
            head.position.y = 1.5;
            group.add(head);

            for (let i = 0; i < 3; i++) {
                const fin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0xffd32a }));
                fin.position.set(0, 1.8 - i * 0.35, -0.45);
                fin.rotation.x = -Math.PI / 3;
                group.add(fin);
            }

            addCuteBigEyesAndBlush(group, 1.55, 0.44, 0.16, 0.1);

            const wandStick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
            wandStick.position.set(0.6, 0.9, 0.25);
            wandStick.rotation.x = Math.PI / 5;
            group.add(wandStick);

            const wandStar = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd32a }));
            wandStar.position.set(0.6, 1.35, 0.45);
            group.add(wandStar);
        }
    } 
    // 3. 🦊 포동포동 아기 여우 늑대
    else if (m.type === 'quad') {
        const wolfBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.85, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffa502, roughness: 0.5 })
        );
        wolfBody.position.y = 0.85;
        wolfBody.scale.set(0.9, 0.85, 1.35);
        group.add(wolfBody);

        const wolfHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffa502 })
        );
        wolfHead.position.set(0, 1.25, 0.7);
        group.add(wolfHead);

        const snout = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        snout.position.set(0, 1.15, 1.15);
        group.add(snout);

        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2f3542 }));
        nose.position.set(0, 1.22, 1.32);
        group.add(nose);

        addCuteBigEyesAndBlush(group, 1.35, 1.02, 0.16, 0.1);

        for (let s = -1; s <= 1; s += 2) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0xffa502 }));
            ear.position.set(s * 0.32, 1.75, 0.6);
            ear.rotation.z = s * -0.15;
            group.add(ear);
        }

        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        tail.position.set(0, 1.1, -1.05);
        group.add(tail);

        for (let lx = -0.35; lx <= 0.35; lx += 0.7) {
            for (let lz = -0.45; lz <= 0.45; lz += 0.9) {
                const paw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                paw.position.set(lx, 0.25, lz);
                group.add(paw);
            }
        }
    } 
    // 4. 🐞 아기 무당벌레 스파이더
    else if (m.type === 'spider') {
        const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), new THREE.MeshStandardMaterial({ color: 0x2f3542 }));
        headSphere.position.set(0, 0.65, 0.35);
        group.add(headSphere);

        const abdomen = new THREE.Mesh(
            new THREE.SphereGeometry(0.78, 16, 16), 
            new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.2 })
        );
        abdomen.position.set(0, 0.8, -0.65);
        group.add(abdomen);

        for (let s = -1; s <= 1; s += 2) {
            const dot1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e272e }));
            dot1.position.set(s * 0.35, 1.25, -0.5);
            group.add(dot1);

            const dot2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e272e }));
            dot2.position.set(s * 0.45, 0.95, -0.9);
            group.add(dot2);
        }

        addCuteBigEyesAndBlush(group, 0.72, 0.72, 0.18, 0.11);

        for (let i = 0; i < 2; i++) {
            const zOff = -0.15 + i * 0.4;
            for (let s = -1; s <= 1; s += 2) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0x2f3542 }));
                leg.position.set(s * 0.65, 0.35, zOff);
                leg.rotation.z = s * 0.75;
                group.add(leg);
            }
        }
    }

    return group;
}

function getMonsterStats(baseHp, baseDmg, pLevel) {
    const scaledMaxHp = baseHp + (pLevel - 1) * 30;
    const scaledTouchDmg = baseDmg + (pLevel - 1) * 10;
    return {
        maxHp: scaledMaxHp,
        touchDmg: scaledTouchDmg,
        expReward: 35 + (pLevel - 1) * 10
    };
}

// -------------------------------------------------------------
// 👾 총 30마리 아기 몬스터 대군단 (산꼭대기, 산기슭, 언덕 위, 연못가 배치)
// -------------------------------------------------------------
const monsters3D = [
    // 1~6: 서쪽 숲 & 서쪽 초록 언덕
    { id: 'slime1', baseName: '🍮 딸기 젤리 슬라임', originX: -45, originZ: -4, patrolRadius: 10, chaseSpeed: 0.055, patrolSpeed: 0.025, color: 0xff7675, baseHp: 50, baseDmg: 5, type: 'slime', scale: 0.85 },
    { id: 'goblin1', baseName: '🦖 아기 공룡 고블린', originX: -35, originZ: 16, patrolRadius: 12, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0x55efc4, baseHp: 60, baseDmg: 6, type: 'biped' },
    { id: 'slime2', baseName: '🍮 민트 젤리 슬라임', originX: -25, originZ: -16, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0x81ecec, baseHp: 50, baseDmg: 4, type: 'slime', scale: 0.65 },
    { id: 'wolf1', baseName: '🦊 아기 여우 늑대', originX: -12, originZ: -25, patrolRadius: 14, chaseSpeed: 0.095, patrolSpeed: 0.045, color: 0xffa502, baseHp: 70, baseDmg: 7, type: 'quad' },
    { id: 'hill_slime_w', baseName: '🍮 서쪽언덕 슬라임', originX: -45, originZ: -30, patrolRadius: 9, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0x7bed9f, baseHp: 55, baseDmg: 5, type: 'slime' },
    { id: 'spider_w', baseName: '🐞 서쪽 꼬마 무당벌레', originX: -55, originZ: -35, patrolRadius: 10, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0xff4757, baseHp: 65, baseDmg: 6, type: 'spider' },

    // 7~12: 중앙 파란 연못가 & 남쪽 에메랄드 언덕
    { id: 'golem1', baseName: '🧸 테디 베어 골렘', originX: 0, originZ: -20, patrolRadius: 10, chaseSpeed: 0.048, patrolSpeed: 0.02, color: 0xcd84f1, baseHp: 100, baseDmg: 9, type: 'biped' },
    { id: 'slime_pond1', baseName: '🍮 파란연못 젤리', originX: -14, originZ: 18, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0x74b9ff, baseHp: 50, baseDmg: 4, type: 'slime', scale: 0.7 },
    { id: 'slime_pond2', baseName: '🍮 연꽃 핑크 슬라임', originX: 15, originZ: 18, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0xfd79a8, baseHp: 50, baseDmg: 4, type: 'slime', scale: 0.7 },
    { id: 'hill_wolf_s', baseName: '🦊 남쪽언덕 아기여우', originX: 10, originZ: -55, patrolRadius: 10, chaseSpeed: 0.09, patrolSpeed: 0.04, color: 0xffbe76, baseHp: 75, baseDmg: 7, type: 'quad' },
    { id: 'ghost_s', baseName: '👻 남쪽 별요정 유령', originX: 18, originZ: -60, patrolRadius: 9, chaseSpeed: 0.075, patrolSpeed: 0.032, color: 0xffffff, baseHp: 70, baseDmg: 6, type: 'biped' },
    { id: 'spider_s', baseName: '🐞 남쪽 핑크 무당벌레', originX: 0, originZ: -50, patrolRadius: 9, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0xfd79a8, baseHp: 75, baseDmg: 6, type: 'spider' },

    // 13~18: 동쪽 연두 언덕 위
    { id: 'hill_slime_e1', baseName: '🍮 동쪽언덕 왕슬라임', originX: 45, originZ: 25, patrolRadius: 10, chaseSpeed: 0.065, patrolSpeed: 0.03, color: 0xffd32a, baseHp: 80, baseDmg: 7, type: 'slime', scale: 1.1 },
    { id: 'hill_dino_e', baseName: '🦖 동쪽언덕 아기공룡', originX: 52, originZ: 28, patrolRadius: 10, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0x55efc4, baseHp: 80, baseDmg: 7, type: 'biped' },
    { id: 'hill_fox_e', baseName: '🦊 동쪽언덕 솜사탕여우', originX: 38, originZ: 22, patrolRadius: 11, chaseSpeed: 0.095, patrolSpeed: 0.045, color: 0xffa502, baseHp: 80, baseDmg: 7, type: 'quad' },
    { id: 'hill_golem_e', baseName: '🧸 하트 테디 골렘', originX: 48, originZ: 15, patrolRadius: 8, chaseSpeed: 0.05, patrolSpeed: 0.02, color: 0xa29bfe, baseHp: 105, baseDmg: 9, type: 'biped' },
    { id: 'spider_e1', baseName: '🐞 황금 무당벌레', originX: 35, originZ: 35, patrolRadius: 9, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0xffd32a, baseHp: 75, baseDmg: 6, type: 'spider' },
    { id: 'ghost_e1', baseName: '👻 언덕 꼬마 천사유령', originX: 55, originZ: 18, patrolRadius: 10, chaseSpeed: 0.075, patrolSpeed: 0.032, color: 0xfff200, baseHp: 85, baseDmg: 7, type: 'biped' },

    // 19~24: 🏔️ 북동쪽 거대한 대산맥 정상 & 구름 산기슭
    { id: 'mountain_wolf1', baseName: '🦊 대산맥 구름여우', originX: 85, originZ: -58, patrolRadius: 12, chaseSpeed: 0.10, patrolSpeed: 0.048, color: 0xff9f43, baseHp: 90, baseDmg: 8, type: 'quad' },
    { id: 'mountain_dino1', baseName: '🦖 대산맥 정상 아기공룡', originX: 95, originZ: -65, patrolRadius: 10, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0x20bf6b, baseHp: 90, baseDmg: 8, type: 'biped' },
    { id: 'mountain_slime1', baseName: '🍮 구름바람 블루 슬라임', originX: 90, originZ: -60, patrolRadius: 9, chaseSpeed: 0.065, patrolSpeed: 0.03, color: 0x0984e3, baseHp: 75, baseDmg: 6, type: 'slime' },
    { id: 'mountain_ghost1', baseName: '👻 산봉우리 구름요정', originX: 98, originZ: -68, patrolRadius: 8, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0xffffff, baseHp: 90, baseDmg: 8, type: 'biped' },
    { id: 'mountain_spider1', baseName: '🐞 산맥 도트 무당벌레', originX: 78, originZ: -50, patrolRadius: 10, chaseSpeed: 0.09, patrolSpeed: 0.04, color: 0xff4757, baseHp: 85, baseDmg: 7, type: 'spider' },
    { id: 'mountain_slime2', baseName: '🍮 설산 솜사탕 슬라임', originX: 92, originZ: -72, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.028, color: 0xff7675, baseHp: 70, baseDmg: 6, type: 'slime' },

    // 25~30: 🏔️ 북서쪽 거대한 산봉우리 정상 & 깊은 숲속
    { id: 'nw_wolf1', baseName: '🦊 북서 산봉우리 여우', originX: -95, originZ: 60, patrolRadius: 10, chaseSpeed: 0.10, patrolSpeed: 0.05, color: 0xffbe76, baseHp: 90, baseDmg: 8, type: 'quad' },
    { id: 'nw_dino1', baseName: '🦖 북서 정상 민트공룡', originX: -90, originZ: 55, patrolRadius: 9, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0x55efc4, baseHp: 85, baseDmg: 7, type: 'biped' },
    { id: 'nw_slime1', baseName: '🍮 바나나 젤리 슬라임', originX: -85, originZ: 45, patrolRadius: 9, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0xffd32a, baseHp: 70, baseDmg: 6, type: 'slime' },
    { id: 'nw_ghost1', baseName: '👻 구름 꼬마 유령', originX: -98, originZ: 65, patrolRadius: 8, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0xffffff, baseHp: 85, baseDmg: 7, type: 'biped' },
    { id: 'deep_forest_fox', baseName: '🦊 깊은숲 아기 여우', originX: -30, originZ: 55, patrolRadius: 12, chaseSpeed: 0.095, patrolSpeed: 0.045, color: 0xffa502, baseHp: 80, baseDmg: 7, type: 'quad' },
    { id: 'deep_forest_slime', baseName: '🍮 포도 젤리 슬라임', originX: 20, originZ: 60, patrolRadius: 9, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0xa29bfe, baseHp: 70, baseDmg: 5, type: 'slime' }
];

monsters3D.forEach(m => {
    m.x = m.originX;
    m.z = m.originZ;
    m.targetX = m.originX;
    m.targetZ = m.originZ;
    m.patrolTimer = Math.floor(Math.random() * 60);
    m.animCycle = Math.random() * Math.PI * 2;
    m.hp = m.baseHp;
    m.maxHp = m.baseHp;
    m.touchDmg = m.baseDmg;
    m.expReward = 35;
    m.alive = true;
    m.respawnTimer = 0;

    const mMesh = buildCuteBabyMonsterMesh(m);
    const elev = getForestTerrainElevation(m.x, m.z);
    mMesh.position.set(m.x, elev, m.z);
    forestGroup.add(mMesh);
    m.mesh = mMesh;

    updateMonsterHpSprite(m);
});

// -------------------------------------------------------------
// 🌐 3D 시점 회전 & 터치 드래그 & 클릭 대화
// -------------------------------------------------------------
container.addEventListener('pointerdown', (e) => {
    initAudio();
    if (gameState !== 'PLAYING') return;

    isPointerDragging = true;
    previousPointerX = e.clientX;
    previousPointerY = e.clientY;

    if (currentMap === 'VILLAGE') {
        const distToBs = Math.hypot(player3D.x - 0, player3D.z - 0.2);
        if (distToBs < 5.5) {
            enterBlacksmithInterior();
            return;
        }
    }

    let activeNpcs = [];
    if (currentMap === 'VILLAGE') activeNpcs = npcsVillage;
    else if (currentMap === 'BLACKSMITH_INTERIOR') activeNpcs = [blacksmithNpc];

    let nearestNpc = null;
    let minDist = 999;
    activeNpcs.forEach(npc => {
        const dist = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
        if (dist < 9.0 && dist < minDist) {
            minDist = dist;
            nearestNpc = npc;
        }
    });

    if (nearestNpc) {
        openNpcDialogue(nearestNpc);
    }
});

window.addEventListener('pointermove', (e) => {
    if (gameState !== 'PLAYING') return;

    if (isShiftLocked) {
        const sens = 0.003;
        yaw -= e.movementX * sens;
        pitch -= e.movementY * sens;
        pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    } else if (isPointerDragging) {
        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;
        previousPointerX = e.clientX;
        previousPointerY = e.clientY;

        const sens = 0.004;
        yaw -= deltaX * sens;
        pitch -= deltaY * sens;
        pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
});

window.addEventListener('pointerup', () => {
    isPointerDragging = false;
});

// -------------------------------------------------------------
// 🔒 쉬프트락 제어
// -------------------------------------------------------------
function toggleShiftLock() {
    try {
        if (document.pointerLockElement === container) {
            document.exitPointerLock();
        } else {
            container.requestPointerLock();
        }
    } catch (e) {}
}

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === container) {
        isShiftLocked = true;
        shiftLockStatusSpan.textContent = '🔒 ON (360도 마우스 회전)';
    } else {
        isShiftLocked = false;
        shiftLockStatusSpan.textContent = '🔓 OFF (Shift키/드래그 시점)';
    }
});

// -------------------------------------------------------------
// 입력 및 조작 키보드/버튼 처리
// -------------------------------------------------------------
let keys = { up: false, down: false, left: false, right: false };
let pressTime = 0;

document.addEventListener('keydown', (e) => {
    initAudio();
    if (gameState === 'START' && (e.key === 'Enter' || e.code === 'Space')) {
        startGame();
        return;
    }

    if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') {
        toggleShiftLock();
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (!keys.up) pressTime = Date.now();
        keys.up = true;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (!keys.down) pressTime = Date.now();
        keys.down = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (!keys.right) pressTime = Date.now();
        keys.right = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (!keys.left) pressTime = Date.now();
        keys.left = true;
    }
    if (e.code === 'Space') {
        e.preventDefault();
        triggerDialogueOrAttack(true);
    }
    if (e.key === 'f' || e.key === 'F') {
        triggerDialogueOrAttack(false);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { keys.up = false; }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { keys.down = false; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = false; }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = false; }
    if (!keys.up && !keys.down && !keys.left && !keys.right) pressTime = 0;
});

btnUp.addEventListener('mousedown', () => { initAudio(); keys.up = true; pressTime = Date.now(); });
btnUp.addEventListener('mouseup', () => { keys.up = false; pressTime = 0; });
btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.up = true; pressTime = Date.now(); });
btnUp.addEventListener('touchend', () => { keys.up = false; pressTime = 0; });

btnDown.addEventListener('mousedown', () => { initAudio(); keys.down = true; pressTime = Date.now(); });
btnDown.addEventListener('mouseup', () => { keys.down = false; pressTime = 0; });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.down = true; pressTime = Date.now(); });
btnDown.addEventListener('touchend', () => { keys.down = false; pressTime = 0; });

btnLeft.addEventListener('mousedown', () => { initAudio(); keys.left = true; pressTime = Date.now(); });
btnLeft.addEventListener('mouseup', () => { keys.left = false; pressTime = 0; });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.left = true; pressTime = Date.now(); });
btnLeft.addEventListener('touchend', () => { keys.left = false; pressTime = 0; });

btnRight.addEventListener('mousedown', () => { initAudio(); keys.right = true; pressTime = Date.now(); });
btnRight.addEventListener('mouseup', () => { keys.right = false; pressTime = 0; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.right = true; pressTime = Date.now(); });
btnRight.addEventListener('touchend', () => { keys.right = false; pressTime = 0; });

btnTalk.onclick = function(e) {
    if (e) e.stopPropagation();
    initAudio();
    triggerDialogueOrAttack(true);
};

function openDirectForgeModal() {
    initAudio();
    openNpcDialogue(blacksmithNpc);
}

btnShiftLock.onclick = function() { initAudio(); toggleShiftLock(); };
btnAttack.onclick = function() { initAudio(); triggerDialogueOrAttack(false); };

// -------------------------------------------------------------
// 맵 이동 로직
// -------------------------------------------------------------
function enterBlacksmithInterior() {
    currentMap = 'BLACKSMITH_INTERIOR';
    villageGroup.visible = false;
    forestGroup.visible = false;
    blacksmithInteriorGroup.visible = true;

    player3D.x = 0;
    player3D.z = 6.5;
    playCustomSound('door');
    updateUI();
}

function goToForestMap() {
    currentMap = 'FOREST';
    villageGroup.visible = false;
    blacksmithInteriorGroup.visible = false;
    forestGroup.visible = true;

    player3D.x = -55;
    player3D.z = 0;
    playCustomSound('door');
    updateUI();
}

function goToVillageMap() {
    currentMap = 'VILLAGE';
    villageGroup.visible = true;
    blacksmithInteriorGroup.visible = false;
    forestGroup.visible = false;

    player3D.x = 18;
    player3D.z = 0;
    playCustomSound('door');
    updateUI();
}

// -------------------------------------------------------------
// 대화 및 공격 액션
// -------------------------------------------------------------
function triggerDialogueOrAttack(preferTalk = false) {
    if (gameState !== 'PLAYING') return;

    if (currentMap === 'VILLAGE') {
        const distToBs = Math.hypot(player3D.x - 0, player3D.z - 0.2);
        if (distToBs < 5.5 && preferTalk) {
            enterBlacksmithInterior();
            return;
        }

        const distToForestGate = Math.hypot(player3D.x - 20, player3D.z - 0);
        if (distToForestGate < 5.0 && preferTalk) {
            goToForestMap();
            return;
        }
    } else if (currentMap === 'FOREST') {
        const distToVillageGate = Math.hypot(player3D.x - (-60), player3D.z - 0);
        if (distToVillageGate < 5.0 && preferTalk) {
            goToVillageMap();
            return;
        }
    } else if (currentMap === 'BLACKSMITH_INTERIOR') {
        const distToExit = Math.hypot(player3D.x - 0, player3D.z - 7.5);
        if (distToExit < 4.0 && preferTalk) {
            currentMap = 'VILLAGE';
            villageGroup.visible = true;
            blacksmithInteriorGroup.visible = false;
            forestGroup.visible = false;
            player3D.x = 0;
            player3D.z = 1.0;
            playCustomSound('door');
            updateUI();
            return;
        }
    }

    let activeNpcs = [];
    if (currentMap === 'VILLAGE') activeNpcs = npcsVillage;
    else if (currentMap === 'BLACKSMITH_INTERIOR') activeNpcs = [blacksmithNpc];

    let nearestNpc = null;
    let minDist = 999;
    activeNpcs.forEach(npc => {
        const dist = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
        if (dist < 9.0 && dist < minDist) {
            minDist = dist;
            nearestNpc = npc;
        }
    });

    if (nearestNpc && preferTalk) {
        openNpcDialogue(nearestNpc);
        return;
    }

    // ⚔️ 1인칭 칼 휘두르기
    player3D.isAttacking = true;
    player3D.attackTimer = 12;
    fpSwordGroup.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
    playCustomSound('ching');

    if (currentMap === 'FOREST') {
        monsters3D.forEach(m => {
            if (m.alive) {
                const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                if (dist <= ATTACK_RANGE) {
                    damageMonster(m);
                }
            }
        });
    }
}

// -------------------------------------------------------------
// NPC 대화 & 대장간 칼 강화 모달
// -------------------------------------------------------------
let currentNpc = null;

function openNpcDialogue(npc) {
    currentNpc = npc;
    npcAvatar.textContent = npc.avatar;
    npcName.textContent = npc.name;
    npcRole.textContent = npc.role;
    dialogueStory.textContent = npc.story;

    if (npc.mesh) {
        npc.mesh.lookAt(player3D.x, npc.mesh.position.y, player3D.z);
    }

    forgePanel.classList.remove('hidden');
    updateForgeUI();

    const q = npc.quest;
    if (q.completed) {
        dialogueText.textContent = `🎉 [완료] ${q.title} 퀘스트를 성공적으로 마쳤습니다!`;
        btnAcceptQuest.style.display = 'none';
    } else if (q.active) {
        dialogueText.textContent = `📜 [진행 중] ${q.title}: ${q.desc}`;
        btnAcceptQuest.style.display = 'none';
    } else {
        dialogueText.textContent = `✨ [새 퀘스트] ${q.title} (+${q.rewardExp} EXP)`;
        btnAcceptQuest.style.display = 'inline-block';
        btnAcceptQuest.textContent = '퀘스트 수락하기';
    }

    if (document.pointerLockElement === container) {
        document.exitPointerLock();
    }

    dialogueModal.style.display = 'flex';
    dialogueModal.classList.remove('hidden');
    dialogueModal.classList.add('active');
    playCustomSound('ching');
}

function updateForgeUI(msgText) {
    const cost = getForgeCost();
    forgeCurrentDamageSpan.textContent = swordDamage;
    forgeCostTextSpan.textContent = `${cost} 코인`;
    btnForgeWeapon.textContent = `⚒️ 칼 강화 도전하기 (${cost} 코인 소모)`;
    if (msgText) forgeResultMsg.textContent = msgText;
}

btnForgeWeapon.addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    const cost = getForgeCost();

    if (coins < cost) {
        forgeResultMsg.textContent = `❌ 코인이 부족합니다! (필요: ${cost}코인, 보유: ${coins}코인)`;
        playCustomSound('hit');
        return;
    }

    coins -= cost;
    forgeAttempts++;

    const isSuccess = Math.random() < 0.75;

    if (isSuccess) {
        swordDamage += 5;
        playCustomSound('powerup');
        updateSwordVisuals();
        updateForgeUI(`🎉 [강화 성공!] 칼 공격력이 +5 올라갔습니다! (현재 데미지: ⚔️${swordDamage})`);
    } else {
        playCustomSound('hit');
        updateForgeUI(`💥 [강화 아쉬움!] 벼림에 실패했습니다. (다음 도전: ${getForgeCost()}코인)`);
    }

    updateUI();
});

btnAcceptQuest.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentNpc) {
        const q = currentNpc.quest;
        q.active = true;
        questDescriptionSpan.textContent = `[${currentNpc.name}] ${q.desc}`;
        playCustomSound('ching');
        dialogueModal.classList.remove('active');
        dialogueModal.classList.add('hidden');
        dialogueModal.style.display = 'none';
    }
});

btnCloseDialogue.addEventListener('click', (e) => {
    e.stopPropagation();
    dialogueModal.classList.remove('active');
    dialogueModal.classList.add('hidden');
    dialogueModal.style.display = 'none';
});

function damageMonster(m) {
    m.hp -= swordDamage;
    playCustomSound('hit');

    const dx = m.x - player3D.x;
    const dz = m.z - player3D.z;
    const len = Math.hypot(dx, dz) || 1;
    m.x += (dx / len) * 0.8;
    m.z += (dz / len) * 0.8;

    updateMonsterHpSprite(m);

    if (m.hp <= 0) {
        m.hp = 0;
        m.alive = false;
        m.respawnTimer = 120;
        m.mesh.visible = false;
        monstersSlain++;

        coins += 20;
        totalCoinsEarned += 20;

        gainExp(m.expReward);
        checkQuests();
    }
}

function gainExp(amount) {
    exp += amount;

    while (exp >= targetExp) {
        exp -= targetExp;
        level += 1;
        
        maxHp += 50;
        hp = maxHp;

        swordDamage += 1;

        monsters3D.forEach(m => {
            const stats = getMonsterStats(m.baseHp, m.baseDmg, level);
            m.maxHp = stats.maxHp;
            m.touchDmg = stats.touchDmg;
            if (m.alive) {
                m.hp = Math.min(m.hp + 30, m.maxHp);
            }
            updateMonsterHpSprite(m);
        });

        playCustomSound('yap');
        showLevelUpToast(`🎉 LEVEL UP! Lv.${level} 달성! (체력 풀회복 & 몬스터 공격력 +10!)`);
    }

    updateUI();
    checkQuests();
}

function showLevelUpToast(msg) {
    levelUpToast.textContent = msg;
    levelUpToast.classList.remove('hidden');
    setTimeout(() => {
        levelUpToast.classList.add('hidden');
    }, 2200);
}

function checkQuests() {
    npcs3D.forEach(npc => {
        const q = npc.quest;
        if (q.active && !q.completed) {
            let isDone = false;

            if (q.targetType === 'kill') {
                q.desc = `아기 몬스터와 놀아주기 (진행: ${Math.min(monstersSlain, q.targetCount)}/${q.targetCount})`;
                if (monstersSlain >= q.targetCount) isDone = true;
            } else if (q.targetType === 'level') {
                if (level >= q.targetLevel) isDone = true;
            } else if (q.targetType === 'explore') {
                if (currentMap === 'FOREST' || currentMap === 'BLACKSMITH_INTERIOR') isDone = true;
            }

            if (isDone) {
                q.completed = true;
                questsCompletedCount++;
                playCustomSound('bbyong');
                gainExp(q.rewardExp);
            }
        }
    });

    updateUI();
}

function updateUI() {
    playerLevelSpan.textContent = `Lv.${level}`;
    playerDamageSpan.textContent = swordDamage;
    playerCoinsSpan.textContent = `${coins}코인`;

    const hpRatio = Math.max(0, (hp / maxHp) * 100);
    hpBarFill.style.width = `${hpRatio}%`;
    hpTextSpan.textContent = `${Math.max(0, Math.ceil(hp))} / ${maxHp}`;

    const expRatio = Math.min(100, Math.floor((exp / targetExp) * 100));
    expBarFill.style.width = `${expRatio}%`;
    expTextSpan.textContent = `${exp} / ${targetExp}`;

    if (currentMap === 'VILLAGE') {
        locationNameSpan.textContent = '🏡 3D 평화로운 마을';
    } else if (currentMap === 'BLACKSMITH_INTERIOR') {
        locationNameSpan.textContent = '⚒️ 3D 대장간 내부';
    } else {
        locationNameSpan.textContent = '☁️ 3D 뭉게구름 & 대산맥 숲';
    }
}

function startGame() {
    try { initAudio(); } catch (e) {}
    gameState = 'PLAYING';
    currentMap = 'VILLAGE';
    level = 1;
    hp = 150;
    maxHp = 150;
    lastRenderedHp = 150;
    exp = 0;
    swordDamage = 10;

    coins = 300;
    totalCoinsEarned = 300;
    monstersSlain = 0;
    questsCompletedCount = 0;
    forgeAttempts = 0;
    yaw = 0;
    pitch = 0;
    hasCelebratedSummit = false;
    camera.rotation.set(0, 0, 0, 'YXZ');

    villageGroup.visible = true;
    blacksmithInteriorGroup.visible = false;
    forestGroup.visible = false;

    player3D.x = -14;
    player3D.z = 0;
    camera.position.set(player3D.x, PLAYER_HEIGHT, player3D.z);

    monsters3D.forEach(m => {
        m.x = m.originX;
        m.z = m.originZ;
        m.targetX = m.originX;
        m.targetZ = m.originZ;
        m.patrolTimer = Math.floor(Math.random() * 60);
        m.alive = true;
        m.mesh.visible = true;
        const elev = getForestTerrainElevation(m.x, m.z);
        m.mesh.position.set(m.x, elev, m.z);

        const stats = getMonsterStats(m.baseHp, m.baseDmg, 1);
        m.maxHp = stats.maxHp;
        m.hp = stats.maxHp;
        m.touchDmg = stats.touchDmg;
        m.expReward = stats.expReward;
        updateMonsterHpSprite(m);
    });

    if (startOverlay) {
        startOverlay.classList.remove('active');
        startOverlay.classList.add('hidden');
        startOverlay.style.cssText = 'display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important;';
    }

    if (resultOverlay) {
        resultOverlay.classList.remove('active');
        resultOverlay.classList.add('hidden');
        resultOverlay.style.cssText = 'display: none !important; opacity: 0 !important; pointer-events: none !important;';
    }
    if (dialogueModal) {
        dialogueModal.style.display = 'none';
        dialogueModal.classList.remove('active');
        dialogueModal.classList.add('hidden');
    }

    if (voidWarningPrompt) {
        voidWarningPrompt.classList.add('hidden');
    }

    updateSwordVisuals();
    updateUI();

    try {
        container.requestPointerLock();
    } catch (err) {}
}
window.startGame = startGame;
window.openDirectForgeModal = openDirectForgeModal;
window.finishGame = finishGame;

if (btnStartGame) {
    btnStartGame.onclick = function(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        startGame();
    };
    btnStartGame.ontouchend = function(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        startGame();
    };
}

// 💀 [핵심] 피가 다 닳았을 때 즉각 사망 & 결과창 모달 띄우기
function finishGame(deathReason = '') {
    gameState = 'GAMEOVER';
    hp = 0;
    updateUI();

    try {
        if (document.pointerLockElement === container) {
            document.exitPointerLock();
        }
    } catch (e) {}

    if (deathReason && deathCauseText) {
        deathCauseText.textContent = deathReason;
    } else if (deathCauseText) {
        deathCauseText.textContent = '아기 몬스터들의 앙증맞은 펀치를 맞아 체력이 0이 되어 휴식을 취합니다!';
    }

    resultLevelSpan.textContent = `Lv.${level}`;
    resultMaxHpSpan.textContent = `${maxHp}`;
    resultMonstersSpan.textContent = `${monstersSlain}마리`;
    resultCoinsSpan.textContent = `${totalCoinsEarned}코인`;

    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('active');
    resultOverlay.style.cssText = 'display: flex !important; opacity: 1 !important; pointer-events: auto !important; z-index: 100000 !important;';
}

// -------------------------------------------------------------
// 3D 1인칭 메인 애니메이션 & 피격/사망 판정 루프
// -------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    // ☁️ 둥실둥실 24개 뭉게구름 바람 따라 유기적 이동
    if (currentMap === 'FOREST') {
        cloudsList.forEach(c => {
            c.mesh.position.x += c.speed;
            c.bobPhase += 0.01;
            c.mesh.position.y = c.baseY + Math.sin(c.bobPhase) * 0.6;

            if (c.mesh.position.x > 165) {
                c.mesh.position.x = -165;
            }
        });
    }

    if (gameState === 'PLAYING') {
        const isRunning = (keys.up || keys.down || keys.left || keys.right) && (Date.now() - pressTime > 180);
        const moveSpeed = isRunning ? player3D.runSpeed : player3D.baseSpeed;

        if (keys.up) {
            player3D.x -= Math.sin(yaw) * moveSpeed;
            player3D.z -= Math.cos(yaw) * moveSpeed;
        }
        if (keys.down) {
            player3D.x += Math.sin(yaw) * moveSpeed;
            player3D.z += Math.cos(yaw) * moveSpeed;
        }
        if (keys.left) {
            player3D.x -= Math.cos(yaw) * moveSpeed;
            player3D.z += Math.sin(yaw) * moveSpeed;
        }
        if (keys.right) {
            player3D.x += Math.cos(yaw) * moveSpeed;
            player3D.z -= Math.sin(yaw) * moveSpeed;
        }

        // 🏔️ 언덕 3개 & 거대한 산 2개 등산 높이(Elevation) 실시간 고도 반영
        const currentElevation = (currentMap === 'FOREST') ? getForestTerrainElevation(player3D.x, player3D.z) : 0;
        camera.position.set(player3D.x, PLAYER_HEIGHT + currentElevation, player3D.z);

        // 💀 검은 공간 낭떠러지 밖으로 나가면 즉시 사망!
        let isNearCliff = false;

        if (currentMap === 'VILLAGE') {
            const limitXMin = -27;
            const limitXMax = 26;
            const limitZMin = -13;
            const limitZMax = 13;

            if (player3D.x < limitXMin + 2.5 || player3D.x > limitXMax - 2.5 || 
                player3D.z < limitZMin + 2.5 || player3D.z > limitZMax - 2.5) {
                isNearCliff = true;
            }

            if (player3D.x < limitXMin || player3D.x > limitXMax || 
                player3D.z < limitZMin || player3D.z > limitZMax) {
                playCustomSound('fall');
                finishGame('💀 마을 땅 바깥의 검은 암흑 공간으로 추락하여 사망했습니다!');
                return;
            }

            // 마을 주민들 자율 산책
            npcsVillage.forEach(npc => {
                if (npc.chatTimer > 0) {
                    npc.chatTimer--;
                    if (npc.chatTimer <= 0) {
                        updateNpcChatBubble(npc, '');
                        npc.isTalkingWithNpc = false;
                    }
                }
            });

            for (let i = 0; i < npcsVillage.length; i++) {
                const npc = npcsVillage[i];

                if (!npc.isTalkingWithNpc) {
                    for (let j = i + 1; j < npcsVillage.length; j++) {
                        const other = npcsVillage[j];
                        const distBetween = Math.hypot(npc.x - other.x, npc.z - other.z);

                        if (distBetween < 4.2 && !other.isTalkingWithNpc) {
                            npc.isTalkingWithNpc = true;
                            other.isTalkingWithNpc = true;
                            npc.chatTimer = 180;
                            other.chatTimer = 180;

                            npc.mesh.lookAt(other.x, npc.mesh.position.y, other.z);
                            other.mesh.lookAt(npc.x, other.mesh.position.y, npc.z);

                            const line1 = npc.chatLines ? npc.chatLines[Math.floor(Math.random() * npc.chatLines.length)] : "반가워요!";
                            const line2 = other.chatLines ? other.chatLines[Math.floor(Math.random() * other.chatLines.length)] : "좋은 하루예요!";

                            updateNpcChatBubble(npc, line1);
                            updateNpcChatBubble(other, line2);
                            break;
                        }
                    }
                }

                if (!npc.isTalkingWithNpc) {
                    npc.patrolTimer--;
                    if (npc.patrolTimer <= 0) {
                        npc.patrolTimer = 120 + Math.floor(Math.random() * 150);
                        const angle = Math.random() * Math.PI * 2;
                        const rad = Math.random() * npc.patrolRadius;
                        npc.targetX = npc.originX + Math.cos(angle) * rad;
                        npc.targetZ = npc.originZ + Math.sin(angle) * rad;
                    }

                    const dx = npc.targetX - npc.x;
                    const dz = npc.targetZ - npc.z;
                    const dist = Math.hypot(dx, dz);

                    if (dist > 0.25) {
                        npc.mesh.lookAt(npc.targetX, npc.mesh.position.y, npc.targetZ);
                        npc.x += (dx / dist) * 0.022;
                        npc.z += (dz / dist) * 0.022;
                        npc.mesh.position.set(npc.x, 0, npc.z);
                    } else {
                        const distToPlayer = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
                        if (distToPlayer < 7.0) {
                            npc.mesh.lookAt(player3D.x, npc.mesh.position.y, player3D.z);
                        }
                    }
                }
            }

            const distToBsDoor = Math.hypot(player3D.x - 0, player3D.z - 0.2);
            if (distToBsDoor < 5.5) {
                proximityNpcText.textContent = `⚒️ [대장간 건물 입구] (터치/Space 누르면 대장간 입장!)`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                let nearestNpc = null;
                let minDist = 999;
                npcsVillage.forEach(npc => {
                    const dist = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
                    if (dist < 8.5 && dist < minDist) {
                        minDist = dist;
                        nearestNpc = npc;
                    }
                });

                if (nearestNpc) {
                    proximityNpcText.textContent = `💬 [${nearestNpc.name}] 근처! [💬 대화하기] 누르기`;
                    npcProximityPrompt.classList.remove('hidden');
                } else {
                    npcProximityPrompt.classList.remove('hidden');
                    proximityNpcText.textContent = `⚒️ [우측 상단 칼 강화소 버튼]을 눌러 언제든 칼 강화 가능!`;
                }
            }

            // 숲 게이트 진입
            if (player3D.x > 19 && Math.abs(player3D.z) < 3.0) {
                goToForestMap();
            }
        } else if (currentMap === 'BLACKSMITH_INTERIOR') {
            if (player3D.x < -9.5 || player3D.x > 9.5 || player3D.z < -9.5 || player3D.z > 9.0) {
                playCustomSound('fall');
                finishGame('💀 대장간 건물 바깥 검은 허공으로 추락했습니다!');
                return;
            }

            if (blacksmithNpc.mesh) {
                blacksmithNpc.mesh.lookAt(player3D.x, blacksmithNpc.mesh.position.y, player3D.z);
            }

            const distToBs = Math.hypot(player3D.x - blacksmithNpc.x, player3D.z - blacksmithNpc.z);
            if (distToBs < 8.0) {
                proximityNpcText.textContent = `🧔 [대장장이 철수] [💬 대화하기] 누르면 칼 강화!`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                npcProximityPrompt.classList.add('hidden');
            }

            if (player3D.z > 8.0 && Math.abs(player3D.x) < 3.0) {
                currentMap = 'VILLAGE';
                villageGroup.visible = true;
                blacksmithInteriorGroup.visible = false;
                forestGroup.visible = false;
                player3D.x = 0;
                player3D.z = 1.0;
                playCustomSound('door');
                updateUI();
            }
        } else if (currentMap === 'FOREST') {
            const fLimitXMin = -155;
            const fLimitXMax = 155;
            const fLimitZMin = -95;
            const fLimitZMax = 95;

            if (player3D.x < fLimitXMin + 4.0 || player3D.x > fLimitXMax - 4.0 || 
                player3D.z < fLimitZMin + 4.0 || player3D.z > fLimitZMax - 4.0) {
                isNearCliff = true;
            }

            if (player3D.x < fLimitXMin || player3D.x > fLimitXMax || 
                player3D.z < fLimitZMin || player3D.z > fLimitZMax) {
                playCustomSound('fall');
                finishGame('💀 숲속 바깥의 깊은 낭떠러지 암흑으로 추락하여 사망했습니다!');
                return;
            }

            // 산꼭대기 정상 / 구름 / 언덕 / 연못 탐색 안내
            let onMountainName = '';
            mountainsData.forEach(m => {
                const d = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                if (d < m.radius * 0.7) {
                    onMountainName = m.name;
                }
            });

            let onHillName = '';
            hillsData.forEach(h => {
                const d = Math.hypot(player3D.x - h.x, player3D.z - h.z);
                if (d < h.radius * 0.75) {
                    onHillName = h.name;
                }
            });

            const distToPond = Math.hypot(player3D.x - 0, player3D.z - 15);

            if (onMountainName) {
                proximityNpcText.textContent = `☁️ [${onMountainName} 구름 정상!] 몽실 구름 사이에서 숲 전체를 내려다봐요! (고도: +${Math.round(currentElevation)}m)`;
                npcProximityPrompt.classList.remove('hidden');

                if (currentElevation > 14 && !hasCelebratedSummit) {
                    hasCelebratedSummit = true;
                    playCustomSound('powerup');
                    showLevelUpToast(`☁️ [구름 위 정상 등극!] 솜사탕 뭉게구름 속 전망대에 도착했습니다!`);
                }
            } else if (onHillName) {
                proximityNpcText.textContent = `⛰️ [${onHillName} 등반 중!] 구름 그늘 아래서 숲을 조망하고 있어요! (고도: +${Math.round(currentElevation)}m)`;
                npcProximityPrompt.classList.remove('hidden');
            } else if (distToPond < 16.5) {
                proximityNpcText.textContent = `💧 [맑은 푸른 연못] 하얀 구름이 연못 물에 비치며 수련꽃이 펴있어요!`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                const distToVillageGate = Math.hypot(player3D.x - (-60), player3D.z - 0);
                if (distToVillageGate < 5.0) {
                    proximityNpcText.textContent = `🏡 [마을 입구 포탈] (Space 누르면 마을 복귀)`;
                    npcProximityPrompt.classList.remove('hidden');
                } else {
                    npcProximityPrompt.classList.add('hidden');
                }
            }

            if (player3D.x < -62 && Math.abs(player3D.z) < 3.0) {
                goToVillageMap();
            }
        }

        if (isNearCliff) {
            voidWarningPrompt.classList.remove('hidden');
        } else {
            voidWarningPrompt.classList.add('hidden');
        }

        // 칼 휘두르기 애니메이션
        if (player3D.isAttacking) {
            player3D.attackTimer--;
            if (player3D.attackTimer <= 0) {
                player3D.isAttacking = false;
                fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
            }
        }

        // 🌲 30마리 숲속 아기 몬스터 실시간 피격 & 체력 0 즉각 사망 판정
        if (currentMap === 'FOREST') {
            let hpChanged = false;

            monsters3D.forEach(m => {
                if (m.alive) {
                    m.animCycle += 0.08;
                    const distToPlayer = Math.hypot(player3D.x - m.x, player3D.z - m.z);

                    if (distToPlayer < AGGRO_RANGE) {
                        m.mesh.lookAt(player3D.x, m.mesh.position.y, player3D.z);
                        const dx = player3D.x - m.x;
                        const dz = player3D.z - m.z;

                        if (distToPlayer > 1.3) {
                            m.x += (dx / distToPlayer) * m.chaseSpeed;
                            m.z += (dz / distToPlayer) * m.chaseSpeed;
                        }

                        const mElev = getForestTerrainElevation(m.x, m.z);

                        if (m.type === 'slime') {
                            const bounce = Math.abs(Math.sin(m.animCycle * 2)) * 0.45;
                            m.mesh.position.set(m.x, mElev + bounce, m.z);
                        } else if (m.type === 'spider') {
                            const crawl = Math.sin(m.animCycle * 3) * 0.1;
                            m.mesh.position.set(m.x, mElev + crawl, m.z);
                        } else {
                            const stepBob = Math.abs(Math.sin(m.animCycle * 1.5)) * 0.2;
                            m.mesh.position.set(m.x, mElev + stepBob, m.z);
                        }

                        // 플레이어와 충돌 시 데미지
                        if (distToPlayer < 1.8) {
                            hp -= (m.touchDmg / 60);
                            hpChanged = true;
                        }
                    } else {
                        m.patrolTimer--;

                        if (m.patrolTimer <= 0) {
                            m.patrolTimer = 100 + Math.floor(Math.random() * 140);
                            const angle = Math.random() * Math.PI * 2;
                            const rad = Math.random() * m.patrolRadius;
                            m.targetX = m.originX + Math.cos(angle) * rad;
                            m.targetZ = m.originZ + Math.sin(angle) * rad;
                        }

                        const pDx = m.targetX - m.x;
                        const pDz = m.targetZ - m.z;
                        const pDist = Math.hypot(pDx, pDz);

                        const mElev = getForestTerrainElevation(m.x, m.z);

                        if (pDist > 0.3) {
                            m.mesh.lookAt(m.targetX, mElev, m.targetZ);
                            m.x += (pDx / pDist) * m.patrolSpeed;
                            m.z += (pDz / pDist) * m.patrolSpeed;

                            if (m.type === 'slime') {
                                const bounce = Math.abs(Math.sin(m.animCycle)) * 0.3;
                                m.mesh.position.set(m.x, mElev + bounce, m.z);
                            } else {
                                const stepBob = Math.abs(Math.sin(m.animCycle)) * 0.12;
                                m.mesh.position.set(m.x, mElev + stepBob, m.z);
                            }
                        } else {
                            m.mesh.position.set(m.x, mElev + Math.sin(m.animCycle * 0.5) * 0.04, m.z);
                        }
                    }
                } else {
                    m.respawnTimer--;
                    if (m.respawnTimer <= 0) {
                        m.alive = true;
                        m.x = m.originX;
                        m.z = m.originZ;
                        m.targetX = m.originX;
                        m.targetZ = m.originZ;
                        const mElev = getForestTerrainElevation(m.x, m.z);
                        m.mesh.position.set(m.x, mElev, m.z);
                        m.mesh.visible = true;
                        const stats = getMonsterStats(m.baseHp, m.baseDmg, level);
                        m.maxHp = stats.maxHp;
                        m.hp = m.maxHp;
                        m.touchDmg = stats.touchDmg;
                        m.expReward = stats.expReward;
                        updateMonsterHpSprite(m);
                    }
                }
            });

            if (hpChanged && Math.abs(hp - lastRenderedHp) > 0.5) {
                lastRenderedHp = hp;
                updateUI();
            }

            // 💀 [핵심] 피가 다 닳았을 때 즉각 쓰러짐 & 결과창 팝업 실행!
            if (hp <= 0) {
                hp = 0;
                playCustomSound('fall');
                finishGame('아기 몬스터들의 앙증맞은 펀치를 맞아 체력이 0이 되어 잠시 휴식을 취합니다!');
                return;
            }
        }
    }

    renderer.render(scene, camera);
}

btnFinishGame.onclick = function() { finishGame('용사가 모험을 마치고 평화로운 휴식을 취합니다.'); };
btnRestartGame.onclick = startGame;

animate();
