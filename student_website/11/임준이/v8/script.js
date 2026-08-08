// ==========================================
// 🍉 싱싱한 과일 쌓기 (v8) - JavaScript
// 관리자 비밀권(0222) & 11단계 연속 도전 모드
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. 화면 스크린 DOM
const homeScreen = document.getElementById('homeScreen');
const gamePlayScreen = document.getElementById('gamePlayScreen');
const adminModal = document.getElementById('adminModal');
const resultModal = document.getElementById('resultModal');

// 2. 헤더 및 게임 정보 DOM
const currentStageText = document.getElementById('currentStageText');
const targetFruitText = document.getElementById('targetFruitText');
const scoreText = document.getElementById('scoreText');
const nextFruitDisplay = document.getElementById('nextFruitDisplay');
const quickSkipBtn = document.getElementById('quickSkipBtn');

// 3. 관리자 모달 DOM (비밀번호: 0222)
const openAdminBtn = document.getElementById('openAdminBtn');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const submitAdminBtn = document.getElementById('submitAdminBtn');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const adminMsg = document.getElementById('adminMsg');

// 4. 결과 모달 DOM
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const drumRollArea = document.getElementById('drumRollArea');
const finalScoreText = document.getElementById('finalScoreText');

// 5. 버튼 DOM
const homeStartBtn = document.getElementById('homeStartBtn');
const retryBtn = document.getElementById('retryBtn');
const nextStageBtn = document.getElementById('nextStageBtn');
const homeBtn = document.getElementById('homeBtn');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');
const btnUp = document.getElementById('btnUp');

// ==========================================
// 🍎 진짜 과일 같은 13종 과일 데이타베이스
// ==========================================
const FRUITS = [
    { level: 0, name: '앵두', emoji: '🍒', radius: 18, color: '#ef233c', score: 10 },
    { level: 1, name: '산딸기', emoji: '🍓', radius: 24, color: '#ff4d6d', score: 20 },
    { level: 2, name: '블루베리', emoji: '🫐', radius: 30, color: '#3f37c9', score: 30 },
    { level: 3, name: '라즈베리', emoji: '🫐', radius: 37, color: '#d90429', score: 40 },
    { level: 4, name: '오디', emoji: '🍇', radius: 43, color: '#560bad', score: 50 },
    { level: 5, name: '체리', emoji: '🍒', radius: 49, color: '#c1121f', score: 60 },
    { level: 6, name: '대추', emoji: '🪵', radius: 55, color: '#9c6644', score: 70 },
    { level: 7, name: '매실', emoji: '🍏', radius: 61, color: '#70e000', score: 80 },
    { level: 8, name: '포도', emoji: '🍇', radius: 67, color: '#480ca8', score: 90 },
    { level: 9, name: '한라봉', emoji: '🍊', radius: 73, color: '#ff9e00', score: 100 },
    { level: 10, name: '용과', emoji: '🐉', radius: 79, color: '#f72585', score: 120 },
    { level: 11, name: '멜론', emoji: '🍈', radius: 85, color: '#9ef01a', score: 150 },
    { level: 12, name: '수박', emoji: '🍉', radius: 93, color: '#1b4332', score: 200 }
];

// 1~11단계 스테이지 구성 (AI 자동 4~11단계 확장!)
const STAGE_CONFIG = {
    1: { name: '1단계', minSpawnLevel: 0, maxSpawnLevel: 2, targetLevel: 3, targetName: '라즈베리', targetEmoji: '🫐' },
    2: { name: '2단계', minSpawnLevel: 0, maxSpawnLevel: 3, targetLevel: 7, targetName: '매실', targetEmoji: '🍏' },
    3: { name: '3단계', minSpawnLevel: 0, maxSpawnLevel: 4, targetLevel: 8, targetName: '포도', targetEmoji: '🍇' },
    4: { name: '4단계', minSpawnLevel: 0, maxSpawnLevel: 4, targetLevel: 9, targetName: '한라봉', targetEmoji: '🍊' },
    5: { name: '5단계', minSpawnLevel: 0, maxSpawnLevel: 5, targetLevel: 10, targetName: '용과', targetEmoji: '🐉' },
    6: { name: '6단계', minSpawnLevel: 0, maxSpawnLevel: 5, targetLevel: 11, targetName: '멜론', targetEmoji: '🍈' },
    7: { name: '7단계', minSpawnLevel: 0, maxSpawnLevel: 5, targetLevel: 12, targetName: '수박', targetEmoji: '🍉' },
    8: { name: '8단계', minSpawnLevel: 1, maxSpawnLevel: 6, targetLevel: 12, targetName: '대형 수박', targetEmoji: '🍉' },
    9: { name: '9단계', minSpawnLevel: 2, maxSpawnLevel: 6, targetLevel: 12, targetName: '슈퍼 수박왕', targetEmoji: '🍉' },
    10: { name: '10단계', minSpawnLevel: 3, maxSpawnLevel: 7, targetLevel: 12, targetName: '은하수 수박왕', targetEmoji: '🍉' },
    11: { name: '11단계', minSpawnLevel: 4, maxSpawnLevel: 8, targetLevel: 12, targetName: '👑 전설의 수박 과일왕', targetEmoji: '👑' }
};

// 게임 변수
let currentStage = 1;
let score = 0;
let isPlaying = false;
let isAdminPassActive = false; // 관리자 건너뛰기 사용권 온/오프

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
let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(783, now + 0.16);
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
        } else if (type === 'admin') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {}
}

// ✨ 파티클 생성
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
// 🎨 진짜 과일 같은 리얼리스틱 렌더링
// ==========================================
function drawRealisticFruit(fruit) {
    const x = fruit.x;
    const y = fruit.y;
    const r = fruit.radius;
    const name = fruit.name;

    ctx.save();

    // 그림자
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';

    // 3D 입체 그라데이션
    const radGrad = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.3, r * 0.1,
        x, y, r
    );

    if (name === '앵두' || name === '체리') {
        radGrad.addColorStop(0, '#ff758f');
        radGrad.addColorStop(0.5, '#d90429');
        radGrad.addColorStop(1, '#590d22');
    } else if (name === '산딸기') {
        radGrad.addColorStop(0, '#ff8fa3');
        radGrad.addColorStop(0.6, '#ff4d6d');
        radGrad.addColorStop(1, '#a71e34');
    } else if (name === '블루베리') {
        radGrad.addColorStop(0, '#7209b7');
        radGrad.addColorStop(0.6, '#3a0ca3');
        radGrad.addColorStop(1, '#10002b');
    } else if (name === '라즈베리') {
        radGrad.addColorStop(0, '#ff4d6d');
        radGrad.addColorStop(0.6, '#c9184a');
        radGrad.addColorStop(1, '#800f2f');
    } else if (name === '오디') {
        radGrad.addColorStop(0, '#4a154b');
        radGrad.addColorStop(0.6, '#240046');
        radGrad.addColorStop(1, '#10002b');
    } else if (name === '대추') {
        radGrad.addColorStop(0, '#b07d62');
        radGrad.addColorStop(0.6, '#804e33');
        radGrad.addColorStop(1, '#462719');
    } else if (name === '매실') {
        radGrad.addColorStop(0, '#a7c957');
        radGrad.addColorStop(0.6, '#6a994e');
        radGrad.addColorStop(1, '#386641');
    } else if (name === '포도') {
        radGrad.addColorStop(0, '#9d4edd');
        radGrad.addColorStop(0.6, '#5a189a');
        radGrad.addColorStop(1, '#240046');
    } else if (name === '한라봉') {
        radGrad.addColorStop(0, '#ffb703');
        radGrad.addColorStop(0.6, '#fb8500');
        radGrad.addColorStop(1, '#d00000');
    } else if (name === '용과') {
        radGrad.addColorStop(0, '#ff48b0');
        radGrad.addColorStop(0.6, '#e60067');
        radGrad.addColorStop(1, '#9e0047');
    } else if (name === '멜론') {
        radGrad.addColorStop(0, '#d8f3dc');
        radGrad.addColorStop(0.6, '#95d5b2');
        radGrad.addColorStop(1, '#40916c');
    } else if (name === '수박') {
        radGrad.addColorStop(0, '#52b788');
        radGrad.addColorStop(0.6, '#2d6a4f');
        radGrad.addColorStop(1, '#081c15');
    } else {
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(1, fruit.color);
    }

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 세부 과일 디테일 (줄기, 꼭지, 무늬)
    if (name === '앵두' || name === '체리') {
        ctx.strokeStyle = '#55a630';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.8);
        ctx.quadraticCurveTo(x + r * 0.4, y - r * 1.4, x + r * 0.2, y - r * 1.6);
        ctx.stroke();

        ctx.fillStyle = '#74c69d';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.3, y - r * 1.4, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
    } else if (name === '산딸기') {
        ctx.fillStyle = '#386641';
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(angle) * r * 0.4, y - r * 0.7 + Math.sin(angle) * 3, 5, 2.5, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#ffeca1';
        for (let i = 0; i < 6; i++) {
            const sx = x + (Math.random() - 0.5) * r * 1.2;
            const sy = y + (Math.random() - 0.5) * r * 1.2;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (name === '한라봉') {
        ctx.fillStyle = '#fb8500';
        ctx.beginPath();
        ctx.arc(x, y - r * 0.85, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 1.1, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (name === '멜론') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r - 3, 0.2, 2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, r - 3, 3.2, 5.5);
        ctx.stroke();
    } else if (name === '수박') {
        ctx.strokeStyle = '#081c15';
        ctx.lineWidth = 5;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(x + i * 20, y, r - 2, 0.4, 2.7);
            ctx.stroke();
        }
    }

    // 광택 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ==========================================
// 🚀 떨어뜨릴 과일 생성 및 조작
// ==========================================
function getRandomSpawnLevel() {
    const config = STAGE_CONFIG[currentStage];
    const minS = config.minSpawnLevel;
    const maxS = config.maxSpawnLevel;
    return Math.floor(Math.random() * (maxS - minS + 1)) + minS;
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

    currentDropFruit = null;
    setTimeout(() => {
        if (isPlaying) spawnNextDropFruit();
    }, 400);
}

// ==========================================
// ⚙️ 물리 및 합성 연산
// ==========================================
function updatePhysics() {
    if (currentDropFruit && !currentDropFruit.isDropping) {
        if (keys.left && currentDropFruit.x - currentDropFruit.radius > 20) {
            currentDropFruit.x -= 5;
        }
        if (keys.right && currentDropFruit.x + currentDropFruit.radius < canvas.width - 20) {
            currentDropFruit.x += 5;
        }
    }

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

        if (f.y + f.radius > bottomY) {
            f.y = bottomY - f.radius;
            f.vy *= -bounceFactor;
        }
        if (f.x - f.radius < leftX) {
            f.x = leftX + f.radius;
            f.vx *= -bounceFactor;
        } else if (f.x + f.radius > rightX) {
            f.x = rightX - f.radius;
            f.vx *= -bounceFactor;
        }
    }

    // 과일 합성 검사
    for (let i = 0; i < fruitsInGlass.length; i++) {
        for (let j = i + 1; j < fruitsInGlass.length; j++) {
            const f1 = fruitsInGlass[i];
            const f2 = fruitsInGlass[j];

            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = f1.radius + f2.radius;

            if (dist < minDist) {
                if (f1.level === f2.level) {
                    const nextLevel = f1.level + 1;
                    const midX = (f1.x + f2.x) / 2;
                    const midY = (f1.y + f2.y) / 2;

                    createSparkle(midX, midY, f1.color);
                    playSound('merge');

                    score += FRUITS[f1.level].score * 2;
                    scoreText.textContent = score;

                    fruitsInGlass.splice(j, 1);
                    fruitsInGlass.splice(i, 1);

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

                        if (nextLevel >= STAGE_CONFIG[currentStage].targetLevel) {
                            setTimeout(() => { triggerVictory(); }, 500);
                        }
                    }
                    return;
                }

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

    // 파티클
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

    // 빨간 가이드선
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 90);
    ctx.lineTo(canvas.width - 15, 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // 낙하 가이드선
    if (currentDropFruit && !currentDropFruit.isDropping) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(currentDropFruit.x, currentDropFruit.y);
        ctx.lineTo(currentDropFruit.x, canvas.height - 15);
        ctx.stroke();
        ctx.setLineDash([]);

        drawRealisticFruit(currentDropFruit);
    }

    // 과일들 렌더링
    fruitsInGlass.forEach(drawRealisticFruit);

    // 파티클
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
// 🔑 관리자 전용 건너뛰기 사용권 인증 (비밀번호: 0222)
// ==========================================
openAdminBtn.addEventListener('click', () => {
    adminPasswordInput.value = '';
    adminMsg.textContent = '';
    adminModal.classList.remove('hidden');
});

closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

submitAdminBtn.addEventListener('click', checkAdminPassword);
adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAdminPassword();
});

function checkAdminPassword() {
    const inputVal = adminPasswordInput.value.trim();
    if (inputVal === '0222') {
        isAdminPassActive = true;
        playSound('admin');
        adminMsg.style.color = '#10b981';
        adminMsg.textContent = '관리자 건너뛰기 사용권이 활성화되었습니다! ⚡';

        setTimeout(() => {
            adminModal.classList.add('hidden');
            quickSkipBtn.classList.remove('hidden');
        }, 700);
    } else {
        adminMsg.style.color = '#ef4444';
        adminMsg.textContent = '비밀번호가 올바르지 않습니다!';
    }
}

// ⚡ 관리자 퀵 건너뛰기 사용권 버튼 누름
quickSkipBtn.addEventListener('click', () => {
    if (!isPlaying) return;
    playSound('admin');
    createSparkle(canvas.width / 2, canvas.height / 2, '#f59e0b');
    triggerVictory();
});

// ==========================================
// 🏆 결과 / 성공 처리
// ==========================================
function triggerVictory() {
    isPlaying = false;
    playSound('win');

    resultIcon.textContent = '🎉';
    resultTitle.textContent = '성공을 축하해요!';
    resultMessage.textContent = `${STAGE_CONFIG[currentStage].name} 목표 달성! 다음 단계로 넘어갑니다.`;
    finalScoreText.textContent = `${score}점`;

    // 기대효과: 두구두구두구두구 🥁
    drumRollArea.classList.remove('hidden');

    if (currentStage < 11) {
        nextStageBtn.style.display = 'block';
    } else {
        nextStageBtn.style.display = 'none';
        resultTitle.textContent = '👑 11단계 최종 클리어 축하해요!';
        resultMessage.textContent = '모든 11개 과일 단계를 정복하셨습니다! 당신은 과일왕!';
    }

    resultModal.classList.remove('hidden');
}

// ==========================================
// 🔄 화면 전환 및 스테이지 시작
// ==========================================
function showScreen(screen) {
    homeScreen.classList.remove('active');
    gamePlayScreen.classList.remove('active');
    screen.classList.add('active');
}

function startStage(stageNum) {
    currentStage = stageNum;
    const config = STAGE_CONFIG[currentStage];

    score = 0;
    fruitsInGlass = [];
    particles = [];

    currentStageText.textContent = `${config.name} / 11단계`;
    targetFruitText.textContent = `목표: ${config.targetEmoji} ${config.targetName}`;
    scoreText.textContent = score;

    if (isAdminPassActive) {
        quickSkipBtn.classList.remove('hidden');
    } else {
        quickSkipBtn.classList.add('hidden');
    }

    nextFruitIndex = getRandomSpawnLevel();
    spawnNextDropFruit();

    showScreen(gamePlayScreen);
    resultModal.classList.add('hidden');

    isPlaying = true;
    render();
}

// ==========================================
// 🖱️ & ⌨️ 이벤트 리스너
// ==========================================
homeStartBtn.addEventListener('click', () => startStage(1));

retryBtn.addEventListener('click', () => startStage(currentStage));
nextStageBtn.addEventListener('click', () => {
    if (currentStage < 11) startStage(currentStage + 1);
});
homeBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    showScreen(homeScreen);
});

// 방향키 입력
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

// 모바일 방향키
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

// 초기 화면 설정
showScreen(homeScreen);
