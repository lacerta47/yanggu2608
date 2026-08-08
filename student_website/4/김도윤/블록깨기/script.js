// 네온 우주 블록깨기 게임 스크립트

document.addEventListener('DOMContentLoaded', () => {
    // 캔버스 및 콘텍스트 설정
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // UI 엘리먼트
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const startOverlay = document.getElementById('startOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const victoryOverlay = document.getElementById('victoryOverlay');
    const finalScoreText = document.getElementById('finalScoreText');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const victoryRestartButton = document.getElementById('victoryRestartButton');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    // 사운드 효과 (Web Audio API 오디오 합성기)
    class SoundSynth {
        constructor() {
            this.audioCtx = null;
        }

        init() {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }

        playBounce() {
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(160, this.audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        }

        playBrickHit(row) {
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const baseFreq = 400 + (5 - row) * 80;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.12);
        }

        playLoseLife() {
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(90, this.audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.3);
        }

        playWin() {
            if (!this.audioCtx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + idx * 0.1 + 0.25);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(this.audioCtx.currentTime + idx * 0.1);
                osc.stop(this.audioCtx.currentTime + idx * 0.1 + 0.25);
            });
        }
    }

    const sound = new SoundSynth();

    // 게임 변수 설정
    let score = 0;
    let lives = 3;
    let isGameRunning = false;
    let isBallLaunched = false;
    let animationFrameId = null;

    // 막대(바) 속성
    const paddle = {
        width: 120,
        height: 16,
        x: (canvas.width - 120) / 2,
        y: canvas.height - 35,
        dx: 8,
        isMovingLeft: false,
        isMovingRight: false
    };

    // 공 속성
    const ball = {
        radius: 9,
        x: canvas.width / 2,
        y: paddle.y - 10,
        speed: 7,
        dx: 4,
        dy: -6,
        trail: []
    };

    // 블록 배열 정보
    const brickConfig = {
        rows: 5,
        cols: 8,
        padding: 12,
        offsetTop: 60,
        offsetLeft: 40,
        colors: [
            { main: '#ff007f', shadow: '#ff007f', score: 50 }, // 핑크
            { main: '#ffe600', shadow: '#ffe600', score: 40 }, // 노랑
            { main: '#00f3ff', shadow: '#00f3ff', score: 30 }, // 청록
            { main: '#00ff66', shadow: '#00ff66', score: 20 }, // 초록
            { main: '#b000ff', shadow: '#b000ff', score: 10 }  // 보라
        ]
    };

    let bricks = [];
    let particles = [];
    let remainingBricks = 0;

    // 블록 초기화
    function initBricks() {
        const totalPadding = brickConfig.padding * (brickConfig.cols - 1);
        const availableWidth = canvas.width - (brickConfig.offsetLeft * 2) - totalPadding;
        const brickWidth = availableWidth / brickConfig.cols;
        const brickHeight = 22;

        remainingBricks = brickConfig.rows * brickConfig.cols;
        bricks = [];
        for (let r = 0; r < brickConfig.rows; r++) {
            bricks[r] = [];
            for (let c = 0; c < brickConfig.cols; c++) {
                const brickX = brickConfig.offsetLeft + c * (brickWidth + brickConfig.padding);
                const brickY = brickConfig.offsetTop + r * (brickHeight + brickConfig.padding);
                bricks[r][c] = {
                    x: brickX,
                    y: brickY,
                    width: brickWidth,
                    height: brickHeight,
                    status: 1,
                    color: brickConfig.colors[r]
                };
            }
        }
    }

    // 파티클 생성 함수 (블록이 부서질 때 분출되는 빛 조각들)
    function createExplosion(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 2,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    }

    // 키보드 조작 이벤트를 등록합니다.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.isMovingRight = true;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            paddle.isMovingLeft = true;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            if (isGameRunning && !isBallLaunched) {
                isBallLaunched = true;
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.isMovingRight = false;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            paddle.isMovingLeft = false;
        }
    });

    // 모바일 터치 버튼 이벤트 처리
    const bindTouchBtn = (btn, isRight) => {
        const start = (e) => {
            e.preventDefault();
            sound.init();
            if (isRight) paddle.isMovingRight = true;
            else paddle.isMovingLeft = true;
            if (isGameRunning && !isBallLaunched) isBallLaunched = true;
        };
        const end = (e) => {
            e.preventDefault();
            if (isRight) paddle.isMovingRight = false;
            else paddle.isMovingLeft = false;
        };
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
    };

    bindTouchBtn(btnLeft, false);
    bindTouchBtn(btnRight, true);

    // 마우스/터치로 캔버스 직접 조작
    function handlePointerMove(e) {
        if (!isGameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const relativeX = clientX - rect.left;
        const canvasScale = canvas.width / rect.width;
        const pointerX = relativeX * canvasScale;

        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, pointerX - paddle.width / 2));
        if (!isBallLaunched) {
            isBallLaunched = true;
        }
    }

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handlePointerMove(e);
    }, { passive: false });

    canvas.addEventListener('click', () => {
        sound.init();
        if (isGameRunning && !isBallLaunched) {
            isBallLaunched = true;
        }
    });

    // 공 리셋 (기회 소진 시)
    function resetBallAndPaddle() {
        isBallLaunched = false;
        paddle.x = (canvas.width - paddle.width) / 2;
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
        ball.dx = (Math.random() > 0.5 ? 4 : -4);
        ball.dy = -6;
        ball.trail = [];
    }

    // 충돌 검사 (공과 블록)
    function checkBrickCollisions() {
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const b = bricks[r][c];
                if (b.status === 1) {
                    // 공과 블록 충돌 로직
                    if (
                        ball.x + ball.radius > b.x &&
                        ball.x - ball.radius < b.x + b.width &&
                        ball.y + ball.radius > b.y &&
                        ball.y - ball.radius < b.y + b.height
                    ) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        score += b.color.score;
                        scoreElement.textContent = score;
                        remainingBricks--;

                        // 사운드 및 파티클 생성
                        sound.playBrickHit(r);
                        createExplosion(b.x + b.width / 2, b.y + b.height / 2, b.color.main);

                        // 모든 블록이 전부 깨졌는지 확인
                        if (remainingBricks <= 0) {
                            handleVictory();
                            return;
                        }
                    }
                }
            }
        }
    }

    // 막대(바) 움직임 처리
    function updatePaddle() {
        if (paddle.isMovingRight && paddle.x < canvas.width - paddle.width) {
            paddle.x += paddle.dx;
        } else if (paddle.isMovingLeft && paddle.x > 0) {
            paddle.x -= paddle.dx;
        }
    }

    // 공 위치 업데이트 및 벽/바 충돌 처리
    function updateBall() {
        if (!isBallLaunched) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 2;
            return;
        }

        // 공 잔상(트레일) 기록
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        ball.x += ball.dx;
        ball.y += ball.dy;

        // 좌/우 벽 충돌
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.dx = -ball.dx;
            sound.playBounce();
        } else if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.dx = -ball.dx;
            sound.playBounce();
        }

        // 상단 벽 충돌
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.dy = -ball.dy;
            sound.playBounce();
        }

        // 막대(바) 충돌
        if (
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width
        ) {
            sound.playBounce();
            // 바의 어느 위치에 부딪혔는지에 따라 튕기는 각도 조절
            const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const maxAngle = Math.PI / 3; // 최대 60도
            const bounceAngle = hitPoint * maxAngle;
            const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

            ball.dx = currentSpeed * Math.sin(bounceAngle);
            ball.dy = -currentSpeed * Math.cos(bounceAngle);

            // 공이 갇히는 현상 방지
            ball.y = paddle.y - ball.radius - 1;
        }

        // 바닥에 떨어짐 (기회 차감)
        if (ball.y + ball.radius > canvas.height) {
            sound.playLoseLife();
            lives--;
            updateLivesDisplay();

            if (lives <= 0) {
                handleGameOver();
            } else {
                resetBallAndPaddle();
            }
        }
    }

    // 파티클 상태 업데이트
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    // 하트 목숨 표시 업데이트
    function updateLivesDisplay() {
        livesElement.textContent = '❤️'.repeat(Math.max(0, lives));
    }

    // 화면 그리기 함수 (렌더링)
    function draw() {
        // 배경 그리기 (투명도가 있는 잔상 효과)
        ctx.fillStyle = 'rgba(5, 5, 20, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. 블록 그리기
        for (let r = 0; r < brickConfig.rows; r++) {
            for (let c = 0; c < brickConfig.cols; c++) {
                const b = bricks[r][c];
                if (b.status === 1) {
                    ctx.save();
                    ctx.fillStyle = b.color.main;
                    ctx.shadowColor = b.color.shadow;
                    ctx.shadowBlur = 12;

                    // 둥근 사각형 블록
                    ctx.beginPath();
                    ctx.roundRect(b.x, b.y, b.width, b.height, 6);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // 2. 파티클 그리기
        particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 3. 바(막대) 그리기
        ctx.save();
        const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
        paddleGradient.addColorStop(0, '#00f3ff');
        paddleGradient.addColorStop(0.5, '#ffffff');
        paddleGradient.addColorStop(1, '#00f3ff');

        ctx.fillStyle = paddleGradient;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
        ctx.fill();
        ctx.restore();

        // 4. 공 잔상 및 공 그리기
        // 공 잔상
        ball.trail.forEach((pos, idx) => {
            ctx.save();
            ctx.globalAlpha = (idx + 1) / ball.trail.length * 0.4;
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ball.radius * ((idx + 1) / ball.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 본래 공
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 메인 게임 루프
    function gameLoop() {
        if (!isGameRunning) return;

        updatePaddle();
        updateBall();
        checkBrickCollisions();
        updateParticles();
        draw();

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // 게임 시작 처리
    function startGame() {
        sound.init();
        score = 0;
        lives = 3;
        scoreElement.textContent = '0';
        updateLivesDisplay();

        initBricks();
        resetBallAndPaddle();
        particles = [];

        startOverlay.classList.remove('active');
        gameOverOverlay.classList.remove('active');
        victoryOverlay.classList.remove('active');

        isGameRunning = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameLoop();
    }

    // 게임 오버 처리
    function handleGameOver() {
        isGameRunning = false;
        finalScoreText.textContent = `최종 점수: ${score}점`;
        gameOverOverlay.classList.add('active');
    }

    // 게임 승리 처리
    function handleVictory() {
        isGameRunning = false;
        sound.playWin();
        victoryOverlay.classList.add('active');
    }

    // 버튼 이벤트 연결
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    victoryRestartButton.addEventListener('click', startGame);

    // 최초 준비 렌더링
    initBricks();
    resetBallAndPaddle();
    draw();
});
