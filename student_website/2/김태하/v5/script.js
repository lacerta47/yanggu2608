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
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(400, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
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

// 우주 초록 공룡 클래스
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
        if (this.isJumping) {
          this.vy += 8; // 착지 속도 가속
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
      // 슬라이딩 포즈
      ctx.fillRect(8, 6, 42, 14);

      ctx.fillRect(44, 2, 14, 12);
      ctx.fillRect(52, 6, 6, 6);

      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 4, 3, 3);

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 8, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#39ff14';
      ctx.fillRect(0, 8, 10, 6);

      ctx.fillStyle = '#ff9900';
      ctx.fillRect(-8, 14, 12, 4);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-4, 16, 8, 2);

      ctx.fillStyle = '#39ff14';
      ctx.fillRect(14, 18, 12, 6);
      ctx.fillRect(34, 18, 12, 6);

    } else {
      // 서있는 포즈
      ctx.fillRect(10, 14, 24, 22);

      ctx.fillRect(20, 2, 20, 16);
      ctx.fillRect(36, 6, 8, 8);

      ctx.fillStyle = '#000000';
      ctx.fillRect(30, 5, 4, 4);

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 10, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#39ff14';
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
    // 히트박스 보정 (슬라이딩 판정 유연성)
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

// 장애물 클래스 (바닥 운석 / 공중 피하기 운석 / UFO)
class Obstacle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type; 
    // 'ground-meteor': 바닥 운석 (점프로 피하기)
    // 'sky-meteor': 머리 높이 공중 운석 (슬라이딩으로 피하기)
    // 'high-ufo': 상공 UFO (슬라이딩으로 피하기)
    // 'low-ufo': 중간 UFO (점프/슬라이딩 둘 다 가능)

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    if (this.type === 'ground-meteor') {
      this.width = 34;
      this.height = 34;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height; // 바닥 위치 -> 점프로 회피!
      this.color = '#ff007f';
      this.speedMult = 1.0;
    } else if (this.type === 'sky-meteor') {
      this.width = 38;
      this.height = 26;
      this.x = canvasWidth + 20;
      this.y = canvasHeight - 30 - 46; // 공룡 서있는 머리 높이 -> 슬라이딩으로 회피!
      this.color = '#ff3300';
      this.speedMult = 1.15;
    } else if (this.type === 'high-ufo') {
      this.width = 48;
      this.height = 26;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - 48; // 머리 높이 UFO -> 슬라이딩으로 회피!
      this.color = '#ff9900';
      this.speedMult = 1.0;
    } else {
      this.width = 42;
      this.height = 24;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height - 20;
      this.color = '#9d4edd';
      this.speedMult = 1.0;
    }
  }

  update(speed) {
    this.x -= speed * this.speedMult;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'ground-meteor') {
      // 바닥 운석
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
    } else if (this.type === 'sky-meteor') {
      // 공중 날아오는 운석 (슬라이딩으로 쏙 피하는 운석)
      ctx.fillStyle = '#ff9900';
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(35, 13);
      ctx.lineTo(85, 2);
      ctx.lineTo(75, 24);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff3300';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(18, 13, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(14, 10, 3, 0, Math.PI * 2);
      ctx.arc(22, 16, 4, 0, Math.PI * 2);
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
      // high-ufo
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
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 8
    };
  }
}

// 배경에 지나가는 관상용 혜성
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
    this.speed = Math.random() * 8 + 10;
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

    // 경고 이펙트 타이머
    this.warningTimer = 0;
    this.warningType = null; // 'SLIDE' 또는 'JUMP'

    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push(new StarParticle(this.width, this.height));
    }

    this.shootingStars = [
      new BackgroundShootingStar(this.width, this.height),
      new BackgroundShootingStar(this.width, this.height)
    ];

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
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 90;
    this.warningTimer = 0;

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

    // 장애물 생성 15프레임 전에 화면 우측에 회피 팁 경고 표시
    if (this.obstacleTimer === this.nextObstacleDistance - 15) {
      const rand = Math.random();
      if (rand > 0.5) {
        this.warningType = 'SLIDE'; // 공중 장애물 -> 슬라이딩 팁
      } else {
        this.warningType = 'JUMP';  // 바닥 장애물 -> 점프 팁
      }
      this.warningTimer = 25;
      this.sound.playWarning();
    }

    if (this.obstacleTimer >= this.nextObstacleDistance) {
      let type = 'ground-meteor';
      if (this.warningType === 'SLIDE') {
        type = Math.random() > 0.5 ? 'sky-meteor' : 'high-ufo';
      } else {
        type = Math.random() > 0.5 ? 'ground-meteor' : 'low-ufo';
      }

      this.obstacles.push(new Obstacle(this.width, this.height, type));
      this.obstacleTimer = 0;
      this.warningType = null;

      this.nextObstacleDistance = Math.floor(Math.random() * 50 + 65) - Math.floor((this.gameSpeed - this.baseSpeed) * 3);
      this.nextObstacleDistance = Math.max(45, this.nextObstacleDistance);
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

    // 경고 이펙트 표시 (화면 오른쪽 끝)
    if (this.warningTimer > 0) {
      this.warningTimer--;
      this.ctx.fillStyle = this.warningType === 'SLIDE' ? '#ff9900' : '#39ff14';
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = 15;
      this.ctx.font = 'bold 16px Orbitron, sans-serif';

      const warningText = this.warningType === 'SLIDE' ? '⚠️ 슬라이딩!(↓)' : '⚠️ 점프!(↑)';
      this.ctx.fillText(warningText, this.width - 140, 50);
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

    this.shootingStars.forEach(ss => {
      ss.update();
      ss.draw(this.ctx);
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
