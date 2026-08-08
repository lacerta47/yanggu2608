// ==========================================
// 고양이 30단계 하늘 점프맵 로직 (v13)
// - 30개의 높이가 다른 파스텔 구름 & 무지개 블록
// - 🚨 빨간색 작은 킬 파트(Kill Part) 밟으면 즉시 재시작!
// - 스페이스바 점프 + 좌우 방향키 이동
// - 🏆 30번째 골인 지점 깃발 목표!
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const progressDisplay = document.getElementById('progressDisplay');
const deathDisplay = document.getElementById('deathDisplay');
const timerDisplay = document.getElementById('timerDisplay');

const startOverlay = document.getElementById('startOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const finalStage = document.getElementById('finalStage');
const restartBtn = document.getElementById('restartBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnJump = document.getElementById('btnJump');

// ------------------------------------------
// 웹 오디오 API (사운드 효과 생성기)
// ------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'hit') {
      // 빨간색 킬 파트에 부딪혔을 때 8비트 기폭음
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.28);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'win') {
      // 30단계 승리 팡파르
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.3, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.2);
      });
    }
  } catch (e) {
    // 예외 무시
  }
}

// ------------------------------------------
// 게임 상수 및 설정 (캔버스 800 x 480)
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

const CAT_WIDTH = 48;
const CAT_HEIGHT = 42;
const GRAVITY = 0.62;
const JUMP_FORCE = -12.8;
const MOVE_SPEED = 5.0;

// 게임 상태 변수
let isGameRunning = false;
let frameCount = 0;
let deathCount = 0;
let startTime = 0;
let elapsedTime = 0;
let animationId = null;
let currentPlatformIndex = 1;

// 카메라이동 (스크롤)
let cameraX = 0;
let cameraY = 0;

// 키 조작 상태
const keys = {
  left: false,
  right: false
};

// 흰색 오드아이 고양이 객체
const cat = {
  x: 80,
  y: 300,
  width: CAT_WIDTH,
  height: CAT_HEIGHT,
  vx: 0,
  vy: 0,
  isGrounded: false,
  facing: 'right'
};

// ------------------------------------------
// ☁️ 30단계 높이가 다른 구름 블록 & 🚨 빨간색 킬 파트맵 생성
// ------------------------------------------
let platforms = [];
let killParts = [];

const BLOCK_COLORS = [
  '#ffb7c5', '#ffcfd2', '#fbf8cc', '#b9fbc0', '#a0c4ff', '#c77dff', '#e8c5ff'
];

function generateJumpMap() {
  platforms = [];
  killParts = [];

  // 1번 시작 블록 (안전지대)
  let currentX = 40;
  let currentY = 380;

  platforms.push({
    id: 1,
    x: currentX,
    y: currentY,
    width: 180,
    height: 32,
    color: '#a0c4ff',
    isGoal: false
  });

  // 2번부터 29번 높이가 다른 구름 블록들
  for (let i = 2; i <= 29; i++) {
    const gapX = Math.floor(Math.random() * 45) + 85; // 85 ~ 130px 간격
    currentX += platforms[platforms.length - 1].width + gapX;

    // 높이 변동 (y: 140 ~ 400px 사이)
    const heightChange = (Math.random() * 140 - 70);
    currentY += heightChange;
    if (currentY < 150) currentY = 150;
    if (currentY > 400) currentY = 400;

    const width = Math.floor(Math.random() * 40) + 85; // 85 ~ 125px 너비
    const color = BLOCK_COLORS[i % BLOCK_COLORS.length];

    platforms.push({
      id: i,
      x: currentX,
      y: currentY,
      width: width,
      height: 32,
      color: color,
      isGoal: false
    });

    // 🚨 킬 파트 배치 (특정 블록 상단에 빨간색 아주 작은 위험 트랩 설치!)
    if (i % 2 === 0 || i % 3 === 0) {
      const killWidth = Math.floor(Math.random() * 6) + 12; // 12 ~ 18px (더 작아진 킬 파트!)
      const killX = currentX + Math.random() * (width - killWidth - 10) + 5;
      const killY = currentY - 8; // 블록 윗면에 착 붙어있는 작은 트랩!

      killParts.push({
        x: killX,
        y: killY,
        width: killWidth,
        height: 8,
        parentBlock: i
      });
    }
  }

  // 30번 최종 골인 지점 블록 (🏆 GOAL!)
  currentX += platforms[platforms.length - 1].width + 100;
  currentY = 250;
  platforms.push({
    id: 30,
    x: currentX,
    y: currentY,
    width: 220,
    height: 36,
    color: '#ffb703',
    isGoal: true
  });
}

// ------------------------------------------
// 게임 초기화 & 리셋
// ------------------------------------------
function respawnCat() {
  cat.x = platforms[0].x + 30;
  cat.y = platforms[0].y - cat.height - 2;
  cat.vx = 0;
  cat.vy = 0;
  cat.isGrounded = true;
  currentPlatformIndex = 1;
}

function initGame() {
  deathCount = 0;
  frameCount = 0;
  startTime = Date.now();
  elapsedTime = 0;

  generateJumpMap();
  respawnCat();
  updateUI();
}

function updateUI() {
  progressDisplay.textContent = currentPlatformIndex + ' / 30';
  deathDisplay.textContent = deathCount + '회';
  if (isGameRunning) {
    elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    timerDisplay.textContent = elapsedTime + '초';
  }
}

// ------------------------------------------
// 픽셀 렌더링 도우미
// ------------------------------------------
function drawPixelRect(px, py, pw, ph, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(px - cameraX), Math.floor(py - cameraY), Math.floor(pw), Math.floor(ph));
}

// ------------------------------------------
// 렌더링 함수들
// ------------------------------------------

// 1. 파스텔 몽실몽실 하늘 배경 & 카메라 스크롤
function drawSkyBackground() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  skyGrad.addColorStop(0, '#e0f7fa');
  skyGrad.addColorStop(0.5, '#bde0fe');
  skyGrad.addColorStop(1, '#e8c5ff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 몽실몽실 먼 픽셀 구름들
  for (let i = 0; i < 15; i++) {
    const cloudX = (i * 300 - cameraX * 0.3 + 3000) % 3000 - 200;
    const cloudY = 50 + (i % 4) * 70;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(cloudX, cloudY, 90, 30);
    ctx.fillRect(cloudX + 15, cloudY - 12, 60, 15);
  }
}

// 2. 30개 구름/무지개 블록 & 🚨 빨간색 킬 파트 그리기
function drawPlatformsAndKillParts() {
  // 블록 그리기
  platforms.forEach(p => {
    ctx.save();
    const px = Math.floor(p.x - cameraX);
    const py = Math.floor(p.y - cameraY);

    if (p.isGoal) {
      // 🏆 30번 골인 지점 황금 깃발 블록
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(px, py, p.width, p.height);
      ctx.fillStyle = '#fb8500';
      ctx.fillRect(px, py + p.height - 8, p.width, 8);

      // 깃발대 & 승리의 깃발 🚩
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + p.width / 2 - 4, py - 60, 8, 60);
      ctx.fillStyle = '#ff0054';
      ctx.beginPath();
      ctx.moveTo(px + p.width / 2 + 4, py - 60);
      ctx.lineTo(px + p.width / 2 + 45, py - 42);
      ctx.lineTo(px + p.width / 2 + 4, py - 24);
      ctx.closePath();
      ctx.fill();

      // 텍스트 GOAL!
      ctx.font = "20px 'DungGeunMo'";
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🏆 GOAL! 30', px + 30, py + 24);

    } else {
      // 몽실몽실 파스텔 구름 블록
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, p.width, p.height);

      // 상단 입체 하이라이트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(px + 4, py + 3, p.width - 8, 5);

      // 하단 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(px, py + p.height - 6, p.width, 6);

      // 블록 번호 표시 (1 ~ 29)
      ctx.font = "14px 'DungGeunMo'";
      ctx.fillStyle = '#334155';
      ctx.fillText(p.id, px + 8, py + 22);
    }

    ctx.restore();
  });

  // 🚨 빨간색 아주 작은 킬 파트(Kill Part) 그리기
  killParts.forEach(k => {
    ctx.save();
    const kx = Math.floor(k.x - cameraX);
    const ky = Math.floor(k.y - cameraY);

    // 깜빡이는 위험한 경고 빨간색 로봇/가시 킬파트
    const glow = Math.sin(frameCount * 0.25) > 0 ? '#ff0054' : '#d90429';
    ctx.fillStyle = glow;
    ctx.fillRect(kx, ky, k.width, k.height);

    // 킬파트 경고 가시 픽셀 포인트 (아주 작은 가시)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(kx + 2, ky + 1, k.width - 4, 2);

    ctx.restore();
  });
}

// 3. 🎀 흰색 오드아이 고양이 플레이어 캐릭터
function drawCat() {
  const x = cat.x;
  const y = cat.y;
  const w = cat.width;
  const h = cat.height;

  ctx.save();

  // 그림자
  if (cat.isGrounded) {
    drawPixelRect(x + 4, y + h - 2, w - 8, 4, 'rgba(0, 0, 0, 0.15)');
  }

  // 몸통
  drawPixelRect(x + 8, y + 10, w - 16, h - 16, '#ffffff');

  // 머리
  drawPixelRect(x + 10, y + 2, 28, 20, '#ffffff');
  // 귀 2개
  drawPixelRect(x + 10, y - 6, 6, 8, '#ffffff');
  drawPixelRect(x + 32, y - 6, 6, 8, '#ffffff');
  drawPixelRect(x + 12, y - 4, 3, 5, '#ffb5a7');
  drawPixelRect(x + 34, y - 4, 3, 5, '#ffb5a7');

  // ⭐ 오드아이 눈 (왼쪽: 오션 블루 💙 / 오른쪽: 호박 골드 💛)
  const eyeY = y + 8;
  const isRight = cat.facing === 'right';
  const leftEyeX = isRight ? x + 24 : x + 14;
  const rightEyeX = isRight ? x + 32 : x + 22;

  drawPixelRect(leftEyeX, eyeY, 4, 6, '#00b4d8');
  drawPixelRect(leftEyeX + 1, eyeY + 1, 2, 2, '#ffffff');

  drawPixelRect(rightEyeX, eyeY, 4, 6, '#ffb703');
  drawPixelRect(rightEyeX + 1, eyeY + 1, 2, 2, '#ffffff');

  // 핑크 코 & 볼터치
  drawPixelRect(isRight ? x + 36 : x + 10, eyeY + 4, 3, 2, '#ff758f');
  drawPixelRect(x + 14, eyeY + 7, 4, 2, '#ffadad');
  drawPixelRect(x + 30, eyeY + 7, 4, 2, '#ffadad');

  // 꼬리
  const tailWave = Math.floor(Math.sin(frameCount * 0.2) * 3);
  const tailX = isRight ? x + 2 : x + w - 8;
  drawPixelRect(tailX, y + 14 + tailWave, 6, 12, '#ffffff');

  // 다리 4개
  const legCycle = cat.isGrounded ? Math.sin(frameCount * 0.3) * 5 : 0;
  drawPixelRect(x + 10 + legCycle, y + h - 6, 5, 8, '#ffffff');
  drawPixelRect(x + 18 - legCycle, y + h - 6, 5, 8, '#ffffff');
  drawPixelRect(x + 26 + legCycle, y + h - 6, 5, 8, '#ffffff');
  drawPixelRect(x + 34 - legCycle, y + h - 6, 5, 8, '#ffffff');

  ctx.restore();
}

// ------------------------------------------
// 물리 엔진 및 충돌 검사
// ------------------------------------------
function updatePhysics() {
  frameCount++;
  updateUI();

  // 수평 이동 (좌우 방향키)
  if (keys.left) {
    cat.vx = -MOVE_SPEED;
    cat.facing = 'left';
  } else if (keys.right) {
    cat.vx = MOVE_SPEED;
    cat.facing = 'right';
  } else {
    cat.vx *= 0.7; // 감속
  }

  cat.x += cat.vx;

  // 수직 중력
  cat.vy += GRAVITY;
  cat.y += cat.vy;

  // 블록 착지 / 충돌 검사
  cat.isGrounded = false;

  platforms.forEach(p => {
    // AABB 충돌 (위에서 아래로 떨어질 때 착지)
    if (
      cat.x + cat.width > p.x + 4 &&
      cat.x < p.x + p.width - 4 &&
      cat.y + cat.height >= p.y &&
      cat.y + cat.height <= p.y + p.height / 2 + cat.vy &&
      cat.vy >= 0
    ) {
      cat.y = p.y - cat.height;
      cat.vy = 0;
      cat.isGrounded = true;

      // 현재 도달한 최고 블록 업데이트
      if (p.id > currentPlatformIndex) {
        currentPlatformIndex = p.id;
      }

      // 🏆 30번 골인 지점 도달 시 승리!
      if (p.isGoal) {
        winGame();
      }
    }
  });

  // 🚨 빨간색 킬 파트(Kill Part) 충돌 검사 (부딪히면 100% 사망 및 리셋!)
  killParts.forEach(k => {
    const padding = 3;
    if (
      cat.x + padding < k.x + k.width - padding &&
      cat.x + cat.width - padding > k.x + padding &&
      cat.y + padding < k.y + k.height - padding &&
      cat.y + cat.height - padding > k.y + padding
    ) {
      // 💥 킬 파트 터짐! 사망!
      dieAndRespawn();
    }
  });

  // 낭떠러지 추락 사망 처리
  if (cat.y > 600) {
    dieAndRespawn();
  }

  // 📷 카메라이동 (고양이를 따라 부드럽게 스크롤)
  const targetCamX = cat.x - CANVAS_WIDTH / 3;
  const targetCamY = cat.y - CANVAS_HEIGHT / 2;
  cameraX += (targetCamX - cameraX) * 0.1;
  cameraY += (targetCamY - cameraY) * 0.1;
  if (cameraY > 50) cameraY = 50; // 하단 카메라 한계
}

function dieAndRespawn() {
  deathCount++;
  playSound('hit');
  respawnCat();
}

function winGame() {
  isGameRunning = false;
  cancelAnimationFrame(animationId);
  playSound('win');

  resultTitle.textContent = '🎉 30단계 완등 성공!';
  resultMessage.textContent = `축하합니다! ${elapsedTime}초 만에 점프맵을 클리어했어요!`;
  finalStage.textContent = '30';
  resultModal.classList.remove('hidden');
}

// ------------------------------------------
// 메인 루프
// ------------------------------------------
function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isGameRunning) {
    updatePhysics();
  }

  drawSkyBackground();
  drawPlatformsAndKillParts();
  drawCat();

  if (isGameRunning) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  startOverlay.classList.add('hidden');
  resultModal.classList.add('hidden');
  initGame();
  isGameRunning = true;
  gameLoop();
}

// ------------------------------------------
// 키보드 & 터치 이벤트 (좌우 이동 + 스페이스바 점프)
// ------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = true;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = true;
  } else if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    if (!isGameRunning) {
      startGame();
    } else if (cat.isGrounded) {
      cat.vy = JUMP_FORCE;
      cat.isGrounded = false;
      playSound('jump');
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = false;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = false;
  }
});

// 모바일 전용 조작 버튼
btnLeft.addEventListener('pointerdown', () => { keys.left = true; });
btnLeft.addEventListener('pointerup', () => { keys.left = false; });
btnLeft.addEventListener('pointerleave', () => { keys.left = false; });

btnRight.addEventListener('pointerdown', () => { keys.right = true; });
btnRight.addEventListener('pointerup', () => { keys.right = false; });
btnRight.addEventListener('pointerleave', () => { keys.right = false; });

btnJump.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!isGameRunning) {
    startGame();
  } else if (cat.isGrounded) {
    cat.vy = JUMP_FORCE;
    cat.isGrounded = false;
    playSound('jump');
  }
});

startGameBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundToggleBtn.textContent = '🔊 소리 켜짐';
    initAudio();
  } else {
    soundToggleBtn.textContent = '🔇 소리 끔';
  }
});

// 초기 렌더링
generateJumpMap();
respawnCat();
drawSkyBackground();
drawPlatformsAndKillParts();
drawCat();
