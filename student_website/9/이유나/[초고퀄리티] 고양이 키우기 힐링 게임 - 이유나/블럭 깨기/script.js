/**
 * Cute Brick Breaker Game (v1)
 * English variable and class names / All UI strings in Korean
 */

// --- Audio Synthesizer ---
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(frequency, type, duration, startVolume = 0.3, endVolume = 0.01) {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(startVolume, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(endVolume, 0.001), this.audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (error) {
      // Ignore audio errors
    }
  }

  playPaddleHitSound() {
    this.playTone(340, 'sine', 0.1, 0.4);
  }

  playWallHitSound() {
    this.playTone(240, 'triangle', 0.08, 0.3);
  }

  playBrickHitSound(hpRemaining) {
    const pitch = 440 + (hpRemaining * 100);
    this.playTone(pitch, 'square', 0.1, 0.3);
  }

  playPowerupSound() {
    if (this.isMuted || !this.audioCtx) return;
    [523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.12, 0.3), index * 60);
    });
  }

  playLifeLostSound() {
    if (this.isMuted || !this.audioCtx) return;
    [320, 260, 200].forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.15, 0.4), index * 90);
    });
  }

  playVictorySound() {
    if (this.isMuted || !this.audioCtx) return;
    [440, 554, 659, 880, 1108].forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.22, 0.4), index * 110);
    });
  }

  playGameOverSound() {
    if (this.isMuted || !this.audioCtx) return;
    [360, 310, 260, 210].forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.4), index * 140);
    });
  }
}

// --- Particle Object ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.015;
    this.gravity = 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
  }

  draw(context) {
    context.save();
    context.globalAlpha = Math.max(this.alpha, 0);
    context.fillStyle = this.color;
    context.shadowBlur = 8;
    context.shadowColor = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

// --- Falling PowerUp Item ---
class PowerUpItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'WIDE', 'MULTI', 'SLOW', 'LIFE', 'FIRE'
    this.width = 32;
    this.height = 20;
    this.vy = 2.2;
  }

  update() {
    this.y += this.vy;
  }

  draw(context) {
    context.save();
    let color = '#00f0ff';
    let label = '바 확대';

    switch (this.type) {
      case 'WIDE': color = '#00f0ff'; label = '↔'; break;
      case 'MULTI': color = '#00e676'; label = '●●'; break;
      case 'SLOW': color = '#ffd600'; label = '느리게'; break;
      case 'LIFE': color = '#ff4081'; label = '♥'; break;
      case 'FIRE': color = '#b388ff'; label = '🔥'; break;
    }

    context.fillStyle = 'rgba(15, 17, 35, 0.9)';
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.shadowBlur = 10;
    context.shadowColor = color;

    context.beginPath();
    context.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 6);
    context.fill();
    context.stroke();

    context.fillStyle = color;
    context.font = 'bold 12px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, this.x, this.y + 1);
    context.restore();
  }
}

// --- Main Brick Breaker Game Class ---
class BrickBreakerGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.context = this.canvas.getContext('2d');

    this.soundManager = new SoundManager();

    // DOM Elements
    this.scoreElement = document.getElementById('score');
    this.highScoreElement = document.getElementById('high-score');
    this.levelElement = document.getElementById('level');
    this.livesElement = document.getElementById('lives');
    this.soundButton = document.getElementById('sound-btn');
    this.powerupBar = document.getElementById('powerup-bar');

    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.winScreen = document.getElementById('win-screen');

    this.finalScoreOver = document.getElementById('final-score-over');
    this.newHighOver = document.getElementById('new-high-over');
    this.finalScoreWin = document.getElementById('final-score-win');
    this.newHighWin = document.getElementById('new-high-win');

    // Game Variables
    this.gameState = 'START';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('cat_breaker_highscore') || '0', 10);
    this.level = 1;
    this.lives = 3;
    this.comboCount = 0;

    this.keyState = { left: false, right: false };

    // Paddle Setup
    this.paddleDefaultWidth = 125;
    this.paddleHeight = 16;
    this.paddleX = (this.canvas.width - this.paddleDefaultWidth) / 2;
    this.paddleY = this.canvas.height - 35;
    this.paddleWidth = this.paddleDefaultWidth;
    this.paddleSpeed = 9;

    // Ball Array
    this.balls = [];
    this.baseSpeed = 6;
    this.isFireballActive = false;

    // Bricks Array
    this.bricks = [];
    this.brickCols = 9;
    this.brickPadding = 8;
    this.brickOffsetTop = 60;
    this.brickOffsetLeft = 35;
    this.brickWidth = 76;
    this.brickHeight = 22;

    this.particles = [];
    this.powerupItems = [];
    this.powerupTimers = {};

    this.initialize();
  }

  initialize() {
    this.highScoreElement.textContent = this.highScore;
    this.bindEvents();
    this.resetGame();
  }

  bindEvents() {
    window.addEventListener('keydown', (event) => {
      this.soundManager.init();
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keyState.left = true;
      if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keyState.right = true;

      if (event.code === 'Space' && this.gameState === 'PLAYING') {
        this.launchBalls();
      }

      if (event.code === 'KeyP' || event.code === 'Escape') {
        if (this.gameState === 'PLAYING') this.pauseGame();
        else if (this.gameState === 'PAUSED') this.resumeGame();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keyState.left = false;
      if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keyState.right = false;
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (this.gameState !== 'PLAYING') return;
      const bounds = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - bounds.left;
      this.paddleX = mouseX - this.paddleWidth / 2;
      this.keepPaddleInBounds();
    });

    this.canvas.addEventListener('click', () => {
      this.soundManager.init();
      if (this.gameState === 'PLAYING') {
        this.launchBalls();
      }
    });

    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
    document.getElementById('restart-btn-over').addEventListener('click', () => this.restartGame());
    document.getElementById('restart-btn-win').addEventListener('click', () => this.restartGame());
    document.getElementById('next-level-btn').addEventListener('click', () => this.goToNextLevel());

    this.soundButton.addEventListener('click', () => {
      this.soundManager.isMuted = !this.soundManager.isMuted;
      this.soundButton.textContent = this.soundManager.isMuted ? '🔇' : '🔊';
    });
  }

  resetGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.updateHUDDisplay();
    this.setupLevel();
  }

  setupLevel() {
    this.comboCount = 0;
    this.clearPowerupTimers();
    this.paddleWidth = this.paddleDefaultWidth;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.isFireballActive = false;

    this.setupBalls();
    this.buildBricks();
    this.particles = [];
    this.powerupItems = [];
    this.powerupBar.innerHTML = '';
  }

  setupBalls() {
    const currentSpeed = this.baseSpeed + (this.level - 1) * 0.5;
    this.balls = [{
      x: this.paddleX + this.paddleWidth / 2,
      y: this.paddleY - 12,
      vx: 0,
      vy: 0,
      radius: 8,
      isStuck: true,
      speed: currentSpeed,
      trailPositions: []
    }];
  }

  launchBalls() {
    this.balls.forEach(ball => {
      if (ball.isStuck) {
        ball.isStuck = false;
        const angle = (Math.random() * 0.6 - 0.3) - Math.PI / 2;
        ball.vx = Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;
      }
    });
  }

  buildBricks() {
    this.bricks = [];
    const colorThemes = [
      { hp: 1, color: '#00f0ff', stroke: '#80f8ff' },
      { hp: 2, color: '#00e676', stroke: '#80ffb3' },
      { hp: 3, color: '#b388ff', stroke: '#e0c8ff' },
      { hp: 1, color: '#ffd600', stroke: '#ffea80', type: 'EXPLOSIVE' },
      { hp: 1, color: '#ff4081', stroke: '#ff80aa', type: 'POWERUP' }
    ];

    const rowCount = Math.min(5 + Math.floor((this.level - 1) / 2), 7);

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        let brickType = 'NORMAL';
        let selectedTheme = colorThemes[r % colorThemes.length];

        const randomVal = Math.random();
        if (randomVal < 0.12) {
          selectedTheme = colorThemes[3];
          brickType = 'EXPLOSIVE';
        } else if (randomVal < 0.25) {
          selectedTheme = colorThemes[4];
          brickType = 'POWERUP';
        }

        const hpValue = Math.min(selectedTheme.hp + Math.floor((this.level - 1) / 3), 3);

        this.bricks.push({
          x: this.brickOffsetLeft + c * (this.brickWidth + this.brickPadding),
          y: this.brickOffsetTop + r * (this.brickHeight + this.brickPadding),
          w: this.brickWidth,
          h: this.brickHeight,
          hp: hpValue,
          maxHp: hpValue,
          color: selectedTheme.color,
          stroke: selectedTheme.stroke,
          type: brickType,
          isDestroyed: false
        });
      }
    }
  }

  startGame() {
    this.soundManager.init();
    this.gameState = 'PLAYING';
    this.startScreen.classList.remove('active');
    this.startScreen.classList.add('hidden');
    this.runGameLoop();
  }

  pauseGame() {
    this.gameState = 'PAUSED';
    this.pauseScreen.classList.remove('hidden');
    this.pauseScreen.classList.add('active');
  }

  resumeGame() {
    this.gameState = 'PLAYING';
    this.pauseScreen.classList.remove('active');
    this.pauseScreen.classList.add('hidden');
    this.runGameLoop();
  }

  restartGame() {
    this.gameoverScreen.classList.remove('active');
    this.gameoverScreen.classList.add('hidden');
    this.winScreen.classList.remove('active');
    this.winScreen.classList.add('hidden');
    this.resetGame();
    this.gameState = 'PLAYING';
    this.runGameLoop();
  }

  goToNextLevel() {
    this.level++;
    this.levelElement.textContent = this.level;
    this.winScreen.classList.remove('active');
    this.winScreen.classList.add('hidden');
    this.setupLevel();
    this.gameState = 'PLAYING';
    this.runGameLoop();
  }

  handleGameOver() {
    this.gameState = 'GAMEOVER';
    this.soundManager.playGameOverSound();
    this.checkAndUpdateHighScore();
    this.finalScoreOver.textContent = this.score;
    this.gameoverScreen.classList.remove('hidden');
    this.gameoverScreen.classList.add('active');
  }

  handleVictory() {
    this.gameState = 'VICTORY';
    this.soundManager.playVictorySound();
    this.checkAndUpdateHighScore();
    this.finalScoreWin.textContent = this.score;
    this.winScreen.classList.remove('hidden');
    this.winScreen.classList.add('active');
  }

  checkAndUpdateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('cat_breaker_highscore', this.highScore);
      this.highScoreElement.textContent = this.highScore;
      this.newHighOver.classList.remove('hidden');
      this.newHighWin.classList.remove('hidden');
    } else {
      this.newHighOver.classList.add('hidden');
      this.newHighWin.classList.add('hidden');
    }
  }

  clearPowerupTimers() {
    Object.values(this.powerupTimers).forEach(timer => clearTimeout(timer));
    this.powerupTimers = {};
  }

  activatePowerup(type) {
    this.soundManager.playPowerupSound();

    switch (type) {
      case 'WIDE':
        this.paddleWidth = 175;
        this.addPowerupTag('바 확장', 10000);
        if (this.powerupTimers['WIDE']) clearTimeout(this.powerupTimers['WIDE']);
        this.powerupTimers['WIDE'] = setTimeout(() => {
          this.paddleWidth = this.paddleDefaultWidth;
          this.removePowerupTag('바 확장');
        }, 10000);
        break;

      case 'MULTI':
        if (this.balls.length > 0) {
          const firstBall = this.balls[0];
          for (let i = 0; i < 2; i++) {
            const angle = (Math.random() * Math.PI / 2) - Math.PI * 3 / 4;
            this.balls.push({
              x: firstBall.x,
              y: firstBall.y,
              vx: Math.cos(angle) * firstBall.speed,
              vy: Math.sin(angle) * firstBall.speed,
              radius: 8,
              isStuck: false,
              speed: firstBall.speed,
              trailPositions: []
            });
          }
        }
        break;

      case 'SLOW':
        this.balls.forEach(b => {
          b.vx *= 0.75;
          b.vy *= 0.75;
        });
        this.addPowerupTag('공 느리게', 8000);
        if (this.powerupTimers['SLOW']) clearTimeout(this.powerupTimers['SLOW']);
        this.powerupTimers['SLOW'] = setTimeout(() => {
          this.balls.forEach(b => {
            b.vx /= 0.75;
            b.vy /= 0.75;
          });
          this.removePowerupTag('공 느리게');
        }, 8000);
        break;

      case 'LIFE':
        if (this.lives < 5) {
          this.lives++;
          this.updateLivesHUD();
        }
        break;

      case 'FIRE':
        this.isFireballActive = true;
        this.addPowerupTag('화염구 관통', 6000);
        if (this.powerupTimers['FIRE']) clearTimeout(this.powerupTimers['FIRE']);
        this.powerupTimers['FIRE'] = setTimeout(() => {
          this.isFireballActive = false;
          this.removePowerupTag('화염구 관통');
        }, 6000);
        break;
    }
  }

  addPowerupTag(label, duration) {
    let tag = document.getElementById(`tag-${label}`);
    if (!tag) {
      tag = document.createElement('div');
      tag.id = `tag-${label}`;
      tag.className = 'powerup-tag';
      tag.textContent = label;
      this.powerupBar.appendChild(tag);
    }
  }

  removePowerupTag(label) {
    const tag = document.getElementById(`tag-${label}`);
    if (tag) tag.remove();
  }

  updateHUDDisplay() {
    this.scoreElement.textContent = this.score;
    this.levelElement.textContent = this.level;
    this.updateLivesHUD();
  }

  updateLivesHUD() {
    const hearts = this.livesElement.querySelectorAll('.heart');
    hearts.forEach((heart, idx) => {
      if (idx < this.lives) heart.classList.remove('lost');
      else heart.classList.add('lost');
    });
  }

  keepPaddleInBounds() {
    if (this.paddleX < 0) this.paddleX = 0;
    if (this.paddleX + this.paddleWidth > this.canvas.width) {
      this.paddleX = this.canvas.width - this.paddleWidth;
    }
  }

  update() {
    if (this.gameState !== 'PLAYING') return;

    if (this.keyState.left) this.paddleX -= this.paddleSpeed;
    if (this.keyState.right) this.paddleX += this.paddleSpeed;
    this.keepPaddleInBounds();

    this.balls.forEach(ball => {
      if (ball.isStuck) {
        ball.x = this.paddleX + this.paddleWidth / 2;
        ball.y = this.paddleY - ball.radius;
      }
    });

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (ball.isStuck) continue;

      ball.trailPositions.push({ x: ball.x, y: ball.y });
      if (ball.trailPositions.length > 8) ball.trailPositions.shift();

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall Bounce
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx;
        this.soundManager.playWallHitSound();
      } else if (ball.x + ball.radius > this.canvas.width) {
        ball.x = this.canvas.width - ball.radius;
        ball.vx = -ball.vx;
        this.soundManager.playWallHitSound();
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
        this.soundManager.playWallHitSound();
      }

      // Paddle Bounce
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= this.paddleY &&
        ball.y - ball.radius <= this.paddleY + this.paddleHeight &&
        ball.x + ball.radius >= this.paddleX &&
        ball.x - ball.radius <= this.paddleX + this.paddleWidth
      ) {
        this.soundManager.playPaddleHitSound();
        this.comboCount = 0;

        const hitSpot = (ball.x - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
        const maxBounceAngle = Math.PI * 5 / 12;
        const bounceAngle = hitSpot * maxBounceAngle;

        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = currentSpeed * Math.sin(bounceAngle);
        ball.vy = -currentSpeed * Math.cos(bounceAngle);
        ball.y = this.paddleY - ball.radius;
      }

      this.checkBrickCollision(ball);

      if (ball.y - ball.radius > this.canvas.height) {
        this.balls.splice(i, 1);
      }
    }

    if (this.balls.length === 0) {
      this.lives--;
      this.updateLivesHUD();
      this.soundManager.playLifeLostSound();

      if (this.lives <= 0) {
        this.handleGameOver();
        return;
      } else {
        this.setupBalls();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.powerupItems.length - 1; i >= 0; i--) {
      const item = this.powerupItems[i];
      item.update();

      if (
        item.y + item.height / 2 >= this.paddleY &&
        item.y - item.height / 2 <= this.paddleY + this.paddleHeight &&
        item.x >= this.paddleX &&
        item.x <= this.paddleX + this.paddleWidth
      ) {
        this.activatePowerup(item.type);
        this.powerupItems.splice(i, 1);
        continue;
      }

      if (item.y > this.canvas.height) {
        this.powerupItems.splice(i, 1);
      }
    }

    const remainingBricks = this.bricks.filter(b => !b.isDestroyed);
    if (remainingBricks.length === 0) {
      this.handleVictory();
    }
  }

  checkBrickCollision(ball) {
    for (let brick of this.bricks) {
      if (brick.isDestroyed) continue;

      if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.w &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.h
      ) {
        if (!this.isFireballActive) {
          const overlapLeft = ball.x + ball.radius - brick.x;
          const overlapRight = brick.x + brick.w - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - brick.y;
          const overlapBottom = brick.y + brick.h - (ball.y - ball.radius);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            ball.vx = -ball.vx;
          } else {
            ball.vy = -ball.vy;
          }
        }

        this.damageBrick(brick);
        break;
      }
    }
  }

  damageBrick(brick) {
    brick.hp--;
    this.comboCount++;
    const points = 100 * this.comboCount;
    this.score += points;
    this.scoreElement.textContent = this.score;

    this.soundManager.playBrickHitSound(brick.hp + 1);

    if (brick.hp <= 0) {
      brick.isDestroyed = true;
      this.spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);

      if (brick.type === 'EXPLOSIVE') {
        this.explodeAdjacentBricks(brick);
      }

      if (brick.type === 'POWERUP' || Math.random() < 0.15) {
        const itemTypes = ['WIDE', 'MULTI', 'SLOW', 'LIFE', 'FIRE'];
        const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        this.powerupItems.push(new PowerUpItem(brick.x + brick.w / 2, brick.y + brick.h / 2, selectedType));
      }
    }
  }

  explodeAdjacentBricks(centerBrick) {
    this.bricks.forEach(b => {
      if (!b.isDestroyed) {
        const dx = (b.x + b.w / 2) - (centerBrick.x + centerBrick.w / 2);
        const dy = (b.y + b.h / 2) - (centerBrick.y + centerBrick.h / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 110) {
          b.hp = 0;
          b.isDestroyed = true;
          this.score += 150;
          this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#ffd600');
        }
      }
    });
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 16; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  draw() {
    this.context.fillStyle = '#0a0c1a';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackgroundGrid();

    this.bricks.forEach(b => {
      if (!b.isDestroyed) this.drawBrick(b);
    });

    this.particles.forEach(p => p.draw(this.context));
    this.powerupItems.forEach(item => item.draw(this.context));

    this.drawPaddle();
    this.balls.forEach(b => this.drawBall(b));
  }

  drawBackgroundGrid() {
    this.context.save();
    this.context.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    this.context.lineWidth = 1;

    for (let x = 0; x < this.canvas.width; x += 40) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.canvas.height);
      this.context.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += 40) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.canvas.width, y);
      this.context.stroke();
    }
    this.context.restore();
  }

  drawBrick(b) {
    this.context.save();
    this.context.shadowBlur = 10;
    this.context.shadowColor = b.color;

    const gradient = this.context.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    gradient.addColorStop(0, b.color);
    gradient.addColorStop(1, 'rgba(15, 18, 38, 0.9)');

    this.context.fillStyle = gradient;
    this.context.strokeStyle = b.stroke;
    this.context.lineWidth = 1.5;

    this.context.beginPath();
    this.context.roundRect(b.x, b.y, b.w, b.h, 4);
    this.context.fill();
    this.context.stroke();

    if (b.type === 'EXPLOSIVE') {
      this.context.fillStyle = '#ffffff';
      this.context.font = 'bold 12px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText('💣', b.x + b.w / 2, b.y + b.h / 2);
    } else if (b.type === 'POWERUP') {
      this.context.fillStyle = '#ffffff';
      this.context.font = 'bold 12px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText('★', b.x + b.w / 2, b.y + b.h / 2);
    } else if (b.maxHp > 1) {
      this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.context.font = 'bold 11px sans-serif';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText(b.hp, b.x + b.w / 2, b.y + b.h / 2);
    }

    this.context.restore();
  }

  drawPaddle() {
    this.context.save();
    const glowColor = this.isFireballActive ? '#b388ff' : '#00f0ff';

    this.context.shadowBlur = 15;
    this.context.shadowColor = glowColor;

    const gradient = this.context.createLinearGradient(this.paddleX, this.paddleY, this.paddleX, this.paddleY + this.paddleHeight);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, '#0055ff');

    this.context.fillStyle = gradient;
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1.5;

    this.context.beginPath();
    this.context.roundRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight, 8);
    this.context.fill();
    this.context.stroke();

    this.context.restore();
  }

  drawBall(ball) {
    this.context.save();

    const ballColor = this.isFireballActive ? '#ff4081' : '#00f0ff';

    ball.trailPositions.forEach((pos, idx) => {
      const alpha = (idx + 1) / ball.trailPositions.length * 0.4;
      const radius = ball.radius * (idx + 1) / ball.trailPositions.length;

      this.context.fillStyle = ballColor;
      this.context.globalAlpha = alpha;
      this.context.beginPath();
      this.context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      this.context.fill();
    });

    this.context.globalAlpha = 1;
    this.context.shadowBlur = 15;
    this.context.shadowColor = ballColor;

    const gradient = this.context.createRadialGradient(
      ball.x - 2, ball.y - 2, 1,
      ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, ballColor);
    gradient.addColorStop(1, '#0055aa');

    this.context.fillStyle = gradient;
    this.context.beginPath();
    this.context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.context.fill();

    this.context.restore();
  }

  runGameLoop() {
    if (this.gameState === 'PLAYING') {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.runGameLoop());
    }
  }
}

// Instantiate Game on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  new BrickBreakerGame();
});
