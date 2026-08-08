/* ==========================================================================
   500km 대모험 RPG (v2) Game Logic
   ========================================================================== */

// 1. 게임 상태 정의 (Player & World Data)
const gameState = {
    player: {
        x: 100,
        y: 200,
        speed: 5,
        level: 1,
        maxLevel: 50,
        exp: 0,
        maxExp: 1000,
        distanceKm: 0,
        maxKm: 500,
        monstersDefeated: 0,
        weaponIndex: 0
    },
    keysPressed: {
        w: false,
        a: false,
        s: false,
        d: false
    },
    monster: {
        name: "아기 슬라임",
        avatar: "🟢",
        tier: 1,
        hp: 50,
        maxHp: 50,
        attackPower: 5
    },
    quests: [
        { id: 1, title: "슬라임 3마리 처치하기", target: 3, current: 0, rewardExp: 50, completed: false },
        { id: 2, title: "50km 거리 모험하기", target: 50, current: 0, rewardExp: 50, completed: false },
        { id: 3, title: "레벨 5 달성하고 무기 받기", target: 5, current: 1, rewardExp: 50, completed: false },
        { id: 4, title: "몬스터 10마리 처치하기", target: 10, current: 0, rewardExp: 50, completed: false }
    ]
};

// 2. 무기 데이터베이스 (5레벨마다 새 무기 증정)
const weaponsDB = [
    { name: "초보자의 나무 검", icon: "🗡️", dmg: 10, reqLevel: 1 },
    { name: "단단한 철검", icon: "⚔️", dmg: 30, reqLevel: 5 },
    { name: "빛나는 은빛 은검", icon: "🗡️", dmg: 60, reqLevel: 10 },
    { name: "이글거리는 불꽃 검", icon: "🔥", dmg: 100, reqLevel: 15 },
    { name: "고대 마법의 룬 검", icon: "🔮", dmg: 150, reqLevel: 20 },
    { name: "용을 잡는 드래곤 슬레이어", icon: "🐲", dmg: 220, reqLevel: 25 },
    { name: "전설의 엑스칼리버", icon: "⚡", dmg: 300, reqLevel: 30 },
    { name: "빛의 성검", icon: "✨", dmg: 450, reqLevel: 35 },
    { name: "신화의 검", icon: "🌌", dmg: 650, reqLevel: 40 },
    { name: "파멸의 다크 소드", icon: "💀", dmg: 850, reqLevel: 45 },
    { name: "신들의 신검 (최종 무기)", icon: "👑", dmg: 1200, reqLevel: 50 }
];

// 3. 몬스터 도감 (레벨 상승 및 5레벨마다 강화)
const monstersDB = [
    { name: "아기 슬라임", avatar: "🟢", baseHp: 50, atk: 5 },
    { name: "사나운 고블린", avatar: "👺", baseHp: 120, atk: 12 },
    { name: "독 숲의 거대 거미", avatar: "🕷️", baseHp: 250, atk: 25 },
    { name: "던전의 해골 전사", avatar: "💀", baseHp: 450, atk: 45 },
    { name: "지옥의 용암 미노타우로스", avatar: "🐂", baseHp: 750, atk: 70 },
    { name: "어둠의 뱀파이어 킹", avatar: "🧛", baseHp: 1200, atk: 100 },
    { name: "얼음 왕국의 서리 거인", avatar: "🧊", baseHp: 1800, atk: 140 },
    { name: "심해의 크라켄", avatar: "🦑", baseHp: 2600, atk: 190 },
    { name: "지옥의 흑룡 드래곤", avatar: "🐉", baseHp: 3800, atk: 260 },
    { name: "최종 마왕 보스", avatar: "😈", baseHp: 5500, atk: 350 }
];

// 4. DOM 요소 획득
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const elLevel = document.getElementById('player-level');
const elCurrentExp = document.getElementById('current-exp');
const elMaxExp = document.getElementById('max-exp');
const elExpBar = document.getElementById('exp-bar');

const elWeaponIcon = document.getElementById('weapon-icon');
const elWeaponName = document.getElementById('weapon-name');
const elWeaponDmg = document.getElementById('weapon-dmg');

const elDistance = document.getElementById('distance-val');
const elToast = document.getElementById('toast-message');
const elToastText = document.getElementById('toast-text');

const elMonsterTier = document.getElementById('monster-tier');
const elMonsterAvatar = document.getElementById('monster-avatar');
const elMonsterName = document.getElementById('monster-name');
const elMonsterHp = document.getElementById('monster-hp');
const elMonsterMaxHp = document.getElementById('monster-max-hp');
const elMonsterHpBar = document.getElementById('monster-hp-bar');

const elAttackBtn = document.getElementById('attack-btn');
const elMobileAttackBtn = document.getElementById('mobile-attack-btn');
const elQuestList = document.getElementById('quest-list');

const elVictoryModal = document.getElementById('victory-modal');
const elFinalWeapon = document.getElementById('final-weapon');
const elFinalDmg = document.getElementById('final-dmg');
const elRestartBtn = document.getElementById('restart-btn');

// 5. 초기화 및 이벤트 리스너 설정
function initGame() {
    setupInputListeners();
    renderQuests();
    updateUI();
    gameLoop();
}

// 6. WASD 및 터치 조작 리스너
function setupInputListeners() {
    // 키보드 누름
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
            gameState.keysPressed[key] = true;
        }
    });

    // 키보드 뗌
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
            gameState.keysPressed[key] = false;
        }
    });

    // 모바일 터치 버튼 (W, A, S, D)
    const bindTouchBtn = (btnId, key) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const startMove = (e) => {
            e.preventDefault();
            gameState.keysPressed[key] = true;
        };
        const endMove = (e) => {
            e.preventDefault();
            gameState.keysPressed[key] = false;
        };

        btn.addEventListener('touchstart', startMove);
        btn.addEventListener('touchend', endMove);
        btn.addEventListener('mousedown', startMove);
        btn.addEventListener('mouseup', endMove);
        btn.addEventListener('mouseleave', endMove);
    };

    bindTouchBtn('btn-w', 'w');
    bindTouchBtn('btn-a', 'a');
    bindTouchBtn('btn-s', 's');
    bindTouchBtn('btn-d', 'd');

    // 공격 버튼
    elAttackBtn.addEventListener('click', attackMonster);
    elMobileAttackBtn.addEventListener('click', attackMonster);

    // 승리 재시작 버튼
    elRestartBtn.addEventListener('click', resetGame);
}

// 7. 메인 캐릭터 이동 및 캔버스 렌더링 Loop
function gameLoop() {
    updateCharacterPosition();
    drawCanvasField();
    requestAnimationFrame(gameLoop);
}

// 8. 캐릭터 이동 로직 (WASD)
function updateCharacterPosition() {
    let moved = false;
    const p = gameState.player;

    if (gameState.keysPressed.w) {
        p.y = Math.max(30, p.y - p.speed);
        moved = true;
    }
    if (gameState.keysPressed.s) {
        p.y = Math.min(canvas.height - 50, p.y + p.speed);
        moved = true;
    }
    if (gameState.keysPressed.a) {
        p.x = Math.max(30, p.x - p.speed);
        moved = true;
    }
    if (gameState.keysPressed.d) {
        p.x = Math.min(canvas.width - 50, p.x + p.speed);
        moved = true;
    }

    // 캐릭터가 움직일 때마다 모험 거리(km) 누적
    if (moved) {
        if (p.distanceKm < p.maxKm) {
            p.distanceKm += 0.1;
            if (p.distanceKm > p.maxKm) p.distanceKm = p.maxKm;
            checkQuestProgress('distance', Math.floor(p.distanceKm));
        }
        updateUI();
    }
}

// 9. 캔버스 필드 그리기
function drawCanvasField() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그라데이션 (500km 모험 배경)
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 길(Road / Trail) 가이드라인
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.quadraticCurveTo(canvas.width / 2, canvas.height / 4, canvas.width, canvas.height / 2);
    ctx.stroke();

    // 나무 / 지형 그래픽 decoration
    drawDecorations();

    // 몬스터 아이콘 렌더링
    const monsterX = canvas.width - 150;
    const monsterY = canvas.height / 2 - 25;
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.monster.avatar, monsterX, monsterY);

    // 용사 캐릭터 렌더링
    const p = gameState.player;
    ctx.font = '36px sans-serif';
    ctx.fillText('🧙‍♂️', p.x, p.y);

    // 용사 이름 표시
    ctx.font = 'bold 12px "Noto Sans KR"';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(`Lv.${p.level} 용사`, p.x, p.y - 25);
}

// 필드 꾸미기 요소
function drawDecorations() {
    ctx.font = '24px sans-serif';
    ctx.fillText('🌲', 80, 80);
    ctx.fillText('🌲', 220, 350);
    ctx.fillText('🏰', 620, 80);
    ctx.fillText('🌋', 500, 360);
    ctx.fillText('💎', 350, 100);
}

// 10. 몬스터 공격 및 경험치 획득 로직 (+100 EXP)
function attackMonster() {
    const p = gameState.player;
    const m = gameState.monster;
    const currentWeapon = weaponsDB[p.weaponIndex];

    // 피해량 계산
    const damage = currentWeapon.dmg;
    m.hp -= damage;
    if (m.hp < 0) m.hp = 0;

    showToast(`⚔️ 몬스터에게 ${damage}의 피해를 주었습니다!`);

    // 몬스터 처치 시
    if (m.hp === 0) {
        p.monstersDefeated++;
        showToast(`💥 몬스터 처치! 경험치 +100 EXP 획득!`);
        addExp(100);
        checkQuestProgress('kill', p.monstersDefeated);
        respawnMonster();
    }

    updateUI();
}

// 몬스터 재생성 / 강철 몬스터 교체
function respawnMonster() {
    const p = gameState.player;
    // 5레벨 단위로 몬스터 강화 단계(tier) 결정 (최대 10단계)
    const tier = Math.min(Math.floor((p.level - 1) / 5), monstersDB.length - 1);
    const template = monstersDB[tier];

    gameState.monster = {
        name: template.name,
        avatar: template.avatar,
        tier: tier + 1,
        hp: template.baseHp,
        maxHp: template.baseHp,
        attackPower: template.atk
    };
}

// 11. 경험치 추가 및 레벨업 로직 (1,000 EXP당 1 레벨업)
function addExp(amount) {
    const p = gameState.player;
    p.exp += amount;

    // 1000 EXP 이상 시 레벨업 처리
    while (p.exp >= p.maxExp && p.level < p.maxLevel) {
        p.exp -= p.maxExp;
        p.level++;
        onLevelUp(p.level);
    }

    // 50레벨 달성 시 게임 완료
    if (p.level >= p.maxLevel) {
        p.level = p.maxLevel;
        p.exp = p.maxExp;
        triggerVictory();
    }

    updateUI();
}

// 12. 레벨업 및 5레벨 주기로 무기 증정 / 몬스터 강화!
function onLevelUp(newLevel) {
    showToast(`🎉 레벨 업! 축하합니다! (현재 LV.${newLevel})`);
    checkQuestProgress('level', newLevel);

    // 조건: 5의 배수 레벨 달성 시 (Lv 5, 10, 15, ..., 50)
    if (newLevel % 5 === 0) {
        const nextWeaponIdx = Math.min(Math.floor(newLevel / 5), weaponsDB.length - 1);
        if (nextWeaponIdx > gameState.player.weaponIndex) {
            gameState.player.weaponIndex = nextWeaponIdx;
            const weapon = weaponsDB[nextWeaponIdx];
            showToast(`🎁 [5레벨 보상] 새로운 무기 획득! [${weapon.name}] (+공격력 ${weapon.dmg})`);
        }
        // 몬스터도 5레벨마다 더 강력해집니다!
        respawnMonster();
        showToast(`🔥 몬스터가 더 강력해졌습니다!`);
    }
}

// 13. 퀘스트 시스템 로직 (+50 EXP 보상)
function renderQuests() {
    elQuestList.innerHTML = '';
    gameState.quests.forEach(q => {
        const li = document.createElement('li');
        li.className = 'quest-item';

        const isReady = q.current >= q.target && !q.completed;
        const progressTxt = q.completed ? '완료됨' : `${Math.min(q.current, q.target)} / ${q.target}`;

        li.innerHTML = `
            <div class="quest-info">
                <span class="quest-title">${q.title}</span>
                <span class="quest-progress">진행도: ${progressTxt}</span>
            </div>
            <button class="quest-complete-btn" ${!isReady ? 'disabled' : ''}>
                ${q.completed ? '✓ 완료' : '보상 받기'}
            </button>
        `;

        const btn = li.querySelector('.quest-complete-btn');
        if (isReady) {
            btn.addEventListener('click', () => completeQuest(q.id));
        }

        elQuestList.appendChild(li);
    });
}

function checkQuestProgress(type, val) {
    let updated = false;
    gameState.quests.forEach(q => {
        if (q.completed) return;
        if (type === 'kill' && q.id === 1) {
            q.current = val;
            updated = true;
        } else if (type === 'distance' && q.id === 2) {
            q.current = val;
            updated = true;
        } else if (type === 'level' && q.id === 3) {
            q.current = val;
            updated = true;
        } else if (type === 'kill' && q.id === 4) {
            q.current = val;
            updated = true;
        }
    });

    if (updated) renderQuests();
}

function completeQuest(questId) {
    const q = gameState.quests.find(item => item.id === questId);
    if (q && !q.completed) {
        q.completed = true;
        showToast(`📜 퀘스트 완료! 보상으로 +50 EXP 획득!`);
        addExp(q.rewardExp);
        renderQuests();
    }
}

// 14. UI 갱신 (레벨, 경험치바, 몬스터 체력바 등)
function updateUI() {
    const p = gameState.player;
    const m = gameState.monster;
    const weapon = weaponsDB[p.weaponIndex];

    // 플레이어 정보
    elLevel.textContent = p.level;
    elCurrentExp.textContent = Math.floor(p.exp);
    elMaxExp.textContent = p.maxExp;

    const expPercent = Math.min(100, (p.exp / p.maxExp) * 100);
    elExpBar.style.width = `${expPercent}%`;

    // 무기 정보
    elWeaponIcon.textContent = weapon.icon;
    elWeaponName.textContent = weapon.name;
    elWeaponDmg.textContent = `공격력 +${weapon.dmg}`;

    // 이동 거리
    elDistance.textContent = p.distanceKm.toFixed(1);

    // 몬스터 정보
    elMonsterTier.textContent = `LV.${m.tier * 5 - 4} ~ LV.${m.tier * 5} 몬스터`;
    elMonsterAvatar.textContent = m.avatar;
    elMonsterName.textContent = m.name;
    elMonsterHp.textContent = m.hp;
    elMonsterMaxHp.textContent = m.maxHp;

    const hpPercent = Math.min(100, (m.hp / m.maxHp) * 100);
    elMonsterHpBar.style.width = `${hpPercent}%`;
}

// 15. 토스트 메시지 팝업
let toastTimer = null;
function showToast(msg) {
    elToastText.textContent = msg;
    elToast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        elToast.classList.add('hidden');
    }, 2500);
}

// 16. 최종 승리 (50레벨 달성)
function triggerVictory() {
    const weapon = weaponsDB[gameState.player.weaponIndex];
    elFinalWeapon.textContent = weapon.name;
    elFinalDmg.textContent = weapon.dmg;
    elVictoryModal.classList.remove('hidden');
}

// 17. 게임 초기화
function resetGame() {
    gameState.player.level = 1;
    gameState.player.exp = 0;
    gameState.player.distanceKm = 0;
    gameState.player.monstersDefeated = 0;
    gameState.player.weaponIndex = 0;
    gameState.player.x = 100;
    gameState.player.y = 200;

    gameState.quests.forEach(q => {
        q.current = 0;
        q.completed = false;
    });

    respawnMonster();
    renderQuests();
    updateUI();
    elVictoryModal.classList.add('hidden');
    showToast('✨ 새로운 모험이 시작되었습니다!');
}

// 게임 시작 실행
window.addEventListener('DOMContentLoaded', initGame);
