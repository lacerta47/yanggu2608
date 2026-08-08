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

  playScoreMilestone() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
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
    this.width = 44;
    this.height = 48;
    this.x = 70;
    this.groundY = canvasHeight - 30 - this.height;
    this.y = this.groundY;
    
    this.vy = 0;
    this.gravity = 0.65;
    this.jumpStrength = -13.5;
    this.isJumping = false;

    this.animFrame = 0;
    this.animTimer = 0;
  }

  jump() {
    if (!this.isJumping) {
      this.vy = this.jumpStrength;
      this.isJumping = true;
      return true; // 점프 성공 반환
    }
    return false;
  }

  update() {
    // 중력 및 이동 처리
    this.vy += this.gravity;
    this.y += this.vy;

    // 바닥 착지 체크
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isJumping = false;
    }

    // 달리기 애니메이션 타이머
    this.animTimer++;
    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 공룡 본체 (초록색 네온)
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 12;

    // 공룡 몸통
    ctx.fillRect(10, 14, 24, 22);

    // 공룡 머리
    ctx.fillRect(20, 2, 20, 16);
    // 공룡 주둥이
    ctx.fillRect(36, 6, 8, 8);

    // 공룡 눈 (검정)
    ctx.fillStyle = '#000000';
    ctx.fillRect(30, 5, 4, 4);

    // 우주 헬멧 (투명 하늘색 글로우)
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(30, 10, 14, 0, Math.PI * 2);
    ctx.stroke();

    // 공룡 꼬리
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(2, 20, 10, 10);
    ctx.fillRect(0, 24, 4, 6);

    // 공룡 다리 (달리기 모션 또는 점프 동작)
    if (this.isJumping) {
      // 점프 중
      ctx.fillRect(14, 36, 6, 8);
      ctx.fillRect(24, 36, 6, 8);
    } else {
      // 달리기 애니메이션 (다리 교차)
      if (this.animFrame === 0) {
        ctx.fillRect(12, 36, 6, 12);
        ctx.fillRect(26, 36, 6, 6);
      } else {
        ctx.fillRect(12, 36, 6, 6);
        ctx.fillRect(26, 36, 6, 12);
      }
    }

    ctx.restore();
  }

  getBounds() {
    // 히트박스는 실제 그래픽보다 약간 작게 부여하여 공정한 게임플레이 제공
    return {
      x: this.x + 6,
      y: this.y + 4,
      width: this.width - 10,
      height: this.height - 6
    };
  }
}

// 우주 장애물 클래스 (운석 및 UFO)
class Obstacle {
  constructor(canvasWidth, canvasHeight, type) {
    this.type = type; // 'meteor' 또는 'ufo'
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    if (this.type === 'meteor') {
      this.width = 34;
      this.height = 34;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height;
      this.color = '#ff007f'; // 네온 핑크 불타는 운석
    } else {
      // UFO (공중에 떠있음)
      this.width = 42;
      this.height = 24;
      this.x = canvasWidth + 10;
      this.y = canvasHeight - 30 - this.height - Math.floor(Math.random() * 35 + 20);
      this.color = '#9d4edd'; // 네온 퍼플 UFO
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'meteor') {
      // 운석 그리기
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(17, 17, 16, 0, Math.PI * 2);
      ctx.fill();

      // 운석 크레이터
      ctx.fillStyle = '#110022';
      ctx.beginPath();
      ctx.arc(10, 12, 4, 0, Math.PI * 2);
      ctx.arc(22, 20, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // UFO 그리기
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      // 돔
      ctx.beginPath();
      ctx.arc(21, 10, 10, Math.PI, 0);
      ctx.fill();

      // UFO 원반
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(0, 10, 42, 10);

      // 하단 램프
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(6, 20, 6, 4);
      ctx.fillRect(18, 20, 6, 4);
      ctx.fillRect(30, 20, 6, 4);
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

// 배경 우주 별 입자
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

    this.sound = new SoundManager();

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 점수 및 속도 설정
    this.score = 0;
    this.highScore = localStorage.getItem('space_dino_high_score') || 0;
    this.baseSpeed = 6.0;
    this.gameSpeed = this.baseSpeed;
    this.isGameOver = false;

    // 공룡 생성
    this.dino = new GreenDino(this.height);

    // 장애물 목록
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.nextObstacleDistance = 90;

    // 우주 배경 별 입자
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

    // 키보드 이벤트
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        triggerJump();
      }
    });

    // 화면 클릭/터치 이벤트
    this.canvas.addEventListener('click', () => triggerJump());
    this.mobileJumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerJump();
    }, { passive: false });
    this.mobileJumpBtn.addEventListener('click', () => triggerJump());

    // 재시작 버튼
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

  // 장애물 생성 로직
  spawnObstacle() {
    this.obstacleTimer++;
    if (this.obstacleTimer >= this.nextObstacleDistance) {
      const type = Math.random() > 0.5 ? 'meteor' : 'ufo';
      this.obstacles.push(new Obstacle(this.width, this.height, type));
      this.obstacleTimer = 0;
      // 다음 장애물 간격 (속도에 맞추어 난이도 유지)
      this.nextObstacleDistance = Math.floor(Math.random() * 50 + 70) - Math.floor((this.gameSpeed - this.baseSpeed) * 3);
      this.nextObstacleDistance = Math.max(45, this.nextObstacleDistance);
    }
  }

  // 충돌 체크 (공룡 vs 장애물)
  checkCollision(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  // 바닥 및 우주 지평선 그리기
  drawEnvironment() {
    // 바닥 라인
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

    // 지평선 아래 그리드 패턴
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

  // 게임 오버 처리
  handleGameOver() {
    this.isGameOver = true;
    this.sound.playGameOver();

    // 최고 점수 갱신
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('space_dino_high_score', this.highScore);
    }

    this.finalScore.textContent = Math.floor(this.score);
    this.modalOverlay.classList.remove('hidden');
  }

  // 메인 루프
  gameLoop() {
    if (this.isGameOver) return;

    // 1. 화면 초기화
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 2. 우주 별 업데이트 & 그리기
    this.stars.forEach(star => {
      star.update(this.gameSpeed);
      star.draw(this.ctx);
    });

    // 3. 환경 (바닥) 그리기
    this.drawEnvironment();

    // 4. 시간이 지날수록 점수 증가 및 게임 속도 증가!
    this.score += 0.15;
    this.gameSpeed += 0.0012; // 점진적인 속도 상승!
    
    // 100점 단위 달성 시 효과음
    if (Math.floor(this.score) > 0 && Math.floor(this.score) % 100 === 0 && Math.floor(this.score - 0.15) % 100 !== 0) {
      this.sound.playScoreMilestone();
    }

    this.updateUI();

    // 5. 공룡 업데이트 & 그리기
    this.dino.update();
    this.dino.draw(this.ctx);

    // 6. 장애물 생성 & 업데이트
    this.spawnObstacle();
    const dinoBounds = this.dino.getBounds();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(this.gameSpeed);
      obs.draw(this.ctx);

      // 충돌 검사
      if (this.checkCollision(dinoBounds, obs.getBounds())) {
        this.handleGameOver();
        return;
      }

      // 화면 벗어난 장애물 제거
      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // 다음 프레임 진행
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }
}

// DOM 로드 완료 시 게임 구동
window.addEventListener('DOMContentLoaded', () => {
  new SpaceDinoGame();
});
