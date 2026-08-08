// 🌋 화산시대 공룡 달리기 게임 (v2)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreText = document.getElementById('scoreText');
const highScoreText = document.getElementById('highScoreText');
const speedText = document.getElementById('speedText');

const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalBtn = document.getElementById('modalBtn');
const btnJump = document.getElementById('btnJump');

// 웹 오디오 API (띠옹 효과음)
let audioCtx = null;

function playJumpSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // "띠옹~" 소리 만들기 (음높이가 빠르게 피웅 올라갔다가 살짝 내려옴)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // 오디오 미지원 예외 처리
  }
}

function playCrashSound() {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

// 게임 상태 및 최고점수
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let highScore = localStorage.getItem('dino_high_score') || 0;
highScoreText.textContent = Math.floor(highScore);

let baseSpeed = 6;
let gameSpeed = baseSpeed;
let frameCount = 0;

// 땅 높이
const groundY = 320;

// 공룡 (Dinosaur) 설정
const dino = {
  x: 80,
  y: groundY - 50,
  width: 44,
  height: 50,
  vy: 0,
  gravity: 0.7,
  jumpStrength: -13.5,
  isGrounded: true,
  legFrame: 0,
  legTimer: 0
};

// 장애물 배열 (화산 돌 & 익룡)
let obstacles = [];
let obstacleSpawnTimer = 0;
let nextSpawnInterval = 100;

// 배경 구름 및 화산 재/불꽃 파티클
let embers = [];
for (let i = 0; i < 30; i++) {
  embers.push({
    x: Math.random() * canvas.width,
    y: Math.random() * (groundY - 100),
    size: Math.random() * 3 + 1,
    vx: -Math.random() * 1.5 - 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    alpha: Math.random() * 0.7 + 0.3
  });
}

// 먼지 이펙트 (발에서 일어나는 먼지)
let dustParticles = [];
function addDust(x, y) {
  dustParticles.push({
    x: x,
    y: y,
    vx: -gameSpeed * 0.5 - Math.random() * 2,
    vy: -Math.random() * 2,
    size: Math.random() * 4 + 2,
    alpha: 0.8
  });
}

// 점프 로직
function jump() {
  if (gameState === 'PLAYING') {
    if (dino.isGrounded) {
      dino.vy = dino.jumpStrength;
      dino.isGrounded = false;
      playJumpSound();
      addDust(dino.x + 10, groundY);
    }
  } else if (gameState === 'START' || gameState === 'GAMEOVER') {
    startNewGame();
  }
}

// 키보드 & 터치 입력 등록
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp') {
    e.preventDefault();
    jump();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  jump();
});

btnJump.addEventListener('click', (e) => {
  e.preventDefault();
  jump();
});

modalBtn.addEventListener('click', () => {
  startNewGame();
});

// 새 게임 시작
function startNewGame() {
  score = 0;
  gameSpeed = baseSpeed;
  frameCount = 0;
  obstacles = [];
  obstacleSpawnTimer = 0;
  nextSpawnInterval = 90;
  dino.y = groundY - dino.height;
  dino.vy = 0;
  dino.isGrounded = true;

  scoreText.textContent = '0';
  speedText.textContent = '1.0x';

  gameState = 'PLAYING';
  gameModal.classList.add('hidden');
}

// 장애물 생성 함수
function spawnObstacle() {
  const type = Math.random() < 0.7 ? 'ROCK' : 'BIRD'; // 70% 돌, 30% 익룡

  if (type === 'ROCK') {
    const isLarge = Math.random() < 0.4;
    obstacles.push({
      type: 'ROCK',
      x: canvas.width + 20,
      y: isLarge ? groundY - 45 : groundY - 32,
      width: isLarge ? 32 : 24,
      height: isLarge ? 45 : 32,
      passed: false
    });
  } else {
    // 익룡 (공중 장애물)
    const flyHeight = Math.random() < 0.5 ? groundY - 70 : groundY - 110;
    obstacles.push({
      type: 'BIRD',
      x: canvas.width + 20,
      y: flyHeight,
      width: 36,
      height: 28,
      wingState: 0,
      passed: false
    });
  }
}

// 게임 상태 업데이트 (Logic)
function update() {
  if (gameState !== 'PLAYING') return;

  frameCount++;

  // 1. 점수 증가 및 속도 증가 (시간이 지날수록 공룡이 점점 더 빠르게 달림!)
  score += 0.15;
  scoreText.textContent = Math.floor(score);

  // 100점마다 게임 속도 조금씩 증가 (최대 18까지)
  gameSpeed = baseSpeed + (score / 120);
  if (gameSpeed > 18) gameSpeed = 18;
  speedText.textContent = (gameSpeed / baseSpeed).toFixed(1) + 'x';

  // 2. 최고점수 갱신
  if (score > highScore) {
    highScore = score;
    highScoreText.textContent = Math.floor(highScore);
    localStorage.setItem('dino_high_score', highScore);
  }

  // 3. 공룡 물리 운동
  dino.vy += dino.gravity;
  dino.y += dino.vy;

  // 착지 체크
  if (dino.y >= groundY - dino.height) {
    dino.y = groundY - dino.height;
    dino.vy = 0;
    if (!dino.isGrounded) {
      addDust(dino.x + 10, groundY);
    }
    dino.isGrounded = true;
  }

  // 달리는 다리 애니메이션
  dino.legTimer++;
  if (dino.legTimer > Math.max(2, 8 - Math.floor(gameSpeed / 2))) {
    dino.legFrame = (dino.legFrame + 1) % 2;
    dino.legTimer = 0;
    if (dino.isGrounded) {
      addDust(dino.x + 5, groundY);
    }
  }

  // 4. 장애물 생성 타이머
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer > nextSpawnInterval) {
    spawnObstacle();
    obstacleSpawnTimer = 0;
    // 다음 장애물 간격을 랜덤하게 조정 (속도가 빠를수록 간격 좁아짐)
    nextSpawnInterval = Math.floor(Math.random() * 40 + (1000 / gameSpeed));
  }

  // 5. 장애물 이동 및 충돌 체크
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    // 익룡 날개 짓
    if (obs.type === 'BIRD' && frameCount % 12 === 0) {
      obs.wingState = (obs.wingState + 1) % 2;
    }

    // 충돌 판정 (히트박스를 약간 좁혀서 너그러운 판정)
    const padding = 6;
    if (
      dino.x + padding < obs.x + obs.width - padding &&
      dino.x + dino.width - padding > obs.x + padding &&
      dino.y + padding < obs.y + obs.height - padding &&
      dino.y + dino.height - padding > obs.y + padding
    ) {
      // 충돌 발생! 게임 오버
      playCrashSound();
      gameState = 'GAMEOVER';
      showGameOverModal();
    }

    // 화면 밖으로 나간 장애물 제거
    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 6. 먼지 이펙트 업데이트
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.04;
    if (p.alpha <= 0) {
      dustParticles.splice(i, 1);
    }
  }

  // 7. 화산 불꽃 배경 요소 이동
  for (let emb of embers) {
    emb.x += emb.vx;
    emb.y += emb.vy;
    if (emb.x < 0) emb.x = canvas.width;
    if (emb.y < 0) emb.y = groundY - 80;
  }
}

// 게임 오버 모달
function showGameOverModal() {
  modalTitle.textContent = '💥 공룡 부딪힘!';
  modalMessage.textContent = `장애물에 걸려 넘어졌어요!\n\n⭐ 획득 점수: ${Math.floor(score)}점\n🏆 최고 점수: ${Math.floor(highScore)}점`;
  modalBtn.textContent = '스페이스바로 다시 뛰기!';
  gameModal.classList.remove('hidden');
}

// 게임 그래픽 그리기 (Drawing)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 화산시대 배경 (배경 화산 산맥)
  ctx.fillStyle = '#2b0f38';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(120, 160); // 화산 1
  ctx.lineTo(240, groundY);
  ctx.lineTo(450, 130); // 중앙 거대 화산 2
  ctx.lineTo(600, groundY);
  ctx.lineTo(720, 200); // 화산 3
  ctx.lineTo(800, groundY);
  ctx.fill();

  // 중앙 거대 화산 불빛 glowing peak
  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.moveTo(435, 145);
  ctx.lineTo(450, 130);
  ctx.lineTo(465, 145);
  ctx.fill();

  // 화산 불꽃 재 파티클
  for (let emb of embers) {
    ctx.fillStyle = `rgba(255, 140, 0, ${emb.alpha})`;
    ctx.beginPath();
    ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 바닥 (화산 암석 지대)
  ctx.fillStyle = '#3a1c40';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // 바닥 용암 균열 선
  ctx.strokeStyle = '#ff4500';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(canvas.width, groundY + 2);
  ctx.stroke();

  // 바닥 질감 선 (스크롤 이펙트)
  ctx.strokeStyle = '#5a2d60';
  ctx.lineWidth = 2;
  for (let i = 0; i < canvas.width; i += 40) {
    const offsetX = (i - (frameCount * gameSpeed) % 40);
    ctx.beginPath();
    ctx.moveTo(offsetX, groundY + 12);
    ctx.lineTo(offsetX + 15, groundY + 12);
    ctx.stroke();
  }

  // 3. 발 먼지 파티클
  for (let p of dustParticles) {
    ctx.fillStyle = `rgba(180, 140, 190, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 장애물 그리기
  for (let obs of obstacles) {
    if (obs.type === 'ROCK') {
      // 화산 돌 (Rock)
      ctx.fillStyle = '#ff5e3a';
      ctx.strokeStyle = '#ffa07a';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      // 돌 표면 용암 눈금
      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(obs.x + 4, obs.y + 6, 6, 6);
    } else if (obs.type === 'BIRD') {
      // 익룡 (Pterodactyl)
      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      // 머리 & 몸통
      ctx.arc(obs.x + 10, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      // 부리
      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 8, obs.y + 16);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      // 날개 (위아래 애니메이션)
      ctx.fillStyle = '#ffa502';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y - 10);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y + 24);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      }
      ctx.fill();
    }
  }

  // 5. 공룡 (Cute T-Rex) 그리기
  const dx = dino.x;
  const dy = dino.y;

  // 몸통 (초록 아기 공룡)
  ctx.fillStyle = '#2ed573';
  ctx.beginPath();
  ctx.roundRect(dx, dy + 10, 36, 32, 8);
  ctx.fill();

  // 머리
  ctx.beginPath();
  ctx.roundRect(dx + 12, dy, 28, 22, 6);
  ctx.fill();

  // 공룡 눈 (동그란 큰 눈)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(dx + 30, dy + 7, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(dx + 31, dy + 7, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 꼬리
  ctx.fillStyle = '#26af5f';
  ctx.beginPath();
  ctx.moveTo(dx, dy + 20);
  ctx.lineTo(dx - 12, dy + 28);
  ctx.lineTo(dx, dy + 32);
  ctx.fill();

  // 볼터치
  ctx.fillStyle = '#ff7675';
  ctx.beginPath();
  ctx.arc(dx + 26, dy + 14, 3, 0, Math.PI * 2);
  ctx.fill();

  // 다리 (달리기 애니메이션 / 점프 시 다리 모음)
  ctx.fillStyle = '#1e90ff';
  if (!dino.isGrounded) {
    // 점프 중
    ctx.fillRect(dx + 8, dy + 40, 8, 10);
    ctx.fillRect(dx + 22, dy + 40, 8, 10);
  } else {
    // 달리는 중 다리 교차
    if (dino.legFrame === 0) {
      ctx.fillRect(dx + 6, dy + 40, 8, 10);
      ctx.fillRect(dx + 22, dy + 38, 8, 8);
    } else {
      ctx.fillRect(dx + 6, dy + 38, 8, 8);
      ctx.fillRect(dx + 22, dy + 40, 8, 10);
    }
  }
}

// 메인 실행 루프
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// 실행
gameLoop();
