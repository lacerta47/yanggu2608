// Web Audio API를 활용한 오락실 사운드 효과
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBounce() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playHitBrick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playGameOver() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playVictory() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // 도, 미, 솔, 높은 도
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.2);
    });
  }
}

// 메인 게임 클래스
class BrickBreakerGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // DOM 요소
    this.scoreText = document.getElementById('scoreText');
    this.bricksText = document.getElementById('bricksText');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalMessage = document.getElementById('modalMessage');
    this.finalScore = document.getElementById('finalScore');
    this.restartBtn = document.getElementById('restartBtn');
    this.touchLeftBtn = document.getElementById('touchLeftBtn');
    this.touchRightBtn = document.getElementById('touchRightBtn');

    // 사운드 매니저
    this.sound = new SoundManager();

    // 게임 설정값
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 패들(바) 설정
    this.paddleWidth = 120;
    this.paddleHeight = 16;
    this.paddleX = (this.width - this.paddleWidth) / 2;
    this.paddleSpeed = 9;

    // 공 설정
    this.ballRadius = 9;
    this.ballX = this.width / 2;
    this.ballY = this.height - 40;
    this.ballSpeed = 6;
    this.ballDx = this.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    this.ballDy = -this.ballSpeed;

    // 블록 설정
    this.brickRowCount = 5;
    this.brickColumnCount = 8;
    this.brickPadding = 12;
    this.brickOffsetTop = 60;
    this.brickOffsetLeft = 35;
    this.brickWidth = (this.width - (this.brickOffsetLeft * 2) - (this.brickPadding * (this.brickColumnCount - 1))) / this.brickColumnCount;
    this.brickHeight = 24;

    // 블록 색상 세트 (네온 컬러)
    this.brickColors = [
      '#ff007f', // 행 0: 네온 마젠타
      '#ffe600', // 행 1: 네온 옐로우
      '#39ff14', // 행 2: 네온 그린
      '#00f3ff', // 행 3: 네온 시안
      '#9d4edd'  // 행 4: 네온 퍼플
    ];

    // 게임 상태
    this.score = 0;
    this.totalBricks = this.brickRowCount * this.brickColumnCount;
    this.remainingBricks = this.totalBricks;
    this.isGameOver = false;
    this.isVictory = false;
    this.animationFrameId = null;

    // 입력 상태
    this.rightPressed = false;
    this.leftPressed = false;

    this.initEvents();
    this.resetGame();
  }

  initEvents() {
    // 키보드 조작
    window.addEventListener('keydown', (e) => {
      this.sound.init();
      if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        this.rightPressed = true;
      } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        this.leftPressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        this.rightPressed = false;
      } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        this.leftPressed = false;
      }
    });

    // 모바일 터치 버튼 조작
    const startLeft = (e) => { e.preventDefault(); this.sound.init(); this.leftPressed = true; };
    const stopLeft = (e) => { e.preventDefault(); this.leftPressed = false; };
    const startRight = (e) => { e.preventDefault(); this.sound.init(); this.rightPressed = true; };
    const stopRight = (e) => { e.preventDefault(); this.rightPressed = false; };

    this.touchLeftBtn.addEventListener('touchstart', startLeft, { passive: false });
    this.touchLeftBtn.addEventListener('touchend', stopLeft, { passive: false });
    this.touchLeftBtn.addEventListener('mousedown', startLeft);
    this.touchLeftBtn.addEventListener('mouseup', stopLeft);

    this.touchRightBtn.addEventListener('touchstart', startRight, { passive: false });
    this.touchRightBtn.addEventListener('touchend', stopRight, { passive: false });
    this.touchRightBtn.addEventListener('mousedown', startRight);
    this.touchRightBtn.addEventListener('mouseup', stopRight);

    // 캔버스 터치/마우스 직접 이동 지원
    const movePaddleWithPointer = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const canvasScale = this.width / rect.width;
      const targetX = (relativeX * canvasScale) - (this.paddleWidth / 2);
      this.paddleX = Math.max(0, Math.min(this.width - this.paddleWidth, targetX));
    };

    this.canvas.addEventListener('mousemove', (e) => {
      movePaddleWithPointer(e.clientX);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        movePaddleWithPointer(e.touches[0].clientX);
      }
    }, { passive: true });

    // 다시 시작 버튼
    this.restartBtn.addEventListener('click', () => {
      this.sound.init();
      this.resetGame();
    });
  }

  // 게임 데이터 초기화
  resetGame() {
    this.score = 0;
    this.remainingBricks = this.totalBricks;
    this.isGameOver = false;
    this.isVictory = false;

    this.paddleX = (this.width - this.paddleWidth) / 2;
    this.ballX = this.width / 2;
    this.ballY = this.height - 50;
    this.ballDx = (Math.random() > 0.5 ? 1 : -1) * (this.ballSpeed * 0.8);
    this.ballDy = -this.ballSpeed;

    // 블록 구조체 초기화
    this.bricks = [];
    for (let r = 0; r < this.brickRowCount; r++) {
      this.bricks[r] = [];
      for (let c = 0; c < this.brickColumnCount; c++) {
        this.bricks[r][c] = { x: 0, y: 0, status: 1 };
      }
    }

    this.updateUI();
    this.modalOverlay.classList.add('hidden');

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.gameLoop();
  }

  // 상단 UI 업데이트
  updateUI() {
    this.scoreText.textContent = this.score;
    this.bricksText.textContent = this.remainingBricks;
  }

  // 블록 그리기
  drawBricks() {
    for (let r = 0; r < this.brickRowCount; r++) {
      for (let c = 0; c < this.brickColumnCount; c++) {
        const b = this.bricks[r][c];
        if (b.status === 1) {
          const brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
          const brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
          b.x = brickX;
          b.y = brickY;

          this.ctx.save();
          this.ctx.fillStyle = this.brickColors[r];
          this.ctx.shadowColor = this.brickColors[r];
          this.ctx.shadowBlur = 10;
          this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);

          // 테두리 빛 효과
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(brickX, brickY, this.brickWidth, this.brickHeight);
          this.ctx.restore();
        }
      }
    }
  }

  // 공 그리기
  drawBall() {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }

  // 패들(바) 그리기
  drawPaddle() {
    this.ctx.save();
    this.ctx.fillStyle = '#ff007f';
    this.ctx.shadowColor = '#ff007f';
    this.ctx.shadowBlur = 15;

    // 모서리가 약간 둥근 패들
    const radius = 6;
    const x = this.paddleX;
    const y = this.height - this.paddleHeight - 10;
    const w = this.paddleWidth;
    const h = this.paddleHeight;

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + w - radius, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.ctx.lineTo(x + w, y + h - radius);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.ctx.lineTo(x + radius, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();

    // 상단 하이라이트 선
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x + 10, y + 2, w - 20, 3);
    this.ctx.restore();
  }

  // 충돌 감지 (공 - 블록)
  collisionDetection() {
    for (let r = 0; r < this.brickRowCount; r++) {
      for (let c = 0; c < this.brickColumnCount; c++) {
        const b = this.bricks[r][c];
        if (b.status === 1) {
          if (
            this.ballX + this.ballRadius > b.x &&
            this.ballX - this.ballRadius < b.x + this.brickWidth &&
            this.ballY + this.ballRadius > b.y &&
            this.ballY - this.ballRadius < b.y + this.brickHeight
          ) {
            this.ballDy = -this.ballDy;
            b.status = 0;
            this.score += 10;
            this.remainingBricks -= 1;
            this.updateUI();
            this.sound.playHitBrick();

            // 모든 블록을 깼는지 확인
            if (this.remainingBricks === 0) {
              this.handleVictory();
            }
          }
        }
      }
    }
  }

  // 승리 처리
  handleVictory() {
    this.isVictory = true;
    this.sound.playVictory();
    this.modalTitle.textContent = '🎉 승리했습니다!';
    this.modalTitle.className = 'modal-title victory';
    this.modalMessage.textContent = '축하합니다! 모든 네온 블록을 깨뜨렸어요!';
    this.finalScore.textContent = this.score;
    this.modalOverlay.classList.remove('hidden');
  }

  // 게임 오버 처리
  handleGameOver() {
    this.isGameOver = true;
    this.sound.playGameOver();
    this.modalTitle.textContent = '💀 게임 오버';
    this.modalTitle.className = 'modal-title';
    this.modalMessage.textContent = '공을 놓쳤어요! 다시 도전해보세요.';
    this.finalScore.textContent = this.score;
    this.modalOverlay.classList.remove('hidden');
  }

  // 게임 루프
  gameLoop() {
    if (this.isGameOver || this.isVictory) return;

    // 1. 캔버스 초기화
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 2. 화면 개체 그리기
    this.drawBricks();
    this.drawBall();
    this.drawPaddle();
    this.collisionDetection();

    // 3. 공 벽 충돌 처리 (좌/우)
    if (this.ballX + this.ballDx > this.width - this.ballRadius || this.ballX + this.ballDx < this.ballRadius) {
      this.ballDx = -this.ballDx;
      this.sound.playBounce();
    }

    // 4. 공 벽 충돌 처리 (상단)
    if (this.ballY + this.ballDy < this.ballRadius) {
      this.ballDy = -this.ballDy;
      this.sound.playBounce();
    }

    // 5. 공 바(Paddle) 및 하단 충돌 처리
    const paddleY = this.height - this.paddleHeight - 10;
    if (this.ballY + this.ballDy > paddleY - this.ballRadius) {
      if (this.ballX > this.paddleX - 5 && this.ballX < this.paddleX + this.paddleWidth + 5) {
        // 패들의 어느 부위에 맞았는지에 따라 반사각 조절
        const hitPoint = (this.ballX - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
        this.ballDx = hitPoint * (this.ballSpeed * 1.2);
        this.ballDy = -Math.abs(this.ballDy);
        this.sound.playBounce();
      } else if (this.ballY + this.ballDy > this.height - this.ballRadius) {
        // 바에 닿지 못하고 하단에 떨어진 경우 -> 게임 오버!
        this.handleGameOver();
        return;
      }
    }

    // 6. 공 위치 업데이트
    this.ballX += this.ballDx;
    this.ballY += this.ballDy;

    // 7. 패들 이동 처리
    if (this.rightPressed && this.paddleX < this.width - this.paddleWidth) {
      this.paddleX += this.paddleSpeed;
    } else if (this.leftPressed && this.paddleX > 0) {
      this.paddleX -= this.paddleSpeed;
    }

    // 다음 프레임 요청
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}

// 페이지 로드 시 게임 시작
window.addEventListener('DOMContentLoaded', () => {
  new BrickBreakerGame();
});
