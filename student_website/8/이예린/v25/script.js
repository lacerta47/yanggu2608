// -------------------------------------------------------------
// 3D 1인칭 용사의 모험 RPG v25 Engine
// (암흑 공허 낭떠러지 추락 사망 & 다크 네온 악마 몬스터 시스템)
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
            // 💀 낭떠러지 추락 시 소름 돋는 급하강 사운드
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
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
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.setValueAtTime(390, now + 0.1);
            osc.frequency.setValueAtTime(520, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
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
        ctx.strokeStyle = '#ffd32a';
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
        m.hpSprite.position.set(0, 2.5, 0);
    }

    const canvas = m.hpSpriteCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'Bold 19px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ff3838';
    ctx.textAlign = 'center';
    ctx.fillText(`[Lv.${level}] ${m.baseName} (⚔️${m.touchDmg})`, 128, 24);

    ctx.fillStyle = '#000000';
    ctx.fillRect(28, 42, 200, 20);

    const ratio = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = ratio > 0.4 ? '#a55eea' : '#ff3838';
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// 1인칭 용사의 칼 (FPS 뷰모델)
const fpSwordGroup = new THREE.Group();
const bladeGeo = new THREE.BoxGeometry(0.08, 0.9, 0.04);
const bladeMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, metalness: 0.9, roughness: 0.2, emissive: 0x00a8ff, emissiveIntensity: 0.5 });
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
        bladeMat.color.setHex(0xff0055);
        bladeMat.emissive.setHex(0xff0055);
        bladeMat.emissiveIntensity = 0.9;
    } else if (swordDamage >= 20) {
        bladeMat.color.setHex(0xffd32a);
        bladeMat.emissive.setHex(0xffd32a);
        bladeMat.emissiveIntensity = 0.8;
    } else if (swordDamage >= 15) {
        bladeMat.color.setHex(0x00f3ff);
        bladeMat.emissive.setHex(0x00a8ff);
        bladeMat.emissiveIntensity = 0.6;
    }
}

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

// 👀 눈동자 & 디테일 3D 파츠 생성 헬퍼 함수
function addDetailedEyes(parentGroup, eyeY, eyeZ, eyeSpacing = 0.18, eyeSize = 0.09, pupilColor = 0x111111) {
    const eyeWhiteGeo = new THREE.SphereGeometry(eyeSize, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilGeo = new THREE.SphereGeometry(eyeSize * 0.55, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: pupilColor });

    const leftWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftWhite.position.set(-eyeSpacing, eyeY, eyeZ);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-eyeSpacing, eyeY, eyeZ + eyeSize * 0.55);
    parentGroup.add(leftWhite);
    parentGroup.add(leftPupil);

    const rightWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightWhite.position.set(eyeSpacing, eyeY, eyeZ);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(eyeSpacing, eyeY, eyeZ + eyeSize * 0.55);
    parentGroup.add(rightWhite);
    parentGroup.add(rightPupil);
}

// -------------------------------------------------------------
// 🏡 3D 평화로운 마을 맵 (Map 1)
// -------------------------------------------------------------
const villageFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 26),
    new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.8 })
);
villageFloor.rotation.x = -Math.PI / 2;
villageGroup.add(villageFloor);

const villagePath = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 4),
    new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.6 })
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
    new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5 })
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
const gatePillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x2980b9 }));
gatePillar1.position.set(-2.5, 2.5, 0);
forestGate.add(gatePillar1);

const gatePillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), new THREE.MeshStandardMaterial({ color: 0x2980b9 }));
gatePillar2.position.set(2.5, 2.5, 0);
forestGate.add(gatePillar2);

const gateTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3498db }));
gateTop.position.set(0, 5.2, 0);
forestGate.add(gateTop);

const gateTag = createTagSprite('🌲 [Space] 악마의 숲 입장', '#ff3838');
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
        story: "허허, 어서오게 젊은 용사여!\n땅 바깥의 칠흑 같은 검은 공간으로 떨어지면 끝없는 낭떠러지로 즉사하니 조심하게나!\n300코인으로 칼을 단련하고 마을을 꼭 지켜주게!",
        chatLines: ["허허, 낭떠러지 쪽은 가지 말게나~", "주희 양, 약초는 잘 자라는가?", "민우야, 조심해서 놀아라!", "철수 자네 망치 소리가 우렁차군!"],
        quest: { title: "이장님의 청부", desc: "악마 몬스터 2마리 처치하기 (진행: 0/2)", targetType: "kill", targetCount: 2, rewardExp: 50, active: false, completed: false } 
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
        story: "안녕하세요 용사님! 마을 바깥 낭떠러지는 너무 어둡고 위험해요!\n용사님께서 300코인으로 칼을 단련해서 슬라임들을 혼내주세요!",
        chatLines: ["오늘 캔 약초 향이 참 좋아요!", "이장님, 건강 챙기세요~", "영희 씨, 장미꽃이 참 곱네요!"],
        quest: { title: "약초밭 지키기", desc: "악마 몬스터 4마리 처치하기 (진행: 0/4)", targetType: "kill", targetCount: 4, rewardExp: 60, active: false, completed: false } 
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
        color: 0xe74c3c, 
        hatColor: 0xc0392b,
        story: "와! 검은 공간으로 떨어지면 큰일나요!\n형, 얼른 칼을 강화해서 무시무시한 사신 해골을 물리쳐줘요!",
        chatLines: ["나도 용사처럼 멋진 검을 가질 테야!", "한스 아저씨, 낭떠러지는 무서워요!", "와아~ 숲속에 가보고 싶다!"],
        quest: { title: "숲속 탐험", desc: "넓어진 숲 맵으로 건너가 탐험해보기", targetType: "explore", rewardExp: 30, active: false, completed: false } 
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
        story: "안녕하세요! 검은 공허 절벽은 발을 헛디디면 위험하답니다.\n강화된 강력한 칼로 몬스터들을 소탕해주시면 예쁜 꽃들이 다시 활짝 필 거예요!",
        chatLines: ["꽃들에게 물을 줘야겠어요~", "주희 씨, 약초 냄새가 싱그럽네요!", "마을이 향기로 가득해요~"],
        quest: { title: "장미밭 구하기", desc: "악마 몬스터 6마리 처치하기 (진행: 0/6)", targetType: "kill", targetCount: 6, rewardExp: 80, active: false, completed: false } 
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
        story: "반갑네 젊은 용사여! 낭떠러지 바깥 공허는 한 번 빠지면 즉사한다네!\n대장장이 철수에게서 칼을 강력하게 벼려보게나!",
        chatLines: ["바람의 냄새가 모험을 부르는군...", "민우야, 절벽 쪽은 조심하렴!", "대장장이 철수 칼솜씨는 여전히 최고야."],
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

    addDetailedEyes(npcGroup, 1.5, 0.38, 0.15, 0.08, 0x1e272e);

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
createWall(18, 6, 0.5, 0, 3, -9);
createWall(0.5, 6, 18, -9, 3, 0);
createWall(0.5, 6, 18, 9, 3, 0);

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

forgeStoneGroup.position.set(-5.5, 0, -7);
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

const exitDoorTag = createTagSprite('🚪 [Space] 마을로 나가기', '#ff9f43');
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
    story: "뜨거운 불꽃이 타오르는 대장간에 잘 왔네 용사여!\n300코인으로 칼을 단련하면 붉은 악마 몬스터들도 단칼에 베어 넘길 수 있네!\n첫 강화 비용은 30코인이며, 성공 확률이 75%로 아주 높다네!",
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

addDetailedEyes(blacksmithGroup, 1.55, 0.4, 0.16, 0.08, 0x000000);

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
// 🌲 3D 악마의 숲 맵 (Map 3)
// -------------------------------------------------------------
const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 80),
    new THREE.MeshStandardMaterial({ color: 0x192a56, roughness: 0.9 })
);
forestFloor.rotation.x = -Math.PI / 2;
forestGroup.add(forestFloor);

function createDetailedForestTree(x, z, typeIndex, scaleRatio = 1.0) {
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 * scaleRatio, 0.5 * scaleRatio, 3.8 * scaleRatio, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.9 })
    );
    trunk.position.y = (1.9 * scaleRatio);
    treeGroup.add(trunk);

    const leafColors = [0x2c2c54, 0x4717f6, 0x706fd3, 0x341f97, 0x574b90];
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
    { x: -55, z: -25, type: 0, s: 1.2 }, { x: -50, z: 20, type: 1, s: 1.1 },
    { x: -45, z: -15, type: 2, s: 1.0 }, { x: -42, z: 12, type: 0, s: 1.3 },
    { x: -38, z: -28, type: 1, s: 0.9 }, { x: -35, z: 26, type: 2, s: 1.15 },
    { x: -30, z: -18, type: 0, s: 1.2 }, { x: -28, z: 18, type: 1, s: 1.05 },
    { x: -22, z: -28, type: 2, s: 1.3 }, { x: -20, z: 24, type: 0, s: 0.95 },
    { x: -14, z: -12, type: 1, s: 1.1 }, { x: -12, z: 10, type: 2, s: 1.2 },
    { x: 0,   z: -28, type: 1, s: 1.3 },  { x: 0,   z: 28, type: 2, s: 1.2 },
    { x: 6,   z: -18, type: 0, s: 1.0 },  { x: 8,   z: 22, type: 1, s: 1.15 },
    { x: 16,  z: -25, type: 2, s: 1.2 },  { x: 18,  z: 22, type: 0, s: 0.9 },
    { x: 24,  z: -16, type: 1, s: 1.1 },  { x: 26,  z: 14, type: 2, s: 1.3 },
    { x: 32,  z: -28, type: 0, s: 1.25 }, { x: 35,  z: 25, type: 1, s: 1.05 },
    { x: 42,  z: -18, type: 2, s: 1.1 },  { x: 44,  z: 18, type: 0, s: 1.2 },
    { x: 50,  z: -26, type: 1, s: 1.3 },  { x: 52,  z: 20, type: 2, s: 1.15 }
];
forestTreePositions.forEach(p => createDetailedForestTree(p.x, p.z, p.type, p.s));

// 마을 복귀 포탈
const villageGateInForest = new THREE.Group();
const vGateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0xff3838 }));
vGateLeft.position.set(-2.5, 2.5, 0);
villageGateInForest.add(vGateLeft);

const vGateRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), new THREE.MeshStandardMaterial({ color: 0xff3838 }));
vGateRight.position.set(2.5, 2.5, 0);
villageGateInForest.add(vGateRight);

const vGateArch = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xa55eea }));
vGateArch.position.set(0, 5.2, 0);
villageGateInForest.add(vGateArch);

const villagePortalTag = createTagSprite('🏡 [Space] 마을로 복귀', '#ffd32a');
villagePortalTag.position.set(0, 6.2, 0);
villageGateInForest.add(villagePortalTag);

villageGateInForest.position.set(-60, 0, 0);
forestGroup.add(villageGateInForest);

// -------------------------------------------------------------
// 😈 붉은 악마 몬스터 3D 모델링
// -------------------------------------------------------------
function buildScaryDemonMonsterMesh(m) {
    const group = new THREE.Group();

    if (m.type === 'slime') {
        const slimeBody = new THREE.Mesh(
            new THREE.SphereGeometry(m.scale || 0.85, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: m.color, 
                roughness: 0.1, 
                emissive: 0xff0000, 
                emissiveIntensity: 0.5,
                transparent: true, 
                opacity: 0.95 
            })
        );
        slimeBody.position.y = 0.75;
        slimeBody.scale.set(1.15, 0.85, 1.1);
        group.add(slimeBody);

        const leftHorn = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.45, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
        );
        leftHorn.position.set(-0.35, 1.45, 0);
        leftHorn.rotation.z = -Math.PI / 6;

        const rightHorn = new THREE.Mesh(
            new THREE.ConeGeometry(0.12, 0.45, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
        );
        rightHorn.position.set(0.35, 1.45, 0);
        rightHorn.rotation.z = Math.PI / 6;

        group.add(leftHorn);
        group.add(rightHorn);

        addDetailedEyes(group, 0.82, 0.72, 0.28, 0.14, 0xff0000);

        const mouthGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 12, Math.PI);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 0.65, 0.82);
        group.add(mouth);
    } else if (m.type === 'biped') {
        const isSkeleton = m.id.includes('skeleton');
        const isGolem = m.id.includes('golem');

        if (isSkeleton) {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xdcdde1 }));
            body.position.y = 0.9;
            group.add(body);

            const cloak = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x3d0c5a, emissive: 0x1f0633, emissiveIntensity: 0.6 }));
            cloak.position.set(0, 0.9, -0.32);
            group.add(cloak);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf5f6fa }));
            head.position.y = 1.8;
            group.add(head);

            addDetailedEyes(group, 1.85, 0.42, 0.18, 0.12, 0xff0000);

            for (let s = -1; s <= 1; s += 2) {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.4), new THREE.MeshStandardMaterial({ color: 0xa55eea }));
                wing.position.set(s * 0.65, 1.4, -0.35);
                wing.rotation.y = s * (Math.PI / 4);
                group.add(wing);
            }

            const scytheStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            scytheStaff.position.set(0.65, 1.2, 0.3);
            scytheStaff.rotation.x = Math.PI / 6;
            group.add(scytheStaff);

            const scytheBlade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: 0xa55eea, emissive: 0x8854d0, emissiveIntensity: 0.8 }));
            scytheBlade.position.set(0.9, 2.1, 0.5);
            scytheBlade.rotation.z = -Math.PI / 4;
            group.add(scytheBlade);
        } else if (isGolem) {
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.4), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
            body.position.y = 1.4;
            group.add(body);

            const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), new THREE.MeshBasicMaterial({ color: 0xff3838 }));
            coreGlow.position.set(0, 1.4, 0.72);
            group.add(coreGlow);

            const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            head.position.y = 2.5;
            group.add(head);

            const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xff3838 }));
            leftEye.position.set(-0.32, 2.5, 0.52);
            const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xff3838 }));
            rightEye.position.set(0.32, 2.5, 0.52);
            group.add(leftEye);
            group.add(rightEye);
        } else {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.7), new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5 }));
            body.position.y = 0.9;
            group.add(body);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), new THREE.MeshStandardMaterial({ color: 0xb71540 }));
            head.position.y = 1.8;
            group.add(head);

            addDetailedEyes(group, 1.85, 0.44, 0.18, 0.1, 0xffd32a);

            const clubHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x4b4b4b }));
            clubHandle.position.set(0.65, 0.9, 0.3);
            clubHandle.rotation.x = Math.PI / 4;
            group.add(clubHandle);
        }
    } else if (m.type === 'quad') {
        const wolfBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.85, 1.7),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 })
        );
        wolfBody.position.y = 0.85;
        group.add(wolfBody);

        for (let sp = 0; sp < 4; sp++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0xff3838, emissive: 0xff0000, emissiveIntensity: 0.6 }));
            spike.position.set(0, 1.4, -0.6 + sp * 0.4);
            group.add(spike);
        }

        const wolfHead = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x1e1e24 }));
        wolfHead.rotation.x = Math.PI / 2;
        wolfHead.position.set(0, 1.25, 0.95);
        group.add(wolfHead);

        addDetailedEyes(group, 1.4, 1.0, 0.16, 0.09, 0xff3838);
    } else if (m.type === 'spider') {
        const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        headSphere.position.set(0, 0.65, 0.35);
        group.add(headSphere);

        const abdomen = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 14, 14), 
            new THREE.MeshStandardMaterial({ color: 0x575fcf, emissive: 0x3c40c6, emissiveIntensity: 0.8, roughness: 0.3 })
        );
        abdomen.position.set(0, 0.85, -0.65);
        group.add(abdomen);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        for (let i = -1; i <= 1; i += 2) {
            const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
            eye1.position.set(i * 0.18, 0.75, 0.78);
            group.add(eye1);
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

const monsters3D = [
    { id: 'slime1', baseName: '😈 지옥 슬라임', originX: -45, originZ: -4, patrolRadius: 10, chaseSpeed: 0.055, patrolSpeed: 0.025, color: 0xeb2f06, baseHp: 50, baseDmg: 5, type: 'slime', scale: 0.85 },
    { id: 'goblin1', baseName: '👹 블러드 고블린', originX: -35, originZ: 6, patrolRadius: 12, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0x780016, baseHp: 60, baseDmg: 6, type: 'biped' },
    { id: 'slime2', baseName: '😈 마그마 슬라임', originX: -25, originZ: -6, patrolRadius: 8, chaseSpeed: 0.06, patrolSpeed: 0.03, color: 0xff3838, baseHp: 50, baseDmg: 4, type: 'slime', scale: 0.65 },

    { id: 'wolf1', baseName: '🐺 지옥의 늑대', originX: -12, originZ: 4, patrolRadius: 14, chaseSpeed: 0.095, patrolSpeed: 0.045, color: 0x1e1e24, baseHp: 70, baseDmg: 7, type: 'quad' },
    { id: 'golem', baseName: '🗿 카오스 골렘', originX: 0, originZ: 0, patrolRadius: 10, chaseSpeed: 0.048, patrolSpeed: 0.02, color: 0x111111, baseHp: 100, baseDmg: 9, type: 'biped' },
    { id: 'spider1', baseName: '🕷️ 다크 네온 거미', originX: 12, originZ: -5, patrolRadius: 12, chaseSpeed: 0.085, patrolSpeed: 0.038, color: 0x575fcf, baseHp: 80, baseDmg: 6, type: 'spider' },

    { id: 'skeleton1', baseName: '💀 사신 해골 전사', originX: 25, originZ: 5, patrolRadius: 12, chaseSpeed: 0.075, patrolSpeed: 0.032, color: 0xf5f6fa, baseHp: 90, baseDmg: 7, type: 'biped' },
    { id: 'wolf2', baseName: '🐺 암흑 우두머리', originX: 38, originZ: -6, patrolRadius: 14, chaseSpeed: 0.10, patrolSpeed: 0.05, color: 0x050505, baseHp: 85, baseDmg: 8, type: 'quad' },
    { id: 'spider2', baseName: '🕷️ 거대 심연 거미', originX: 45, originZ: 4, patrolRadius: 10, chaseSpeed: 0.09, patrolSpeed: 0.04, color: 0x3c40c6, baseHp: 85, baseDmg: 7, type: 'spider' },
    { id: 'skeleton2', baseName: '💀 정예 저승 사신', originX: 52, originZ: -3, patrolRadius: 12, chaseSpeed: 0.08, patrolSpeed: 0.035, color: 0xffffff, baseHp: 95, baseDmg: 8, type: 'biped' }
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

    const mMesh = buildScaryDemonMonsterMesh(m);
    mMesh.position.set(m.x, 0, m.z);
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
btnQuickForge.onclick = openDirectForgeModal;
btnFooterForge.onclick = openDirectForgeModal;

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
                q.desc = `악마 몬스터 처치하기 (진행: ${Math.min(monstersSlain, q.targetCount)}/${q.targetCount})`;
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
        locationNameSpan.textContent = '🌲 3D 악마의 숲속';
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
        m.mesh.position.set(m.x, 0, m.z);

        const stats = getMonsterStats(m.baseHp, m.baseDmg, 1);
        m.maxHp = stats.maxHp;
        m.hp = stats.maxHp;
        m.touchDmg = stats.touchDmg;
        m.expReward = stats.expReward;
        updateMonsterHpSprite(m);
    });

    if (startOverlay) {
        startOverlay.style.display = 'none';
        startOverlay.style.opacity = '0';
        startOverlay.style.visibility = 'hidden';
        startOverlay.style.pointerEvents = 'none';
        startOverlay.classList.remove('active');
        startOverlay.classList.add('hidden');
    }

    if (resultOverlay) {
        resultOverlay.classList.remove('active');
        resultOverlay.classList.add('hidden');
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
}

if (btnStartGame) {
    btnStartGame.addEventListener('click', (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        startGame();
        try { container.requestPointerLock(); } catch (err) {}
    });
    btnStartGame.addEventListener('touchend', (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        startGame();
    });
}

function finishGame(deathReason = '') {
    gameState = 'GAMEOVER';

    if (document.pointerLockElement === container) {
        document.exitPointerLock();
    }

    if (deathReason && deathCauseText) {
        deathCauseText.textContent = deathReason;
    } else if (deathCauseText) {
        deathCauseText.textContent = '몬스터의 공격을 받아 체력이 소진되었습니다!';
    }

    resultLevelSpan.textContent = `Lv.${level}`;
    resultMaxHpSpan.textContent = `${maxHp}`;
    resultMonstersSpan.textContent = `${monstersSlain}마리`;
    resultCoinsSpan.textContent = `${totalCoinsEarned}코인`;

    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('active');
}

// -------------------------------------------------------------
// 3D 1인칭 메인 애니메이션 & 낭떠러지 추락 사망 체크 루프
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

        camera.position.set(player3D.x, PLAYER_HEIGHT, player3D.z);

        // 💀 [핵심 구현] 검은 공간 낭떠러지 밖으로 나가면 즉시 사망!
        let isNearCliff = false;

        if (currentMap === 'VILLAGE') {
            // 마을 땅 범위: x: -27 ~ 26, z: -13 ~ 13
            const limitXMin = -27;
            const limitXMax = 26;
            const limitZMin = -13;
            const limitZMax = 13;

            // 1. 낭떠러지 근접 경고 배너
            if (player3D.x < limitXMin + 2.5 || player3D.x > limitXMax - 2.5 || 
                player3D.z < limitZMin + 2.5 || player3D.z > limitZMax - 2.5) {
                isNearCliff = true;
            }

            // 2. 검은 공간으로 나가면 즉시 추락사!
            if (player3D.x < limitXMin || player3D.x > limitXMax || 
                player3D.z < limitZMin || player3D.z > limitZMax) {
                hp = 0;
                playCustomSound('fall');
                updateUI();
                finishGame('💀 마을 땅 바깥의 검은 암흑 공간으로 추락하여 즉사했습니다!');
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
            // 대장간 실내 경계: x: -9 ~ 9, z: -9 ~ 8.5
            if (player3D.x < -9.5 || player3D.x > 9.5 || player3D.z < -9.5 || player3D.z > 9.0) {
                hp = 0;
                playCustomSound('fall');
                updateUI();
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
            // 숲속 땅 경계: x: -68 ~ 68, z: -38 ~ 38
            const fLimitXMin = -68;
            const fLimitXMax = 68;
            const fLimitZMin = -38;
            const fLimitZMax = 38;

            if (player3D.x < fLimitXMin + 3.0 || player3D.x > fLimitXMax - 3.0 || 
                player3D.z < fLimitZMin + 3.0 || player3D.z > fLimitZMax - 3.0) {
                isNearCliff = true;
            }

            // 숲속 낭떠러지 추락 사망!
            if (player3D.x < fLimitXMin || player3D.x > fLimitXMax || 
                player3D.z < fLimitZMin || player3D.z > fLimitZMax) {
                hp = 0;
                playCustomSound('fall');
                updateUI();
                finishGame('💀 악마의 숲 깊은 암흑 절벽으로 추락하여 사망했습니다!');
                return;
            }

            const distToVillageGate = Math.hypot(player3D.x - (-60), player3D.z - 0);
            if (distToVillageGate < 5.0) {
                proximityNpcText.textContent = `🏡 [마을 입구 포탈] (Space 누르면 마을 복귀)`;
                npcProximityPrompt.classList.remove('hidden');
            } else {
                npcProximityPrompt.classList.add('hidden');
            }

            if (player3D.x < -62 && Math.abs(player3D.z) < 3.0) {
                goToVillageMap();
            }
        }

        // 낭떠러지 위험 경고창 표시 제어
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

        // 🌲 숲속 몬스터 실시간 살아있는 이동 & 추격 AI
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

                        if (m.type === 'slime') {
                            const bounce = Math.abs(Math.sin(m.animCycle * 2)) * 0.45;
                            m.mesh.position.set(m.x, bounce, m.z);
                        } else if (m.type === 'spider') {
                            const crawl = Math.sin(m.animCycle * 3) * 0.1;
                            m.mesh.position.set(m.x, crawl, m.z);
                        } else {
                            const stepBob = Math.abs(Math.sin(m.animCycle * 1.5)) * 0.2;
                            m.mesh.position.set(m.x, stepBob, m.z);
                        }

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

                        if (pDist > 0.3) {
                            m.mesh.lookAt(m.targetX, m.mesh.position.y, m.targetZ);
                            m.x += (pDx / pDist) * m.patrolSpeed;
                            m.z += (pDz / pDist) * m.patrolSpeed;

                            if (m.type === 'slime') {
                                const bounce = Math.abs(Math.sin(m.animCycle)) * 0.3;
                                m.mesh.position.set(m.x, bounce, m.z);
                            } else {
                                const stepBob = Math.abs(Math.sin(m.animCycle)) * 0.12;
                                m.mesh.position.set(m.x, stepBob, m.z);
                            }
                        } else {
                            m.mesh.position.set(m.x, Math.sin(m.animCycle * 0.5) * 0.04, m.z);
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
                        m.mesh.position.set(m.x, 0, m.z);
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
                finishGame('몬스터들의 강력한 공격을 받아 체력이 소진되었습니다!');
            }
        }
    }

    renderer.render(scene, camera);
}

btnFinishGame.onclick = function() { finishGame('용사가 모험을 마치고 휴식을 취합니다.'); };
btnRestartGame.onclick = startGame;

animate();
