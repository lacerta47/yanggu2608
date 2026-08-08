// 캔버스 및 DOM 요소 참조
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const shieldCountEl = document.getElementById('shieldCount');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');

// 3대 히든 아이템 HUD
const giantHud = document.getElementById('giantHud');
const giantTimerBar = document.getElementById('giantTimerBar');

const thunderHud = document.getElementById('thunderHud');
const thunderTimerBar = document.getElementById('thunderTimerBar');

const blackHoleHud = document.getElementById('blackHoleHud');
const blackHoleTimerBar = document.getElementById('blackHoleTimerBar');

const godHandHud = document.getElementById('godHandHud');
const godHandTimerBar = document.getElementById('godHandTimerBar');
const godDimensionText = document.getElementById('godDimensionText');

const dimensionHud = document.getElementById('dimensionHud');
const dimensionTimerBar = document.getElementById('dimensionTimerBar');

const resultModal = document.getElementById('resultModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const newRecordBadge = document.getElementById('newRecordBadge');
const restartBtn = document.getElementById('restartBtn');

const jumpBtn = document.getElementById('jumpBtn');
const slideBtn = document.getElementById('slideBtn');

// 캔버스 규격
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 250;

// 게임 상태 ('READY', 'RUNNING', 'GAME_OVER')
let gameState = 'READY';

// 점수 및 속도
let score = 0;
let highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
let baseSpeed = 8.5;
let frameCount = 0;
let animationId = null;

// 버프 상태 변수
let shieldsCount = 0;
let invulnerableTimer = 0;
let isMilkActive = false;
let milkTimer = 0;

// 👑 1번: 거대 킹 공룡 변수
let isGiantActive = false;
let giantTimer = 0;
const GIANT_MAX_DURATION = 420;

// ⚡ 3번: 번개 폭풍 변수
let isThunderActive = false;
let thunderTimer = 0;
const THUNDER_MAX_DURATION = 360;

// 🕳️ 4번: 냠냠 블랙홀 변수
let isBlackHoleActive = false;
let blackHoleTimer = 0;
const BLACKHOLE_MAX_DURATION = 380;

// 🌀 기본 이차원 세계 변수
let isDimensionActive = false;
let dimensionTimer = 0;
const DIMENSION_MAX_DURATION = 450;

// 🖐️✨ 신의 손 멀티 차원 변수
let isGodHandActive = false;
let godHandTimer = 0;
const GODHAND_MAX_DURATION = 540;

// 공룡 객체
const dino = {
    x: 80,
    y: GROUND_Y - 54,
    width: 44,
    height: 54,
    normalWidth: 44,
    normalHeight: 54,
    giantWidth: 80,
    giantHeight: 98,
    duckHeight: 28,
    vy: 0,
    gravity: 0.65,
    jumpPower: -12.5,
    isJumping: false,
    isDucking: false
};

// 배열 요소
let obstacles = [];
let items = [];
let clouds = [];
let particles = [];
let floatingTexts = [];
let spaceStars = [];
let thunderBolts = [];

// 우주 별빛 생성
for (let i = 0; i < 40; i++) {
    spaceStars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (GROUND_Y - 20),
        size: Math.random() * 2.5 + 1,
        speed: Math.random() * 2.5 + 1,
        color: `hsl(${Math.random() * 360}, 100%, 75%)`
    });
}

highScoreEl.textContent = highScore;
shieldCountEl.textContent = shieldsCount;

// 이벤트 리스너 등록
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleUserInteraction);
startOverlay.addEventListener('click', handleUserInteraction);
if (startBtn) startBtn.addEventListener('click', handleUserInteraction);
restartBtn.addEventListener('click', resetGame);

jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleUserInteraction(); triggerJump(); });
jumpBtn.addEventListener('mousedown', (e) => { handleUserInteraction(); triggerJump(); });

slideBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleUserInteraction(); startDuck(); });
slideBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopDuck(); });
slideBtn.addEventListener('mousedown', (e) => { handleUserInteraction(); startDuck(); });
slideBtn.addEventListener('mouseup', () => { stopDuck(); });

function handleUserInteraction() {
    if (gameState === 'READY') {
        startGame();
    }
}

function handleKeyDown(e) {
    if (gameState === 'READY') {
        startGame();
        return;
    }

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'RUNNING') {
            triggerJump();
        } else if (gameState === 'GAME_OVER') {
            resetGame();
        }
    }

    if (e.code === 'ArrowDown' || e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (gameState === 'RUNNING') {
            startDuck();
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
        if (gameState === 'RUNNING') {
            stopDuck();
        }
    }
}

function triggerJump() {
    if (gameState === 'RUNNING' && !dino.isJumping) {
        dino.vy = dino.jumpPower;
        dino.isJumping = true;
        if (dino.isDucking) {
            stopDuck();
        }
    }
}

function startDuck() {
    if (gameState === 'RUNNING' && !dino.isDucking && !dino.isJumping) {
        dino.isDucking = true;
        const currentH = isGiantActive ? 45 : dino.duckHeight;
        dino.height = currentH;
        dino.y = GROUND_Y - currentH;
    }
}

function stopDuck() {
    if (dino.isDucking) {
        dino.isDucking = false;
        const normalH = isGiantActive ? dino.giantHeight : dino.normalHeight;
        dino.height = normalH;
        dino.y = GROUND_Y - normalH;
    }
}

function startGame() {
    gameState = 'RUNNING';
    startOverlay.classList.add('hidden');
    startOverlay.style.display = 'none';
}

function resetGame() {
    gameState = 'RUNNING';
    score = 0;
    baseSpeed = 8.5;
    frameCount = 0;
    shieldsCount = 0;
    invulnerableTimer = 0;
    isMilkActive = false;
    milkTimer = 0;

    isGiantActive = false;
    giantTimer = 0;

    isThunderActive = false;
    thunderTimer = 0;

    isBlackHoleActive = false;
    blackHoleTimer = 0;

    isDimensionActive = false;
    dimensionTimer = 0;
    isGodHandActive = false;
    godHandTimer = 0;

    obstacles = [];
    items = [];
    clouds = [];
    particles = [];
    floatingTexts = [];
    thunderBolts = [];
    
    dino.width = dino.normalWidth;
    dino.height = dino.normalHeight;
    dino.y = GROUND_Y - dino.normalHeight;
    dino.vy = 0;
    dino.isJumping = false;
    dino.isDucking = false;

    currentScoreEl.textContent = '0';
    shieldCountEl.textContent = '0';
    giantHud.classList.add('hidden');
    thunderHud.classList.add('hidden');
    blackHoleHud.classList.add('hidden');
    dimensionHud.classList.add('hidden');
    godHandHud.classList.add('hidden');
    resultModal.classList.add('hidden');
    newRecordBadge.classList.add('hidden');
}

function addFloatingText(x, y, text, color = '#38bdf8') {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 40,
        dy: -1.5
    });
}

// 아이템 스폰 (👑 거대킹공룡, ⚡ 번개폭풍, 🕳️ 블랙홀, 🖐️✨ 신의손, 🥚 황금알, 🛡️ 보호막, 🥛 무적우유)
function createItem() {
    if (frameCount % 150 === 0 && Math.random() < 0.8) {
        const rand = Math.random();
        let type = 'shield';

        if (rand < 0.18) {
            type = 'giant'; // 👑 1번: 거대 킹 공룡
        } else if (rand < 0.35) {
            type = 'thunder'; // ⚡ 3번: 번개 폭풍
        } else if (rand < 0.52) {
            type = 'blackhole'; // 🕳️ 4번: 냠냠 블랙홀
        } else if (rand < 0.68) {
            type = 'godhand'; // 🖐️✨ 신의 손
        } else if (rand < 0.82) {
            type = 'egg'; // 🥚 황금알
        } else if (rand < 0.92) {
            type = 'shield'; // 🛡️ 보호막
        } else {
            type = 'milk'; // 🥛 무적우유
        }

        const yPos = Math.random() < 0.5 ? GROUND_Y - 45 : GROUND_Y - 95;

        items.push({
            x: CANVAS_WIDTH,
            y: yPos,
            width: 32,
            height: 32,
            type: type
        });
    }
}

// 구름 스폰
function createCloud() {
    if (Math.random() < 0.015) {
        clouds.push({
            x: CANVAS_WIDTH,
            y: Math.random() * 90 + 25,
            width: Math.random() * 40 + 50,
            speed: Math.random() * 0.8 + 0.5
        });
    }
}

// 장애물 스폰
function createObstacle() {
    const minInterval = Math.max(45, 90 - Math.floor(score / 80));
    if (frameCount % minInterval === 0 && Math.random() < 0.8) {
        const rand = Math.random();
        
        if (rand < 0.38 && score > 50) {
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 58,
                width: 44,
                height: 26,
                type: 'pterodactyl'
            });
        } else if (rand < 0.7) {
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 45,
                width: 24,
                height: 45,
                type: 'single'
            });
        } else {
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 52,
                width: 44,
                height: 52,
                type: 'double'
            });
        }
    }
}

function createParticles(x, y, color = '#38bdf8', count = 25) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 12,
            dy: (Math.random() - 0.5) * 12,
            color: color,
            size: Math.random() * 5 + 3,
            life: 40
        });
    }
}

// 아이템 획득 처리
function collectItem(type) {
    if (type === 'giant') {
        // 👑 1번: 거대 킹 공룡 모드 발동!
        isGiantActive = true;
        giantTimer = GIANT_MAX_DURATION;
        dino.width = dino.giantWidth;
        dino.height = dino.giantHeight;
        dino.y = GROUND_Y - dino.giantHeight;
        giantHud.classList.remove('hidden');

        addFloatingText(dino.x, dino.y - 25, '👑 거대 킹 공룡 모드! (쿵쾅 짓밟기!)', '#f59e0b');
        createParticles(dino.x + 40, dino.y + 40, '#f59e0b', 50);
    } else if (type === 'thunder') {
        // ⚡ 3번: 찌릿찌릿 번개 폭풍 모드 발동!
        isThunderActive = true;
        thunderTimer = THUNDER_MAX_DURATION;
        thunderHud.classList.remove('hidden');

        addFloatingText(dino.x, dino.y - 20, '⚡ 번개 폭풍 발동! (장애물이 보석💎으로!)', '#38bdf8');
        createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 45);
    } else if (type === 'blackhole') {
        // 🕳️ 4번: 냠냠 블랙홀 모드 발동!
        isBlackHoleActive = true;
        blackHoleTimer = BLACKHOLE_MAX_DURATION;
        blackHoleHud.classList.remove('hidden');

        addFloatingText(dino.x, dino.y - 20, '🕳️ 냠냠 블랙홀 흡수! (장애물을 사탕🍭으로!)', '#c084fc');
        createParticles(dino.x + 20, dino.y + 20, '#c084fc', 45);
    } else if (type === 'godhand') {
        isGodHandActive = true;
        godHandTimer = GODHAND_MAX_DURATION;
        godHandHud.classList.remove('hidden');
        dimensionHud.classList.add('hidden');

        addFloatingText(dino.x, dino.y - 25, '🖐️✨ 신의 손 발동! 모든 차원 연속 여행 (5배 폭발!)', '#f59e0b');
        createParticles(dino.x + 20, dino.y + 20, '#f59e0b', 50);
    } else if (type === 'egg') {
        if (!isGodHandActive) {
            isDimensionActive = true;
            dimensionTimer = DIMENSION_MAX_DURATION;
            dimensionHud.classList.remove('hidden');

            addFloatingText(dino.x, dino.y - 20, '🌀 무적 이차원 세계 진입! (점수 3배!)', '#c084fc');
            createParticles(dino.x + 20, dino.y + 20, '#c084fc', 35);
        }
    } else if (type === 'shield') {
        shieldsCount++;
        shieldCountEl.textContent = shieldsCount;
        addFloatingText(dino.x, dino.y - 15, '🛡️ 목숨 +1 추가!', '#38bdf8');
        createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 20);
    } else if (type === 'milk') {
        isMilkActive = true;
        milkTimer = 400;
        addFloatingText(dino.x, dino.y - 15, '🥛 무적 우유 파워!', '#facc15');
        createParticles(dino.x + 20, dino.y + 20, '#facc15', 20);
    }
}

// 신의 손 배경
function handleGodHandBackground() {
    ctx.save();
    if (godHandTimer > 360) {
        godDimensionText.textContent = '🌌 1차원: 네온 사이버 우주 (점수 5배!)';
        const spaceGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        spaceGrad.addColorStop(0, '#130424');
        spaceGrad.addColorStop(1, '#2b0947');
        ctx.fillStyle = spaceGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        spaceStars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
            star.x -= star.speed * 3;
            if (star.x < 0) star.x = CANVAS_WIDTH;
        });

        ctx.strokeStyle = '#c084fc';
    } else if (godHandTimer > 180) {
        godDimensionText.textContent = '🔥 2차원: 불꽃 용암 차원 (점수 5배!)';
        const lavaGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        lavaGrad.addColorStop(0, '#450a0a');
        lavaGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `hsl(${Math.random() * 40 + 10}, 100%, 50%)`;
            ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * GROUND_Y, Math.random() * 6 + 2, Math.random() * 6 + 2);
        }

        ctx.strokeStyle = '#ef4444';
    } else {
        godDimensionText.textContent = '💎 3차원: 무지개 크리스탈 차원 (점수 5배!)';
        const crystalGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        crystalGrad.addColorStop(0, '#064e3b');
        crystalGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = crystalGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = '#38bdf8';
    }

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.restore();
}

// 이차원 배경
function handleDimensionBackground() {
    ctx.save();
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    spaceGrad.addColorStop(0, '#130424');
    spaceGrad.addColorStop(1, '#2b0947');
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    spaceStars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.x -= star.speed * 2;
        if (star.x < 0) star.x = CANVAS_WIDTH;
    });

    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.restore();
}

// 🕳️ 블랙홀 포탈 그리기
function drawBlackHole() {
    if (!isBlackHoleActive) return;

    ctx.save();
    const holeX = dino.x + dino.width + 50;
    const holeY = GROUND_Y - 45;

    ctx.translate(holeX, holeY);
    ctx.rotate((frameCount * 0.1));

    // 소용돌이 포탈
    for (let r = 35; r > 5; r -= 6) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.5);
        ctx.strokeStyle = `hsl(${(frameCount * 5 + r * 10) % 360}, 90%, 65%)`;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.restore();
}

// ⚡ 번개 효과 그리기
function drawThunderBolts() {
    if (!isThunderActive) return;

    ctx.save();
    if (frameCount % 6 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    thunderBolts.forEach(tb => {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';

        ctx.beginPath();
        ctx.moveTo(tb.x, 0);
        ctx.lineTo(tb.x - 10, tb.targetY / 2);
        ctx.lineTo(tb.x + 12, tb.targetY * 0.7);
        ctx.lineTo(tb.x, tb.targetY);
        ctx.stroke();
    });
    ctx.restore();
}

// 공룡 그리기 (👑 킹공룡 거대화 및 3초 카운트다운)
function drawDino() {
    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer / 4) % 2 === 0) {
        return;
    }

    ctx.save();

    const x = dino.x;
    const y = dino.y;
    const w = dino.width;
    const h = dino.height;

    // 👑 킹공룡 왕관 및 거대화 오라
    if (isGiantActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fill();
        ctx.closePath();

        // 머리 위 왕관 👑
        ctx.font = '28px sans-serif';
        ctx.fillText('👑', x + w / 2 - 14, y - 8);
    }

    // 신의 손 후광
    if (isGodHandActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.fill();
        ctx.closePath();
    }

    // 이차원 잔상
    if (isDimensionActive && !isGodHandActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.fill();
        ctx.closePath();
    }

    // 보호막 링
    if (shieldsCount > 0 && !isMilkActive && !isDimensionActive && !isGodHandActive && !isGiantActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.stroke();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    let dinoColor = '#10b981';
    if (isGiantActive) dinoColor = '#f59e0b';
    else if (isThunderActive) dinoColor = '#facc15';
    else if (isBlackHoleActive) dinoColor = '#c084fc';
    else if (isGodHandActive) dinoColor = '#f59e0b';
    else if (isDimensionActive) dinoColor = '#c084fc';
    else if (shieldsCount > 0) dinoColor = '#38bdf8';
    else if (isMilkActive) dinoColor = `hsl(${(frameCount * 10) % 360}, 90%, 65%)`;

    ctx.fillStyle = dinoColor;

    if (dino.isDucking) {
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillRect(x + w - 16, y, 20, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + w - 6, y + 3, 4, 4);
        ctx.fillStyle = dinoColor;

        if (Math.floor(frameCount / 6) % 2 === 0) {
            ctx.fillRect(x + 10, y + h, 6, 6);
            ctx.fillRect(x + 28, y + h, 6, 2);
        } else {
            ctx.fillRect(x + 10, y + h, 6, 2);
            ctx.fillRect(x + 28, y + h, 6, 6);
        }
    } else {
        const scale = isGiantActive ? 1.8 : 1;
        ctx.fillRect(x + 14 * scale, y, 28 * scale, 22 * scale);
        ctx.fillRect(x + 32 * scale, y + 10 * scale, 12 * scale, 10 * scale);
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 30 * scale, y + 4 * scale, 4 * scale, 4 * scale);

        ctx.fillStyle = dinoColor;
        ctx.fillRect(x, y + 18 * scale, 26 * scale, 24 * scale);
        ctx.fillRect(x + 24 * scale, y + 26 * scale, 8 * scale, 4 * scale);
        ctx.fillRect(x - 8 * scale, y + 20 * scale, 10 * scale, 12 * scale);

        if (dino.isJumping) {
            ctx.fillRect(x + 4 * scale, y + 42 * scale, 6 * scale, 12 * scale);
            ctx.fillRect(x + 16 * scale, y + 42 * scale, 6 * scale, 12 * scale);
        } else {
            if (Math.floor(frameCount / 5) % 2 === 0) {
                ctx.fillRect(x + 4 * scale, y + 42 * scale, 6 * scale, 12 * scale);
                ctx.fillRect(x + 16 * scale, y + 42 * scale, 6 * scale, 6 * scale);
            } else {
                ctx.fillRect(x + 4 * scale, y + 42 * scale, 6 * scale, 6 * scale);
                ctx.fillRect(x + 16 * scale, y + 42 * scale, 6 * scale, 12 * scale);
            }
        }
    }

    // 👑/⚡/🕳️/🖐️✨/🌀/🥛 3초 남았을 때 공룡 몸 위에 3, 2, 1 카운트다운 숫자
    let activeTimer = 0;
    let timerColor = '#ffffff';

    if (isGiantActive && giantTimer <= 180) { activeTimer = giantTimer; timerColor = '#f59e0b'; }
    else if (isThunderActive && thunderTimer <= 180) { activeTimer = thunderTimer; timerColor = '#facc15'; }
    else if (isBlackHoleActive && blackHoleTimer <= 180) { activeTimer = blackHoleTimer; timerColor = '#c084fc'; }
    else if (isGodHandActive && godHandTimer <= 180) { activeTimer = godHandTimer; timerColor = '#ef4444'; }
    else if (isDimensionActive && dimensionTimer <= 180) { activeTimer = dimensionTimer; timerColor = '#c084fc'; }
    else if (isMilkActive && milkTimer <= 180) { activeTimer = milkTimer; timerColor = '#ef4444'; }

    if (activeTimer > 0) {
        const remainingSeconds = Math.ceil(activeTimer / 60);
        ctx.font = 'bold 28px "Press Start 2P", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText(remainingSeconds.toString(), x + w / 2, y + h / 2);

        ctx.fillStyle = (frameCount % 10 < 5) ? timerColor : '#ffffff';
        ctx.fillText(remainingSeconds.toString(), x + w / 2, y + h / 2);
    }

    ctx.restore();
}

// 아이템 그리기 (👑, ⚡, 🕳️, 🖐️✨, 🥚, 🛡️, 🥛)
function drawItem(item) {
    ctx.save();
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let icon = '🛡️';
    if (item.type === 'giant') icon = '👑';
    if (item.type === 'thunder') icon = '⚡';
    if (item.type === 'blackhole') icon = '🕳️';
    if (item.type === 'godhand') icon = '🖐️';
    if (item.type === 'egg') icon = '🥚';
    if (item.type === 'milk') icon = '🥛';

    const floatY = Math.sin(frameCount / 8) * 4;

    if (item.type === 'giant') {
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#f59e0b';
    } else if (item.type === 'thunder') {
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#facc15';
    } else if (item.type === 'blackhole') {
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#c084fc';
    }

    ctx.fillText(icon, item.x + item.width / 2, item.y + item.height / 2 + floatY);
    ctx.restore();
}

// 장애물 그리기
function drawObstacle(obs) {
    ctx.save();

    if (obs.type === 'pterodactyl') {
        ctx.fillStyle = isGiantActive ? '#f59e0b' : (isGodHandActive ? '#f59e0b' : (isDimensionActive ? '#c084fc' : '#f59e0b'));
        const wingUp = Math.floor(frameCount / 8) % 2 === 0;

        ctx.fillRect(obs.x + 10, obs.y + 8, 24, 12);
        ctx.fillRect(obs.x + 32, obs.y + 4, 12, 8);
        ctx.fillRect(obs.x - 4, obs.y + 10, 14, 6);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x + 38, obs.y + 6, 3, 3);
        ctx.fillStyle = isGiantActive ? '#f59e0b' : (isGodHandActive ? '#f59e0b' : (isDimensionActive ? '#c084fc' : '#f59e0b'));

        if (wingUp) {
            ctx.fillRect(obs.x + 14, obs.y - 10, 12, 18);
        } else {
            ctx.fillRect(obs.x + 14, obs.y + 16, 12, 14);
        }
    } else {
        ctx.fillStyle = isGiantActive ? '#eab308' : (isGodHandActive ? '#eab308' : (isDimensionActive ? '#38bdf8' : '#22c55e'));
        ctx.fillRect(obs.x + 8, obs.y, obs.width - 16, obs.height);
        ctx.fillRect(obs.x, obs.y + 12, 10, 6);
        ctx.fillRect(obs.x, obs.y + 6, 6, 12);

        ctx.fillRect(obs.x + obs.width - 10, obs.y + 18, 10, 6);
        ctx.fillRect(obs.x + obs.width - 6, obs.y + 10, 6, 14);

        if (obs.type === 'double') {
            ctx.fillRect(obs.x + 26, obs.y + 6, 12, obs.height - 6);
        }
    }

    ctx.restore();
}

// 구름 그리기
function drawCloud(cloud) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 14, 0, Math.PI * 2);
    ctx.arc(cloud.x + 15, cloud.y - 8, 18, 0, Math.PI * 2);
    ctx.arc(cloud.x + 32, cloud.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 바닥 그리기
function drawGround(currentSpeed) {
    ctx.save();
    ctx.strokeStyle = isGiantActive ? '#f59e0b' : (isGodHandActive ? '#f59e0b' : (isDimensionActive ? '#c084fc' : '#475569'));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = isGiantActive ? '#eab308' : (isGodHandActive ? '#eab308' : (isDimensionActive ? '#38bdf8' : '#64748b'));
    const offsetX = (frameCount * currentSpeed) % 24;
    for (let x = -offsetX; x < CANVAS_WIDTH; x += 24) {
        ctx.fillRect(x, GROUND_Y + 8, 10, 3);
        ctx.fillRect(x + 12, GROUND_Y + 18, 6, 2);
    }

    ctx.restore();
}

// 부유 텍스트 및 파티클 처리
function handleEffects() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ctx.save();
        ctx.font = 'bold 16px Pretendard, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 40;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y += ft.dy;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// 충돌 검사
function checkCollision(objA, objB) {
    const pad = 4;
    return (
        objA.x + pad < objB.x + objB.width &&
        objA.x + objA.width - pad > objB.x &&
        objA.y + pad < objB.y + objB.height &&
        objA.y + objA.height - pad > objB.y
    );
}

// 업데이트 루프
function update() {
    if (gameState !== 'RUNNING') return;

    frameCount++;

    if (invulnerableTimer > 0) invulnerableTimer--;
    if (isMilkActive) {
        milkTimer--;
        if (milkTimer <= 0) isMilkActive = false;
    }

    // 👑 1번: 거대 킹 공룡 타이머
    if (isGiantActive) {
        giantTimer--;
        const pct = (giantTimer / GIANT_MAX_DURATION) * 100;
        giantTimerBar.style.width = `${pct}%`;

        if (giantTimer <= 0) {
            isGiantActive = false;
            dino.width = dino.normalWidth;
            dino.height = dino.normalHeight;
            dino.y = GROUND_Y - dino.normalHeight;
            giantHud.classList.add('hidden');
            addFloatingText(dino.x, dino.y - 15, '거대화 종료!', '#f59e0b');
            createParticles(dino.x + 20, dino.y + 20, '#f59e0b', 30);
        }
    }

    // ⚡ 3번: 번개 폭풍 타이머
    if (isThunderActive) {
        thunderTimer--;
        const pct = (thunderTimer / THUNDER_MAX_DURATION) * 100;
        thunderTimerBar.style.width = `${pct}%`;

        if (thunderTimer <= 0) {
            isThunderActive = false;
            thunderHud.classList.add('hidden');
            thunderBolts = [];
            addFloatingText(dino.x, dino.y - 15, '번개 폭풍 종료!', '#facc15');
            createParticles(dino.x + 20, dino.y + 20, '#facc15', 30);
        }
    }

    // 🕳️ 4번: 냠냠 블랙홀 타이머
    if (isBlackHoleActive) {
        blackHoleTimer--;
        const pct = (blackHoleTimer / BLACKHOLE_MAX_DURATION) * 100;
        blackHoleTimerBar.style.width = `${pct}%`;

        if (blackHoleTimer <= 0) {
            isBlackHoleActive = false;
            blackHoleHud.classList.add('hidden');
            addFloatingText(dino.x, dino.y - 15, '블랙홀 소멸!', '#c084fc');
            createParticles(dino.x + 20, dino.y + 20, '#c084fc', 30);
        }
    }

    // 🖐️✨ 신의 손 타이머
    if (isGodHandActive) {
        godHandTimer--;
        const pct = (godHandTimer / GODHAND_MAX_DURATION) * 100;
        godHandTimerBar.style.width = `${pct}%`;

        if (godHandTimer <= 0) {
            isGodHandActive = false;
            godHandHud.classList.add('hidden');
            addFloatingText(dino.x, dino.y - 15, '신의 손 차원 여행 종료!', '#f59e0b');
            createParticles(dino.x + 20, dino.y + 20, '#f59e0b', 35);
        }
    }

    // 🌀 이차원 타이머
    if (isDimensionActive && !isGodHandActive) {
        dimensionTimer--;
        const pct = (dimensionTimer / DIMENSION_MAX_DURATION) * 100;
        dimensionTimerBar.style.width = `${pct}%`;

        if (dimensionTimer <= 0) {
            isDimensionActive = false;
            dimensionHud.classList.add('hidden');
            addFloatingText(dino.x, dino.y - 15, '원래 세계로 귀환!', '#38bdf8');
            createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 30);
        }
    }

    const currentSpeed = baseSpeed + Math.floor(score / 250) * 0.5;

    let scoreAdd = 1;
    if (isGodHandActive) scoreAdd = 5;
    else if (isDimensionActive) scoreAdd = 3;

    score += scoreAdd;
    currentScoreEl.textContent = Math.floor(score / 5);

    // 공룡 점프 및 중력
    if (dino.isJumping) {
        dino.vy += dino.gravity;
        dino.y += dino.vy;

        const currentGroundY = GROUND_Y - dino.height;
        if (dino.y >= currentGroundY) {
            dino.y = currentGroundY;
            dino.isJumping = false;
            dino.vy = 0;
        }
    }

    // 구름 이동
    if (!isDimensionActive && !isGodHandActive) createCloud();
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) clouds.splice(i, 1);
    }

    // 아이템 이동 및 획득
    createItem();
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].x -= currentSpeed;

        if (checkCollision(dino, items[i])) {
            collectItem(items[i].type);
            items.splice(i, 1);
            continue;
        }

        if (items[i].x + items[i].width < 0) items.splice(i, 1);
    }

    // ⚡ 번개 폭풍 & 🕳️ 블랙홀 흡수 처리
    thunderBolts = [];
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];

        // ⚡ 번개 폭풍: 화면의 모든 장애물을 쾅! 벼락 쳐서 보석으로 변환!
        if (isThunderActive && obs.x < CANVAS_WIDTH - 50) {
            thunderBolts.push({ x: obs.x + obs.width / 2, targetY: obs.y + obs.height / 2 });
            addFloatingText(obs.x, obs.y - 15, '💎 벼락 보석 +150!', '#facc15');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#facc15', 25);
            score += 150;
            obstacles.splice(i, 1);
            continue;
        }

        // 🕳️ 블랙홀 포탈: 공룡 앞의 블랙홀로 슈우욱~ 빨아들여 사탕으로 변환!
        if (isBlackHoleActive && obs.x < dino.x + dino.width + 120 && obs.x > dino.x) {
            addFloatingText(obs.x, obs.y - 15, '🍭 블랙홀 냠냠 +120!', '#c084fc');
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#c084fc', 25);
            score += 120;
            obstacles.splice(i, 1);
            continue;
        }
    }

    // 장애물 이동 및 본체 충돌 처리
    createObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= currentSpeed;

        if (checkCollision(dino, obs)) {
            // 👑 1번: 킹공룡 거대화 모드 발동 시 발로 쿵! 짓밟아 부수기!
            if (isGiantActive) {
                addFloatingText(obs.x, obs.y - 15, '👑 쿵! 킹공룡 짓밟기 +200!', '#f59e0b');
                createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#f59e0b', 35);
                score += 200;
                obstacles.splice(i, 1);
                continue;
            } else if (isGodHandActive) {
                addFloatingText(obs.x, obs.y - 10, '💥 BOOM! 신의 파괴!', '#f59e0b');
                createParticles(obs.x, obs.y, '#f59e0b', 30);
                score += 150;
                obstacles.splice(i, 1);
                continue;
            } else if (isDimensionActive) {
                addFloatingText(obs.x, obs.y - 10, '💥 BOOM! 차원 무적 파괴!', '#c084fc');
                createParticles(obs.x, obs.y, '#c084fc', 25);
                score += 100;
                obstacles.splice(i, 1);
                continue;
            } else if (isMilkActive) {
                addFloatingText(obs.x, obs.y - 10, '💥 BOOM! 무적 파괴!', '#facc15');
                createParticles(obs.x, obs.y, '#facc15', 20);
                score += 100;
                obstacles.splice(i, 1);
                continue;
            } else if (invulnerableTimer > 0) {
                continue;
            } else if (shieldsCount > 0) {
                shieldsCount--;
                shieldCountEl.textContent = shieldsCount;
                invulnerableTimer = 75;

                addFloatingText(dino.x, dino.y - 15, '🛡️ 보호막 소모! (생존)', '#38bdf8');
                createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 25);
                obstacles.splice(i, 1);
                continue;
            } else {
                gameOver(obs.type);
                break;
            }
        }

        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }
}

// 게임 오버
function gameOver(causeType) {
    gameState = 'GAME_OVER';
    const finalScore = Math.floor(score / 5);
    let isNewRecord = false;

    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('dino_high_score', highScore.toString());
        highScoreEl.textContent = highScore;
        isNewRecord = true;
    }

    modalIcon.textContent = isNewRecord ? '🏆' : (causeType === 'pterodactyl' ? '🦅' : '💥');
    modalTitle.textContent = isNewRecord ? '축하합니다!' : '게임 오버!';
    modalTitle.style.color = isNewRecord ? '#f59e0b' : '#ef4444';

    let causeMessage = causeType === 'pterodactyl' ? '날아오는 익룡과 부딪혔어요!' : '선인장에 부딪혔어요!';
    modalMessage.textContent = isNewRecord
        ? `와우! 최고 기록을 깨뜨렸어요! (최종 점수: ${finalScore}점)`
        : `${causeMessage} (점수: ${finalScore}점)`;

    if (isNewRecord) {
        newRecordBadge.classList.remove('hidden');
    } else {
        newRecordBadge.classList.add('hidden');
    }

    resultModal.classList.remove('hidden');
}

// 그리기 루프
function draw() {
    const currentSpeed = baseSpeed + Math.floor(score / 250) * 0.5;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (isGodHandActive) {
        handleGodHandBackground();
    } else if (isDimensionActive) {
        handleDimensionBackground();
    } else {
        clouds.forEach(drawCloud);
    }

    drawGround(currentSpeed);
    items.forEach(drawItem);
    obstacles.forEach(drawObstacle);
    drawThunderBolts(); // ⚡ 번개 그리기
    drawBlackHole();    // 🕳️ 블랙홀 그리기
    drawDino();
    handleEffects();
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

gameLoop();
