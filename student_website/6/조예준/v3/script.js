// 🌋 화산시대 공룡 달리기 게임 (v3 - 엎드려 숙이기 기능!)

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
const btnDuck = document.getElementById('btnDuck');

// 웹 오디오 API
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

    // "띠옹~" 효과음
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playDuckSound() {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    // 숙일 때 "슝~" 바람 소리
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
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
let gameState = 'START';
let score = 0;
let highScore = localStorage.getItem('dino_high_score') || 0;
highScoreText.textContent = Math.floor(highScore);

let baseSpeed = 6;
let gameSpeed = baseSpeed;
let frameCount = 0;

const groundY = 320;

// 공룡 (Dinosaur) 상태
const dino = {
  x: 80,
  y: groundY - 50,
  normalWidth: 44,
  normalHeight: 50,
  duckWidth: 56,
  duckHeight: 26,
  width: 44,
  height: 50,
  vy: 0,
  gravity: 0.7,
  jumpStrength: -13.5,
  isGrounded: true,
  isDucking: false,
  legFrame: 0,
  legTimer: 0
};

// 장애물 배열 (화산 돌 & 높낮이가 다양한 익룡)
let obstacles = [];
let obstacleSpawnTimer = 0;
let nextSpawnInterval = 100;

// 배경 파티클
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
    if (dino.isGrounded && !dino.isDucking) {
      dino.vy = dino.jumpStrength;
      dino.isGrounded = false;
      playJumpSound();
      addDust(dino.x + 10, groundY);
    }
  } else if (gameState === 'START' || gameState === 'GAMEOVER') {
    startNewGame();
  }
}

// 숙이기 (Ducking) 시작
function startDuck() {
  if (gameState === 'PLAYING' && dino.isGrounded && !dino.isDucking) {
    dino.isDucking = true;
    dino.width = dino.duckWidth;
    dino.height = dino.duckHeight;
    dino.y = groundY - dino.duckHeight;
    playDuckSound();
  }
}

// 숙이기 해제
function stopDuck() {
  if (dino.isDucking) {
    dino.isDucking = false;
    dino.width = dino.normalWidth;
    dino.height = dino.normalHeight;
    dino.y = groundY - dino.normalHeight;
  }
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    jump();
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    startDuck();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    stopDuck();
  }
});

// 모바일 및 버튼 조작
btnJump.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
btnDuck.addEventListener('pointerdown', (e) => { e.preventDefault(); startDuck(); });
btnDuck.addEventListener('pointerup', (e) => { e.preventDefault(); stopDuck(); });
btnDuck.addEventListener('pointerleave', (e) => { e.preventDefault(); stopDuck(); });

modalBtn.addEventListener('click', () => {
  startNewGame();
});

// 게임 시작 함수
function startNewGame() {
  score = 0;
  gameSpeed = baseSpeed;
  frameCount = 0;
  obstacles = [];
  obstacleSpawnTimer = 0;
  nextSpawnInterval = 90;
  
  stopDuck();
  dino.y = groundY - dino.normalHeight;
  dino.vy = 0;
  dino.isGrounded = true;

  scoreText.textContent = '0';
  speedText.textContent = '1.0x';

  gameState = 'PLAYING';
  gameModal.classList.add('hidden');
}

// 장애물 생성 함수 (높이가 낮은 익룡 추가!)
function spawnObstacle() {
  const rand = Math.random();

  if (rand < 0.5) {
    // 화산 돌 (지상 장애물 - 점프로 피해야 함)
    const isLarge = Math.random() < 0.4;
    obstacles.push({
      type: 'ROCK',
      x: canvas.width + 20,
      y: isLarge ? groundY - 45 : groundY - 32,
      width: isLarge ? 32 : 24,
      height: isLarge ? 45 : 32
    });
  } else {
    // 익룡 (공중 장애물: 높낮이 3단계)
    // 1. LOW: 지상 바로 위 (숙여서 피해야 함!)
    // 2. MEDIUM: 중간 높이 (숙이거나 점프 둘 다 가능)
    // 3. HIGH: 높은 공중 (그냥 지나가거나 점프 안 하기)
    const heightRand = Math.random();
    let flyHeight;
    let category;

    if (heightRand < 0.45) {
      // 🚨 낮게 나는 익룡! (반드시 엎드려 숙여야 피할 수 있음!)
      flyHeight = groundY - 42;
      category = 'LOW';
    } else if (heightRand < 0.8) {
      // 중간 익룡
      flyHeight = groundY - 72;
      category = 'MEDIUM';
    } else {
      // 높게 나는 익룡
      flyHeight = groundY - 110;
      category = 'HIGH';
    }

    obstacles.push({
      type: 'BIRD',
      category: category,
      x: canvas.width + 20,
      y: flyHeight,
      width: 38,
      height: 28,
      wingState: 0
    });
  }
}

// 업데이트 로직
function update() {
  if (gameState !== 'PLAYING') return;

  frameCount++;

  // 1. 점수 및 속도 증가
  score += 0.15;
  scoreText.textContent = Math.floor(score);

  gameSpeed = baseSpeed + (score / 110);
  if (gameSpeed > 18) gameSpeed = 18;
  speedText.textContent = (gameSpeed / baseSpeed).toFixed(1) + 'x';

  if (score > highScore) {
    highScore = score;
    highScoreText.textContent = Math.floor(highScore);
    localStorage.setItem('dino_high_score', highScore);
  }

  // 2. 공룡 물리 운동
  if (!dino.isDucking) {
    dino.vy += dino.gravity;
    dino.y += dino.vy;

    if (dino.y >= groundY - dino.normalHeight) {
      dino.y = groundY - dino.normalHeight;
      dino.vy = 0;
      if (!dino.isGrounded) {
        addDust(dino.x + 10, groundY);
      }
      dino.isGrounded = true;
    }
  } else {
    // 숙이고 있을 때 바닥 밀착
    dino.y = groundY - dino.duckHeight;
    dino.vy = 0;
    dino.isGrounded = true;
  }

  // 달리기 다리 애니메이션
  dino.legTimer++;
  if (dino.legTimer > Math.max(2, 8 - Math.floor(gameSpeed / 2))) {
    dino.legFrame = (dino.legFrame + 1) % 2;
    dino.legTimer = 0;
    if (dino.isGrounded) {
      addDust(dino.x + 5, groundY);
    }
  }

  // 3. 장애물 생성
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer > nextSpawnInterval) {
    spawnObstacle();
    obstacleSpawnTimer = 0;
    nextSpawnInterval = Math.floor(Math.random() * 40 + (1000 / gameSpeed));
  }

  // 4. 장애물 이동 및 충돌 판정
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    if (obs.type === 'BIRD' && frameCount % 10 === 0) {
      obs.wingState = (obs.wingState + 1) % 2;
    }

    // 히트박스 충돌 판정
    const padding = 6;
    if (
      dino.x + padding < obs.x + obs.width - padding &&
      dino.x + dino.width - padding > obs.x + padding &&
      dino.y + padding < obs.y + obs.height - padding &&
      dino.y + dino.height - padding > obs.y + padding
    ) {
      playCrashSound();
      gameState = 'GAMEOVER';
      showGameOverModal();
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // 5. 먼지 및 파티클
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.04;
    if (p.alpha <= 0) {
      dustParticles.splice(i, 1);
    }
  }

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
  modalMessage.textContent = `익룡이나 돌에 걸려 부딪혔어요!\n\n⭐ 획득 점수: ${Math.floor(score)}점\n🏆 최고 점수: ${Math.floor(highScore)}점`;
  modalBtn.textContent = '다시 도전하기!';
  gameModal.classList.remove('hidden');
}

// 그려주기 함수 (Rendering)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 화산 배경
  ctx.fillStyle = '#2b0f38';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(120, 160);
  ctx.lineTo(240, groundY);
  ctx.lineTo(450, 130);
  ctx.lineTo(600, groundY);
  ctx.lineTo(720, 200);
  ctx.lineTo(800, groundY);
  ctx.fill();

  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.moveTo(435, 145);
  ctx.lineTo(450, 130);
  ctx.lineTo(465, 145);
  ctx.fill();

  for (let emb of embers) {
    ctx.fillStyle = `rgba(255, 140, 0, ${emb.alpha})`;
    ctx.beginPath();
    ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 땅 및 용암 선
  ctx.fillStyle = '#3a1c40';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.strokeStyle = '#ff4500';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(canvas.width, groundY + 2);
  ctx.stroke();

  ctx.strokeStyle = '#5a2d60';
  ctx.lineWidth = 2;
  for (let i = 0; i < canvas.width; i += 40) {
    const offsetX = (i - (frameCount * gameSpeed) % 40);
    ctx.beginPath();
    ctx.moveTo(offsetX, groundY + 12);
    ctx.lineTo(offsetX + 15, groundY + 12);
    ctx.stroke();
  }

  // 3. 발 먼지
  for (let p of dustParticles) {
    ctx.fillStyle = `rgba(180, 140, 190, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. 장애물 그리기 (돌 및 낮게 나는 익룡)
  for (let obs of obstacles) {
    if (obs.type === 'ROCK') {
      ctx.fillStyle = '#ff5e3a';
      ctx.strokeStyle = '#ffa07a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(obs.x + 4, obs.y + 6, 6, 6);
    } else if (obs.type === 'BIRD') {
      // 낮게 나는 익룡은 붉은 불빛 경고 테두리!
      if (obs.category === 'LOW') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4757';
      }

      ctx.fillStyle = obs.category === 'LOW' ? '#ff4757' : '#ffdd59';
      ctx.beginPath();
      ctx.arc(obs.x + 10, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 10, obs.y + 16);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      ctx.fillStyle = '#ffa502';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y - 12);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y + 24);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // 5. 공룡 (서있을 때 vs 엎드렸을 때)
  const dx = dino.x;
  const dy = dino.y;

  if (dino.isDucking) {
    // 🙇‍♂️ 엎드려 숙인 공룡
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.roundRect(dx, dy + 6, 52, 20, 8);
    ctx.fill();

    // 숙인 머리 (앞으로 길게)
    ctx.beginPath();
    ctx.roundRect(dx + 30, dy + 2, 24, 18, 5);
    ctx.fill();

    // 눈
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dx + 46, dy + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(dx + 47, dy + 8, 2, 0, Math.PI * 2);
    ctx.fill();

    // 꼬리
    ctx.fillStyle = '#26af5f';
    ctx.beginPath();
    ctx.moveTo(dx, dy + 10);
    ctx.lineTo(dx - 12, dy + 14);
    ctx.lineTo(dx, dy + 20);
    ctx.fill();

    // 숙인 다리 (빠르게 바닥 긁기)
    ctx.fillStyle = '#1e90ff';
    if (dino.legFrame === 0) {
      ctx.fillRect(dx + 12, dy + 22, 10, 4);
      ctx.fillRect(dx + 32, dy + 20, 10, 6);
    } else {
      ctx.fillRect(dx + 12, dy + 20, 10, 6);
      ctx.fillRect(dx + 32, dy + 22, 10, 4);
    }
  } else {
    // 🦖 정상 서 있는 공룡
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.roundRect(dx, dy + 10, 36, 32, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(dx + 12, dy, 28, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dx + 30, dy + 7, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(dx + 31, dy + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#26af5f';
    ctx.beginPath();
    ctx.moveTo(dx, dy + 20);
    ctx.lineTo(dx - 12, dy + 28);
    ctx.lineTo(dx, dy + 32);
    ctx.fill();

    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(dx + 26, dy + 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e90ff';
    if (!dino.isGrounded) {
      ctx.fillRect(dx + 8, dy + 40, 8, 10);
      ctx.fillRect(dx + 22, dy + 40, 8, 10);
    } else {
      if (dino.legFrame === 0) {
        ctx.fillRect(dx + 6, dy + 40, 8, 10);
        ctx.fillRect(dx + 22, dy + 38, 8, 8);
      } else {
        ctx.fillRect(dx + 6, dy + 38, 8, 8);
        ctx.fillRect(dx + 22, dy + 40, 8, 10);
      }
    }
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
