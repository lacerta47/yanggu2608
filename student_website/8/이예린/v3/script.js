const canvas = document.getElementById('rpgCanvas');
const ctx = canvas.getContext('2d');

// UI 요소
const playerLevelSpan = document.getElementById('player-level');
const hpBarFill = document.getElementById('hp-bar');
const hpTextSpan = document.getElementById('hp-text');
const playerDamageSpan = document.getElementById('player-damage');
const expBarFill = document.getElementById('exp-bar');
const expTextSpan = document.getElementById('exp-text');
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

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnAttack = document.getElementById('btn-attack');

// 게임 상태
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
let currentMap = 'VILLAGE'; // 'VILLAGE' 또는 'FOREST'

// 플레이어 스탯 및 상태
let level = 1;
let hp = 150;
let maxHp = 150;
let exp = 0;
const targetExp = 100; // 목표 경험치는 100!
let swordDamage = 10;
let monstersSlain = 0;
let questsCompletedCount = 0;

// 웹 오디오 합성 사운드 ("칭", "뿅", "얍!")
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
            // 칼 휘두르는 소리 "칭!" (날카로운 금속 찌르는 소리)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bbyong') {
            // 퀘스트 완료 "뿅!" 소리 (귀여운 통통 튀는 피치 벤드)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'yap') {
            // 레벨업 "얍!" 소리 (신나는 화음 아르페지오)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.setValueAtTime(520, now + 0.08);
            osc.frequency.setValueAtTime(700, now + 0.16);
            osc.frequency.setValueAtTime(1050, now + 0.24);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {}
}

// 플레이어 객체
const player = {
    x: 100,
    y: 350,
    width: 46,
    height: 66,
    baseSpeed: 4.5,
    runSpeed: 8.5,
    currentSpeed: 4.5,
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    isAttacking: false,
    attackTimer: 0,
    attackBox: { x: 0, y: 0, width: 65, height: 60 },
    touchDamageTimer: 0
};

// 마을 NPC 6명 (이장님 1명 + 주민 5명)
const npcs = [
    {
        id: 'elder',
        name: '마을 이장님',
        role: '마을 수호자',
        avatar: '👴',
        x: 140,
        y: 345,
        width: 45,
        height: 70,
        color: '#f1c40f',
        quest: {
            title: "이장님의 청부",
            desc: "숲속 몬스터 2마리 처치하기 (진행: 0/2)",
            targetType: "kill",
            targetCount: 2,
            rewardExp: 50,
            active: false,
            completed: false
        }
    },
    {
        id: 'villager1',
        name: '약초꾼 주희',
        role: '마을 주민',
        avatar: '👩‍🌾',
        x: 260,
        y: 350,
        width: 45,
        height: 65,
        color: '#2ecc71',
        quest: {
            title: "약초밭 지키기",
            desc: "숲속 몬스터 4마리 처치하기 (진행: 0/4)",
            targetType: "kill",
            targetCount: 4,
            rewardExp: 60,
            active: false,
            completed: false
        }
    },
    {
        id: 'villager2',
        name: '대장장이 철수',
        role: '마을 주민',
        avatar: '🧔',
        x: 390,
        y: 345,
        width: 48,
        height: 70,
        color: '#e67e22',
        quest: {
            title: "칼 단련 시험",
            desc: "Lv.2 도달하기",
            targetType: "level",
            targetLevel: 2,
            rewardExp: 40,
            active: false,
            completed: false
        }
    },
    {
        id: 'villager3',
        name: '꼬마 민우',
        role: '마을 주민',
        avatar: '👦',
        x: 510,
        y: 360,
        width: 40,
        height: 55,
        color: '#e74c3c',
        quest: {
            title: "숲속 탐험",
            desc: "숲 맵으로 건너가 탐험해보기",
            targetType: "explore",
            rewardExp: 30,
            active: false,
            completed: false
        }
    },
    {
        id: 'villager4',
        name: '정원사 영희',
        role: '마을 주민',
        avatar: '👩',
        x: 630,
        y: 350,
        width: 45,
        height: 65,
        color: '#9b59b6',
        quest: {
            title: "장미밭 구하기",
            desc: "숲속 몬스터 6마리 처치하기 (진행: 0/6)",
            targetType: "kill",
            targetCount: 6,
            rewardExp: 80,
            active: false,
            completed: false
        }
    },
    {
        id: 'villager5',
        name: '모험가 한스',
        role: '마을 주민',
        avatar: '🧙‍♂️',
        x: 750,
        y: 345,
        width: 45,
        height: 70,
        color: '#3498db',
        quest: {
            title: "진정한 용사의 길",
            desc: "Lv.3 도달하기",
            targetType: "level",
            targetLevel: 3,
            rewardExp: 100,
            active: false,
            completed: false
        }
    }
];

// 숲속 몬스터 2마리
const monsters = [
    {
        id: 'slime1',
        name: '슬라임',
        x: 450,
        y: 355,
        width: 55,
        height: 60,
        hp: 100,
        maxHp: 100,
        alive: true,
        respawnTimer: 0,
        color: '#2ecc71',
        hitTimer: 0
    },
    {
        id: 'goblin1',
        name: '숲 고블린',
        x: 700,
        y: 345,
        width: 55,
        height: 70,
        hp: 100,
        maxHp: 100,
        alive: true,
        respawnTimer: 0,
        color: '#e74c3c',
        hitTimer: 0
    }
];

let floatingTexts = [];
let particles = [];

// 키 입력 및 달리기 감지
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
        keys.right = false;
        rightPressTime = 0;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
        leftPressTime = 0;
    }
});

// 터치 컨트롤
btnLeft.addEventListener('mousedown', () => { initAudio(); keys.left = true; leftPressTime = Date.now(); });
btnLeft.addEventListener('mouseup', () => { keys.left = false; leftPressTime = 0; });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.left = true; leftPressTime = Date.now(); });
btnLeft.addEventListener('touchend', () => { keys.left = false; leftPressTime = 0; });

btnRight.addEventListener('mousedown', () => { initAudio(); keys.right = true; rightPressTime = Date.now(); });
btnRight.addEventListener('mouseup', () => { keys.right = false; rightPressTime = 0; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); keys.right = true; rightPressTime = Date.now(); });
btnRight.addEventListener('touchend', () => { keys.right = false; rightPressTime = 0; });

btnAttack.addEventListener('click', () => {
    initAudio();
    triggerAttackOrInteract();
});

// 칼 휘두르기 (칭!) 및 대화
function triggerAttackOrInteract() {
    if (gameState !== 'PLAYING') return;

    // 마을에 있을 때 NPC 대화 체크
    if (currentMap === 'VILLAGE') {
        let interacted = false;
        npcs.forEach(npc => {
            if (Math.abs(player.x - npc.x) < 70) {
                openNpcDialogue(npc);
                interacted = true;
            }
        });
        if (interacted) return;
    }

    // 칼 휘두르기 공격 ("칭!" 효과음!)
    if (!player.isAttacking) {
        player.isAttacking = true;
        player.attackTimer = 14;
        playCustomSound('ching'); // "칭!" 사운드 재생!

        // 공격 박스 설정
        if (player.direction === 1) {
            player.attackBox.x = player.x + player.width;
        } else {
            player.attackBox.x = player.x - player.attackBox.width;
        }
        player.attackBox.y = player.y + 5;

        // 숲 지도인 경우 몬스터 피격 판정
        if (currentMap === 'FOREST') {
            monsters.forEach(m => {
                if (m.alive && checkCollision(player.attackBox, m)) {
                    damageMonster(m);
                }
            });
        }
    }
}

// NPC 대화 및 퀘스트 모달
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

// 충돌 탐지
function checkCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

// 몬스터 데미지 입히기
function damageMonster(m) {
    m.hp -= swordDamage;
    m.hitTimer = 10;
    playCustomSound('hit');

    // 깎이는 피 보이기 (데미지 텍스트)
    floatingTexts.push({
        text: `-${swordDamage}`,
        x: m.x + m.width / 2,
        y: m.y - 15,
        color: '#ff4d4d',
        alpha: 1,
        dy: -1.6
    });

    if (m.hp <= 0) {
        m.hp = 0;
        m.alive = false;
        m.respawnTimer = 100;
        monstersSlain++;

        gainExp(35); // 몬스터 처치 시 35 EXP
        checkQuests();
    }
}

// 경험치 및 레벨업 시스템 (목표 경험치 = 100)
function gainExp(amount) {
    exp += amount;

    floatingTexts.push({
        text: `+${amount} EXP`,
        x: player.x + player.width / 2,
        y: player.y - 20,
        color: '#0fbcf9',
        alpha: 1,
        dy: -1.5
    });

    // 목표 경험치(100) 달성 시 레벨업 및 경험치 초기화!
    while (exp >= targetExp) {
        exp -= targetExp; // 목표 경험치 달성 후 초과분 정리 (또는 0 초기화)
        level += 1;
        swordDamage += 1; // 레벨 1 오를 때마다 칼 데미지 +1!

        playCustomSound('yap'); // "얍!" 레벨업 소리!

        floatingTexts.push({
            text: `★ 레벨업! Lv.${level} (얍!) ★`,
            x: player.x + player.width / 2,
            y: player.y - 50,
            color: '#ffd32a',
            alpha: 1,
            dy: -2
        });

        createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ffd32a');
    }

    updateUI();
    checkQuests();
}

// 퀘스트 진행 체크 (완료 시 "뿅!" 소리!)
function checkQuests() {
    npcs.forEach(npc => {
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
                playCustomSound('bbyong'); // 완료 시 "뿅!" 소리!

                floatingTexts.push({
                    text: `🎉 퀘스트 완료! (뿅!)`,
                    x: player.x + player.width / 2,
                    y: player.y - 35,
                    color: '#05c46b',
                    alpha: 1,
                    dy: -1.8
                });

                gainExp(q.rewardExp);
            }
        }
    });

    updateUI();
}

// UI 업데이트
function updateUI() {
    playerLevelSpan.textContent = `Lv.${level}`;
    playerDamageSpan.textContent = swordDamage;

    // HP 바 업데이트 (최대 150)
    const hpRatio = Math.max(0, (hp / maxHp) * 100);
    hpBarFill.style.width = `${hpRatio}%`;
    hpTextSpan.textContent = `${Math.ceil(hp)} / ${maxHp}`;

    // EXP 바 업데이트 (목표 100)
    const expRatio = Math.min(100, Math.floor((exp / targetExp) * 100));
    expBarFill.style.width = `${expRatio}%`;
    expTextSpan.textContent = `${exp} / ${targetExp}`;

    // 현재 위치 및 퀘스트 텍스트
    locationNameSpan.textContent = currentMap === 'VILLAGE' ? '🏡 평화로운 마을' : '🌲 깊은 숲속';
}

// 파티클 생성
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x, y: y,
            radius: Math.random() * 4 + 2,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            color: color,
            alpha: 1
        });
    }
}

// 게임 시작
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

    startOverlay.classList.remove('active');
    startOverlay.classList.add('hidden');
    resultOverlay.classList.remove('active');
    resultOverlay.classList.add('hidden');

    updateUI();
}

// 게임 종료 및 결과창 표시
function finishGame() {
    gameState = 'GAMEOVER';

    resultLevelSpan.textContent = `Lv.${level}`;
    resultMonstersSpan.textContent = `${monstersSlain}마리`;
    resultQuestsSpan.textContent = `${questsCompletedCount}개`;

    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('active');
}

// 프레임 업데이트
function update() {
    if (gameState !== 'PLAYING') return;

    // 달리기 (방향키를 200ms 이상 꾹 누르면 속도 증가!)
    const isRunningRight = keys.right && (Date.now() - rightPressTime > 180);
    const isRunningLeft = keys.left && (Date.now() - leftPressTime > 180);

    player.currentSpeed = (isRunningRight || isRunningLeft) ? player.runSpeed : player.baseSpeed;

    // 플레이어 이동
    if (keys.right) {
        player.x += player.currentSpeed;
        player.direction = 1;
    } else if (keys.left) {
        player.x -= player.currentSpeed * 0.75; // 살짝 이동
        player.direction = -1;
    }

    // 맵 이동 (마을 ↔ 숲)
    if (currentMap === 'VILLAGE' && player.x > canvas.width - player.width) {
        currentMap = 'FOREST';
        player.x = 20; // 숲 왼쪽 끝에서 나타남
        checkQuests();
        updateUI();
    } else if (currentMap === 'FOREST' && player.x < 10) {
        currentMap = 'VILLAGE';
        player.x = canvas.width - player.width - 20; // 마을 오른쪽 끝에서 나타남
        updateUI();
    }

    // 칼 공격 타이머
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) player.isAttacking = false;
    }

    // 숲 몬스터 피격 및 플레이어 체력 감소 (1초당 5만큼 체력 닳음!)
    if (currentMap === 'FOREST') {
        let isTouchingMonster = false;

        monsters.forEach(m => {
            if (m.alive) {
                if (checkCollision(player, m)) {
                    isTouchingMonster = true;
                }
            } else {
                m.respawnTimer--;
                if (m.respawnTimer <= 0) {
                    m.alive = true;
                    m.hp = m.maxHp;
                }
            }
            if (m.hitTimer > 0) m.hitTimer--;
        });

        // 몬스터와 닿아있을 때 1초당 5 체력 감소 (60fps 기준 프레임당 5/60)
        if (isTouchingMonster) {
            hp -= (5 / 60);
            if (hp <= 0) {
                hp = 0;
                finishGame(); // 사망 시 결과창!
            }
            updateUI();
        }
    }

    // floating text & particles
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.dy;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

// 마을 배경 그리기 (집들, 잔디, 꽃, 나무 3개)
function drawVillageBackground() {
    // 하늘 & 해
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(800, 70, 40, 0, Math.PI * 2);
    ctx.fill();

    // 언덕 및 땅 (잔디)
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 390, canvas.width, 110);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 410, canvas.width, 90);

    // 바닥의 꽃들
    const flowerPositions = [50, 180, 320, 470, 600, 730, 840];
    flowerPositions.forEach(fx => {
        ctx.fillStyle = '#ff7675';
        ctx.beginPath();
        ctx.arc(fx, 425, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fdcb6e';
        ctx.beginPath();
        ctx.arc(fx, 425, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // 집 2채 (마을 느낌)
    // 집 1
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(30, 270, 100, 120);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(15, 270);
    ctx.lineTo(80, 210);
    ctx.lineTo(145, 270);
    ctx.fill();

    // 집 2
    ctx.fillStyle = '#d35400';
    ctx.fillRect(800, 280, 90, 110);
    ctx.fillStyle = '#a93226';
    ctx.beginPath();
    ctx.moveTo(785, 280);
    ctx.lineTo(845, 220);
    ctx.lineTo(905, 280);
    ctx.fill();

    // 나무 3개 (마을 나무)
    const treeXCoords = [200, 450, 700];
    treeXCoords.forEach(tx => {
        // 기둥
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(tx + 18, 290, 24, 100);
        // 잎사귀
        ctx.fillStyle = '#10ac84';
        ctx.beginPath();
        ctx.arc(tx + 30, 260, 45, 0, Math.PI * 2);
        ctx.fill();
    });

    // 숲으로 가는 오른쪽 통로 안내판
    ctx.font = 'bold 15px "Noto Sans KR"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🌲 숲으로 가는 길 ▶', 730, 380);
}

// 숲 배경 그리기 (흐린 숲 배경, 덩굴, 여러 나무들)
function drawForestBackground() {
    // 안개낀 숲 하늘
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 안개 효과 (흐린 숲)
    ctx.fillStyle = 'rgba(189, 195, 199, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바닥 (풀밭)
    ctx.fillStyle = '#16a085';
    ctx.fillRect(0, 390, canvas.width, 110);

    // 숲 나무 여러 개
    const forestTrees = [40, 160, 300, 520, 680, 820];
    forestTrees.forEach(tx => {
        ctx.fillStyle = '#34495e';
        ctx.fillRect(tx + 20, 240, 30, 150);

        ctx.fillStyle = '#1abc9c';
        ctx.beginPath();
        ctx.arc(tx + 35, 200, 55, 0, Math.PI * 2);
        ctx.fill();
    });

    // 덩굴 (Vines) 그리디
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 4;
    for (let x = 100; x < canvas.width; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 20, 80, x - 20, 140, x + 10, 200);
        ctx.stroke();
    }

    // 마을로 돌아가는 왼쪽 안내판
    ctx.font = 'bold 15px "Noto Sans KR"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('◀ 🏡 마을로 돌아가기', 20, 380);
}

// 용사 플레이어 그리기
function drawPlayer() {
    ctx.save();
    // 캐릭터 몸체 (달리기 시 약간 기울어짐 효과)
    ctx.fillStyle = '#0fbcf9';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();

    // 눈
    ctx.fillStyle = '#ffffff';
    const eyeX = player.direction === 1 ? player.x + 30 : player.x + 8;
    ctx.fillRect(eyeX, player.y + 16, 8, 8);

    // 손에 들고 있는 칼
    ctx.fillStyle = '#f1f2f6';
    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 2;

    const swordX = player.direction === 1 ? player.x + player.width - 5 : player.x + 5;
    const swordY = player.y + 26;

    if (player.direction === 1) {
        if (player.isAttacking) {
            ctx.save();
            ctx.translate(swordX, swordY);
            ctx.rotate(Math.PI / 3);
            ctx.fillRect(0, -6, 50, 12);
            ctx.strokeRect(0, -6, 50, 12);
            ctx.restore();
        } else {
            ctx.fillRect(swordX, swordY, 28, 8);
            ctx.strokeRect(swordX, swordY, 28, 8);
        }
    } else {
        if (player.isAttacking) {
            ctx.save();
            ctx.translate(swordX, swordY);
            ctx.rotate(-Math.PI / 3);
            ctx.fillRect(-50, -6, 50, 12);
            ctx.strokeRect(-50, -6, 50, 12);
            ctx.restore();
        } else {
            ctx.fillRect(swordX - 28, swordY, 28, 8);
            ctx.strokeRect(swordX - 28, swordY, 28, 8);
        }
    }

    // 이름
    ctx.font = 'bold 13px "Noto Sans KR"';
    ctx.fillStyle = '#0fbcf9';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${level} 용사`, player.x + player.width / 2, player.y - 12);
    ctx.restore();
}

// 몬스터 및 체력바 그리기
function drawMonsters() {
    if (currentMap !== 'FOREST') return;

    monsters.forEach(m => {
        if (!m.alive) return;
        ctx.save();

        ctx.fillStyle = m.hitTimer > 0 ? '#ffffff' : m.color;
        ctx.beginPath();
        ctx.roundRect(m.x, m.y, m.width, m.height, 10);
        ctx.fill();

        // 몬스터 이름 & 얼굴
        ctx.font = 'bold 12px "Noto Sans KR"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, m.x + m.width / 2, m.y - 26);

        // 🔴 몬스터 체력바 (HP Bar 100) - 피 달음이 잘 보이게 표시!
        const barW = 65;
        const barH = 8;
        const barX = m.x + (m.width - barW) / 2;
        const barY = m.y - 16;

        ctx.fillStyle = '#000000';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const ratio = Math.max(0, m.hp / m.maxHp);
        ctx.fillStyle = ratio > 0.4 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(barX, barY, barW * ratio, barH);

        ctx.restore();
    });
}

// NPC 및 대화 아이콘 그리기
function drawNPCs() {
    if (currentMap !== 'VILLAGE') return;

    npcs.forEach(npc => {
        ctx.save();
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.roundRect(npc.x, npc.y, npc.width, npc.height, 8);
        ctx.fill();

        ctx.font = '22px sans-serif';
        ctx.fillText(npc.avatar, npc.x + 8, npc.y + 35);

        ctx.font = 'bold 12px "Noto Sans KR"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 10);

        // 💬 퀘스트 대화 마크
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = npc.quest.completed ? '#2ecc71' : '#f1c40f';
        ctx.fillText(npc.quest.completed ? '✅ 완료' : '💬 퀘스트', npc.x + npc.width / 2, npc.y - 26);
        ctx.restore();
    });
}

// 텍스트 & 파티클 그리기
function drawEffects() {
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 16px "Noto Sans KR"';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function render() {
    if (currentMap === 'VILLAGE') {
        drawVillageBackground();
        drawNPCs();
    } else {
        drawForestBackground();
        drawMonsters();
    }

    drawPlayer();
    drawEffects();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 버튼 이벤트 등록
btnStartGame.addEventListener('click', startGame);
btnFinishGame.addEventListener('click', finishGame);
btnRestartGame.addEventListener('click', startGame);

// 게임 루프 가동
gameLoop();
