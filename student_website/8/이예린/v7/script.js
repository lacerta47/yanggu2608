// -------------------------------------------------------------
// 3D 1인칭 용사의 모험 RPG v7 Engine (칼 사거리 대폭 증가 버전)
// -------------------------------------------------------------

// DOM UI 요소
const playerLevelSpan = document.getElementById('player-level');
const hpBarFill = document.getElementById('hp-bar');
const hpTextSpan = document.getElementById('hp-text');
const playerDamageSpan = document.getElementById('player-damage');
const expBarFill = document.getElementById('exp-bar');
const expTextSpan = document.getElementById('exp-text');
const monsterWaveSpan = document.getElementById('monster-wave');
const locationNameSpan = document.getElementById('location-name');
const questDescriptionSpan = document.getElementById('quest-description');

const startOverlay = document.getElementById('start-overlay');
const dialogueModal = document.getElementById('dialogue-modal');
const resultOverlay = document.getElementById('result-overlay');

const btnStartGame = document.getElementById('btn-start-game');
const btnFinishGame = document.getElementById('btn-finish-game');
const btnRestartGame = document.getElementById('btn-restart-game');

const npcAvatar = document.getElementById('npc-avatar');
const npcName = document.getElementById('npc-name');
const npcRole = document.getElementById('npc-role-tag');
const dialogueText = document.getElementById('dialogue-text');
const btnAcceptQuest = document.getElementById('btn-accept-quest');
const btnCloseDialogue = document.getElementById('btn-close-dialogue');

const resultLevelSpan = document.getElementById('result-level');
const resultMonstersSpan = document.getElementById('result-monsters');
const resultQuestsSpan = document.getElementById('result-quests');
const resultWaveSpan = document.getElementById('result-wave');

const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnAttack = document.getElementById('btn-attack');

// 게임 수치
let gameState = 'START';
let currentMap = 'VILLAGE';

let level = 1;
let hp = 150;
let maxHp = 150;
let exp = 0;
const targetExp = 100;
let swordDamage = 10;
let monstersSlain = 0;
let questsCompletedCount = 0;
let currentWave = 1;

// 사거리 설정 (기존 3.5 ➔ 6.5로 대폭 증가!)
const ATTACK_RANGE = 6.5;

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
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bbyong') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.16);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'yap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.setValueAtTime(540, now + 0.08);
            osc.frequency.setValueAtTime(720, now + 0.16);
            osc.frequency.setValueAtTime(1080, now + 0.24);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'powerup') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.3);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {}
}

// -------------------------------------------------------------
// 3D 텍스트 스프라이트 생성 유틸리티
// -------------------------------------------------------------
function createNpcNameSprite(nameText) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.font = 'Bold 18px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffd32a';
    ctx.textAlign = 'center';
    ctx.fillText('💬 [Space] 대화', 128, 24);

    ctx.font = 'Bold 22px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, 128, 58);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.0, 1);
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
    ctx.fillText(`[W${currentWave}] ${m.baseName}`, 128, 24);

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
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(900, 500);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(15, 30, 20);
dirLight.castShadow = true;
scene.add(dirLight);

scene.fog = new THREE.FogExp2(0x0a101d, 0.02);

const villageGroup = new THREE.Group();
const forestGroup = new THREE.Group();
scene.add(villageGroup);
scene.add(forestGroup);
forestGroup.visible = false;

// 🗡️ 사거리가 대폭 길어진 1인칭 롱소드 (First-Person Long Sword)
const fpSwordGroup = new THREE.Group();
const fpBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.8, 0.07), // 칼날 길이를 1.2 ➔ 1.8로 연장!
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
fpSwordGroup.position.set(0.45, -0.45, -0.75);
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

camera.position.set(player3D.x, 1.6, player3D.z);

// -------------------------------------------------------------
// 3D 마을 (Map 1) 에셋 & NPC 이름표
// -------------------------------------------------------------
const villageFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8 })
);
villageFloor.rotation.x = -Math.PI / 2;
villageFloor.receiveShadow = true;
villageGroup.add(villageFloor);

function createHouse(x, z, color) {
    const house = new THREE.Group();
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2.8, 3.5),
        new THREE.MeshStandardMaterial({ color: color })
    );
    wall.position.y = 1.4;
    wall.castShadow = true;
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
createHouse(-18, -6, 0xe67e22);
createHouse(18, -6, 0xd35400);

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
createTree(0, -7);
createTree(10, -6);

// 마을 NPC 6명
const npcs3D = [
    { id: 'elder', name: '마을 이장님', role: '마을 수호자', avatar: '👴', x: -11, z: -2, color: 0xffdd59, quest: { title: "이장님의 청부", desc: "숲속 몬스터 2마리 처치하기 (진행: 0/2)", targetType: "kill", targetCount: 2, rewardExp: 50, active: false, completed: false } },
    { id: 'villager1', name: '약초꾼 주희', role: '마을 주민', avatar: '👩‍🌾', x: -6, z: -2, color: 0x2ecc71, quest: { title: "약초밭 지키기", desc: "숲속 몬스터 4마리 처치하기 (진행: 0/4)", targetType: "kill", targetCount: 4, rewardExp: 60, active: false, completed: false } },
    { id: 'villager2', name: '대장장이 철수', role: '마을 주민', avatar: '🧔', x: -1, z: -2, color: 0xe67e22, quest: { title: "칼 단련 시험", desc: "Lv.2 도달하기", targetType: "level", targetLevel: 2, rewardExp: 40, active: false, completed: false } },
    { id: 'villager3', name: '꼬마 민우', role: '마을 주민', avatar: '👦', x: 4, z: -2, color: 0xe74c3c, quest: { title: "숲속 탐험", desc: "숲 맵으로 건너가 탐험해보기", targetType: "explore", rewardExp: 30, active: false, completed: false } },
    { id: 'villager4', name: '정원사 영희', role: '마을 주민', avatar: '👩', x: 9, z: -2, color: 0x9b59b6, quest: { title: "장미밭 구하기", desc: "숲속 몬스터 6마리 처치하기 (진행: 0/6)", targetType: "kill", targetCount: 6, rewardExp: 80, active: false, completed: false } },
    { id: 'villager5', name: '모험가 한스', role: '마을 주민', avatar: '🧙‍♂️', x: 14, z: -2, color: 0x3498db, quest: { title: "진정한 용사의 길", desc: "Lv.3 도달하기", targetType: "level", targetLevel: 3, rewardExp: 100, active: false, completed: false } }
];

npcs3D.forEach(npc => {
    const npcMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12),
        new THREE.MeshStandardMaterial({ color: npc.color })
    );
    npcMesh.position.set(npc.x, 0.9, npc.z);
    npcMesh.castShadow = true;

    const nameSprite = createNpcNameSprite(`${npc.avatar} ${npc.name}`);
    nameSprite.position.set(0, 1.8, 0);
    npcMesh.add(nameSprite);

    villageGroup.add(npcMesh);
    npc.mesh = npcMesh;
});

// -------------------------------------------------------------
// 3D 숲 (Map 2) 에셋 및 몬스터
// -------------------------------------------------------------
const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.9 })
);
forestFloor.rotation.x = -Math.PI / 2;
forestFloor.receiveShadow = true;
forestGroup.add(forestFloor);

for (let i = -24; i <= 24; i += 6) {
    const fTree = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x34495e })
    );
    trunk.position.y = 2;
    fTree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x1abc9c, roughness: 0.4 })
    );
    leaves.position.y = 5;
    fTree.add(leaves);

    fTree.position.set(i, 0, -6.5);
    forestGroup.add(fTree);
}

function getMonsterStats(baseHp, baseDmg, wave) {
    return {
        maxHp: Math.floor(baseHp + (wave - 1) * 35),
        touchDmg: baseDmg + (wave - 1) * 2,
        expReward: 35 + (wave - 1) * 10
    };
}

const monsters3D = [
    { id: 'slime', baseName: '🟢 숲 슬라임', x: -16, z: 0, geo: new THREE.DodecahedronGeometry(0.8), color: 0x2ecc71, baseHp: 100, baseDmg: 5 },
    { id: 'goblin', baseName: '🔴 분노한 고블린', x: -8, z: -2, geo: new THREE.BoxGeometry(1.2, 1.4, 1.2), color: 0xe74c3c, baseHp: 110, baseDmg: 6 },
    { id: 'wolf', baseName: '🐺 숲 늑대', x: 0, z: 2, geo: new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8), color: 0x7f8c8d, baseHp: 120, baseDmg: 7 },
    { id: 'golem', baseName: '🗿 암석 골렘', x: 8, z: -1, geo: new THREE.BoxGeometry(1.6, 2.0, 1.6), color: 0x95a5a6, baseHp: 150, baseDmg: 8 },
    { id: 'spider', baseName: '🕷️ 독 거미', x: 14, z: 1, geo: new THREE.SphereGeometry(0.9, 12, 12), color: 0x9b59b6, baseHp: 105, baseDmg: 6 },
    { id: 'skeleton', baseName: '👻 해골 전사', x: 20, z: -2, geo: new THREE.CylinderGeometry(0.5, 0.5, 2.0, 8), color: 0xf1f2f6, baseHp: 130, baseDmg: 7 }
];

monsters3D.forEach(m => {
    m.hp = m.baseHp;
    m.maxHp = m.baseHp;
    m.touchDmg = m.baseDmg;
    m.expReward = 35;
    m.alive = true;
    m.respawnTimer = 0;

    const mMesh = new THREE.Mesh(m.geo, new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.4 }));
    mMesh.position.set(m.x, 1.0, m.z);
    mMesh.castShadow = true;
    forestGroup.add(mMesh);
    m.mesh = mMesh;

    updateMonsterHpSprite(m);
});

// -------------------------------------------------------------
// 입력 처리
// -------------------------------------------------------------
let keys = { up: false, down: false, left: false, right: false };
let pressTime = 0;

document.addEventListener('keydown', (e) => {
    initAudio();
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
        triggerAttackOrInteract();
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

btnAttack.addEventListener('click', () => { initAudio(); triggerAttackOrInteract(); });

// 🗡️ 공격 및 대화 (사거리 ATTACK_RANGE = 6.5 적용!)
function triggerAttackOrInteract() {
    if (gameState !== 'PLAYING') return;

    if (currentMap === 'VILLAGE') {
        let interacted = false;
        npcs3D.forEach(npc => {
            const dist = Math.hypot(player3D.x - npc.x, player3D.z - npc.z);
            if (dist < 4.5) { // NPC 대화도 편하게 멀리서 가능!
                openNpcDialogue(npc);
                interacted = true;
            }
        });
        if (interacted) return;
    }

    if (!player3D.isAttacking) {
        player3D.isAttacking = true;
        player3D.attackTimer = 14;
        playCustomSound('ching');

        // 롱소드 베기 애니메이션
        fpSwordGroup.rotation.set(-Math.PI / 3, 0, -Math.PI / 2);

        if (currentMap === 'FOREST') {
            monsters3D.forEach(m => {
                if (m.alive) {
                    const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                    // 🔴 칼 사거리 체크 (ATTACK_RANGE = 6.5까지 대폭 공격 가능!)
                    if (dist < ATTACK_RANGE) {
                        damageMonster(m);
                    }
                }
            });
        }
    }
}

let currentNpc = null;
function openNpcDialogue(npc) {
    currentNpc = npc;
    const q = npc.quest;
    npcAvatar.textContent = npc.avatar;
    npcName.textContent = npc.name;
    npcRole.textContent = npc.role;

    if (q.completed) {
        dialogueText.textContent = `🎉 정말 감사합니다 용사님! '${q.title}' 퀘스트를 완료하셨군요!`;
        btnAcceptQuest.style.display = 'none';
    } else if (q.active) {
        dialogueText.textContent = `📜 진행 중인 퀘스트: ${q.desc}`;
        btnAcceptQuest.style.display = 'none';
    } else {
        dialogueText.textContent = `안녕하신가 용사여! 나를 도와서 '${q.title}' (${q.desc}) 퀘스트를 수행해주겠나?`;
        btnAcceptQuest.style.display = 'inline-block';
        btnAcceptQuest.textContent = '퀘스트 수락하기';
    }

    dialogueModal.classList.remove('hidden');
    dialogueModal.classList.add('active');
}

btnAcceptQuest.addEventListener('click', () => {
    if (currentNpc) {
        const q = currentNpc.quest;
        q.active = true;
        questDescriptionSpan.textContent = `[${currentNpc.name}] ${q.desc}`;
        playCustomSound('ching');
        dialogueModal.classList.remove('active');
        dialogueModal.classList.add('hidden');
    }
});

btnCloseDialogue.addEventListener('click', () => {
    dialogueModal.classList.remove('active');
    dialogueModal.classList.add('hidden');
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

        const nextWave = Math.floor(monstersSlain / 3) + 1;
        if (nextWave > currentWave) {
            currentWave = nextWave;
            playCustomSound('powerup');
        }

        gainExp(m.expReward);
        checkQuests();
    }
}

function gainExp(amount) {
    exp += amount;

    while (exp >= targetExp) {
        exp -= targetExp;
        level += 1;
        swordDamage += 1;
        playCustomSound('yap');
    }

    updateUI();
    checkQuests();
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
                if (currentMap === 'FOREST') isDone = true;
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
    monsterWaveSpan.textContent = `Wave ${currentWave}`;

    const hpRatio = Math.max(0, (hp / maxHp) * 100);
    hpBarFill.style.width = `${hpRatio}%`;
    hpTextSpan.textContent = `${Math.ceil(hp)} / ${maxHp}`;

    const expRatio = Math.min(100, Math.floor((exp / targetExp) * 100));
    expBarFill.style.width = `${expRatio}%`;
    expTextSpan.textContent = `${exp} / ${targetExp}`;

    locationNameSpan.textContent = currentMap === 'VILLAGE' ? '🏡 3D 1인칭 평화로운 마을' : '🌲 3D 1인칭 다채로운 숲속';

    monsters3D.forEach(m => {
        if (m.alive) updateMonsterHpSprite(m);
    });
}

function startGame() {
    initAudio();
    gameState = 'PLAYING';
    currentMap = 'VILLAGE';
    level = 1;
    hp = 150;
    exp = 0;
    swordDamage = 10;
    monstersSlain = 0;
    questsCompletedCount = 0;
    currentWave = 1;

    villageGroup.visible = true;
    forestGroup.visible = false;
    player3D.x = -14;
    player3D.z = 0;
    camera.position.set(player3D.x, 1.6, player3D.z);

    monsters3D.forEach(m => {
        m.alive = true;
        m.mesh.visible = true;
        m.hp = m.baseHp;
        m.maxHp = m.baseHp;
        updateMonsterHpSprite(m);
    });

    startOverlay.classList.remove('active');
    startOverlay.classList.add('hidden');
    resultOverlay.classList.remove('active');
    resultOverlay.classList.add('hidden');

    updateUI();
}

function finishGame() {
    gameState = 'GAMEOVER';

    resultLevelSpan.textContent = `Lv.${level}`;
    resultMonstersSpan.textContent = `${monstersSlain}마리`;
    resultQuestsSpan.textContent = `${questsCompletedCount}개`;
    resultWaveSpan.textContent = `Wave ${currentWave} (HP: ${100 + (currentWave - 1) * 35})`;

    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('active');
}

// -------------------------------------------------------------
// 3D 1인칭 메인 애니메이션 루프
// -------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        const isRunning = (keys.up || keys.down || keys.left || keys.right) && (Date.now() - pressTime > 180);
        const moveSpeed = isRunning ? player3D.runSpeed : player3D.baseSpeed;

        if (keys.up) player3D.z -= moveSpeed;
        if (keys.down) player3D.z += moveSpeed;
        if (keys.right) player3D.x += moveSpeed;
        if (keys.left) player3D.x -= moveSpeed;

        camera.position.set(player3D.x, 1.6, player3D.z);

        if (currentMap === 'VILLAGE' && player3D.x > 24) {
            currentMap = 'FOREST';
            villageGroup.visible = false;
            forestGroup.visible = true;
            player3D.x = -24;
            checkQuests();
            updateUI();
        } else if (currentMap === 'FOREST' && player3D.x < -25) {
            currentMap = 'VILLAGE';
            forestGroup.visible = false;
            villageGroup.visible = true;
            player3D.x = 23;
            updateUI();
        }

        if (player3D.isAttacking) {
            player3D.attackTimer--;
            if (player3D.attackTimer <= 0) {
                player3D.isAttacking = false;
                fpSwordGroup.rotation.set(Math.PI / 6, -Math.PI / 12, -Math.PI / 12);
            }
        }

        if (currentMap === 'FOREST') {
            monsters3D.forEach(m => {
                if (m.alive) {
                    const dist = Math.hypot(player3D.x - m.x, player3D.z - m.z);
                    if (dist < 1.8) {
                        hp -= (m.touchDmg / 60);
                    }
                } else {
                    m.respawnTimer--;
                    if (m.respawnTimer <= 0) {
                        m.alive = true;
                        m.mesh.visible = true;
                        const stats = getMonsterStats(m.baseHp, m.baseDmg, currentWave);
                        m.maxHp = stats.maxHp;
                        m.hp = m.maxHp;
                        m.touchDmg = stats.touchDmg;
                        m.expReward = stats.expReward;
                        updateMonsterHpSprite(m);
                    }
                }
            });

            if (hp <= 0) {
                hp = 0;
                finishGame();
            }
            updateUI();
        }
    }

    renderer.render(scene, camera);
}

btnStartGame.addEventListener('click', startGame);
btnFinishGame.addEventListener('click', finishGame);
btnRestartGame.addEventListener('click', startGame);

animate();
