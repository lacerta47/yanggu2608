// 웹 오디오 API 효과음 및 사운드 관리자
class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    // 은은한 버튼 클릭음
    playClick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // 물레 다듬기 소리
    playClay() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + Math.random() * 80, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // 불꽃 타오르는 소리
    playFire() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 + Math.random() * 50, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    // 성공 및 보상 종소리
    playChime() {
        if (!this.ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.12);
            osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
        });
    }

    // 일기장 장 넘어가는 소리
    playPage() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
}

const sounds = new SoundManager();

// 게임 데이터 및 상태 관리
const gameState = {
    day: 1,
    warmth: 0,
    potteryCountToday: 0,
    customerCountToday: 0,
    totalWarmthToday: 0,
    hasCurrentOrder: true,
    stepState: 'IDLE', // IDLE, ORDERED, SHAPED, KILNED
    currentOrder: null
};

// 다양한 손님 및 도자기 주문 데이터 목록
const orderDatabase = [
    {
        npcName: "달님 할머니 👵",
        npcAvatar: "👵",
        itemTitle: "따스한 둥근 차잔",
        dialogue: "이른 새벽 공기가 차갑구려. 손을 따뜻하게 감싸쥘 수 있는 오목하고 포근한 차잔 하나 부탁하네.",
        targetProfile: [45, 55, 60, 62, 60, 55, 45, 35], // 높이별 반지름
        letter: "할머니의 손길에 꼭 맞는 온기를 선물해 주어서 고맙네. 차 한 잔 마실 때마다 공방의 따스함이 떠오를 것 같아."
    },
    {
        npcName: "어린 화가 민우 🎨",
        npcAvatar: "🎨",
        itemTitle: "우아한 꽃병",
        dialogue: "새벽녘 들판에서 꺾은 작은 들꽃을 꽂아둘 길쭉하고 예쁜 붓꽃병이 필요해요!",
        targetProfile: [25, 30, 40, 55, 65, 40, 30, 50],
        letter: "제가 그린 새벽 화폭 옆에 놓아두었어요. 둥근 선이 너무 아늑해서 쳐다보기만 해도 기분이 좋아집니다."
    },
    {
        npcName: "숲속 정원사 수아 🌿",
        npcAvatar: "🌿",
        itemTitle: "아담한 흙화분",
        dialogue: "새로 틔운 다육이 싹을 심을 넓고 다부진 화분이 필요해요. 흙 냄새가 물씬 나는 것으로 빚어주세요.",
        targetProfile: [60, 62, 65, 65, 60, 55, 50, 45],
        letter: "정성스레 빚어주신 화분에 새 싹을 옮겨 심었어요. 흙과 가마의 기운 덕분에 화초가 아주 건강하게 잘 자랄 것 같아요!"
    },
    {
        npcName: "시인 하은 📜",
        npcAvatar: "📜",
        itemTitle: "새벽빛 머그잔",
        dialogue: "글을 쓰다 새벽을 맞이하곤 한답니다. 따뜻한 유자를 담아 마실 큼직한 머그잔을 기대할게요.",
        targetProfile: [50, 52, 55, 55, 55, 52, 50, 48],
        letter: "차가운 원고지 위에 머그잔을 올려놓으니 마음까지 고요해집니다. 글귀마다 공방의 온기가 묻어나는 듯해요."
    }
];

// 독백 데이터
const monologues = [
    "어둠이 은은하게 물러가는 새벽 공기 속에서 손님의 마음을 생각하며 도자기를 빚었다. 흙을 어루만질 때마다 내 마음도 함께 차분해진다.",
    "가마 속 은은한 불꽃을 바라보며 기다림의 소중함을 배운 하루였다. 그릇에 담길 온기가 누군가의 새벽을 따스하게 밝혀주기를...",
    "공방 창가로 들어오는 보랏빛 별빛을 보며 일기를 적는다. 소소하지만 정성스런 일상이 모여 나의 작은 계절이 되어간다."
];

// 저장 및 불러오기
function loadGameData() {
    const saved = localStorage.getItem('season_workshop_save');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState.day = parsed.day || 1;
            gameState.warmth = parsed.warmth || 0;
        } catch (e) {
            console.log(e);
        }
    }
    updateHUD();
}

function saveGameData() {
    localStorage.setItem('season_workshop_save', JSON.stringify({
        day: gameState.day,
        warmth: gameState.warmth
    }));
}

function updateHUD() {
    document.getElementById('dayText').textContent = `${gameState.day}일 차 (새벽녘)`;
    document.getElementById('warmthText').textContent = `온기 ${gameState.warmth}개`;
}

// 씬 전환 관리 (페이드 애니메이션)
function switchScene(fromSceneId, toSceneId) {
    const fromScene = document.getElementById(fromSceneId);
    const toScene = document.getElementById(toSceneId);

    if (fromScene) {
        fromScene.classList.remove('active');
        fromScene.classList.add('hidden');
    }

    setTimeout(() => {
        if (toScene) {
            toScene.classList.remove('hidden');
            toScene.classList.add('active');
        }
    }, 400);
}

// 타자기 텍스트 연출 효과
function typeWriterEffect(element, text, speed = 40, callback = null) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
            if (callback) callback();
        }
    }, speed);
}

// 타이틀 화면 입자 애니메이션 생성
function initTitleParticles() {
    const container = document.getElementById('titleParticles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'title-particle';
        const size = Math.random() * 5 + 2;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(216, 180, 254, ${Math.random() * 0.6 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            box-shadow: 0 0 10px rgba(216, 180, 254, 0.8);
            animation: floatParticle ${Math.random() * 6 + 4}s infinite alternate ease-in-out;
        `;
        container.appendChild(particle);
    }
}

// 2단계: 공방 캔버스 조작 & 이동 시스템 (WASD)
let workshopCanvas, wsCtx;
const player = {
    x: 400,
    y: 300,
    radius: 18,
    speed: 4,
    color: '#d8b4fe'
};

const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    e: false
};

// 공방 작업대 영역 정의
const stations = [
    { id: 'door', name: '🚪 손님 맞이 문 앞', x: 100, y: 180, w: 100, h: 100, color: '#4c1d95' },
    { id: 'wheel', name: '🏺 물레 작업대', x: 680, y: 160, w: 110, h: 110, color: '#581c87' },
    { id: 'kiln', name: '🔥 가마', x: 680, y: 360, w: 110, h: 120, color: '#7c2d12' },
    { id: 'diary', name: '📖 하루 일기장 책상', x: 200, y: 380, w: 110, h: 90, color: '#3b0764' }
];

let nearStation = null;

function initWorkshopCanvas() {
    workshopCanvas = document.getElementById('workshopCanvas');
    wsCtx = workshopCanvas.getContext('2d');
    
    // 키 이벤트 등록
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = true;
        if (e.key in keys) keys[e.key] = true;
        if (e.key === 'e' || e.key === 'E') {
            triggerStationInteract();
        }
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = false;
        if (e.key in keys) keys[e.key] = false;
    });

    // 모바일 터치 버튼 처리
    document.querySelectorAll('.dpad-btn').forEach(btn => {
        const key = btn.dataset.key;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
        btn.addEventListener('mousedown', () => { keys[key] = true; });
        btn.addEventListener('mouseup', () => { keys[key] = false; });
    });

    // 캔버스 클릭으로 이동 및 인터랙션 지원
    workshopCanvas.addEventListener('click', (e) => {
        const rect = workshopCanvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (workshopCanvas.width / rect.width);
        const clickY = (e.clientY - rect.top) * (workshopCanvas.height / rect.height);
        
        // 스테이션 클릭 시 접근
        stations.forEach(st => {
            if (clickX >= st.x && clickX <= st.x + st.w && clickY >= st.y && clickY <= st.y + st.h) {
                player.x = st.x + st.w / 2;
                player.y = st.y + st.h + 25;
                checkNearStation();
                triggerStationInteract();
            }
        });
    });

    requestAnimationFrame(updateWorkshopLoop);
}

function updateWorkshopLoop() {
    const workshopScreen = document.getElementById('workshopScreen');
    if (workshopScreen && workshopScreen.classList.contains('active')) {
        // 플레이어 이동 로직 (WASD / 방향키)
        let dx = 0, dy = 0;
        if (keys.w || keys.ArrowUp) dy -= player.speed;
        if (keys.s || keys.ArrowDown) dy += player.speed;
        if (keys.a || keys.ArrowLeft) dx -= player.speed;
        if (keys.d || keys.ArrowRight) dx += player.speed;

        // 이동 보정
        player.x += dx;
        player.y += dy;

        // 공방 벽 충돌 처리 (경계)
        player.x = Math.max(50, Math.min(workshopCanvas.width - 50, player.x));
        player.y = Math.max(120, Math.min(workshopCanvas.height - 50, player.y));

        checkNearStation();
        drawWorkshop();
    }
    requestAnimationFrame(updateWorkshopLoop);
}

// 작업대 접근 체크
function checkNearStation() {
    nearStation = null;
    const promptEl = document.getElementById('interactPrompt');
    const promptTextEl = document.getElementById('promptText');

    stations.forEach(st => {
        const centerX = st.x + st.w / 2;
        const centerY = st.y + st.h / 2;
        const dist = Math.hypot(player.x - centerX, player.y - centerY);
        if (dist < 90) {
            nearStation = st;
        }
    });

    if (nearStation) {
        promptEl.classList.remove('hidden');
        promptTextEl.textContent = `${nearStation.name} [E 키 또는 클릭]`;
    } else {
        promptEl.classList.add('hidden');
    }
}

// 작업대 상호작용 트리거
function triggerStationInteract() {
    if (!nearStation) return;
    sounds.playClick();

    if (nearStation.id === 'door') {
        if (gameState.stepState === 'IDLE') {
            openDialogueModal();
        } else {
            alert('이미 주문을 받아 진행 중입니다! 물레 작업대로 이동해 보세요.');
        }
    } else if (nearStation.id === 'wheel') {
        if (gameState.stepState === 'ORDERED') {
            openWheelModal();
        } else if (gameState.stepState === 'IDLE') {
            alert('먼저 문 앞[🚪]에서 손님 주문을 받아주세요!');
        } else {
            alert('이미 물레 빚기가 완료되었습니다. 가마[🔥]로 이동하세요.');
        }
    } else if (nearStation.id === 'kiln') {
        if (gameState.stepState === 'SHAPED') {
            openKilnModal();
        } else if (gameState.stepState === 'KILNED') {
            openResultModal();
        } else {
            alert('물레 작업대[🏺]에서 먼저 도자기 모양을 다듬어주세요!');
        }
    } else if (nearStation.id === 'diary') {
        openDiaryScreen();
    }
}

// 공방 캔버스 그래픽 렌더링
function drawWorkshop() {
    wsCtx.clearRect(0, 0, workshopCanvas.width, workshopCanvas.height);

    // 1. 공방 나무 바닥 배경
    wsCtx.fillStyle = '#1e1438';
    wsCtx.fillRect(0, 0, workshopCanvas.width, workshopCanvas.height);

    // 격자 타일 라인
    wsCtx.strokeStyle = 'rgba(216, 180, 254, 0.06)';
    wsCtx.lineWidth = 1;
    for (let x = 0; x < workshopCanvas.width; x += 50) {
        wsCtx.beginPath(); wsCtx.moveTo(x, 0); wsCtx.lineTo(x, workshopCanvas.height); wsCtx.stroke();
    }
    for (let y = 0; y < workshopCanvas.height; y += 50) {
        wsCtx.beginPath(); wsCtx.moveTo(0, y); wsCtx.lineTo(workshopCanvas.width, y); wsCtx.stroke();
    }

    // 2. 창문 (보랏빛 새벽빛 연출)
    wsCtx.fillStyle = '#311b5e';
    wsCtx.fillRect(320, 20, 260, 70);
    wsCtx.strokeStyle = '#6b21a8';
    wsCtx.lineWidth = 4;
    wsCtx.strokeRect(320, 20, 260, 70);
    // 은은한 창가 유성 은하수 효과
    wsCtx.fillStyle = 'rgba(216, 180, 254, 0.8)';
    wsCtx.font = '14px serif';
    wsCtx.fillText('✨ 새벽의 은하수가 창가를 지나갑니다 ✨', 345, 60);

    // 3. 작업대들 렌더링
    stations.forEach(st => {
        wsCtx.save();
        wsCtx.fillStyle = st.color;
        wsCtx.beginPath();
        wsCtx.roundRect(st.x, st.y, st.w, st.h, 16);
        wsCtx.fill();
        wsCtx.strokeStyle = 'rgba(216, 180, 254, 0.4)';
        wsCtx.lineWidth = 2;
        wsCtx.stroke();

        // 텍스트 라벨
        wsCtx.fillStyle = '#faf5ff';
        wsCtx.font = '15px Gowun Dodum';
        wsCtx.textAlign = 'center';
        wsCtx.fillText(st.name, st.x + st.w / 2, st.y + st.h / 2 + 5);

        // 하이라이트 후광
        if (nearStation === st) {
            wsCtx.strokeStyle = '#a855f7';
            wsCtx.lineWidth = 4;
            wsCtx.strokeRect(st.x - 4, st.y - 4, st.w + 8, st.h + 8);
        }
        wsCtx.restore();
    });

    // 4. 손님 NPC (문 앞에 서있음)
    if (gameState.currentOrder) {
        wsCtx.save();
        wsCtx.font = '36px sans-serif';
        wsCtx.fillText(gameState.currentOrder.npcAvatar, 130, 140);
        
        // 말풍선
        wsCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        wsCtx.beginPath();
        wsCtx.roundRect(100, 75, 110, 32, 10);
        wsCtx.fill();
        wsCtx.fillStyle = '#2e1065';
        wsCtx.font = '13px Gowun Dodum';
        wsCtx.fillText('주문이 있어요!', 110, 96);
        wsCtx.restore();
    }

    // 5. 주인공 캐릭터 (아기자기 원형 렌더링)
    wsCtx.save();
    wsCtx.shadowColor = '#c084fc';
    wsCtx.shadowBlur = 15;
    
    // 주인공 몸체 (부드러운 연보라)
    wsCtx.fillStyle = player.color;
    wsCtx.beginPath();
    wsCtx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    wsCtx.fill();
    wsCtx.strokeStyle = '#ffffff';
    wsCtx.lineWidth = 3;
    wsCtx.stroke();

    // 두 눈
    wsCtx.fillStyle = '#2e1065';
    wsCtx.beginPath();
    wsCtx.arc(player.x - 5, player.y - 3, 2.5, 0, Math.PI * 2);
    wsCtx.arc(player.x + 5, player.y - 3, 2.5, 0, Math.PI * 2);
    wsCtx.fill();

    // 미소
    wsCtx.strokeStyle = '#2e1065';
    wsCtx.lineWidth = 1.5;
    wsCtx.beginPath();
    wsCtx.arc(player.x, player.y + 2, 4, 0.1 * Math.PI, 0.9 * Math.PI);
    wsCtx.stroke();

    wsCtx.restore();
}

// 주문 대화 창 모달
function openDialogueModal() {
    sounds.init();
    sounds.playClick();
    const modal = document.getElementById('dialogueModal');
    const order = gameState.currentOrder;

    document.getElementById('npcAvatar').textContent = order.npcAvatar;
    document.getElementById('npcName').textContent = order.npcName;
    document.getElementById('orderItemName').textContent = order.itemTitle;
    
    const dialogueEl = document.getElementById('npcDialogue');
    modal.classList.remove('hidden');

    typeWriterEffect(dialogueEl, order.dialogue);

    document.getElementById('acceptOrderBtn').onclick = () => {
        sounds.playClick();
        modal.classList.add('hidden');
        gameState.stepState = 'ORDERED';
        alert('주문을 받았습니다! 물레 작업대[🏺]로 가서 도자기를 빚어주세요.');
    };
}

// 3단계-1: 물레 빚기 미니게임
let wheelCanvas, wheelCtx;
let currentRadii = [50, 50, 50, 50, 50, 50, 50, 50]; // 8단계 높이별 반지름
let isDraggingWheel = false;

function openWheelModal() {
    sounds.init();
    const modal = document.getElementById('wheelModal');
    modal.classList.remove('hidden');

    wheelCanvas = document.getElementById('wheelCanvas');
    wheelCtx = wheelCanvas.getContext('2d');

    // 초기 반지름 리셋
    currentRadii = [50, 50, 50, 50, 50, 50, 50, 50];
    updateWheelAccuracy();
    drawWheelCanvas();

    // 드래그 이벤트
    const handleMove = (e) => {
        if (!isDraggingWheel) return;
        const rect = wheelCanvas.getBoundingClientRect();
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);

        const mouseY = (clientY - rect.top) * (wheelCanvas.height / rect.height);
        const mouseX = (clientX - rect.left) * (wheelCanvas.width / rect.width);

        const sliceHeight = 220 / 8;
        const index = Math.floor((mouseY - 70) / sliceHeight);
        if (index >= 0 && index < 8) {
            const distFromCenter = Math.abs(mouseX - wheelCanvas.width / 2);
            currentRadii[index] = Math.max(20, Math.min(85, distFromCenter));
            sounds.playClay();
            updateWheelAccuracy();
            drawWheelCanvas();
        }
    };

    wheelCanvas.onmousedown = (e) => { isDraggingWheel = true; handleMove(e); };
    wheelCanvas.onmousemove = handleMove;
    window.onmouseup = () => { isDraggingWheel = false; };

    wheelCanvas.ontouchstart = (e) => { isDraggingWheel = true; handleMove(e); };
    wheelCanvas.ontouchmove = handleMove;
    window.ontouchend = () => { isDraggingWheel = false; };

    document.getElementById('resetWheelBtn').onclick = () => {
        sounds.playClick();
        currentRadii = [50, 50, 50, 50, 50, 50, 50, 50];
        updateWheelAccuracy();
        drawWheelCanvas();
    };

    document.getElementById('finishWheelBtn').onclick = () => {
        sounds.playClick();
        modal.classList.add('hidden');
        gameState.stepState = 'SHAPED';
        alert('도자기 예쁜 실루엣이 완성되었습니다! 이제 가마[🔥]로 가서 단단하게 구워주세요.');
    };
}

function updateWheelAccuracy() {
    const target = gameState.currentOrder.targetProfile;
    let diffSum = 0;
    for (let i = 0; i < 8; i++) {
        diffSum += Math.abs(currentRadii[i] - target[i]);
    }
    const maxDiff = 8 * 40;
    let acc = Math.max(10, Math.round(100 - (diffSum / maxDiff) * 100));
    
    document.getElementById('accuracyFill').style.width = acc + '%';
    document.getElementById('accuracyText').textContent = acc + '%';
}

function drawWheelCanvas() {
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    const centerX = wheelCanvas.width / 2;
    const startY = 70;
    const sliceH = 220 / 8;

    // 1. 목표 실루엣 점선 가이드 렌더링
    const target = gameState.currentOrder.targetProfile;
    wheelCtx.save();
    wheelCtx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
    wheelCtx.lineWidth = 2;
    wheelCtx.setLineDash([5, 5]);

    wheelCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        if (i === 0) wheelCtx.moveTo(centerX - target[i], y);
        else wheelCtx.lineTo(centerX - target[i], y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        wheelCtx.lineTo(centerX + target[i], y);
    }
    wheelCtx.closePath();
    wheelCtx.stroke();
    wheelCtx.restore();

    // 2. 현재 빚고 있는 찰흙 물레 렌더링
    wheelCtx.save();
    const grad = wheelCtx.createLinearGradient(centerX - 80, 0, centerX + 80, 0);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(0.5, '#e9d5ff');
    grad.addColorStop(1, '#a855f7');

    wheelCtx.fillStyle = grad;
    wheelCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        if (i === 0) wheelCtx.moveTo(centerX - currentRadii[i], y);
        else wheelCtx.lineTo(centerX - currentRadii[i], y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        wheelCtx.lineTo(centerX + currentRadii[i], y);
    }
    wheelCtx.closePath();
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#ffffff';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();
    wheelCtx.restore();

    // 3. 물레 밑판 회전대
    wheelCtx.fillStyle = '#3b0764';
    wheelCtx.fillRect(centerX - 90, startY + 220, 180, 20);
    wheelCtx.fillStyle = '#6b21a8';
    wheelCtx.fillRect(centerX - 100, startY + 240, 200, 12);
}

// 3단계-2: 가마 굽기 미니게임
let kilnNeedlePos = 0; // 0 ~ 100
let kilnInterval = null;
let kilnTimerVal = 7;
let kilnTimerInterval = null;

function openKilnModal() {
    sounds.init();
    const modal = document.getElementById('kilnModal');
    modal.classList.remove('hidden');

    kilnNeedlePos = 20;
    kilnTimerVal = 7;
    document.getElementById('kilnTimer').textContent = kilnTimerVal;

    const heatBtn = document.getElementById('heatKilnBtn');
    
    const applyHeat = () => {
        kilnNeedlePos = Math.min(100, kilnNeedlePos + 14);
        sounds.playFire();
        document.getElementById('tempNeedle').style.bottom = kilnNeedlePos + '%';
    };

    heatBtn.onclick = applyHeat;

    const keyHeat = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            applyHeat();
        }
    };
    window.addEventListener('keydown', keyHeat);

    // 온도 감소 루프 및 타이머
    if (kilnInterval) clearInterval(kilnInterval);
    if (kilnTimerInterval) clearInterval(kilnTimerInterval);

    kilnInterval = setInterval(() => {
        kilnNeedlePos = Math.max(0, kilnNeedlePos - 3);
        document.getElementById('tempNeedle').style.bottom = kilnNeedlePos + '%';
    }, 100);

    kilnTimerInterval = setInterval(() => {
        kilnTimerVal--;
        document.getElementById('kilnTimer').textContent = kilnTimerVal;

        if (kilnTimerVal <= 0) {
            clearInterval(kilnInterval);
            clearInterval(kilnTimerInterval);
            window.removeEventListener('keydown', keyHeat);

            sounds.playChime();
            modal.classList.add('hidden');
            gameState.stepState = 'KILNED';
            openResultModal();
        }
    }, 1000);
}

// 4단계-1: 도자기 완성 결과창
function openResultModal() {
    sounds.playChime();
    const modal = document.getElementById('resultModal');
    modal.classList.remove('hidden');

    // 완성된 도자기 캔버스 그리기
    const resultCanvas = document.getElementById('resultPotteryCanvas');
    const rCtx = resultCanvas.getContext('2d');
    rCtx.clearRect(0, 0, 180, 180);

    const centerX = 90;
    const startY = 25;
    const sliceH = 130 / 8;

    rCtx.save();
    const grad = rCtx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, '#f5d0fe');
    grad.addColorStop(0.5, '#c084fc');
    grad.addColorStop(1, '#7e22ce');

    rCtx.fillStyle = grad;
    rCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        const rad = currentRadii[i] * 0.7;
        if (i === 0) rCtx.moveTo(centerX - rad, y);
        else rCtx.lineTo(centerX - rad, y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        const rad = currentRadii[i] * 0.7;
        rCtx.lineTo(centerX + rad, y);
    }
    rCtx.closePath();
    rCtx.fill();
    rCtx.strokeStyle = '#ffffff';
    rCtx.lineWidth = 3;
    rCtx.stroke();
    rCtx.restore();

    // 편지 내용 타이핑 연출
    const letterEl = document.getElementById('letterContent');
    typeWriterEffect(letterEl, gameState.currentOrder.letter, 35);

    document.getElementById('closeResultBtn').onclick = () => {
        sounds.playClick();
        modal.classList.add('hidden');
        
        // 보상 누적
        gameState.warmth += 50;
        gameState.potteryCountToday++;
        gameState.customerCountToday++;
        gameState.totalWarmthToday += 50;
        gameState.stepState = 'IDLE';

        updateHUD();
        saveGameData();

        alert('손님의 감사 편지와 온기 50개를 받았습니다! 하루 일기장 책상[📖]으로 가서 마감해 보세요.');
    };
}

// 4단계-2: 하루 마감 일기장 화면
function openDiaryScreen() {
    sounds.playPage();
    switchScene('workshopScreen', 'diaryScreen');

    document.getElementById('diaryDate').textContent = `${gameState.day}일 차 밤 - 새벽녘의 기록`;
    document.getElementById('statPotteryCount').textContent = `${gameState.potteryCountToday}개`;
    document.getElementById('statCustomerCount').textContent = `${gameState.customerCountToday}명`;
    document.getElementById('statTotalWarmth').textContent = `${gameState.totalWarmthToday}개`;

    const monologueEl = document.getElementById('monologueText');
    const monoText = monologues[(gameState.day - 1) % monologues.length];
    typeWriterEffect(monologueEl, monoText, 40);

    document.getElementById('nextDayBtn').onclick = () => {
        sounds.playClick();
        // 다음 날로 전환
        gameState.day++;
        gameState.potteryCountToday = 0;
        gameState.customerCountToday = 0;
        gameState.totalWarmthToday = 0;

        // 다음 손님 주문 지정
        const nextOrderIndex = (gameState.day - 1) % orderDatabase.length;
        gameState.currentOrder = orderDatabase[nextOrderIndex];
        gameState.stepState = 'IDLE';

        saveGameData();
        updateHUD();

        switchScene('diaryScreen', 'workshopScreen');
    };
}

// 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
    initTitleParticles();
    loadGameData();
    gameState.currentOrder = orderDatabase[0];

    document.getElementById('startGameBtn').addEventListener('click', () => {
        sounds.init();
        sounds.playClick();
        switchScene('titleScreen', 'workshopScreen');
        initWorkshopCanvas();
    });
});
