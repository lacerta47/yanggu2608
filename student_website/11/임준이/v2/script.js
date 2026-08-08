// ==========================================
// 🍓 말랑말랑 과일 쌓기 (v2) - JavaScript
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. 화면 스크린 DOM
const homeScreen = document.getElementById('homeScreen');
const stageSelectScreen = document.getElementById('stageSelectScreen');
const gamePlayScreen = document.getElementById('gamePlayScreen');
const resultModal = document.getElementById('resultModal');

// 2. 헤더 및 정보 DOM
const currentStageText = document.getElementById('currentStageText');
const targetFruitText = document.getElementById('targetFruitText');
const timerText = document.getElementById('timerText');
const scoreText = document.getElementById('scoreText');
const nextFruitDisplay = document.getElementById('nextFruitDisplay');

// 3. 결과 모달 DOM
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const drumRollArea = document.getElementById('drumRollArea');
const finalScoreText = document.getElementById('finalScoreText');

// 4. 버튼 DOM
const homeStartBtn = document.getElementById('homeStartBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const stageBtns = document.querySelectorAll('.stage-btn');
const retryBtn = document.getElementById('retryBtn');
const nextStageBtn = document.getElementById('nextStageBtn');
const homeBtn = document.getElementById('homeBtn');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');
const btnUp = document.getElementById('btnUp');

// ==========================================
// 🍎 과일 데이터베이스 정의
// ==========================================
const FRUITS = [
    { level: 0, name: '앵두', emoji: '🍒', radius: 18, color: '#ff4d6d', score: 10 },
    { level: 1, name: '산딸기', emoji: '🍓', radius: 24, color: '#ff70a6', score: 20 },
    { level: 2, name: '블루베리', emoji: '🫐', radius: 30, color: '#4361ee', score: 30 },
    { level: 3, name: '라즈베리', emoji: '🫐', radius: 37, color: '#d90429', score: 40 },
    { level: 4, name: '오디', emoji: '🍇', radius: 43, color: '#7209b7', score: 50 },
    { level: 5, name: '체리', emoji: '🍒', radius: 49, color: '#ef233c', score: 60 },
    { level: 6, name: '대추', emoji: '🪵', radius: 55, color: '#9c6644', score: 70 },
    { level: 7, name: '매실', emoji: '🍏', radius: 61, color: '#70e000', score: 80 },
    { level: 8, name: '포도', emoji: '🍇', radius: 67, color: '#560bad', score: 90 },
    { level: 9, name: '한라봉', emoji: '🍊', radius: 73, color: '#ff9e00', score: 100 },
    { level: 10, name: '용과', emoji: '🐉', radius: 79, color: '#f72585', score: 120 },
    { level: 11, name: '멜론', emoji: '🍈', radius: 85, color: '#9ef01a', score: 150 },
    { level: 12, name: '수박', emoji: '🍉', radius: 93, color: '#2b9348', score: 200 }
];

// 스테이지별 플레이 가능 과일 범위 설정
const STAGE_CONFIG = {
    1: { name: '1단계', maxSpawnLevel: 2, maxLevel: 3, targetName: '라즈베리', targetEmoji: '🫐', timeLimit: 60 },
    2: { name: '2단계', maxSpawnLevel: 4, maxLevel: 7, targetName: '매실', targetEmoji: '🍏', timeLimit: 75 },
    3: { name: '3단계', maxSpawnLevel: 5, maxLevel: 12, targetName: '수박', targetEmoji: '🍉', timeLimit: 90 }
};

// ==========================================
// 🎮 게임 변수
// ==========================================
let currentStage = 1;
let score = 0;
let timeLeft = 60;
let timerInterval = null;
let isPlaying = false;

let fruitsInGlass = [];
let particles = [];
let currentDropFruit = null;
let nextFruitIndex = 0;

// 물리 관련 변수
const gravity = 0.35;
const friction = 0.98;
const bounceFactor = 0.3;

// 키보드 조작
const keys = { left: false, right: false };

// ==========================================
// 🔊 사운드 효과 (Web Audio API)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'merge') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.setValueAtTime(659, now + 0.08); // E5
        osc.frequency.setValueAtTime(783, now + 0.16); // G5
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(783, now + 0.2);
        osc.frequency.setValueAtTime(1046, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// ==========================================
// ✨ 반짝이 파티클 생성
// ==========================================
function createSparkle(x, y, color) {
    for (let i = 0; i < 16; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 5 + 2,
            color: color || '#fff7ed',
            alpha: 1,
            life: 30
        });
    }
}

// ==========================================
// 🎨 과일 및 포근한 얼굴 그리기
// ==========================================
function drawFruit(fruit) {
    ctx.save();

    // 1. 과일 바탕 원 및 그림자
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';

    ctx.fillStyle = fruit.color;
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. 광택 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(fruit.x - fruit.radius * 0.3, fruit.y - fruit.radius * 0.3, fruit.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 3. 포근한 눈, 코, 입 그리기 (Cute cozy face 😊)
    const r = fruit.radius;
    const eyeOffsetX = r * 0.3;
    const eyeOffsetY = -r * 0.1;
    const eyeSize = Math.max(2, r * 0.08);

    ctx.fillStyle = '#212529';
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.lineCap = 'round';

    // 포근한 눈 (웃는 눈 ^ ^ 또는 또렷한 귀여운 눈)
    ctx.beginPath();
    ctx.arc(fruit.x - eyeOffsetX, fruit.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.arc(fruit.x + eyeOffsetX, fruit.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // 부드러운 분홍 볼터치 (볼)
    ctx.fillStyle = 'rgba(255, 154, 162, 0.6)';
    ctx.beginPath();
    ctx.arc(fruit.x - eyeOffsetX - 2, fruit.y + eyeOffsetY + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.arc(fruit.x + eyeOffsetX + 2, fruit.y + eyeOffsetY + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 포근한 입 (스마일 미소 😊)
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y + r * 0.1, r * 0.22, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    // 수박 스트라이프 또는 특징 추가
    if (fruit.name === '수박') {
        ctx.strokeStyle = '#1b4332';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.radius - 2, 0.2, 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.radius - 2, 2.0, 3.0);
        ctx.stroke();
    }

    ctx.restore();
}

// ==========================================
// 🚀 떨어질 과일 생성 및 이동
// ==========================================
function getRandomSpawnLevel() {
    const maxSpawn = STAGE_CONFIG[currentStage].maxSpawnLevel;
    return Math.floor(Math.random() * (maxSpawn + 1));
}

function spawnNextDropFruit() {
    const level = nextFruitIndex;
    const info = FRUITS[level];

    currentDropFruit = {
        level: level,
        name: info.name,
        emoji: info.emoji,
        radius: info.radius,
        color: info.color,
        score: info.score,
        x: canvas.width / 2,
        y: 40,
        vx: 0,
        vy: 0,
        isDropping: false
    };

    nextFruitIndex = getRandomSpawnLevel();
    nextFruitDisplay.textContent = `${FRUITS[nextFruitIndex].emoji} ${FRUITS[nextFruitIndex].name}`;
}

function dropCurrentFruit() {
    if (!currentDropFruit || currentDropFruit.isDropping) return;
    currentDropFruit.isDropping = true;
    fruitsInGlass.push(currentDropFruit);
    playSound('drop');
    createSparkle(currentDropFruit.x, currentDropFruit.y, currentDropFruit.color);

    // 일정 시간 후 다음 과일 등장
    currentDropFruit = null;
    setTimeout(() => {
        if (isPlaying) spawnNextDropFruit();
    }, 400);
}

// ==========================================
// ⚙️ 물리 연산 및 충돌 (Glass Physics & Merging)
// ==========================================
function updatePhysics() {
    // 1. 떨어뜨리는 조작 과일 위치 이동
    if (currentDropFruit && !currentDropFruit.isDropping) {
        if (keys.left && currentDropFruit.x - currentDropFruit.radius > 20) {
            currentDropFruit.x -= 5;
        }
        if (keys.right && currentDropFruit.x + currentDropFruit.radius < canvas.width - 20) {
            currentDropFruit.x += 5;
        }
    }

    // 2. 유리컵 내부 과일들 중력 및 벽 충돌
    const bottomY = canvas.height - 15;
    const leftX = 15;
    const rightX = canvas.width - 15;

    for (let i = 0; i < fruitsInGlass.length; i++) {
        const f = fruitsInGlass[i];

        f.vy += gravity;
        f.x += f.vx;
        f.y += f.vy;

        f.vx *= friction;
        f.vy *= friction;

        // 바닥 충돌
        if (f.y + f.radius > bottomY) {
            f.y = bottomY - f.radius;
            f.vy *= -bounceFactor;
        }
        // 좌우 벽 충돌
        if (f.x - f.radius < leftX) {
            f.x = leftX + f.radius;
            f.vx *= -bounceFactor;
        } else if (f.x + f.radius > rightX) {
            f.x = rightX - f.radius;
            f.vx *= -bounceFactor;
        }
    }

    // 3. 과일 상호 충돌 및 같은 과일 합성 (Merge Check)
    for (let i = 0; i < fruitsInGlass.length; i++) {
        for (let j = i + 1; j < fruitsInGlass.length; j++) {
            const f1 = fruitsInGlass[i];
            const f2 = fruitsInGlass[j];

            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = f1.radius + f2.radius;

            if (dist < minDist) {
                // 똑같은 과일 끼리 만났을 때 -> 합성! ✨
                if (f1.level === f2.level) {
                    const nextLevel = f1.level + 1;

                    // 합성 지점 중점 계산
                    const midX = (f1.x + f2.x) / 2;
                    const midY = (f1.y + f2.y) / 2;

                    // 파티클 폭발 및 소리
                    createSparkle(midX, midY, f1.color);
                    playSound('merge');

                    // 점수 추가
                    score += FRUITS[f1.level].score * 2;
                    scoreText.textContent = score;

                    // 이전 두 과일 삭제
                    fruitsInGlass.splice(j, 1);
                    fruitsInGlass.splice(i, 1);

                    // 다음 레벨 과일 생성 (최대 수박 레벨 12까지)
                    if (nextLevel < FRUITS.length) {
                        const newFruitInfo = FRUITS[nextLevel];
                        fruitsInGlass.push({
                            level: nextLevel,
                            name: newFruitInfo.name,
                            emoji: newFruitInfo.emoji,
                            radius: newFruitInfo.radius,
                            color: newFruitInfo.color,
                            score: newFruitInfo.score,
                            x: midX,
                            y: midY,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -2,
                            isDropping: true
                        });

                        // 목표 과일 달성 체크!
                        if (nextLevel >= STAGE_CONFIG[currentStage].maxLevel) {
                            setTimeout(() => { triggerVictory(); }, 500);
                        }
                    }
                    return;
                }

                // 다른 과일 끼리 겹쳤을 때 -> 밀어내기 반발력 물리 처리
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                f1.x -= nx * overlap * 0.5;
                f1.y -= ny * overlap * 0.5;
                f2.x += nx * overlap * 0.5;
                f2.y += ny * overlap * 0.5;
            }
        }
    }

    // 4. 파티클 업데이트
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 30;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ==========================================
// 🎨 메인 렌더링 루프
// ==========================================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 가이드 데드라인 라인 (위쪽에 너무 높게 쌓이면 경고)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 90);
    ctx.lineTo(canvas.width - 15, 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. 조작 중인 떨어질 과일 가이드선 및 그려주기
    if (currentDropFruit && !currentDropFruit.isDropping) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(currentDropFruit.x, currentDropFruit.y);
        ctx.lineTo(currentDropFruit.x, canvas.height - 15);
        ctx.stroke();
        ctx.setLineDash([]);

        drawFruit(currentDropFruit);
    }

    // 3. 유리컵 안의 과일들 그리기
    fruitsInGlass.forEach(drawFruit);

    // 4. 반짝이 파티클 그리기 ✨
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    if (isPlaying) {
        updatePhysics();
        requestAnimationFrame(render);
    }
}

// ==========================================
// ⏰ 타이머 및 스테이지 제어
// ==========================================
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = `${timeLeft}초`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerTimeoutCheck();
        }
    }, 1000);
}

function triggerTimeoutCheck() {
    // 시간 만료 시 목표 과일을 달성했는지 체크
    const hasTarget = fruitsInGlass.some(f => f.level >= STAGE_CONFIG[currentStage].maxLevel);
    if (hasTarget) {
        triggerVictory();
    } else {
        triggerFail();
    }
}

// ==========================================
// 🏆 결과 / 클리어 화면 처리
// ==========================================
function triggerVictory() {
    isPlaying = false;
    clearInterval(timerInterval);
    playSound('win');

    resultIcon.textContent = '🎉';
    resultTitle.textContent = '성공을 축하해요!';
    resultMessage.textContent = `${STAGE_CONFIG[currentStage].name} 목표를 멋지게 달성했습니다!`;
    finalScoreText.textContent = `${score}점`;

    // 기대효과: 맨 마지막에 두구두구두구두구 표현 🥁
    drumRollArea.classList.remove('hidden');

    if (currentStage < 3) {
        nextStageBtn.style.display = 'block';
    } else {
        nextStageBtn.style.display = 'none';
    }

    resultModal.classList.remove('hidden');
}

function triggerFail() {
    isPlaying = false;
    clearInterval(timerInterval);
    playSound('fail');

    resultIcon.textContent = '💧';
    resultTitle.textContent = '아쉽네요.';
    resultMessage.textContent = '시간 내에 목표 과일을 만들지 못했어요. 다시 도전해볼까요?';
    finalScoreText.textContent = `${score}점`;

    drumRollArea.classList.add('hidden');
    nextStageBtn.style.display = 'none';

    resultModal.classList.remove('hidden');
}

// ==========================================
// 🔄 화면 전환 함수 (Flow: 홈 -> 시작 -> 스테이지 -> 클리어)
// ==========================================
function showScreen(screen) {
    homeScreen.classList.remove('active');
    stageSelectScreen.classList.remove('active');
    gamePlayScreen.classList.remove('active');

    screen.classList.add('active');
}

function startStage(stageNum) {
    currentStage = stageNum;
    const config = STAGE_CONFIG[currentStage];

    score = 0;
    timeLeft = config.timeLimit;
    fruitsInGlass = [];
    particles = [];

    currentStageText.textContent = config.name;
    targetFruitText.textContent = `목표: ${config.targetEmoji} ${config.targetName}`;
    timerText.textContent = `${timeLeft}초`;
    scoreText.textContent = score;

    nextFruitIndex = getRandomSpawnLevel();
    spawnNextDropFruit();

    showScreen(gamePlayScreen);
    resultModal.classList.add('hidden');

    isPlaying = true;
    startTimer();
    render();
}

// ==========================================
// 🖱️ & ⌨️ 이벤트 리스너
// ==========================================

// 1. 홈 -> 단계 선택
homeStartBtn.addEventListener('click', () => {
    showScreen(stageSelectScreen);
});

// 2. 단계 선택 -> 홈으로
backToHomeBtn.addEventListener('click', () => {
    showScreen(homeScreen);
});

// 3. 단계 선택 버튼 클릭 -> 게임 시작
stageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const stageNum = parseInt(btn.dataset.stage);
        startStage(stageNum);
    });
});

// 4. 모달 결과창 버튼
retryBtn.addEventListener('click', () => {
    startStage(currentStage);
});

nextStageBtn.addEventListener('click', () => {
    if (currentStage < 3) {
        startStage(currentStage + 1);
    }
});

homeBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    showScreen(homeScreen);
});

// 5. 방향키 입력 (위, 아래, 왼쪽, 오른쪽)
window.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowDown' || e.key === 's') dropCurrentFruit();
    if (e.key === 'ArrowUp' || e.key === 'w') dropCurrentFruit();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// 6. 모바일 방향키 버튼
btnLeft.addEventListener('mousedown', () => keys.left = true);
btnLeft.addEventListener('mouseup', () => keys.left = false);
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });

btnRight.addEventListener('mousedown', () => keys.right = true);
btnRight.addEventListener('mouseup', () => keys.right = false);
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });

btnDown.addEventListener('click', dropCurrentFruit);
btnUp.addEventListener('click', dropCurrentFruit);

// Initial State
showScreen(homeScreen);
