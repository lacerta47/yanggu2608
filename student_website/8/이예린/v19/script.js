// -------------------------------------------------------------
// 3D 1인칭 용사의 모험 RPG v19 Engine
// (드넓은 숲속 대자연 확장 & 살아 숨쉬는 실시간 배회 몬스터 AI)
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

const npcProximityPrompt = document.getElementById('npc-proximity-prompt');
const proximityNpcText = document.getElementById('proximity-npc-text');

const btnStartGame = document.getElementById('btn-start-game');
const btnFinishGame = document.getElementById('btn-finish-game');
const btnRestartGame = document.getElementById('btn-restart-game');

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
let coins = 0;
let totalCoinsEarned = 0;
let monstersSlain = 0;
let questsCompletedCount = 0;

// 📏 용사 캐릭터 키 높이 (2.5)
const PLAYER_HEIGHT = 2.5;

// 🔨 칼 강화 상태 변수
let forgeAttempts = 0;
function getForgeCost() {
    return 100 + (forgeAttempts * 10);
}

const ATTACK_RANGE = 6.5;
const AGGRO_RANGE = 14.0;

// 쉬프트락 및 터치 드래그 변수
let isShiftLocked = false;
let isPointerDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;
let yaw = 0;
let pitch = 0;

// 오디오 사운드
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        } else if (type === 'bbyong') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.16);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'yap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.setValueAtTime(540, now + 0.08);
            osc.frequency.setValueAtTime(720, now + 0.16);
            osc.frequency.setValueAtTime(1080, now + 0.24);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'door') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'powerup') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
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

function createTagSprite(tagText, colorStr = '#ff9f43') {
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
        m.hpSprite.position.set(0, 1.9, 0);
    }

    const canvas = m.hpSpriteCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'Bold 20px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ff9f43';
    ctx.textAlign = 'center';
    ctx.fillText(`[Lv.${level}] ${m.baseName}`, 128, 24);

    ctx.fillStyle = '#000000';
    ctx.fillRect(28, 42, 200, 20);

    const ratio = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = ratio > 0.4 ? '#2ecc71' : '#ff4d4d';
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

const camera = new THREE.PerspectiveCamera(65, 900 / 500, 0.1, 1000);
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// 1인칭 용사의 칼 (FPS 뷰모델)
const fpSwordGroup = new THREE.Group();
const bladeGeo = new THREE.BoxGeometry(0.08, 0.9, 0.04);
const bladeMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, metalness: 0.9, roughness: 0.2, emissive: 0x00a8ff, emissiveIntensity: 0.4 });
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

// 플레이어 물리 좌표
const player3D = {
    x: -14,
    z: 0,
    baseSpeed: 0.16,
    runSpeed: 0.24,
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
// 🏡 3D 평화로운 마을 맵 (Map 1)
// -------------------------------------------------------------
const villageFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.8 })
);
villageFloor.rotation.x = -Math.PI / 2;
villageGroup.add(villageFloor);

// 마을 길
const villagePath = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 4),
    new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.6 })
);
villagePath.rotation.x = -Math.PI / 2;
villagePath.position.y = 0.02;
villageGroup.add(villagePath);

// 대장간 외관 건물
const bsExterior = new THREE.Group();
const bsWalls = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.7 })
);
bsWalls.position.y = 2.25;
bsExterior.add(bsWalls);

const bsRoof = new THREE.Mesh(
    new THREE.ConeGeometry(5.2, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5 })
);
bsRoof.position.y = 5.75;
bsRoof.rotation.y = Math.PI / 4;
bsExterior.add(bsRoof);

const bsSign = createTagSprite('⚒️ 3D 대장간 (문으로 쏙 들어가기)', '#ffd32a');
bsSign.position.set(0, 5.0, 3.2);
bsExterior.add(bsSign);

bsExterior.position.set(0, 0, -6.5);
villageGroup.add(bsExterior);

// 숲으로 통하는 동쪽 포탈
const forestGate = new THREE.Group();
const gatePillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x2980b9 }));
gatePillar1.position.set(-2.5, 2.5, 0);
forestGate.add(gatePillar1);

const gatePillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x2980b9 }));
gatePillar2.position.set(2.5, 2.5, 0);
forestGate.add(gatePillar2);

const gateTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3498db }));
gateTop.position.set(0, 5.2, 0);
forestGate.add(gateTop);

const gateTag = createTagSprite('🌲 [Space] 울창한 숲속 맵 입장', '#00f3ff');
gateTag.position.set(0, 6.2, 0);
forestGate.add(gateTag);

forestGate.position.set(22, 0, 0);
villageGroup.add(forestGate);

// 마을 주민 NPC들
const npcsVillage = [
    { 
        id: 'villager0', 
        name: '이장님 성민', 
        role: '마을 이장', 
        avatar: '👴', 
        x: -12, 
        z: 0, 
        color: 0xf39c12, 
        story: "허허, 어서오게 젊은 용사여!\n우리 마을은 평화로워 보이지만, 동쪽 숲속에는 살아 움직이는 몬스터들이 이리저리 돌아다니고 있다네.\n숲으로 떠나기 전에 대장간에 들러 칼을 점검하고, 몬스터가 다가오면 칼을 휘둘러 물리치게나!",
        quest: { title: "이장님의 청부", desc: "숲속 몬스터 2마리 처치하기 (진행: 0/2)", targetType: "kill", targetCount: 2, rewardExp: 50, active: false, completed: false } 
    },
    { 
        id: 'villager1', 
        name: '약초꾼 주희', 
        role: '마을 주민', 
        avatar: '👩‍🌾', 
        x: -6, 
        z: 0, 
        color: 0x2ecc71, 
        story: "안녕하세요 용사님! 요즘 숲이 훨씬 넓어졌는데, 슬라임과 고블린들이 살아서 쿵쾅쿵쾅 돌아다녀요...\n용사님께서 숲속 몬스터들을 혼내주시면 넉넉한 보상을 드릴게요!",
        quest: { title: "약초밭 지키기", desc: "숲속 몬스터 4마리 처치하기 (진행: 0/4)", targetType: "kill", targetCount: 4, rewardExp: 60, active: false, completed: false } 
    },
    { 
        id: 'villager3', 
        name: '꼬마 민우', 
        role: '마을 주민', 
        avatar: '👦', 
        x: 6, 
        z: 0, 
        color: 0xe74c3c, 
        story: "와! 멋진 용사 형이다!\n동쪽 숲이 엄청 넓어져서 신기한 나무랑 버섯이 가득해요!\n몬스터들이 가만히 안 있고 계속 걸어 다니니까 뒤에서 조심해서 공격하세요!",
        quest: { title: "숲속 탐험", desc: "넓어진 숲 맵으로 건너가 탐험해보기", targetType: "explore", rewardExp: 30, active: false, completed: false } 
    },
    { 
        id: 'villager4', 
        name: '정원사 영희', 
        role: '마을 주민', 
        avatar: '👩', 
        x: 10, 
        z: 0, 
        color: 0x9b59b6, 
        story: "넓은 숲속에 거미와 늑대들이 자유롭게 뛰어다니고 있어요.\n멋진 칼솜씨로 몬스터들을 소탕해주시면 예쁜 꽃밭을 가꿀 수 있답니다!",
        quest: { title: "장미밭 구하기", desc: "숲속 몬스터 6마리 처치하기 (진행: 0/6)", targetType: "kill", targetCount: 6, rewardExp: 80, active: false, completed: false } 
    },
    { 
        id: 'villager5', 
        name: '모험가 한스', 
        role: '마을 주민', 
        avatar: '🧙‍♂️', 
        x: 14, 
        z: 0, 
        color: 0x3498db, 
        story: "전설의 모험가 한스라고 부르게!\n움직이는 몬스터를 물리치며 레벨 3에 도달해 자네의 용기를 증명해보게나!",
        quest: { title: "진정한 용사의 길", desc: "Lv.3 도달하기", targetType: "level", targetLevel: 3, rewardExp: 100, active: false, completed: false } 
    }
];

npcsVillage.forEach(npc => {
    const npcGroup = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.5, 1.3, 12),
        new THREE.MeshStandardMaterial({ color: npc.color, roughness: 0.5 })
    );
    body.position.y = 0.65;
    npcGroup.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.3 })
    );
    head.position.y = 1.5;
    npcGroup.add(head);

    npcGroup.position.set(npc.x, 0, npc.z);

    const nameSprite = createNpcNameSprite(`${npc.avatar} ${npc.name}`);
    nameSprite.position.set(0, 2.2, 0);
    npcGroup.add(nameSprite);

    villageGroup.add(npcGroup);
    npc.mesh = npcGroup;
});

// -------------------------------------------------------------
// ⚒️ 3D 대장간 건물 내부 맵 (Map 2)
// -------------------------------------------------------------
const bsFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x474754, roughness: 0.7 })
);
bsFloor.rotation.x = -Math.PI / 2;
blacksmithInteriorGroup.add(bsFloor);

function createWall(w, h, d, x, y, z) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.6 })
    );
    wall.position.set(x, y, z);
    blacksmithInteriorGroup.add(wall);
}
createWall(20, 6, 0.5, 0, 3, -10);
createWall(0.5, 6, 20, -10, 3, 0);
createWall(0.5, 6, 20, 10, 3, 0);

// 용광로
const forgeStoneGroup = new THREE.Group();
const forgeBase = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 2.6, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
);
forgeBase.position.set(0, 1.3, 0);
forgeStoneGroup.add(forgeBase);

const forgeCore = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.6, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xe74c3c, emissive: 0xff4757, emissiveIntensity: 0.9 })
);
forgeCore.position.set(0, 1.3, 0.7);
forgeStoneGroup.add(forgeCore);

const forgeLight = new THREE.PointLight(0xff6b6b, 2.5, 10);
forgeLight.position.set(0, 2.0, 1.0);
forgeStoneGroup.add(forgeLight);

forgeStoneGroup.position.set(-6, 0, -8);
blacksmithInteriorGroup.add(forgeStoneGroup);

// 모루 작업대
const workTableGroup = new THREE.Group();
const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.35, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x57606f })
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

// 출구 문
const exitDoorTag = createTagSprite('🚪 [Space] 마을로 나가기', '#ff9f43');
exitDoorTag.position.set(0, 2.2, 8);
blacksmithInteriorGroup.add(exitDoorTag);

// 대장장이 NPC
const blacksmithNpc = {
    id: 'villager2',
    name: '대장장이 철수',
    role: '3D 대장간 장인',
    avatar: '🧔',
    x: 1.8,
    z: -3.5,
    color: 0xe67e22,
    story: "뜨거운 불꽃이 타오르는 대장간에 잘 왔네 용사여!\n몬스터를 무찌르고 모아온 코인으로 칼을 단련해보게나!\n기본 강화 비용은 100코인이며, 강화 성공 시 칼 공격력이 무려 +5 올라가지!",
    quest: { title: "칼 단련 시험", desc: "Lv.2 도달하기", targetType: "level", targetLevel: 2, rewardExp: 40, active: false, completed: false }
};

const blacksmithGroup = new THREE.Group();
const bsBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.55, 1.3, 12),
    new THREE.MeshStandardMaterial({ color: blacksmithNpc.color })
);
bsBody.position.y = 0.65;
blacksmithGroup.add(bsBody);

const bsHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdfba })
);
bsHead.position.y = 1.5;
blacksmithGroup.add(bsHead);

blacksmithGroup.position.set(blacksmithNpc.x, 0, blacksmithNpc.z);

const bsNameSprite = createNpcNameSprite(`🧔 대장장이 철수`);
bsNameSprite.position.set(0, 2.2, 0);
blacksmithGroup.add(bsNameSprite);

blacksmithInteriorGroup.add(blacksmithGroup);
blacksmithNpc.mesh = blacksmithGroup;

const npcs3D = [...npcsVillage, blacksmithNpc];

// -------------------------------------------------------------
// 🌲 3D 숲속 맵 (Map 3) - 대폭 넓어진 땅 & 풍성한 대자연
// -------------------------------------------------------------
// 숲 땅을 160 x 100 크기로 대폭 확장!
const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 100),
    new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.9 })
);
forestFloor.rotation.x = -Math.PI / 2;
forestGroup.add(forestFloor);

// 숲속 3D 나무 생성 함수
function createDetailedForestTree(x, z, typeIndex, scaleRatio = 1.0) {
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 * scaleRatio, 0.5 * scaleRatio, 3.8 * scaleRatio, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 })
    );
    trunk.position.y = (1.9 * scaleRatio);
    treeGroup.add(trunk);

    const leafColors = [0x2ecc71, 0x1abc9c, 0x27ae60, 0x16a085, 0x117a65];
    const leafColor = leafColors[typeIndex % leafColors.length];

    if (typeIndex % 3 === 0) {
        for (let tier = 0; tier < 3; tier++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry((2.4 - tier * 0.5) * scaleRatio, (2.6 - tier * 0.4) * scaleRatio, 8),
                new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.4 })
            );
            cone.position.y = (3.5 + tier * 1.5) * scaleRatio;
            treeGroup.add(cone);
        }
    } else if (typeIndex % 3 === 1) {
        const crown = new THREE.Mesh(
            new THREE.DodecahedronGeometry(2.2 * scaleRatio),
            new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.5 })
        );
        crown.position.y = 4.6 * scaleRatio;
        treeGroup.add(crown);
    } else {
        const tallCone = new THREE.Mesh(
            new THREE.ConeGeometry(2.8 * scaleRatio, 5.5 * scaleRatio, 10),
            new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.3 })
        );
        tallCone.position.y = 5.2 * scaleRatio;
        treeGroup.add(tallCone);
    }

    treeGroup.position.set(x, 0, z);
    forestGroup.add(treeGroup);
}

// 넓어진 숲 전체에 풍성하게 배치된 나무들 (60개 이상)
const forestTreePositions = [
    // 서쪽 구역
    { x: -65, z: -30, type: 0, s: 1.2 }, { x: -60, z: 25, type: 1, s: 1.1 },
    { x: -55, z: -15, type: 2, s: 1.0 }, { x: -52, z: 12, type: 0, s: 1.3 },
    { x: -48, z: -35, type: 1, s: 0.9 }, { x: -45, z: 32, type: 2, s: 1.15 },
    // 서북 & 서남
    { x: -40, z: -20, type: 0, s: 1.2 }, { x: -38, z: 18, type: 1, s: 1.05 },
    { x: -32, z: -38, type: 2, s: 1.3 }, { x: -30, z: 30, type: 0, s: 0.95 },
    { x: -24, z: -12, type: 1, s: 1.1 }, { x: -22, z: 10, type: 2, s: 1.2 },
    // 중앙 북쪽 & 남쪽
    { x: -16, z: -32, type: 0, s: 1.15 }, { x: -14, z: 28, type: 1, s: 1.0 },
    { x: -8,  z: -22, type: 2, s: 1.25 }, { x: -6,  z: 20, type: 0, s: 1.1 },
    { x: 0,   z: -36, type: 1, s: 1.3 },  { x: 0,   z: 35, type: 2, s: 1.2 },
    { x: 6,   z: -18, type: 0, s: 1.0 },  { x: 8,   z: 22, type: 1, s: 1.15 },
    // 동북 & 동남
    { x: 16,  z: -30, type: 2, s: 1.2 },  { x: 18,  z: 26, type: 0, s: 0.9 },
    { x: 24,  z: -16, type: 1, s: 1.1 },  { x: 26,  z: 14, type: 2, s: 1.3 },
    { x: 32,  z: -35, type: 0, s: 1.25 }, { x: 35,  z: 32, type: 1, s: 1.05 },
    { x: 42,  z: -20, type: 2, s: 1.1 },  { x: 44,  z: 18, type: 0, s: 1.2 },
    // 동쪽 끝 구역
    { x: 52,  z: -32, type: 1, s: 1.3 },  { x: 55,  z: 25, type: 2, s: 1.15 },
    { x: 62,  z: -15, type: 0, s: 1.0 },  { x: 65,  z: 15, type: 1, s: 1.25 },
    { x: 68,  z: -35, type: 2, s: 1.1 },  { x: 70,  z: 30, type: 0, s: 1.2 }
];

forestTreePositions.forEach(p => {
    createDetailedForestTree(p.x, p.z, p.type, p.s);
});

// 숲속 버섯 무리
function createForestMushroom(x, z, capColor = 0xe74c3c) {
    const shroom = new THREE.Group();
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    stem.position.y = 0.2;
    shroom.add(stem);

    const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.32, 10),
        new THREE.MeshStandardMaterial({ color: capColor })
    );
    cap.position.y = 0.45;
    shroom.add(cap);

    shroom.position.set(x, 0, z);
    forestGroup.add(shroom);
}

const shroomCoords = [
    { x: -50, z: -8, c: 0xe74c3c }, { x: -42, z: 6, c: 0x9b59b6 },
    { x: -28, z: -5, c: 0xf1c40f }, { x: -15, z: 8, c: 0xe74c3c },
    { x: -2,  z: -8, c: 0x9b59b6 }, { x: 12,  z: 6, c: 0xf1c40f },
    { x: 28,  z: -6, c: 0xe74c3c }, { x: 45,  z: 8, c: 0x9b59b6 },
    { x: 58,  z: -4, c: 0xf1c40f }
];
shroomCoords.forEach(sc => createForestMushroom(sc.x, sc.z, sc.c));

// 숲속 통나무 그루터기
function createTreeStump(x, z) {
    const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.75, 0.55, 8),
        new THREE.MeshStandardMaterial({ color: 0x5e35b1, roughness: 0.9 })
    );
    stump.position.set(x, 0.27, z);
    forestGroup.add(stump);
}
createTreeStump(-45, -10);
createTreeStump(-20, 12);
createTreeStump(5, -12);
createTreeStump(30, 10);
createTreeStump(52, -8);

// 숲속 바위
function createForestRock(x, z, scale = 1.0) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.9 * scale),
        new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.8 })
    );
    rock.position.set(x, 0.5 * scale, z);
    forestGroup.add(rock);
}
createForestRock(-35, 14, 1.4);
createForestRock(-10, -15, 1.2);
createForestRock(18, 15, 1.6);
createForestRock(40, -14, 1.3);

// 🏡 마을로 돌아가는 서쪽 게이트 포탈
const villageGateInForest = new THREE.Group();
const vGateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
vGateLeft.position.set(-2.5, 2.5, 0);
villageGateInForest.add(vGateLeft);

const vGateRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0xf1c40f }));
vGateRight.position.set(2.5, 2.5, 0);
villageGateInForest.add(vGateRight);

const vGateArch = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xf39c12 }));
vGateArch.position.set(0, 5.2, 0);
villageGateInForest.add(vGateArch);

const villagePortalTag = createTagSprite('🏡 [Space] 마을 맵으로 돌아가기', '#ffd32a');
villagePortalTag.position.set(0, 6.2, 0);
villageGateInForest.add(villagePortalTag);

villageGateInForest.position.set(-70, 0, 0);
forestGroup.add(villageGateInForest);

// -------------------------------------------------------------
// 👾 살아서 움직이는 몬스터 AI (실시간 배회 & 추격 시스템)
// -------------------------------------------------------------
function getMonsterStats(baseHp, baseDmg, pLevel) {
    const scaledMaxHp = baseHp + (pLevel - 1) * 30;
    return {
        maxHp: scaledMaxHp,
        touchDmg: baseDmg + (pLevel - 1) * 2,
        expReward: 35 + (pLevel - 1) * 10
    };
}

// 넓어진 숲을 자유롭게 돌아다니는 10마리의 생동감 넘치는 몬스터들!
const monsters3D = [
    // 1. 숲 서쪽 구역 몬스터들
    { id: 'slime1', baseName: '🟢 숲 슬라임', originX: -55, originZ: -4, patrolRadius: 10, chaseSpeed: 0.055, patrolSpeed: 0.025, geo: new THREE.DodecahedronGeometry(0.8), color: 0x2ecc71, baseHp: 50, baseDmg: 5, type: 'slime' },
    { id: 'goblin1', baseName: '🔴 성난 고블린', originX: -42, originZ: 6, patrolRadius: 12, chaseSpeed: 0.08, patrolSpeed: 0.035, geo: new THREE.BoxGeometry(1.2, 1.4, 1.2), color: 0xe74c3c, baseHp: 60, baseDmg: 6, type: 'biped' },
    { id: 'slime2', baseName: '🟢 아기 슬라임', originX: -30, originZ: -6, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.03, geo: new THREE.DodecahedronGeometry(0.65), color: 0x1abc9c, baseHp: 50, baseDmg: 4, type: 'slime' },

    // 2. 숲 중앙 구역 몬스터들
    { id: 'wolf1', baseName: '🐺 숲 늑대', originX: -15, originZ: 4, patrolRadius: 14, chaseSpeed: 0.095, patrolSpeed: 0.045, geo: new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8), color: 0x7f8c8d, baseHp: 70, baseDmg: 7, type: 'quad' },
    { id: 'golem', baseName: '🗿 암석 골렘', originX: 0, originZ: 0, patrolRadius: 10, chaseSpeed: 0.048, patrolSpeed: 0.02, geo: new THREE.BoxGeometry(1.8, 2.2, 1.8), color: 0x95a5a6, baseHp: 100, baseDmg: 9, type: 'biped' },
    { id: 'spider1', baseName: '🕷️ 독 거미', originX: 12, originZ: -5, patrolRadius: 12, chaseSpeed: 0.085, patrolSpeed: 0.038, geo: new THREE.SphereGeometry(0.9, 12, 12), color: 0x9b59b6, baseHp: 80, baseDmg: 6, type: 'spider' },

    // 3. 숲 동쪽 구역 몬스터들
    { id: 'skeleton1', baseName: '👻 해골 전사', originX: 25, originZ: 5, patrolRadius: 12, chaseSpeed: 0.075, patrolSpeed: 0.032, geo: new THREE.CylinderGeometry(0.5, 0.5, 2.0, 8), color: 0xf1f2f6, baseHp: 90, baseDmg: 7, type: 'biped' },
    { id: 'wolf2', baseName: '🐺 우두머리 늑대', originX: 38, originZ: -6, patrolRadius: 14, chaseSpeed: 0.10, patrolSpeed: 0.05, geo: new THREE.CylinderGeometry(0.7, 0.9, 1.6, 8), color: 0x34495e, baseHp: 85, baseDmg: 8, type: 'quad' },
    { id: 'spider2', baseName: '🕷️ 거대 거미', originX: 50, originZ: 4, patrolRadius: 10, chaseSpeed: 0.09, patrolSpeed: 0.04, geo: new THREE.SphereGeometry(1.0, 12, 12), color: 0x8e44ad, baseHp: 85, baseDmg: 7, type: 'spider' },
    { id: 'skeleton2', baseName: '👻 정예 해골', originX: 62, originZ: -3, patrolRadius: 12, chaseSpeed: 0.08, patrolSpeed: 0.035, geo: new THREE.CylinderGeometry(0.55, 0.55, 2.1, 8), color: 0xdcdde1, baseHp: 95, baseDmg: 8, type: 'biped' }
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

    const mMesh = new THREE.Mesh(m.geo, new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.4 }));
    mMesh.position.set(m.x, 1.0, m.z);
    forestGroup.add(mMesh);
    m.mesh = mMesh;

    updateMonsterHpSprite(m);
});

// -------------------------------------------------------------
// 🌐 3D 시점 회전 & 터치 드래그 인터랙션
// -------------------------------------------------------------
container.addEventListener('pointerdown', (e) => {
    initAudio();
    if (gameState !== 'PLAYING') return;

    isPointerDragging = true;
    previousPointerX = e.clientX;
    previousPointerY = e.clientY;

    if (currentMap === 'VILLAGE') {
        const distToBs = Math.hypot(player3D.x - 0, player3D.z - 0.2);
        if (distToBs < 5.2) {
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
        if (dist < 8.0 && dist < minDist) {
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
        triggerDialogueOrAttack(false);
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
    player3D.z = 7.0;
    playCustomSound('door');
    updateUI();
}

function goToForestMap() {
    currentMap = 'FOREST';
    villageGroup.visible = false;
    blacksmithInteriorGroup.visible = false;
    forestGroup.visible = true;

    // 넓어진 숲 서쪽 게이트 입구에서 시작
    player3D.x = -64;
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
// 대화 및 칼 휘두르기 공격 액션
// -------------------------------------------------------------
function triggerDialogueOrAttack(preferTalk = false) {
    if (gameState !== 'PLAYING') return;

    if (currentMap === 'VILLAGE') {
        const distToBs = Math.hypot(player3D.x - 0, player3D.z - 0.2);
        if (distToBs < 5.2) {
            enterBlacksmithInterior();
            return;
        }

        const distToForestGate = Math.hypot(player3D.x - 22, player3D.z - 0);
        if (distToForestGate < 5.0) {
            goToForestMap();
            return;
        }
    } else if (currentMap === 'FOREST') {
        const distToVillageGate = Math.hypot(player3D.x - (-70), player3D.z - 0);
        if (distToVillageGate < 5.0) {
            goToVillageMap();
            return;
        }
    } else if (currentMap === 'BLACKSMITH_INTERIOR') {
        const distToExit = Math.hypot(player3D.x - 0, player3D.z - 8.0);
        if (distToExit < 4.0) {
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
        if (dist < 8.0 && dist < minDist) {
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
        let hitAny = false;
        monsters3D.forEach(m => {
            if (m.alive) {
                const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                if (dist <= ATTACK_RANGE) {
                    damageMonster(m);
                    hitAny = true;
                }
            }
        });
    }
}

// -------------------------------------------------------------
// NPC 대화 및 대장간 UI
// -------------------------------------------------------------
let currentNpc = null;

function openNpcDialogue(npc) {
    currentNpc = npc;
    npcAvatar.textContent = npc.avatar;
    npcName.textContent = npc.name;
    npcRole.textContent = npc.role;
    dialogueStory.textContent = npc.story;

    if (npc.id === 'villager2') {
        forgePanel.classList.remove('hidden');
        updateForgeUI();
    } else {
        forgePanel.classList.add('hidden');
    }

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

    const isSuccess = Math.random() < 0.5;
    forgeAttempts++;

    if (isSuccess) {
        swordDamage += 5;
        playCustomSound('powerup');
        updateForgeUI(`🎉 [강화 성공!] 칼 데미지가 +5 상승했습니다! (현재: Lv.강화, 데미지: ${swordDamage})`);
    } else {
        playCustomSound('hit');
        updateForgeUI(`💥 [강화 실패!] 안타깝게도 강철 단련에 실패했습니다... (다음 도전: ${getForgeCost()}코인)`);
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

    // 맞으면 용사 쪽으로 밀려남(넉백)
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

        coins += 10;
        totalCoinsEarned += 10;

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
            if (m.alive) {
                m.hp = Math.min(m.hp + 30, m.maxHp);
            }
            updateMonsterHpSprite(m);
        });

        playCustomSound('yap');
        showLevelUpToast(`🎉 LEVEL UP! Lv.${level} 달성! (몬스터 피 +30 상승!)`);
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
                q.desc = `숲속 몬스터 처치하기 (진행: ${Math.min(monstersSlain, q.targetCount)}/${q.targetCount})`;
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
    hpTextSpan.textContent = `${Math.ceil(hp)} / ${maxHp}`;

    const expRatio = Math.min(100, Math.floor((exp / targetExp) * 100));
    expBarFill.style.width = `${expRatio}%`;
    expTextSpan.textContent = `${exp} / ${targetExp}`;

    if (currentMap === 'VILLAGE') {
        locationNameSpan.textContent = '🏡 3D 평화로운 마을';
    } else if (currentMap === 'BLACKSMITH_INTERIOR') {
        locationNameSpan.textContent = '⚒️ 3D 대장간 내부';
    } else {
        locationNameSpan.textContent = '🌲 3D 드넓은 대자연 숲속';
    }
}

function startGame() {
    initAudio();
    gameState = 'PLAYING';
    currentMap = 'VILLAGE';
    level = 1;
    hp = 150;
    maxHp = 150;
    lastRenderedHp = 150;
    exp = 0;
    swordDamage = 10;
    coins = 0;
    totalCoinsEarned = 0;
    monstersSlain = 0;
    questsCompletedCount = 0;
    forgeAttempts = 0;
    yaw = 0;
    pitch = 0;
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
        m.mesh.position.set(m.x, 1.0, m.z);

        const stats = getMonsterStats(m.baseHp, m.baseDmg, 1);
        m.maxHp = stats.maxHp;
        m.hp = stats.maxHp;
        m.touchDmg = stats.touchDmg;
        m.expReward = stats.expReward;
        updateMonsterHpSprite(m);
    });

    startOverlay.style.display = 'none';
    startOverlay.style.visibility = 'hidden';
    startOverlay.style.pointerEvents = 'none';
    startOverlay.classList.remove('active');
    startOverlay.classList.add('hidden');

    resultOverlay.classList.remove('active');
    resultOverlay.classList.add('hidden');
    dialogueModal.style.display = 'none';

    updateUI();
}

btnStartGame.onclick = function(e) {
    if (e) e.stopPropagation();
    startGame();
    try {
        container.requestPointerLock();
    } catch (err) {}
};

function finishGame() {
    gameState = 'GAMEOVER';

    if (document.pointerLockElement === container) {
        document.exitPointerLock();
    }

    resultLevelSpan.textContent = `Lv.${level}`;
    resultMaxHpSpan.textContent = `${maxHp}`;
    resultMonstersSpan.textContent = `${monstersSlain}마리`;
    resultCoinsSpan.textContent = `${totalCoinsEarned}코인`;

    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('active');
}

// -------------------------------------------------------------
// 3D 1인칭 메인 애니메이션 & 살아있는 몬스터 배회/추격 루프
// -------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

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

        // 📏 상향된 시점 키 높이 2.5 적용!
        camera.position.set(player3D.x, PLAYER_HEIGHT, player3D.z);

        // 맵별 근접 감지 & 맵 전환
        if (currentMap === 'VILLAGE') {
            const distToBsDoor = Math.hypot(player3D.x - 0, player3D.z - 0.2);
            if (distToBsDoor < 5.2) {
                proximityNpcText.textContent = `⚒️ [대장간 건물 입구] 근처! (터치/Space 누르면 대장간 입장!)`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                let activeNpcs = npcsVillage;
                let nearestNpc = null;
                let minDist = 999;
                activeNpcs.forEach(npc => {
                    const dist = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
                    if (dist < 8.0 && dist < minDist) {
                        minDist = dist;
                        nearestNpc = npc;
                    }
                });

                if (nearestNpc) {
                    proximityNpcText.textContent = `💬 [${nearestNpc.name}] 근처! [💬 대화하기] 누르기`;
                    npcProximityPrompt.classList.remove('hidden');
                } else {
                    npcProximityPrompt.classList.add('hidden');
                }
            }

            if (player3D.x > 21) {
                goToForestMap();
            }
        } else if (currentMap === 'BLACKSMITH_INTERIOR') {
            const distToBs = Math.hypot(player3D.x - blacksmithNpc.x, player3D.z - blacksmithNpc.z);
            if (distToBs < 8.0) {
                proximityNpcText.textContent = `🧔 [대장장이 철수] 근처! [💬 대화하기] 누르기`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                npcProximityPrompt.classList.add('hidden');
            }

            if (player3D.x < -9) player3D.x = -9;
            if (player3D.x > 9) player3D.x = 9;
            if (player3D.z < -9) player3D.z = -9;
            if (player3D.z > 8.5) {
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
            // 넓어진 숲 맵 경계 제한
            if (player3D.x < -75) player3D.x = -75;
            if (player3D.x > 75) player3D.x = 75;
            if (player3D.z < -45) player3D.z = -45;
            if (player3D.z > 45) player3D.z = 45;

            // 마을로 돌아가는 서쪽 게이트 감지
            const distToVillageGate = Math.hypot(player3D.x - (-70), player3D.z - 0);
            if (distToVillageGate < 5.0) {
                proximityNpcText.textContent = `🏡 [마을 입구 포탈] 근처! (Space 누르면 마을 복귀)`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                npcProximityPrompt.classList.add('hidden');
            }

            if (player3D.x < -72) {
                goToVillageMap();
            }
        }

        // 칼 휘두르기 애니메이션
        if (player3D.isAttacking) {
            player3D.attackTimer--;
            if (player3D.attackTimer <= 0) {
                player3D.isAttacking = false;
                fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
            }
        }

        // 🌲 숲속 몬스터 실시간 살아있는 이동 & 추격 AI
        if (currentMap === 'FOREST') {
            let hpChanged = false;

            monsters3D.forEach(m => {
                if (m.alive) {
                    m.animCycle += 0.08;
                    const distToPlayer = Math.hypot(player3D.x - m.x, player3D.z - m.z);

                    // 1. 용사가 사정거리 내에 들어온 경우 ➔ 용사를 향해 맹렬히 추격!
                    if (distToPlayer < AGGRO_RANGE) {
                        m.mesh.lookAt(player3D.x, 1.0, player3D.z);
                        const dx = player3D.x - m.x;
                        const dz = player3D.z - m.z;

                        if (distToPlayer > 1.3) {
                            m.x += (dx / distToPlayer) * m.chaseSpeed;
                            m.z += (dz / distToPlayer) * m.chaseSpeed;
                        }

                        // 몬스터 종류별 살아있는 추격 애니메이션
                        if (m.type === 'slime') {
                            const bounce = Math.abs(Math.sin(m.animCycle * 2)) * 0.5;
                            m.mesh.position.set(m.x, 0.8 + bounce, m.z);
                        } else if (m.type === 'spider') {
                            const crawl = Math.sin(m.animCycle * 3) * 0.15;
                            m.mesh.position.set(m.x, 1.0 + crawl, m.z);
                        } else {
                            const stepBob = Math.abs(Math.sin(m.animCycle * 1.5)) * 0.25;
                            m.mesh.position.set(m.x, 1.0 + stepBob, m.z);
                        }

                        // 용사와 부딪혔을 때 지속 데미지
                        if (distToPlayer < 1.8) {
                            hp -= (m.touchDmg / 60);
                            hpChanged = true;
                        }
                    } 
                    // 2. 평상시 상태 ➔ 가만히 있지 않고 구역 주변을 계속 배회(Patrol)!
                    else {
                        m.patrolTimer--;

                        // 새로운 배회 목적지 설정 (주기적으로 새로운 곳으로 산책)
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

                        if (pDist > 0.3) {
                            m.mesh.lookAt(m.targetX, 1.0, m.targetZ);
                            m.x += (pDx / pDist) * m.patrolSpeed;
                            m.z += (pDz / pDist) * m.patrolSpeed;

                            // 몬스터 종류별 살아있는 배회 애니메이션
                            if (m.type === 'slime') {
                                const bounce = Math.abs(Math.sin(m.animCycle)) * 0.35;
                                m.mesh.position.set(m.x, 0.8 + bounce, m.z);
                            } else {
                                const stepBob = Math.abs(Math.sin(m.animCycle)) * 0.15;
                                m.mesh.position.set(m.x, 1.0 + stepBob, m.z);
                            }
                        } else {
                            // 목표 지점 도착 시 가벼운 숨쉬기 모션
                            m.mesh.position.set(m.x, 1.0 + Math.sin(m.animCycle * 0.5) * 0.05, m.z);
                        }
                    }
                } else {
                    // 쓰러진 몬스터 리스폰 카운트
                    m.respawnTimer--;
                    if (m.respawnTimer <= 0) {
                        m.alive = true;
                        m.x = m.originX;
                        m.z = m.originZ;
                        m.targetX = m.originX;
                        m.targetZ = m.originZ;
                        m.mesh.position.set(m.x, 1.0, m.z);
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

            if (hp <= 0) {
                hp = 0;
                finishGame();
            }
        }
    }

    renderer.render(scene, camera);
}

btnFinishGame.onclick = finishGame;
btnRestartGame.onclick = startGame;

animate();
