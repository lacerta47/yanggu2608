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

  playWarning() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(850, this.ctx.currentTime);
    osc.frequency.setValueAtTime(450, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playHyperspaceEnter() {
    if (!this.ctx) return;
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.25);
    });
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

// 1.5배 고속 반응 우주 공룡 클래스
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
    this.gravity = 0.8; // 1.5배 속도에 맞춘 빠르고 절도 있는 점프 물리학
    this.jumpStrength = -14.8;
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
        if (this.isJumping) {
          this.vy += 10;
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
    this.groundY = this.canvasHeight - 30 - this.height;

    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isJumping = false;
    }

    this.animTimer++;
    if (this.animTimer % 4 === 0) { // 1.5배 빠른 달리기 애니메이션
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  draw(ctx, isHyperspace) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const dinoColor = isHyperspace ? '#00ffff' : '#39ff14';
    ctx.fillStyle = dinoColor;
    ctx.shadowColor = dinoColor;
    ctx.shadowBlur = isHyperspace ? 20 : 12;

    if (this.isSliding) {
      ctx.fillRect(8, 6, 42, 14);

      ctx.fillRect(44, 2, 14, 12);
      ctx.fillRect(52, 6, 6, 6);

      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 4, 3, 3);

      ctx.strokeStyle = isHyperspace ? '#ff00ff' : '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 8, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = dinoColor;
      ctx.fillRect(0, 8, 10, 6);

      ctx.fillStyle = '#ff007f';
      ctx.fillRect(-10, 14, 14, 4);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-5, 16, 8, 2);

      ctx.fillStyle = dinoColor;
      ctx.fillRect(14, 18, 12, 6);
      ctx.fillRect(34, 18, 12, 6);

    } else {
      ctx.fillRect(10, 14, 24, 22);

      ctx.fillRect(20, 2, 20, 16);
      ctx.fillRect(36, 6, 8, 8);

      ctx.fillStyle = '#000000';
      ctx.fillRect(30, 5, 4, 4);

      ctx.strokeStyle = isHyperspace ? '#ff00ff' : '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 10, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = dinoColor;
      ctx.fillRect(2, 20, 10, 10);
      ctx.fillRect(0, 24, 4, 6);

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
    const paddingX = 6;
    const paddingY = 4;
    return {
      x: this.x + paddingX,
      y: this.y + paddingY,
      width: this.width - (paddingX * 2),
      height: this.height - (paddingY * 2)
    };
  }
}

// 장애물 클래스
class Obstacle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    if (this.type === 'meteor') {
      this.width = 40;
      this.height = 42;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height;
      this.color = '#ff0055';
    } else {
      this.width = 48;
      this.height = 26;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - 48;
      this.color = '#ff9900';
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(ctx, isHyperspace) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'meteor') {
      ctx.fillStyle = isHyperspace ? '#ff00ff' : '#ff0055';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(20, 21, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.arc(15, 12, 6, 0, Math.PI * 2);
      ctx.arc(28, 28, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(12, 10, 3, 0, Math.PI * 2);
      ctx.fill();

    } else {
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

      ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
      ctx.fillRect(12, 22, 24, 4);
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

// 배경 슈팅스타
class BackgroundShootingStar {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.x = this.width + Math.random() * 300;
    this.y = Math.random() * 100 + 15;
    this.length = Math.random() * 80 + 40;
    this.speed = Math.random() * 12 + 15;
    this.size = Math.random() * 2 + 1;
    this.color = Math.random() > 0.5 ? '#00f3ff' : '#ffe600';
  }

  update() {
    this.x -= this.speed;
    this.y += this.speed * 0.15;
    if (this.x < -150) {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = this.size;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.length, this.y - (this.length * 0.15));
    ctx.stroke();
    ctx.restore();
  }
}

// 배경 별
class StarParticle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.width;
    this.y = Math.random() * (this.height - 50);
    this.size = Math.random() * 2 + 1;
    this.speed = (this.size * 0.4);
    this.alpha = Math.random();
    this.alphaSpeed = 0.02 * (Math.random() > 0.5 ? 1 : -1);
  }

  update(gameSpeed, isHyperspace) {
    const mult = isHyperspace ? 3.5 : 0.3;
    this.x -= this.speed * (gameSpeed * mult);

    if (this.x < 0) {
      this.x = this.width;
      this.y = Math.random() * (this.height - 50);
    }

    this.alpha += this.alphaSpeed;
    if (this.alpha <= 0.2 || this.alpha >= 1) {
      this.alphaSpeed = -this.alphaSpeed;
    }
  }

  draw(ctx, isHyperspace) {
    ctx.save();
    if (isHyperspace) {
      ctx.strokeStyle = `rgba(181, 23, 158, ${this.alpha})`;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + (this.speed * 20), this.y);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    ctx.restore();
  }
}

// 메인 게임 컨트롤러 (1.5배 고속 모드)
class SpaceDinoGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.gameHeader = document.getElementById('gameHeader');
    this.gameTitle = document.getElementById('gameTitle');
    this.canvasWrapper = document.getElementById('canvasWrapper');
    this.scoreText = document.getElementById('scoreText');
    this.highScoreText = document.getElementById('highScoreText');
    this.levelText = document.getElementById('levelText');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.finalScore = document.getElementById('finalScore');
    this.restartBtn = document.getElementById('restartBtn');
    this.mobileJumpBtn = document.getElementById('mobileJumpBtn');
    this.mobileSlideBtn = document.getElementById('mobileSlideBtn');

    this.sound = new SoundManager();

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.score = 0;
    this.highScore = localStorage.getItem('space_dino_v10_high_score') || 0;
    
    // 기존 속도의 1.5배 적용 (4.8 * 1.5 = 7.2)
    this.baseSpeed = 7.2;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;

    this.isHyperspaceMode = false;

    this.dino = new GreenDino(this.height);
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 80;

    this.warningTimer = 0;
    this.warningType = null;

    this.stars = [];
    for (let i = 0; i < 50; i++) {
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

    this.restartBtn.addEventListener('click', () => {
      this.sound.init();
      this.resetGame();
    });
  }

  resetGame() {
    this.score = 0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;
    this.isHyperspaceMode = false;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 80;
    this.warningTimer = 0;

    document.body.classList.remove('hyperspace-mode');
    this.gameHeader.classList.remove('hyperspace-header');
    this.gameTitle.classList.remove('hyperspace-title');
    this.gameTitle.textContent = '⚡ SPACE DINO RUNNER (1.5x) v10 ⚡';
    this.canvasWrapper.classList.remove('hyperspace-canvas');

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

    this.scoreText.textContent = formattedScore;
    this.highScoreText.textContent = formattedHighScore;

    const currentScore = Math.floor(this.score);
    if (currentScore < 200) {
      this.levelText.textContent = '⚡ 1.5x EASY';
      this.levelText.className = 'value level-easy';
    } else if (currentScore < 500) {
      this.levelText.textContent = '⚡ 1.5x NORMAL';
      this.levelText.className = 'value level-normal';
    } else if (currentScore < 800) {
      this.levelText.textContent = '🔥 1.5x HARD';
      this.levelText.className = 'value level-hard';
    } else {
      if (!this.isHyperspaceMode) {
        this.isHyperspaceMode = true;
        this.sound.playHyperspaceEnter();

        document.body.classList.add('hyperspace-mode');
        this.gameHeader.classList.add('hyperspace-header');
        this.gameTitle.classList.add('hyperspace-title');
        this.gameTitle.textContent = '🌌 HYPERSPACE (1.5x) SUPERNOVA 🌌';
        this.canvasWrapper.classList.add('hyperspace-canvas');
      }

      this.levelText.textContent = '🌌 HYPERSPACE (1.5x)';
      this.levelText.className = 'value level-extreme';
    }
  }

  spawnObstacle() {
    this.obstacleTimer++;

    if (this.obstacleTimer === this.nextObstacleDistance - 15) {
      const rand = Math.random();
      if (rand > 0.45) {
        this.warningType = 'JUMP';
      } else {
        this.warningType = 'SLIDE';
      }
      this.warningTimer = 20;
      this.sound.playWarning();
    }

    if (this.obstacleTimer >= this.nextObstacleDistance) {
      const type = (this.warningType === 'JUMP') ? 'meteor' : 'high-ufo';

      this.obstacles.push(new Obstacle(this.width, this.height, type));
      this.obstacleTimer = 0;
      this.warningType = null;

      const minGap = Math.max(40, 80 - Math.floor((this.gameSpeed - this.baseSpeed) * 6));
      this.nextObstacleDistance = Math.floor(Math.random() * 35 + minGap);
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

    const groundColor = this.isHyperspaceMode ? '#ff00ff' : '#00f3ff';
    this.ctx.strokeStyle = groundColor;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = groundColor;
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.width, groundY);
    this.ctx.stroke();

    this.ctx.strokeStyle = this.isHyperspaceMode ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 243, 255, 0.15)';
    this.ctx.lineWidth = 1;
    for (let x = (this.score * 7.5) % 40 * -1; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x - 20, this.height);
      this.ctx.stroke();
    }

    if (this.isHyperspaceMode) {
      const grad = this.ctx.createLinearGradient(0, 0, 0, 150);
      grad.addColorStop(0, 'rgba(181, 23, 158, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, 150);
    }

    if (this.warningTimer > 0) {
      this.warningTimer--;
      this.ctx.fillStyle = this.warningType === 'JUMP' ? '#39ff14' : '#ff9900';
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = 15;
      this.ctx.font = 'bold 16px Orbitron, sans-serif';

      const warningText = this.warningType === 'JUMP' ? '☄️ 운석! 점프!(↑)' : '🛸 UFO! 슬라이딩!(↓)';
      this.ctx.fillText(warningText, this.width - 170, 50);
    }

    this.ctx.restore();
  }

  handleGameOver() {
    this.isGameOver = true;
    this.sound.playGameOver();

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('space_dino_v10_high_score', this.highScore);
    }

    this.finalScore.textContent = Math.floor(this.score);
    this.modalOverlay.classList.remove('hidden');
  }

  gameLoop() {
    if (this.isGameOver) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.stars.forEach(star => {
      star.update(this.gameSpeed, this.isHyperspaceMode);
      star.draw(this.ctx, this.isHyperspaceMode);
    });

    this.drawEnvironment();

    // 점수 및 1.5배 전체 속도 곡선 계산!
    this.score += 0.22; 
    this.gameSpeed = (this.baseSpeed + (Math.sqrt(this.score) * 0.24));

    if (Math.floor(this.score) > 0 && Math.floor(this.score) % 100 === 0 && Math.floor(this.score - 0.22) % 100 !== 0) {
      this.sound.playScoreMilestone();
    }

    this.updateUI();

    this.dino.update();
    this.dino.draw(this.ctx, this.isHyperspaceMode);

    this.spawnObstacle();
    const dinoBounds = this.dino.getBounds();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(this.gameSpeed);
      obs.draw(this.ctx, this.isHyperspaceMode);

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
