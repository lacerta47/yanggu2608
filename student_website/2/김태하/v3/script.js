// Web Audio API 사운드 효과
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

  playJump() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playSlide() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playScoreMilestone() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playGameOver() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

// 우주 초록 공룡 클래스 (점프 + 슬라이딩 지원)
class GreenDino {
  constructor(canvasHeight) {
    this.canvasHeight = canvasHeight;
    this.normalWidth = 44;
    this.normalHeight = 48;
    this.slideWidth = 58;
    this.slideHeight = 24;

    this.width = this.normalWidth;
    this.height = this.normalHeight;
    this.x = 70;

    this.groundY = this.canvasHeight - 30 - this.height;
    this.y = this.groundY;
    
    this.vy = 0;
    this.gravity = 0.65;
    this.jumpStrength = -13.5;
    this.isJumping = false;
    this.isSliding = false;

    this.animFrame = 0;
    this.animTimer = 0;
  }

  jump() {
    if (!this.isJumping && !this.isSliding) {
      this.vy = this.jumpStrength;
      this.isJumping = true;
      return true;
    }
    return false;
  }

  slide(active) {
    if (active) {
      if (!this.isSliding) {
        this.isSliding = true;
        this.width = this.slideWidth;
        this.height = this.slideHeight;
        // 공중에서 슬라이딩 키 누르면 급강하
        if (this.isJumping) {
          this.vy += 8;
        }
      }
    } else {
      if (this.isSliding) {
        this.isSliding = false;
        this.width = this.normalWidth;
        this.height = this.normalHeight;
      }
    }
  }

  update() {
    // 슬라이딩 상태에 맞춰 바닥 높이 갱신
    this.groundY = this.canvasHeight - 30 - this.height;

    // 중력 및 이동 처리
    this.vy += this.gravity;
    this.y += this.vy;

    // 바닥 착지 체크
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isJumping = false;
    }

    // 달리기/슬라이딩 애니메이션 타이머
    this.animTimer++;
    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 12;

    if (this.isSliding) {
      // ===== 슬라이딩 자세 (낮게 엎드린 모습) =====
      // 몸통
      ctx.fillRect(8, 6, 42, 14);

      // 머리 & 주둥이 (앞으로 숙임)
      ctx.fillRect(44, 2, 14, 12);
      ctx.fillRect(52, 6, 6, 6);

      // 눈
      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 4, 3, 3);

      // 헬멧
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 8, 10, 0, Math.PI * 2);
      ctx.stroke();

      // 꼬리 (뒤로 길게)
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(0, 8, 10, 6);

      // 부스터 스파크 (슬라이딩 이펙트)
      ctx.fillStyle = '#ff9900';
      ctx.fillRect(-8, 14, 12, 4);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-4, 16, 8, 2);

      // 슬라이딩 바퀴/다리
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(14, 18, 12, 6);
      ctx.fillRect(34, 18, 12, 6);

    } else {
      // ===== 일반 직립 자세 =====
      // 몸통
      ctx.fillRect(10, 14, 24, 22);

      // 머리 & 주둥이
      ctx.fillRect(20, 2, 20, 16);
      ctx.fillRect(36, 6, 8, 8);

      // 눈
      ctx.fillStyle = '#000000';
      ctx.fillRect(30, 5, 4, 4);

      // 헬멧
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 10, 14, 0, Math.PI * 2);
      ctx.stroke();

      // 꼬리
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(2, 20, 10, 10);
      ctx.fillRect(0, 24, 4, 6);

      // 다리
      if (this.isJumping) {
        ctx.fillRect(14, 36, 6, 8);
        ctx.fillRect(24, 36, 6, 8);
      } else {
        if (this.animFrame === 0) {
          ctx.fillRect(12, 36, 6, 12);
          ctx.fillRect(26, 36, 6, 6);
        } else {
          ctx.fillRect(12, 36, 6, 6);
          ctx.fillRect(26, 36, 6, 12);
        }
      }
    }

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x + 4,
      y: this.y + 3,
      width: this.width - 8,
      height: this.height - 5
    };
  }
}

// 우주 장애물 클래스 (운석 / 낮은 UFO / 높은 UFO)
class Obstacle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type; // 'meteor'(낮음), 'low-ufo'(중간), 'high-ufo'(높음-슬라이딩 필수!)
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    if (this.type === 'meteor') {
      // 낮은 바닥 운석 (점프 필요)
      this.width = 34;
      this.height = 34;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height;
      this.color = '#ff007f';
    } else if (this.type === 'low-ufo') {
      // 중간 위치 UFO (점프/슬라이딩 가능)
      this.width = 42;
      this.height = 24;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height - 25;
      this.color = '#9d4edd';
    } else {
      // 높은 공중 UFO (반드시 슬라이딩/숙이기 필요!)
      this.width = 48;
      this.height = 28;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - 45 - 28; // 서있으면 머리에 걸림, 슬라이딩 시 지남
      this.color = '#ff9900';
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'meteor') {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(17, 17, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#110022';
      ctx.beginPath();
      ctx.arc(10, 12, 4, 0, Math.PI * 2);
      ctx.arc(22, 20, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'low-ufo') {
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(21, 10, 10, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(0, 10, 42, 10);

      ctx.fillStyle = '#ffe600';
      ctx.fillRect(6, 20, 6, 4);
      ctx.fillRect(18, 20, 6, 4);
      ctx.fillRect(30, 20, 6, 4);
    } else {
      // 높은 공중 고속 UFO (위협적인 붉은빛 전장 레이저 이펙트)
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(24, 10, 12, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(0, 10, 48, 12);

      // 하단 레이저 빔 이펙트
      ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
      ctx.fillRect(12, 22, 24, 6);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x + 3,
      y: this.y + 3,
      width: this.width - 6,
      height: this.height - 6
    };
  }
}

// 배경 별 입자
class StarParticle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = Math.random() * width;
    this.y = Math.random() * (height - 50);
    this.size = Math.random() * 2 + 1;
    this.speed = (this.size * 0.4);
    this.alpha = Math.random();
    this.alphaSpeed = 0.02 * (Math.random() > 0.5 ? 1 : -1);
  }

  update(gameSpeed) {
    this.x -= this.speed * (gameSpeed * 0.3);
    if (this.x < 0) {
      this.x = this.width;
      this.y = Math.random() * (this.height - 50);
    }

    this.alpha += this.alphaSpeed;
    if (this.alpha <= 0.2 || this.alpha >= 1) {
      this.alphaSpeed = -this.alphaSpeed;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// 메인 게임 컨트롤러
class SpaceDinoGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.scoreText = document.getElementById('scoreText');
    this.highScoreText = document.getElementById('highScoreText');
    this.speedText = document.getElementById('speedText');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.finalScore = document.getElementById('finalScore');
    this.restartBtn = document.getElementById('restartBtn');
    this.mobileJumpBtn = document.getElementById('mobileJumpBtn');
    this.mobileSlideBtn = document.getElementById('mobileSlideBtn');

    this.sound = new SoundManager();

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.score = 0;
    this.highScore = localStorage.getItem('space_dino_high_score') || 0;
    this.baseSpeed = 6.0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;

    this.dino = new GreenDino(this.height);
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 90;

    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push(new StarParticle(this.width, this.height));
    }

    this.animationFrameId = null;

    this.initEvents();
    this.resetGame();
  }

  initEvents() {
    const triggerJump = () => {
      this.sound.init();
      if (this.isGameOver) {
        this.resetGame();
      } else {
        if (this.dino.jump()) {
          this.sound.playJump();
        }
      }
    };

    const triggerSlide = (active) => {
      this.sound.init();
      if (!this.isGameOver) {
        if (active && !this.dino.isSliding) {
          this.sound.playSlide();
        }
        this.dino.slide(active);
      }
    };

    // 키보드 입력
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        triggerJump();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        triggerSlide(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        triggerSlide(false);
      }
    });

    // 모바일 터치 이벤트
    this.mobileJumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerJump();
    }, { passive: false });
    this.mobileJumpBtn.addEventListener('click', () => triggerJump());

    this.mobileSlideBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerSlide(true);
    }, { passive: false });

    this.mobileSlideBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      triggerSlide(false);
    }, { passive: false });

    this.mobileSlideBtn.addEventListener('mousedown', () => triggerSlide(true));
    this.mobileSlideBtn.addEventListener('mouseup', () => triggerSlide(false));

    // 다시 시작 버튼
    this.restartBtn.addEventListener('click', () => {
      this.sound.init();
      this.resetGame();
    });
  }

  resetGame() {
    this.score = 0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 90;

    this.dino = new GreenDino(this.height);
    this.modalOverlay.classList.add('hidden');

    this.updateUI();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.gameLoop();
  }

  updateUI() {
    const formattedScore = String(Math.floor(this.score)).padStart(5, '0');
    const formattedHighScore = String(Math.floor(this.highScore)).padStart(5, '0');
    const speedMult = (this.gameSpeed / this.baseSpeed).toFixed(1);

    this.scoreText.textContent = formattedScore;
    this.highScoreText.textContent = formattedHighScore;
    this.speedText.textContent = `${speedMult}x`;
  }

  spawnObstacle() {
    this.obstacleTimer++;
    if (this.obstacleTimer >= this.nextObstacleDistance) {
      const rand = Math.random();
      let type = 'meteor';
      if (rand > 0.6) {
        type = 'high-ufo'; // 높은 장애물 (슬라이딩 필수!)
      } else if (rand > 0.3) {
        type = 'low-ufo';  // 중간 장애물
      }

      this.obstacles.push(new Obstacle(this.width, this.height, type));
      this.obstacleTimer = 0;
      this.nextObstacleDistance = Math.floor(Math.random() * 50 + 65) - Math.floor((this.gameSpeed - this.baseSpeed) * 3);
      this.nextObstacleDistance = Math.max(40, this.nextObstacleDistance);
    }
  }

  checkCollision(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  drawEnvironment() {
    const groundY = this.height - 30;
    this.ctx.save();
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.width, groundY);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    this.ctx.lineWidth = 1;
    for (let x = (this.score * 5) % 40 * -1; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x - 20, this.height);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  handleGameOver() {
    this.isGameOver = true;
    this.sound.playGameOver();

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('space_dino_high_score', this.highScore);
    }

    this.finalScore.textContent = Math.floor(this.score);
    this.modalOverlay.classList.remove('hidden');
  }

  gameLoop() {
    if (this.isGameOver) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.stars.forEach(star => {
      star.update(this.gameSpeed);
      star.draw(this.ctx);
    });

    this.drawEnvironment();

    this.score += 0.15;
    this.gameSpeed += 0.0012;

    if (Math.floor(this.score) > 0 && Math.floor(this.score) % 100 === 0 && Math.floor(this.score - 0.15) % 100 !== 0) {
      this.sound.playScoreMilestone();
    }

    this.updateUI();

    this.dino.update();
    this.dino.draw(this.ctx);

    this.spawnObstacle();
    const dinoBounds = this.dino.getBounds();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(this.gameSpeed);
      obs.draw(this.ctx);

      if (this.checkCollision(dinoBounds, obs.getBounds())) {
        this.handleGameOver();
        return;
      }

      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SpaceDinoGame();
});
