// -------------------------------------------------------------
// 3D 1인칭 용사의 모험 RPG v18 Engine (캐릭터 키 시점 높이 2.5 상향)
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

// 📏 [핵심 요청 구현] 용사 캐릭터 키 높이 (기존 1.6 ➔ 2.5 상향!)
const PLAYER_HEIGHT = 2.5;

// 🔨 칼 강화 상태 변수
let forgeAttempts = 0;
function getForgeCost() {
    return 100 + (forgeAttempts * 10);
}

const ATTACK_RANGE = 6.5;
const AGGRO_RANGE = 12.0;

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
        m.hpSprite.position.set(0, 1.8, 0);
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

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(900, 500);
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
dirLight.position.set(15, 30, 20);
scene.add(dirLight);

scene.fog = new THREE.FogExp2(0x0a101d, 0.015);

const villageGroup = new THREE.Group();
const blacksmithInteriorGroup = new THREE.Group();
const forestGroup = new THREE.Group();

scene.add(villageGroup);
scene.add(blacksmithInteriorGroup);
scene.add(forestGroup);

blacksmithInteriorGroup.visible = false;
forestGroup.visible = false;

// 1인칭 칼 (First-Person Sword)
const fpSwordGroup = new THREE.Group();
const fpBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.8, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xf1f2f6, metalness: 0.9, roughness: 0.1 })
);
fpBlade.position.set(0, 0.8, 0);

const fpHilt = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.09, 0.09),
    new THREE.MeshStandardMaterial({ color: 0xffd32a })
);
fpHilt.position.set(0, 0, 0);

fpSwordGroup.add(fpBlade);
fpSwordGroup.add(fpHilt);
fpSwordGroup.position.set(0.48, -0.5, -0.85);
fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
camera.add(fpSwordGroup);

// 플레이어 물리 위치
const player3D = {
    x: -14,
    z: 0,
    baseSpeed: 0.16,
    runSpeed: 0.3,
    isAttacking: false,
    attackTimer: 0
};

// 📏 시점 높이 2.5 적용!
camera.position.set(player3D.x, PLAYER_HEIGHT, player3D.z);

// -------------------------------------------------------------
// 3D 마을 (Map 1) 에셋 & 포탈
// -------------------------------------------------------------
const villageFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8 })
);
villageFloor.rotation.x = -Math.PI / 2;
villageGroup.add(villageFloor);

function createNormalHouse(x, z, color) {
    const house = new THREE.Group();
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2.8, 3.5),
        new THREE.MeshStandardMaterial({ color: color })
    );
    wall.position.y = 1.4;
    house.add(wall);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0xc0392b })
    );
    roof.position.y = 3.8;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    house.position.set(x, 0, z);
    villageGroup.add(house);
}
createNormalHouse(-18, -6, 0xe67e22);
createNormalHouse(18, -6, 0xd35400);

function createTree(x, z) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
    );
    trunk.position.y = 1.5;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.8),
        new THREE.MeshStandardMaterial({ color: 0x10ac84, roughness: 0.5 })
    );
    leaves.position.y = 3.6;
    tree.add(leaves);

    tree.position.set(x, 0, z);
    villageGroup.add(tree);
}
createTree(-10, -6);
createTree(10, -6);

// ⚒️ 마을 한가운데 3D 대장간 건물
const blacksmithBuilding = new THREE.Group();
const bsWall = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 3.2, 4.8),
    new THREE.MeshStandardMaterial({ color: 0x546de5, roughness: 0.5 })
);
bsWall.position.y = 1.6;
blacksmithBuilding.add(bsWall);

const bsRoof = new THREE.Mesh(
    new THREE.ConeGeometry(4.4, 2.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x303952 })
);
bsRoof.position.y = 4.4;
bsRoof.rotation.y = Math.PI / 4;
blacksmithBuilding.add(bsRoof);

const bsChimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
);
bsChimney.position.set(1.6, 3.9, -1.0);
blacksmithBuilding.add(bsChimney);

const bsSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.8, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffd32a })
);
bsSign.position.set(0, 2.7, 2.5);
blacksmithBuilding.add(bsSign);

const bsAnvil = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.8 })
);
bsAnvil.position.set(-1.8, 0.35, 2.7);
blacksmithBuilding.add(bsAnvil);

const bsDoorTag = createTagSprite('⚒️ [Space/터치] 대장간 들어가기', '#ff9f43');
bsDoorTag.position.set(0, 2.2, 2.7);
blacksmithBuilding.add(bsDoorTag);

blacksmithBuilding.position.set(0, 0, -2.5);
villageGroup.add(blacksmithBuilding);

// 🌲 마을 동쪽 포탈 게이트
const forestGateInVillage = new THREE.Group();
const gatePillarLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4.0, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
);
gatePillarLeft.position.set(-2, 2, 0);
forestGateInVillage.add(gatePillarLeft);

const gatePillarRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4.0, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
);
gatePillarRight.position.set(2, 2, 0);
forestGateInVillage.add(gatePillarRight);

const gateArch = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x1abc9c })
);
gateArch.position.set(0, 4.2, 0);
forestGateInVillage.add(gateArch);

const forestPortalTag = createTagSprite('🌲 [Space/터치] 숲속 맵 들어가기', '#00f3ff');
forestPortalTag.position.set(0, 5.2, 0);
forestGateInVillage.add(forestPortalTag);

forestGateInVillage.position.set(22, 0, 0);
villageGroup.add(forestGateInVillage);

// 마을 귀여운 3D NPC 5명
const npcsVillage = [
    { 
        id: 'elder', 
        name: '마을 이장님', 
        role: '마을 수호자', 
        avatar: '👴', 
        x: -11, 
        z: 0, 
        color: 0xffdd59, 
        story: "허허, 어서오게 젊은 용사여!\n우리 마을은 평화로워 보이지만, 동쪽 숲속 포탈 너머에는 무시무시한 몬스터들이 점점 도사리고 있다네.\n숲으로 떠나기 전에 마을 중앙 대장간에 들러 대장장이에게 칼을 점검받아보게나!",
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
        story: "안녕하세요 용사님! 전 마을 아픈 주민들을 치료할 상처 약초를 모으는 주희예요.\n요즘 숲속 슬라임들이 약초밭을 다 망쳐놓고 있어요...\n용사님께서 숲속 몬스터들을 혼내주시면 약초도 구하고 넉넉한 보상을 드릴게요!",
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
        story: "와! 칼을 든 멋진 용사 형이다!\n형, 마을 동쪽 끝 게이트 포탈을 지나가면 커다란 숲이 나오는데, 거기 무서운 골렘이랑 독거미도 있대요!\n몬스터를 무찌를수록 계속 강해진대요! 조심해서 다녀오세요!",
        quest: { title: "숲속 탐험", desc: "숲 맵으로 건너가 탐험해보기", targetType: "explore", rewardExp: 30, active: false, completed: false } 
    },
    { 
        id: 'villager4', 
        name: '정원사 영희', 
        role: '마을 주민', 
        avatar: '👩', 
        x: 10, 
        z: 0, 
        color: 0x9b59b6, 
        story: "향기로운 제 장미 정원이 숲속 독거미들의 거미줄 때문에 다 시들어버리고 있어요...\n멋진 칼솜씨로 몬스터들을 소탕해주시면 제 장미꽃들이 다시 예쁘게 피어날 수 있답니다!",
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
        story: "전 세계 7대 대륙을 주름잡았던 전설의 모험가 한스라고 부르게!\n진정한 모험가의 실력은 몬스터들의 강력한 공격 속에서도 굴하지 않는 법이지.\n레벨을 3까지 올려 자네의 용기를 증명해보게나!",
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

// 🔥 1. 용광로
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

// 🪵 2. 땔감 장작
const firewoodGroup = new THREE.Group();
for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
    );
    log.rotation.z = Math.PI / 2;
    log.position.set((i % 2) * 0.4, Math.floor(i / 2) * 0.35 + 0.18, (i % 3) * 0.3);
    firewoodGroup.add(log);
}
firewoodGroup.position.set(-8.5, 0, -6.5);
blacksmithInteriorGroup.add(firewoodGroup);

// 🗡️ 3. 무기 거치대 & 방패
const weaponRackGroup = new THREE.Group();
const rackBack = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 2.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
);
weaponRackGroup.add(rackBack);

for (let s = -1; s <= 1; s += 2) {
    const displaySword = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.8, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xf1f2f6, metalness: 0.8 })
    );
    displaySword.position.set(s * 1.2, 0, 0.2);
    displaySword.rotation.z = s * (Math.PI / 6);
    weaponRackGroup.add(displaySword);
}

const displayShield = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x2980b9, metalness: 0.9 })
);
displayShield.rotation.x = Math.PI / 2;
displayShield.position.set(0, 0, 0.25);
weaponRackGroup.add(displayShield);

weaponRackGroup.position.set(4.5, 3.2, -9.7);
blacksmithInteriorGroup.add(weaponRackGroup);

// 🔨 4. 작업대 & 모루 & 뜨거운 철괴
const workTableGroup = new THREE.Group();
const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.4, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x5f27cd })
);
tableTop.position.y = 0.9;
workTableGroup.add(tableTop);

for (let lx of [-1.3, 1.3]) {
    for (let lz of [-0.5, 0.5]) {
        const leg = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.9, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x341f97 })
        );
        leg.position.set(lx, 0.45, lz);
        workTableGroup.add(leg);
    }
}

const anvilMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x1e272e, metalness: 0.95 })
);
anvilMesh.position.set(-0.5, 1.45, 0);
workTableGroup.add(anvilMesh);

const hotIronBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.12, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0xff7675, emissiveIntensity: 1.0 })
);
hotIronBar.position.set(-0.5, 1.86, 0);
workTableGroup.add(hotIronBar);

workTableGroup.position.set(0, 0, -3.5);
blacksmithInteriorGroup.add(workTableGroup);

// 📦 5. 보물 상자 & 물통
const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 1.3, 12),
    new THREE.MeshStandardMaterial({ color: 0x747d8c })
);
barrel.position.set(-8, 0.65, 3);
blacksmithInteriorGroup.add(barrel);

const chest = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xffa502 })
);
chest.position.set(7.5, 0.45, -7.5);
blacksmithInteriorGroup.add(chest);

// 🚪 출구 문 3D 태그
const exitDoorTag = createTagSprite('🚪 [Space] 마을로 나가기', '#ff9f43');
exitDoorTag.position.set(0, 2.2, 8);
blacksmithInteriorGroup.add(exitDoorTag);

// 🧔 3D 대장장이 NPC
const blacksmithNpc = {
    id: 'villager2',
    name: '대장장이 철수',
    role: '3D 대장간 장인',
    avatar: '🧔',
    x: 1.8,
    z: -3.5,
    color: 0xe67e22,
    story: "뜨거운 불꽃이 타오르는 대장간에 잘 왔네 용사여!\n몬스터를 무찌르고 모아온 코인으로 칼을 단련해보게나!\n기본 강화 비용은 100코인이며, 강화 성공 확률은 50%라네! 성공하면 칼 공격력이 무려 +5 올라가지!\n재도전할 때마다 필요 코인이 10원씩 더 늘어나니 신중하게 도전하게나!",
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
// 🌲 3D 숲속 맵 (Map 3) - 울창한 3D 나무 확장
// -------------------------------------------------------------
const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.9 })
);
forestFloor.rotation.x = -Math.PI / 2;
forestGroup.add(forestFloor);

function createDetailedForestTree(x, z, typeIndex, scaleRatio = 1.0) {
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 * scaleRatio, 0.5 * scaleRatio, 3.8 * scaleRatio, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 })
    );
    trunk.position.y = (1.9 * scaleRatio);
    treeGroup.add(trunk);

    const leafColors = [0x2ecc71, 0x1abc9c, 0x27ae60, 0x16a085];
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

const forestTreePositions = [
    { x: -24, z: -10, type: 0, s: 1.1 }, { x: -18, z: -11, type: 1, s: 0.9 },
    { x: -12, z: -9,  type: 2, s: 1.2 }, { x: -6,  z: -12, type: 0, s: 1.0 },
    { x: 0,   z: -10, type: 1, s: 1.15 }, { x: 6,   z: -11, type: 2, s: 0.95 },
    { x: 12,  z: -9,  type: 0, s: 1.1 }, { x: 18, z: -12, type: 1, s: 1.0 },
    { x: 24,  z: -10, type: 2, s: 1.25 },

    { x: -24, z: 10,  type: 1, s: 1.0 }, { x: -18, z: 12,  type: 2, s: 1.2 },
    { x: -12, z: 11,  type: 0, s: 0.9 }, { x: -6,  z: 9,   type: 1, s: 1.1 },
    { x: 0,   z: 12,  type: 2, s: 1.05 }, { x: 6,   z: 10,  type: 0, s: 1.15 },
    { x: 12,  z: 11,  type: 1, s: 0.95 }, { x: 18, z: 9,   type: 2, s: 1.2 },
    { x: 24,  z: 12,  type: 0, s: 1.0 },

    { x: -16, z: -5,  type: 2, s: 0.85 }, { x: -10, z: 5,   type: 0, s: 1.1 },
    { x: -4,  z: -4,  type: 1, s: 0.9 },  { x: 4,   z: 5,   type: 2, s: 1.0 },
    { x: 10,  z: -5,  type: 0, s: 1.2 },  { x: 16,  z: 4,   type: 1, s: 0.95 },
    { x: 22,  z: -4,  type: 2, s: 1.1 }
];

forestTreePositions.forEach(p => {
    createDetailedForestTree(p.x, p.z, p.type, p.s);
});

function createForestMushroom(x, z) {
    const shroom = new THREE.Group();
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    stem.position.y = 0.2;
    shroom.add(stem);

    const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.3, 10),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c })
    );
    cap.position.y = 0.45;
    shroom.add(cap);

    shroom.position.set(x, 0, z);
    forestGroup.add(shroom);
}
createForestMushroom(-15, -3);
createForestMushroom(-8, 3);
createForestMushroom(-2, -4);
createForestMushroom(5, 3);
createForestMushroom(11, -3);
createForestMushroom(17, 3);

function createTreeStump(x, z) {
    const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.7, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x5e35b1, roughness: 0.9 })
    );
    stump.position.set(x, 0.25, z);
    forestGroup.add(stump);
}
createTreeStump(-11, -2);
createTreeStump(1, 4);
createTreeStump(13, -2);

// 마을로 돌아가는 게이트
const villageGateInForest = new THREE.Group();
const vGateLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4.0, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf1c40f })
);
vGateLeft.position.set(-2, 2, 0);
villageGateInForest.add(vGateLeft);

const vGateRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4.0, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf1c40f })
);
vGateRight.position.set(2, 2, 0);
villageGateInForest.add(vGateRight);

const vGateArch = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xf39c12 })
);
vGateArch.position.set(0, 4.2, 0);
villageGateInForest.add(vGateArch);

const villagePortalTag = createTagSprite('🏡 [Space] 마을 맵으로 돌아가기', '#ffd32a');
villagePortalTag.position.set(0, 5.2, 0);
villageGateInForest.add(villagePortalTag);

villageGateInForest.position.set(-22, 0, 0);
forestGroup.add(villageGateInForest);

function getMonsterStats(baseHp, baseDmg, pLevel) {
    const scaledMaxHp = baseHp + (pLevel - 1) * 30;
    return {
        maxHp: scaledMaxHp,
        touchDmg: baseDmg + (pLevel - 1) * 2,
        expReward: 35 + (pLevel - 1) * 10
    };
}

// 몬스터 6종 (기본 피: 50 ~ 100)
const monsters3D = [
    { id: 'slime', baseName: '🟢 숲 슬라임', originX: -14, originZ: 0, chaseSpeed: 0.05, geo: new THREE.DodecahedronGeometry(0.8), color: 0x2ecc71, baseHp: 50, baseDmg: 5 },
    { id: 'goblin', baseName: '🔴 분노한 고블린', originX: -6, originZ: -2, chaseSpeed: 0.08, geo: new THREE.BoxGeometry(1.2, 1.4, 1.2), color: 0xe74c3c, baseHp: 60, baseDmg: 6 },
    { id: 'wolf', baseName: '🐺 숲 늑대', originX: 2, originZ: 2, chaseSpeed: 0.09, geo: new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8), color: 0x7f8c8d, baseHp: 70, baseDmg: 7 },
    { id: 'spider', baseName: '🕷️ 독 거미', originX: 14, originZ: 1, chaseSpeed: 0.085, geo: new THREE.SphereGeometry(0.9, 12, 12), color: 0x9b59b6, baseHp: 80, baseDmg: 6 },
    { id: 'skeleton', baseName: '👻 해골 전사', originX: 20, originZ: -2, chaseSpeed: 0.065, geo: new THREE.CylinderGeometry(0.5, 0.5, 2.0, 8), color: 0xf1f2f6, baseHp: 90, baseDmg: 7 },
    { id: 'golem', baseName: '🗿 암석 골렘', originX: 8, originZ: -1, chaseSpeed: 0.045, geo: new THREE.BoxGeometry(1.6, 2.0, 1.6), color: 0x95a5a6, baseHp: 100, baseDmg: 8 }
];

monsters3D.forEach(m => {
    m.x = m.originX;
    m.z = m.originZ;
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
// 🌐 3D 시점 회전 & 대장간/포탈 우선 감지 터치
// -------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

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
// 입력 및 대화/포탈/강화 처리
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

// 💬 [주민 대화하기] 전용 버튼
btnTalk.onclick = function(e) {
    if (e) e.stopPropagation();
    initAudio();
    triggerDialogueOrAttack(true);
};

btnShiftLock.onclick = function() { initAudio(); toggleShiftLock(); };
btnAttack.onclick = function() { initAudio(); triggerDialogueOrAttack(false); };

function enterBlacksmithInterior() {
    currentMap = 'BLACKSMITH_INTERIOR';
    villageGroup.visible = false;
    blacksmithInteriorGroup.visible = true;
    forestGroup.visible = false;

    player3D.x = 0;
    player3D.z = 6;
    playCustomSound('door');
    updateUI();
}

function goToForestMap() {
    currentMap = 'FOREST';
    villageGroup.visible = false;
    blacksmithInteriorGroup.visible = false;
    forestGroup.visible = true;

    player3D.x = -18;
    player3D.z = 0;
    playCustomSound('door');
    checkQuests();
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

function triggerDialogueOrAttack(forceDialogueOnly = false) {
    if (gameState !== 'PLAYING') return;

    if (currentMap === 'VILLAGE') {
        const distToBsDoor = Math.hypot(player3D.x - 0, player3D.z - 0.2);
        if (distToBsDoor < 5.2) {
            enterBlacksmithInterior();
            return;
        }

        const distToForestPortal = Math.hypot(player3D.x - 22, player3D.z - 0);
        if (distToForestPortal < 4.0) {
            goToForestMap();
            return;
        }
    }

    if (currentMap === 'BLACKSMITH_INTERIOR') {
        if (player3D.z > 7.0) {
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

    if (currentMap === 'FOREST') {
        const distToVillagePortal = Math.hypot(player3D.x - (-22), player3D.z - 0);
        if (distToVillagePortal < 4.0) {
            goToVillageMap();
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
        return;
    }

    if (forceDialogueOnly) {
        showLevelUpToast('💡 근처에 주민이 없습니다! 대장간 입구나 주민에게 더 가까이 가보세요!');
        return;
    }

    if (!player3D.isAttacking) {
        player3D.isAttacking = true;
        player3D.attackTimer = 14;
        playCustomSound('ching');

        fpSwordGroup.rotation.set(-Math.PI / 3, 0, -Math.PI / 2);

        if (currentMap === 'FOREST') {
            monsters3D.forEach(m => {
                if (m.alive) {
                    const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                    if (dist < ATTACK_RANGE) {
                        damageMonster(m);
                    }
                }
            });
        }
    }
}

// 💬 NPC 대화 모달 렌더링
let currentNpc = null;
function openNpcDialogue(npc) {
    currentNpc = npc;
    const q = npc.quest;
    npcAvatar.textContent = npc.avatar;
    npcName.textContent = npc.name;
    npcRole.textContent = npc.role;

    dialogueStory.textContent = npc.story;

    if (npc.id === 'villager2') {
        forgePanel.classList.remove('hidden');
        updateForgeUI('강화 버튼을 눌러 칼을 강화해보세요!');
    } else {
        forgePanel.classList.add('hidden');
    }

    if (q.completed) {
        dialogueText.textContent = `🎉 정말 감사합니다 용사님! '${q.title}' 퀘스트를 완료하셨군요! (보상 획득 완료)`;
        btnAcceptQuest.style.display = 'none';
    } else if (q.active) {
        dialogueText.textContent = `📜 진행 중인 퀘스트: ${q.desc}`;
        btnAcceptQuest.style.display = 'none';
    } else {
        dialogueText.textContent = `📜 퀘스트 요청: '${q.title}' (${q.desc})`;
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

    updateMonsterHpSprite(m);

    if (m.hp <= 0) {
        m.hp = 0;
        m.alive = false;
        m.respawnTimer = 100;
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
        locationNameSpan.textContent = '🌲 3D 다채로운 숲속';
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
    // 📏 키 높이 2.5 적용!
    camera.position.set(player3D.x, PLAYER_HEIGHT, player3D.z);

    monsters3D.forEach(m => {
        m.x = m.originX;
        m.z = m.originZ;
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
// 3D 1인칭 메인 애니메이션 & 대장간/NPC 실시간 근접 감지 루프
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
        } else if (currentMap === 'BLACKSMITH_INTERIOR') {
            const distToBs = Math.hypot(player3D.x - blacksmithNpc.x, player3D.z - blacksmithNpc.z);
            if (distToBs < 8.0) {
                proximityNpcText.textContent = `🧔 [대장장이 철수] 근처! [💬 대화하기] 누르기`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                npcProximityPrompt.classList.add('hidden');
            }
        } else {
            npcProximityPrompt.classList.add('hidden');
        }

        if (currentMap === 'VILLAGE' && player3D.x > 21) {
            goToForestMap();
        } else if (currentMap === 'FOREST' && player3D.x < -21) {
            goToVillageMap();
        }

        if (currentMap === 'BLACKSMITH_INTERIOR') {
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
        }

        if (player3D.isAttacking) {
            player3D.attackTimer--;
            if (player3D.attackTimer <= 0) {
                player3D.isAttacking = false;
                fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
            }
        }

        if (currentMap === 'FOREST') {
            let hpChanged = false;
            monsters3D.forEach(m => {
                if (m.alive) {
                    const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);

                    if (dist < AGGRO_RANGE) {
                        m.mesh.lookAt(player3D.x, 1.0, player3D.z);
                        const dx = player3D.x - m.x;
                        const dz = player3D.z - m.z;
                        if (dist > 1.2) {
                            m.x += (dx / dist) * m.chaseSpeed;
                            m.z += (dz / dist) * m.chaseSpeed;
                            m.mesh.position.set(m.x, 1.0, m.z);
                        }
                    } else {
                        const returnDx = m.originX - m.x;
                        const returnDz = m.originZ - m.z;
                        const returnDist = Math.hypot(returnDx, returnDz);
                        if (returnDist > 0.2) {
                            m.x += (returnDx / returnDist) * (m.chaseSpeed * 0.4);
                            m.z += (returnDz / returnDist) * (m.chaseSpeed * 0.4);
                            m.mesh.position.set(m.x, 1.0, m.z);
                        }
                    }

                    if (dist < 1.8) {
                        hp -= (m.touchDmg / 60);
                        hpChanged = true;
                    }
                } else {
                    m.respawnTimer--;
                    if (m.respawnTimer <= 0) {
                        m.alive = true;
                        m.x = m.originX;
                        m.z = m.originZ;
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
