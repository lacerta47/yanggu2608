// Web Audio API 안전 사운드 매니저 (예외 처리 완료)
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.log('Audio init error handled safely');
    }
  }

  playJump() {
    if (!this.ctx) return;
    try {
      this.init();
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
    } catch (e) {
      // 오디오 에러 안전 무시 (게임 멈춤 방지)
    }
  }

  playSlide() {
    if (!this.ctx) return;
    try {
      this.init();
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
    } catch (e) {
      // 오디오 에러 안전 무시
    }
  }

  playWarning() {
    if (!this.ctx) return;
    try {
      this.init();
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
    } catch (e) {
      // 오디오 에러 안전 무시
    }
  }

  playStageUp() {
    if (!this.ctx) return;
    try {
      this.init();
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.22);
      });
    } catch (e) {
      // 오디오 에러 안전 무시
    }
  }

  playScoreMilestone() {
    if (!this.ctx) return;
    try {
      this.init();
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
    } catch (e) {
      // 오디오 에러 안전 무시
    }
  }

  playGameOver() {
    if (!this.ctx) return;
    try {
      this.init();
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
    } catch (e) {
      // 오디오 에러 안전 무시
    }
  }
}

// 10단계 색상 매핑 표
const STAGE_COLORS = {
  1: '#39ff14',  // 에메랄드 그린
  2: '#00f3ff',  // 일렉트릭 시안
  3: '#ff6600',  // 선셋 오렌지
  4: '#ff007f',  // 마젠타 핫핑크
  5: '#9d4edd',  // 바이올렛 퍼플
  6: '#ffe600',  // 엠버 옐로우
  7: '#48cae4',  // 아이스 다이아몬드
  8: '#ff0033',  // 크림슨 플레임
  9: '#ffd700',  // 로얄 골드
  10: '#ffffff'  // 프리즘 아우라
};

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

  draw(ctx, stageLevel) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const dinoColor = STAGE_COLORS[stageLevel] || '#39ff14';
    ctx.fillStyle = dinoColor;
    ctx.shadowColor = dinoColor;
    ctx.shadowBlur = 12 + (stageLevel * 2);

    if (this.isSliding) {
      ctx.fillRect(8, 6, 42, 14);

      ctx.fillRect(44, 2, 14, 12);
      ctx.fillRect(52, 6, 6, 6);

      ctx.fillStyle = '#000000';
      ctx.fillRect(48, 4, 3, 3);

      ctx.strokeStyle = dinoColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(48, 8, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = dinoColor;
      ctx.fillRect(0, 8, 10, 6);

      ctx.fillStyle = '#ff0055';
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

      ctx.strokeStyle = dinoColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 10, 14, 0, Math.PI * 2);
      ctx.stroke();

      if (stageLevel >= 9) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(22, -4);
        ctx.lineTo(26, 2);
        ctx.lineTo(30, -6);
        ctx.lineTo(34, 2);
        ctx.lineTo(38, -4);
        ctx.lineTo(35, 6);
        ctx.lineTo(25, 6);
        ctx.closePath();
        ctx.fill();
      }

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
    } else {
      this.width = 48;
      this.height = 26;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - 48;
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(ctx, stageLevel) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const themeColor = STAGE_COLORS[stageLevel] || '#ff0055';

    if (this.type === 'meteor') {
      ctx.fillStyle = stageLevel >= 8 ? '#ff0033' : themeColor;
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
      ctx.fillStyle = themeColor;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(24, 10, 12, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#ff9900';
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

// 배경 별 입자
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

  update(gameSpeed, stageLevel) {
    const mult = stageLevel >= 5 ? (stageLevel * 0.4) : 0.3;
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

  draw(ctx, stageLevel) {
    ctx.save();
    const starColor = STAGE_COLORS[stageLevel] || '#ffffff';

    if (stageLevel >= 5) {
      ctx.strokeStyle = starColor;
      ctx.shadowColor = starColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + (this.speed * (stageLevel * 3)), this.y);
      ctx.stroke();
    } else {
      ctx.fillStyle = starColor;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    ctx.restore();
  }
}

// 메인 게임 컨트롤러 (안전 버그 수정 완료)
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
    this.lastMilestone = 0; // 마일스톤 중복 호출 및 99점 부근 오류 방지
    this.highScore = localStorage.getItem('space_dino_v12_high_score') || 0;
    this.baseSpeed = 4.8;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;

    this.stageLevel = 1;

    this.dino = new GreenDino(this.height);
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 110;

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
    this.lastMilestone = 0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;
    this.stageLevel = 1;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 110;
    this.warningTimer = 0;

    document.body.className = 'theme-1';
    this.gameTitle.textContent = '🚀 SPACE DINO RUNNER v12 🚀';

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
    let newLevel = 1;
    let levelName = '🌱 EASY (1/10)';

    if (currentScore < 150) {
      newLevel = 1; levelName = '🌱 EASY (1/10)';
    } else if (currentScore < 350) {
      newLevel = 2; levelName = '⚡ NORMAL (2/10)';
    } else if (currentScore < 600) {
      newLevel = 3; levelName = '🔥 HARD (3/10)';
    } else if (currentScore < 950) {
      newLevel = 4; levelName = '🎆 ULTRA (4/10)';
    } else if (currentScore < 1350) {
      newLevel = 5; levelName = '🌌 HYPERSPACE (5/10)';
    } else if (currentScore < 1800) {
      newLevel = 6; levelName = '🪐 PLANETARY (6/10)';
    } else if (currentScore < 2300) {
      newLevel = 7; levelName = '💎 DIAMOND (7/10)';
    } else if (currentScore < 2900) {
      newLevel = 8; levelName = '🌋 SUPERNOVA (8/10)';
    } else if (currentScore < 3600) {
      newLevel = 9; levelName = '👑 GOD MODE (9/10)';
    } else {
      newLevel = 10; levelName = '♾️ INFINITY OVERLORD (10/10)';
    }

    if (newLevel !== this.stageLevel) {
      this.stageLevel = newLevel;
      this.sound.playStageUp();
      document.body.className = `theme-${newLevel}`;

      if (newLevel === 10) {
        this.gameTitle.textContent = '♾️ INFINITY DINO OVERLORD ♾️';
      } else if (newLevel === 9) {
        this.gameTitle.textContent = '👑 OVERLORD GOD DINO 👑';
      }
    }

    this.levelText.textContent = levelName;
    this.levelText.className = `value level-val`;
  }

  spawnObstacle() {
    this.obstacleTimer++;

    // 안전한 타이밍 계산 (경고 출력)
    const warnTrigger = Math.max(5, this.nextObstacleDistance - 18);
    if (this.obstacleTimer === warnTrigger) {
      const rand = Math.random();
      if (rand > 0.45) {
        this.warningType = 'JUMP';
      } else {
        this.warningType = 'SLIDE';
      }
      this.warningTimer = 25;
      this.sound.playWarning();
    }

    if (this.obstacleTimer >= this.nextObstacleDistance) {
      const type = (this.warningType === 'JUMP') ? 'meteor' : 'high-ufo';

      this.obstacles.push(new Obstacle(this.width, this.height, type));
      this.obstacleTimer = 0;

      if (this.stageLevel >= 6 && Math.random() < (0.2 + (this.stageLevel * 0.04))) {
        const comboType = type === 'meteor' ? 'high-ufo' : 'meteor';
        setTimeout(() => {
          if (!this.isGameOver) {
            this.obstacles.push(new Obstacle(this.width, this.height, comboType));
          }
        }, 340);
      }

      this.warningType = null;
      const minGap = Math.max(40, 110 - Math.floor((this.gameSpeed - this.baseSpeed) * 7));
      this.nextObstacleDistance = Math.floor(Math.random() * 40 + minGap);
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

    const groundColor = STAGE_COLORS[this.stageLevel] || '#00f3ff';

    this.ctx.strokeStyle = groundColor;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = groundColor;
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.width, groundY);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    for (let x = (this.score * 5) % 40 * -1; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x - 20, this.height);
      this.ctx.stroke();
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
      localStorage.setItem('space_dino_v12_high_score', this.highScore);
    }

    this.finalScore.textContent = Math.floor(this.score);
    this.modalOverlay.classList.remove('hidden');
  }

  gameLoop() {
    if (this.isGameOver) return;

    try {
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.stars.forEach(star => {
        star.update(this.gameSpeed, this.stageLevel);
        star.draw(this.ctx, this.stageLevel);
      });

      this.drawEnvironment();

      this.score += 0.15;
      this.gameSpeed = this.baseSpeed + (Math.sqrt(this.score) * 0.16);

      // 100점 마일스톤 사운드 호출 안정화 (99점 멈춤 방지)
      const currentMilestone = Math.floor(this.score / 100);
      if (currentMilestone > this.lastMilestone) {
        this.lastMilestone = currentMilestone;
        this.sound.playScoreMilestone();
      }

      this.updateUI();

      this.dino.update();
      this.dino.draw(this.ctx, this.stageLevel);

      this.spawnObstacle();
      const dinoBounds = this.dino.getBounds();

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.update(this.gameSpeed);
        obs.draw(this.ctx, this.stageLevel);

        if (this.checkCollision(dinoBounds, obs.getBounds())) {
          this.handleGameOver();
          return;
        }

        if (obs.x + obs.width < 0) {
          this.obstacles.splice(i, 1);
        }
      }
    } catch (e) {
      console.log('Game loop error safely handled:', e);
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SpaceDinoGame();
});
