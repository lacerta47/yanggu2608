const canvas = document.getElementById('rpgCanvas');
const ctx = canvas.getContext('2d');

// UI 요소 참조
const playerLevelSpan = document.getElementById('player-level');
const playerDamageSpan = document.getElementById('player-damage');
const expBarFill = document.getElementById('exp-bar');
const expTextSpan = document.getElementById('exp-text');
const questDescriptionSpan = document.getElementById('quest-description');

const dialogueModal = document.getElementById('dialogue-modal');
const npcAvatar = document.getElementById('npc-avatar');
const npcName = document.getElementById('npc-name');
const dialogueText = document.getElementById('dialogue-text');
const btnAcceptQuest = document.getElementById('btn-accept-quest');
const btnCloseDialogue = document.getElementById('btn-close-dialogue');

const btnMoveLeft = document.getElementById('btn-move-left');
const btnMoveRight = document.getElementById('btn-move-right');
const btnAttack = document.getElementById('btn-attack');

// 게임 스탯
let level = 1;
let exp = 0;
let maxExp = 100;
let swordDamage = 10;
let monstersSlain = 0;

// 퀘스트 시스템
const quests = [
    {
        id: 1,
        title: "이장님의 부탁",
        npc: "마을 이장님",
        avatar: "👴",
        dialogue: "반갑네 용사여! 들판의 몬스터들 3마리를 처치해서 우리 마을을 지켜주겠나?",
        desc: "들판의 몬스터 3마리 처치하기 (진행도: 0/3)",
        type: "kill",
        targetCount: 3,
        currentCount: 0,
        rewardExp: 60,
        completed: false,
        active: false
    },
    {
        id: 2,
        title: "주민의 응원",
        npc: "마을 주민",
        avatar: "👩‍🌾",
        dialogue: "용사님! 더욱 강해져서 Lv.3에 도달하시면 아주 특별한 보상을 드릴게요!",
        desc: "Lv.3 달성하기",
        type: "level",
        targetLevel: 3,
        rewardExp: 100,
        completed: false,
        active: false
    }
];

let activeQuest = null;

// 오디오 시스템
let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'slash') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'levelup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.setValueAtTime(450, now + 0.1);
            osc.frequency.setValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'quest') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.12);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {}
}

// 용사 (Player) 객체
const player = {
    x: 120,
    y: 350,
    width: 45,
    height: 65,
    speed: 5,
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    isAttacking: false,
    attackTimer: 0,
    attackBox: { x: 0, y: 0, width: 60, height: 60 }
};

// NPCs (마을 이장님, 주민)
const npcs = [
    {
        id: 'elder',
        name: '마을 이장님',
        avatar: '👴',
        x: 80,
        y: 345,
        width: 45,
        height: 70,
        questIndex: 0,
        color: '#ffdd59'
    },
    {
        id: 'villager',
        name: '마을 주민',
        avatar: '👩‍🌾',
        x: 230,
        y: 350,
        width: 45,
        height: 65,
        questIndex: 1,
        color: '#48dbfb'
    }
];

// 몬스터 (Monster) 객체
const monster = {
    x: 650,
    y: 350,
    width: 60,
    height: 65,
    hp: 100,
    maxHp: 100,
    alive: true,
    respawnTimer: 0,
    color: '#ff4757',
    hitTimer: 0
};

// 데미지 텍스트 및 효과 파티클
let floatingTexts = [];
let particles = [];

// 키보드 상태
let keys = {
    left: false,
    right: false
};

// 조작 이벤트 핸들러
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
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
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
});

// 터치 / 버튼 컨트롤
btnMoveLeft.addEventListener('mousedown', () => { keys.left = true; });
btnMoveLeft.addEventListener('mouseup', () => { keys.left = false; });
btnMoveLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
btnMoveLeft.addEventListener('touchend', () => { keys.left = false; });

btnMoveRight.addEventListener('mousedown', () => { keys.right = true; });
btnMoveRight.addEventListener('mouseup', () => { keys.right = false; });
btnMoveRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
btnMoveRight.addEventListener('touchend', () => { keys.right = false; });

btnAttack.addEventListener('click', () => {
    triggerAttackOrInteract();
});

// 공격 및 NPC 대화 트리거
function triggerAttackOrInteract() {
    // 먼저 가까운 NPC 대화 체크
    let interacted = false;
    npcs.forEach(npc => {
        const dist = Math.abs(player.x - npc.x);
        if (dist < 70) {
            openNpcDialogue(npc);
            interacted = true;
        }
    });

    // NPC 대화가 아니면 칼 휘두르기 공격!
    if (!interacted && !player.isAttacking) {
        player.isAttacking = true;
        player.attackTimer = 15; // 15프레임 동안 공격 판정
        playSound('slash');

        // 칼 공격 박스 생성
        if (player.direction === 1) {
            player.attackBox.x = player.x + player.width;
        } else {
            player.attackBox.x = player.x - player.attackBox.width;
        }
        player.attackBox.y = player.y + 5;

        // 몬스터 공격 피격 판정
        if (monster.alive) {
            const hit = checkCollision(player.attackBox, monster);
            if (hit) {
                applyDamageToMonster();
            }
        }
    }
}

// NPC 대화창 열기
let currentSpeakingNpc = null;

function openNpcDialogue(npc) {
    currentSpeakingNpc = npc;
    const q = quests[npc.questIndex];
    npcAvatar.textContent = npc.avatar;
    npcName.textContent = npc.name;

    if (q.completed) {
        dialogueText.textContent = `감사합니다 용사님! ${q.title} 퀘스트를 완료하셨군요!`;
        btnAcceptQuest.style.display = 'none';
    } else if (q.active) {
        dialogueText.textContent = `퀘스트 진행 중: ${q.desc}`;
        btnAcceptQuest.style.display = 'none';
    } else {
        dialogueText.textContent = q.dialogue;
        btnAcceptQuest.style.display = 'inline-block';
        btnAcceptQuest.textContent = "퀘스트 수락하기";
    }

    dialogueModal.classList.remove('hidden');
}

btnAcceptQuest.addEventListener('click', () => {
    if (currentSpeakingNpc) {
        const q = quests[currentSpeakingNpc.questIndex];
        q.active = true;
        activeQuest = q;
        playSound('quest');
        updateQuestUI();
        dialogueModal.classList.add('hidden');
    }
});

btnCloseDialogue.addEventListener('click', () => {
    dialogueModal.classList.add('hidden');
});

// AABB 충돌 탐지
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// 몬스터 데미지 입히기
function applyDamageToMonster() {
    monster.hp -= swordDamage;
    monster.hitTimer = 10;
    playSound('hit');

    // 통통 튀는 빨간 데미지 텍스트
    floatingTexts.push({
        text: `-${swordDamage}`,
        x: monster.x + monster.width / 2 + (Math.random() * 20 - 10),
        y: monster.y - 10,
        color: '#ff4757',
        alpha: 1,
        dy: -1.8
    });

    // 몬스터 처치 시
    if (monster.hp <= 0) {
        monster.hp = 0;
        monster.alive = false;
        monster.respawnTimer = 90; // 90프레임 (약 1.5초 후 리스폰)

        // 경험치 획득 (몬스터 1마리당 35 EXP)
        gainExp(35);
        monstersSlain++;

        // 퀘스트 카운트 체크
        checkQuestProgress();
    }
}

// 경험치 및 레벨업
function gainExp(amount) {
    exp += amount;

    floatingTexts.push({
        text: `+${amount} EXP`,
        x: player.x + player.width / 2,
        y: player.y - 20,
        color: '#1e90ff',
        alpha: 1,
        dy: -1.5
    });

    // 레벨업 체크
    while (exp >= maxExp) {
        exp -= maxExp;
        level += 1;
        swordDamage += 1; // 레벨 1 당 칼 데미지 +1 증가!
        maxExp = level * 100; // 요구 경험치 증가

        playSound('levelup');

        // 레벨업 축하 텍스트
        floatingTexts.push({
            text: `★ LEVEL UP! (Lv.${level}) ★`,
            x: player.x + player.width / 2,
            y: player.y - 45,
            color: '#ffd700',
            alpha: 1,
            dy: -2
        });

        // 레벨업 파티클 생성
        createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ffd700');
    }

    updateUI();
    checkQuestProgress();
}

// 퀘스트 진행도 업데이트
function checkQuestProgress() {
    quests.forEach(q => {
        if (q.active && !q.completed) {
            if (q.type === 'kill') {
                q.currentCount = monstersSlain;
                q.desc = `들판의 몬스터 3마리 처치하기 (진행도: ${Math.min(q.currentCount, 3)}/3)`;
                if (q.currentCount >= q.targetCount) {
                    q.completed = true;
                    gainExp(q.rewardExp);
                    playSound('quest');
                    q.desc = `[완료] 이장님의 부탁 완료! (+${q.rewardExp} EXP 획득)`;
                }
            } else if (q.type === 'level') {
                if (level >= q.targetLevel) {
                    q.completed = true;
                    gainExp(q.rewardExp);
                    playSound('quest');
                    q.desc = `[완료] Lv.3 달성하기 완료! (+${q.rewardExp} EXP 획득)`;
                }
            }
        }
    });

    updateQuestUI();
}

// UI 업데이트
function updateUI() {
    playerLevelSpan.textContent = `Lv.${level}`;
    playerDamageSpan.textContent = swordDamage;

    const percentage = Math.min(100, Math.floor((exp / maxExp) * 100));
    expBarFill.style.width = `${percentage}%`;
    expTextSpan.textContent = `${exp} / ${maxExp}`;
}

function updateQuestUI() {
    if (activeQuest) {
        questDescriptionSpan.textContent = activeQuest.desc;
    }
}

// 파티클 생성
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 4 + 2,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            color: color,
            alpha: 1
        });
    }
}

// 업데이트 로직
function update() {
    // 이동 조작
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
        player.direction = 1;
    } else if (keys.left && player.x > 0) {
        player.x -= player.speed * 0.8; // 살짝 묵직한 이동
        player.direction = -1;
    }

    // 공격 타이머 처리
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
            player.isAttacking = false;
        }
    }

    // 몬스터 리스폰 처리
    if (!monster.alive) {
        monster.respawnTimer--;
        if (monster.respawnTimer <= 0) {
            monster.alive = true;
            monster.hp = monster.maxHp;
        }
    }

    if (monster.hitTimer > 0) {
        monster.hitTimer--;
    }

    // 둥둥 뜨는 텍스트 애니메이션
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.dy;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // 파티클 애니메이션
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 배경 그리기 (마을 & 들판 배경)
function drawBackground() {
    // 하늘
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 땅 / 바닥
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(0, 415, canvas.width, 85);
    ctx.fillStyle = '#26af5f';
    ctx.fillRect(0, 430, canvas.width, 70);

    // 구름 및 경계선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(350, 0);
    ctx.lineTo(350, 415);
    ctx.stroke();
    ctx.setLineDash([]);

    // 영역 이정표
    ctx.font = 'bold 16px "Noto Sans KR"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('🏡 평화로운 마을', 40, 40);
    ctx.fillText('⚔️ 몬스터 들판', 400, 40);
}

// NPC 그리기
function drawNPCs() {
    npcs.forEach(npc => {
        ctx.save();
        // NPC 본체
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.roundRect(npc.x, npc.y, npc.width, npc.height, 8);
        ctx.fill();

        // NPC 아바타 / 이름
        ctx.font = '24px sans-serif';
        ctx.fillText(npc.avatar, npc.x + 8, npc.y + 35);

        ctx.font = 'bold 13px "Noto Sans KR"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 12);

        // 대화 가능 아이콘 (퀘스트 마크)
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('💬 [Space]', npc.x + npc.width / 2, npc.y - 30);
        ctx.restore();
    });
}

// 용사 플레이어 그리기
function drawPlayer() {
    ctx.save();
    // 캐릭터 몸체
    ctx.fillStyle = '#1e90ff';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();

    // 용사 눈
    ctx.fillStyle = '#ffffff';
    const eyeX = player.direction === 1 ? player.x + 28 : player.x + 8;
    ctx.fillRect(eyeX, player.y + 15, 8, 8);

    // 칼 (Sword) 들고 있는 이펙트
    ctx.fillStyle = '#dcdde1';
    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 2;

    if (player.direction === 1) {
        // 오른쪽 보고 있을 때 칼
        const swordX = player.x + player.width - 5;
        const swordY = player.y + 25;

        if (player.isAttacking) {
            // 휘두르는 애니메이션
            ctx.save();
            ctx.translate(swordX, swordY);
            ctx.rotate(Math.PI / 3);
            ctx.fillRect(0, -5, 45, 10);
            ctx.strokeRect(0, -5, 45, 10);
            ctx.restore();
        } else {
            ctx.fillRect(swordX, swordY, 25, 8);
            ctx.strokeRect(swordX, swordY, 25, 8);
        }
    } else {
        // 왼쪽 보고 있을 때 칼
        const swordX = player.x + 5;
        const swordY = player.y + 25;

        if (player.isAttacking) {
            ctx.save();
            ctx.translate(swordX, swordY);
            ctx.rotate(-Math.PI / 3);
            ctx.fillRect(-45, -5, 45, 10);
            ctx.strokeRect(-45, -5, 45, 10);
            ctx.restore();
        } else {
            ctx.fillRect(swordX - 25, swordY, 25, 8);
            ctx.strokeRect(swordX - 25, swordY, 25, 8);
        }
    }

    // 용사 이름 표시
    ctx.font = 'bold 13px "Noto Sans KR"';
    ctx.fillStyle = '#1e90ff';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${level} 용사`, player.x + player.width / 2, player.y - 10);

    ctx.restore();
}

// 몬스터 및 체력바 그리기
function drawMonster() {
    if (!monster.alive) return;

    ctx.save();
    // 몬스터 피격 시 하얗게 깜빡임 효과
    if (monster.hitTimer > 0) {
        ctx.fillStyle = '#ffffff';
    } else {
        ctx.fillStyle = monster.color;
    }

    ctx.beginPath();
    ctx.roundRect(monster.x, monster.y, monster.width, monster.height, 10);
    ctx.fill();

    // 몬스터 얼굴
    ctx.fillStyle = '#000000';
    ctx.fillRect(monster.x + 12, monster.y + 18, 8, 12);
    ctx.fillRect(monster.x + 38, monster.y + 18, 8, 12);

    // 🔴 몬스터 체력바 (HP Bar) - 체력 감소가 눈에 잘 보이게 표시!
    const hpBarWidth = 70;
    const hpBarHeight = 10;
    const hpBarX = monster.x + (monster.width - hpBarWidth) / 2;
    const hpBarY = monster.y - 22;

    // 체력바 배경 (검은색)
    ctx.fillStyle = '#000000';
    ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarWidth + 2, hpBarHeight + 2);

    // 남은 체력 비율 (초록 -> 빨강)
    const hpRatio = Math.max(0, monster.hp / monster.maxHp);
    ctx.fillStyle = hpRatio > 0.4 ? '#2ed573' : '#ff4757';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

    // 체력 수치 텍스트 (예: 90 / 100)
    ctx.font = 'bold 11px "Noto Sans KR"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${monster.hp} / ${monster.maxHp}`, monster.x + monster.width / 2, hpBarY - 4);

    ctx.restore();
}

// 둥둥 뜨는 텍스트 및 파티클 그리기
function drawFloatingTextsAndParticles() {
    // floating texts
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 16px "Noto Sans KR"';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    // particles
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

// 메인 렌더 루프
function render() {
    drawBackground();
    drawNPCs();
    drawMonster();
    drawPlayer();
    drawFloatingTextsAndParticles();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 게임 시작 초기화
updateUI();
gameLoop();
