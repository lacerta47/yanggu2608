// -------------------------------------------------------------
// 3D 용사의 모험 RPG v5 Engine (Three.js WebGL)
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

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnAttack = document.getElementById('btn-attack');

// 게임 수치 변수
let gameState = 'START';
let currentMap = 'VILLAGE'; // 'VILLAGE' or 'FOREST'

let level = 1;
let hp = 150;
let maxHp = 150;
let exp = 0;
const targetExp = 100;
let swordDamage = 10;
let monstersSlain = 0;
let questsCompletedCount = 0;
let currentWave = 1;

// Web Audio API 오디오 ("칭", "뿅", "얍!")
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

        if (type === 'ching') { // 칼 휘두르기 "칭!"
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1300, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bbyong') { // 퀘스트 완료 "뿅!"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.16);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'yap') { // 레벨업 "얍!"
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
// THREE.JS 3D 환경 구축
// -------------------------------------------------------------
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 900 / 500, 0.1, 1000);
camera.position.set(0, 10, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(900, 500);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(15, 30, 20);
dirLight.castShadow = true;
scene.add(dirLight);

// 안개 효과
scene.fog = new THREE.FogExp2(0x0e1726, 0.015);

// 그룹 객체
const villageGroup = new THREE.Group();
const forestGroup = new THREE.Group();
scene.add(villageGroup);
scene.add(forestGroup);
forestGroup.visible = false;

// -------------------------------------------------------------
// 3D 메쉬 생성 함수
// -------------------------------------------------------------

// 1. 3D 용사 플레이어
const playerGroup = new THREE.Group();
scene.add(playerGroup);

// 몸통
const bodyGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 12);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0fbcf9, roughness: 0.3 });
const playerBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
playerBodyMesh.position.y = 0.9;
playerBodyMesh.castShadow = true;
playerGroup.add(playerBodyMesh);

// 머리
const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const playerHeadMesh = new THREE.Mesh(headGeo, headMat);
playerHeadMesh.position.y = 2.1;
playerGroup.add(playerHeadMesh);

// 3D 칼 (Right Hand Sword)
const swordGroup = new THREE.Group();
const bladeGeo = new THREE.BoxGeometry(0.15, 1.4, 0.08);
const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f6, metalness: 0.8, roughness: 0.2 });
const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
bladeMesh.position.y = 0.7;

const hiltGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
const hiltMat = new THREE.MeshStandardMaterial({ color: 0xffd32a });
const hiltMesh = new THREE.Mesh(hiltGeo, hiltMat);
hiltMesh.position.y = 0.1;

swordGroup.add(bladeMesh);
swordGroup.add(hiltMesh);
swordGroup.position.set(0.7, 1.0, 0.2);
playerGroup.add(swordGroup);

// 플레이어 물리 위치
const player3D = {
    x: -12,
    z: 0,
    baseSpeed: 0.15,
    runSpeed: 0.28,
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    isAttacking: false,
    attackTimer: 0
};

playerGroup.position.set(player3D.x, 0, player3D.z);

// -------------------------------------------------------------
// 3D 마을 (Map 1) 에셋
// -------------------------------------------------------------
// 지형 바닥
const villageFloorGeo = new THREE.PlaneGeometry(50, 20);
const villageFloorMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.8 });
const villageFloor = new THREE.Mesh(villageFloorGeo, villageFloorMat);
villageFloor.rotation.x = -Math.PI / 2;
villageFloor.receiveShadow = true;
villageGroup.add(villageFloor);

// 집 2채
function createHouse(x, z, color) {
    const house = new THREE.Group();
    const wallGeo = new THREE.BoxGeometry(3, 2.5, 3);
    const wallMat = new THREE.MeshStandardMaterial({ color: color });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.25;
    wall.castShadow = true;
    house.add(wall);

    const roofGeo = new THREE.ConeGeometry(2.5, 1.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xc0392b });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.4;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    house.position.set(x, 0, z);
    villageGroup.add(house);
}
createHouse(-15, -4, 0xe67e22);
createHouse(15, -4, 0xd35400);

// 나무 3개
function createTree(x, z) {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.25;
    tree.add(trunk);

    const leavesGeo = new THREE.DodecahedronGeometry(1.6);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x10ac84, roughness: 0.5 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3.2;
    tree.add(leaves);

    tree.position.set(x, 0, z);
    villageGroup.add(tree);
}
createTree(-8, -4);
createTree(0, -5);
createTree(8, -4);

// 마을 NPC 6명
const npcs3D = [
    { id: 'elder', name: '마을 이장님', role: '마을 수호자', avatar: '👴', x: -10, color: 0xffdd59, quest: { title: "이장님의 청부", desc: "숲속 몬스터 2마리 처치하기 (진행: 0/2)", targetType: "kill", targetCount: 2, rewardExp: 50, active: false, completed: false } },
    { id: 'villager1', name: '약초꾼 주희', role: '마을 주민', avatar: '👩‍🌾', x: -5, color: 0x2ecc71, quest: { title: "약초밭 지키기", desc: "숲속 몬스터 4마리 처치하기 (진행: 0/4)", targetType: "kill", targetCount: 4, rewardExp: 60, active: false, completed: false } },
    { id: 'villager2', name: '대장장이 철수', role: '마을 주민', avatar: '🧔', x: 0, color: 0xe67e22, quest: { title: "칼 단련 시험", desc: "Lv.2 도달하기", targetType: "level", targetLevel: 2, rewardExp: 40, active: false, completed: false } },
    { id: 'villager3', name: '꼬마 민우', role: '마을 주민', avatar: '👦', x: 5, color: 0xe74c3c, quest: { title: "숲속 탐험", desc: "숲 맵으로 건너가 탐험해보기", targetType: "explore", rewardExp: 30, active: false, completed: false } },
    { id: 'villager4', name: '정원사 영희', role: '마을 주민', avatar: '👩', x: 9, color: 0x9b59b6, quest: { title: "장미밭 구하기", desc: "숲속 몬스터 6마리 처치하기 (진행: 0/6)", targetType: "kill", targetCount: 6, rewardExp: 80, active: false, completed: false } },
    { id: 'villager5', name: '모험가 한스', role: '마을 주민', avatar: '🧙‍♂️', x: 13, color: 0x3498db, quest: { title: "진정한 용사의 길", desc: "Lv.3 도달하기", targetType: "level", targetLevel: 3, rewardExp: 100, active: false, completed: false } }
];

npcs3D.forEach(npc => {
    const npcMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.6, 12),
        new THREE.MeshStandardMaterial({ color: npc.color })
    );
    npcMesh.position.set(npc.x, 0.8, -1);
    npcMesh.castShadow = true;
    villageGroup.add(npcMesh);
    npc.mesh = npcMesh;
});

// -------------------------------------------------------------
// 3D 숲 (Map 2) 에셋
// -------------------------------------------------------------
const forestFloorGeo = new THREE.PlaneGeometry(50, 20);
const forestFloorMat = new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.9 });
const forestFloor = new THREE.Mesh(forestFloorGeo, forestFloorMat);
forestFloor.rotation.x = -Math.PI / 2;
forestFloor.receiveShadow = true;
forestGroup.add(forestFloor);

// 숲 나무들
for (let i = -22; i <= 22; i += 7) {
    const fTree = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 3.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x34495e })
    );
    trunk.position.y = 1.75;
    fTree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(2.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1abc9c, roughness: 0.4 })
    );
    leaves.position.y = 4.5;
    fTree.add(leaves);

    fTree.position.set(i, 0, -4.5);
    forestGroup.add(fTree);
}

// 3D 몬스터 2마리
function getMonsterStats(baseHp, baseDmg, wave) {
    return {
        maxHp: Math.floor(baseHp + (wave - 1) * 35),
        touchDmg: baseDmg + (wave - 1) * 2,
        expReward: 35 + (wave - 1) * 10
    };
}

const monsters3D = [
    { id: 'slime1', baseName: '슬라임', x: 2, baseHp: 100, baseDmg: 5, hp: 100, maxHp: 100, touchDmg: 5, expReward: 35, alive: true, respawnTimer: 0, color: 0x2ecc71 },
    { id: 'goblin1', baseName: '숲 고블린', x: 10, baseHp: 100, baseDmg: 5, hp: 100, maxHp: 100, touchDmg: 5, expReward: 35, alive: true, respawnTimer: 0, color: 0xe74c3c }
];

monsters3D.forEach(m => {
    const mMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8),
        new THREE.MeshStandardMaterial({ color: m.color })
    );
    mMesh.position.set(m.x, 0.8, 0);
    mMesh.castShadow = true;
    forestGroup.add(mMesh);
    m.mesh = mMesh;
});

// -------------------------------------------------------------
// 입력 & 컨트롤 시스템
// -------------------------------------------------------------
let keys = { right: false, left: false };
let rightPressTime = 0;
let leftPressTime = 0;

document.addEventListener('keydown', (e) => {
    initAudio();
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (!keys.right) rightPressTime = Date.now();
        keys.right = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (!keys.left) leftPressTime = Date.now();
        keys.left = true;
    }
    if (e.code === 'Space') {
        e.preventDefault();
        triggerAttackOrInteract();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false; rightPressTime = 0;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false; leftPressTime = 0;
    }
});

btnLeft.addEventListener('mousedown', () => { initAudio(); keys.left = true; leftPressTime = Date.now(); });
btnLeft.addEventListener('mouseup', () => { keys.left = false; leftPressTime = 0; });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.left = true; leftPressTime = Date.now(); });
btnLeft.addEventListener('touchend', () => { keys.left = false; leftPressTime = 0; });

btnRight.addEventListener('mousedown', () => { initAudio(); keys.right = true; rightPressTime = Date.now(); });
btnRight.addEventListener('mouseup', () => { keys.right = false; rightPressTime = 0; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.right = true; rightPressTime = Date.now(); });
btnRight.addEventListener('touchend', () => { keys.right = false; rightPressTime = 0; });

btnAttack.addEventListener('click', () => { initAudio(); triggerAttackOrInteract(); });

// 3D 공격 및 대화
function triggerAttackOrInteract() {
    if (gameState !== 'PLAYING') return;

    if (currentMap === 'VILLAGE') {
        let interacted = false;
        npcs3D.forEach(npc => {
            if (Math.abs(player3D.x - npc.x) < 2.5) {
                openNpcDialogue(npc);
                interacted = true;
            }
        });
        if (interacted) return;
    }

    if (!player3D.isAttacking) {
        player3D.isAttacking = true;
        player3D.attackTimer = 15;
        playCustomSound('ching');

        // 3D 칼 휘두르기 애니메이션
        swordGroup.rotation.z = player3D.direction === 1 ? -Math.PI / 2 : Math.PI / 2;

        if (currentMap === 'FOREST') {
            monsters3D.forEach(m => {
                if (m.alive && Math.abs(player3D.x - m.x) < 2.5) {
                    damageMonster(m);
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

// 데미지 입히기 & 몬스터 강화 스케일링
function damageMonster(m) {
    m.hp -= swordDamage;
    playCustomSound('hit');

    if (m.hp <= 0) {
        m.hp = 0;
        m.alive = false;
        m.respawnTimer = 90;
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

// 경험치 및 레벨업
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

    locationNameSpan.textContent = currentMap === 'VILLAGE' ? '🏡 3D 평화로운 마을' : '🌲 3D 깊은 숲속';
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
    player3D.x = -12;
    playerGroup.position.x = player3D.x;

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
// 3D 메인 게임 렌더 루프
// -------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        const isRunningRight = keys.right && (Date.now() - rightPressTime > 180);
        const isRunningLeft = keys.left && (Date.now() - leftPressTime > 180);

        const moveSpeed = (isRunningRight || isRunningLeft) ? player3D.runSpeed : player3D.baseSpeed;

        if (keys.right) {
            player3D.x += moveSpeed;
            player3D.direction = 1;
            playerGroup.rotation.y = 0;
        } else if (keys.left) {
            player3D.x -= moveSpeed * 0.75;
            player3D.direction = -1;
            playerGroup.rotation.y = Math.PI;
        }

        playerGroup.position.x = player3D.x;
        camera.position.x = player3D.x * 0.6; // 3D 카메라 부드러운 따라가기

        // 3D 맵 이동 (마을 ↔ 숲)
        if (currentMap === 'VILLAGE' && player3D.x > 20) {
            currentMap = 'FOREST';
            villageGroup.visible = false;
            forestGroup.visible = true;
            player3D.x = -20;
            checkQuests();
            updateUI();
        } else if (currentMap === 'FOREST' && player3D.x < -21) {
            currentMap = 'VILLAGE';
            forestGroup.visible = false;
            villageGroup.visible = true;
            player3D.x = 19;
            updateUI();
        }

        // 칼 복원 애니메이션
        if (player3D.isAttacking) {
            player3D.attackTimer--;
            if (player3D.attackTimer <= 0) {
                player3D.isAttacking = false;
                swordGroup.rotation.z = 0;
            }
        }

        // 3D 몬스터 닿음 피해 & 리스폰
        if (currentMap === 'FOREST') {
            let isTouching = false;
            monsters3D.forEach(m => {
                if (m.alive) {
                    if (Math.abs(player3D.x - m.x) < 1.4) {
                        isTouching = true;
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
