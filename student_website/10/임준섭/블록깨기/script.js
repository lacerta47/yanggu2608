// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const overlayScreen = document.getElementById('overlayScreen');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const leftTouchBtn = document.getElementById('leftTouchBtn');
const rightTouchBtn = document.getElementById('rightTouchBtn');

// Game Parameters
let score = 0;
let animationFrameId = null;
let isGameRunning = false;

// Keyboard State
let rightPressed = false;
let leftPressed = false;

// Paddle Configuration
const paddleHeight = 12;
const paddleWidth = 84;
let paddleX = (canvas.width - paddleWidth) / 2;
const paddleY = canvas.height - paddleHeight - 12;
const paddleSpeed = 7;

// Ball Configuration
const ballRadius = 8;
let ballX = canvas.width / 2;
let ballY = paddleY - ballRadius - 2;
let ballDx = 4;
let ballDy = -4;

// Brick Configuration
const brickRowCount = 4;
const brickColumnCount = 6;
const brickWidth = 62;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 40;
const brickOffsetLeft = 28;
const brickColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80'];

let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: brickColors[r % brickColors.length] };
        }
    }
}

// Event Listeners for Keyboard
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// Event Listeners for Mobile Touch Buttons
leftTouchBtn.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; });
leftTouchBtn.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; });
leftTouchBtn.addEventListener('mousedown', () => { leftPressed = true; });
leftTouchBtn.addEventListener('mouseup', () => { leftPressed = false; });
leftTouchBtn.addEventListener('mouseleave', () => { leftPressed = false; });

rightTouchBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; });
rightTouchBtn.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; });
rightTouchBtn.addEventListener('mousedown', () => { rightPressed = true; });
rightTouchBtn.addEventListener('mouseup', () => { rightPressed = false; });
rightTouchBtn.addEventListener('mouseleave', () => { rightPressed = false; });

// Mouse Move Support on Canvas
canvas.addEventListener('mousemove', mouseMoveHandler, false);

function mouseMoveHandler(e) {
    if (!isGameRunning) return;
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const canvasMouseX = relativeX * scaleX;
    
    if (canvasMouseX > 0 && canvasMouseX < canvas.width) {
        paddleX = canvasMouseX - paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}

// Collision Detection with Bricks
function collisionDetection() {
    let activeBrickCount = 0;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                activeBrickCount++;
                if (
                    ballX + ballRadius > b.x &&
                    ballX - ballRadius < b.x + brickWidth &&
                    ballY + ballRadius > b.y &&
                    ballY - ballRadius < b.y + brickHeight
                ) {
                    ballDy = -ballDy;
                    b.status = 0;
                    score += 10;
                    scoreDisplay.textContent = score;

                    activeBrickCount--;
                    if (activeBrickCount === 0) {
                        gameWin();
                        return;
                    }
                }
            }
        }
    }
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38bdf8';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, paddleY, paddleWidth, paddleHeight, 6);
    ctx.fillStyle = '#818cf8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#818cf8';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Game Update Loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();

    // Wall Collision (Left & Right)
    if (ballX + ballDx > canvas.width - ballRadius || ballX + ballDx < ballRadius) {
        ballDx = -ballDx;
    }

    // Wall Collision (Top)
    if (ballY + ballDy < ballRadius) {
        ballDy = -ballDy;
    } else if (ballY + ballDy > paddleY - ballRadius) {
        // Paddle Collision Check
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            // Adjust bounce angle based on where ball hit paddle
            const hitPoint = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            ballDx = hitPoint * 5;
            ballDy = -Math.abs(ballDy);
        } else if (ballY + ballDy > canvas.height - ballRadius) {
            // Ball fell below paddle -> Game Over
            gameOver();
            return;
        }
    }

    // Move Paddle
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }

    // Move Ball
    ballX += ballDx;
    ballY += ballDy;

    if (isGameRunning) {
        animationFrameId = requestAnimationFrame(update);
    }
}

function startGame() {
    score = 0;
    scoreDisplay.textContent = score;
    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = paddleY - ballRadius - 2;
    ballDx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ballDy = -4;

    initBricks();
    overlayScreen.classList.add('hidden');
    isGameRunning = true;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    update();
}

function gameOver() {
    isGameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    overlayTitle.textContent = '게임 오버 😭';
    overlayMessage.textContent = '공이 바닥으로 떨어졌어요. 다시 도전해볼까요?';
    startBtn.textContent = '다시 하기';
    overlayScreen.classList.remove('hidden');
}

function gameWin() {
    isGameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    overlayTitle.textContent = '🎉 축하합니다!';
    overlayMessage.textContent = '모든 블록을 다 깨뜨려 승리하셨습니다!';
    startBtn.textContent = '다시 하기';
    overlayScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);

// Draw initial static state before game starts
initBricks();
drawBricks();
drawPaddle();
drawBall();
