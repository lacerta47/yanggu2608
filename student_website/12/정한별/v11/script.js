// --------------------------------------------------
// 살인의 미스터리 (v11) - 수사 및 추리 게임 로직
// --------------------------------------------------

// Web Audio API 효과음 관리자
class SoundManager {
    constructor() { this.ctx = null; }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    playClick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    }

    playTick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }

    playSuccess() {
        if (!this.ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.12);
            osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
        });
    }

    playShock() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    }

    playBadEnding() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(65, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.8);
    }
}

const sounds = new SoundManager();

// 게임 상태 변수
const gameState = {
    currentTimeMinutes: 13 * 60, // 오후 1시 (780분)
    maxTimeMinutes: 20 * 60,     // 저녁 8시 (1200분)
    selectedClue: null,
    selectedSuspect: null,
    searchedTargets: new Set(),
    interrogatedSuspects: new Set()
};

// 장소 수사 데이터
const locationData = {
    mountain: {
        title: "아이가 사라진 산 입구",
        log: "🌲 [아이가 사라진 산 입구] 조사 완료: 진흙밭에서 커다란 등산화 자국(270mm)과 무언가를 끌고 간 듯한 억새풀 자국을 발견했습니다. 또한 꺾어진 나뭇가지 부근에서 깎아낸 지 얼마 안 된 나무 조각 파편을 발견했습니다."
    },
    board: {
        title: "지문이 안 나온 나무판 (경고장)",
        log: "🪵 [지문이 안 나온 나무판(경고장)] 정밀 감식 완료: 범인이 장갑을 끼고 제작하여 지문은 전혀 묻어있지 않습니다! 하지만 정밀 조사 결과, 산속에서는 자라지 않는 **희귀 삼나무** 재질이며, 가구점용 특수 대형 톱날 흔적이 남아있습니다!"
    }
};

// 용의자 심문 데이터
const suspectData = {
    carpenter: {
        name: "가구점 사장 박씨",
        log: "🪚 [가구점 사장 박씨] 심문: \"허허, 난 사건 당일 오후 2시에 가구점에서 장갑을 끼고 삼나무판을 깎아 의자를 만들었소! 산 입구 근처에는 간 적도 없고, 내 장갑 때문에 지문 따위는 안 묻었... 아니, 내 가구점 작업에 시비 걸지 마시오!\""
    },
    herbalist: {
        name: "약초꾼 이씨",
        log: "🌿 [약초꾼 이씨] 심문: \"오후 2시엔 산 중턱에서 칡뿌리를 파내고 있었습니다. 산 입구의 경고판이요? 전 문맹이라 글씨를 쓸 줄도 몰라요.\""
    },
    hunter: {
        name: "사냥꾼 최씨",
        log: "🏹 [사냥꾼 최씨] 심문: \"오후 2시엔 산기슭 오두막에서 엽총 기름칠을 하며 쉬고 있었소. 난 목재를 다룰 줄도 모르고 톱이나 가구용 도구도 갖고 있지 않소.\""
    }
};

// 시계 분 ➔ 한국어 시각 변환 (예: 13:30 ➔ 오후 01:30)
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? '오후' : '오전';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    
    const padHours = String(displayHours).padStart(2, '0');
    const padMinutes = String(minutes).padStart(2, '0');
    return `${period} ${padHours}:${padMinutes}`;
}

// 시간 차감 및 체크 (30분 소요)
function advanceTime(minutesToConsume = 30) {
    gameState.currentTimeMinutes += minutesToConsume;
    sounds.playTick();

    const formatted = formatTime(gameState.currentTimeMinutes);
    document.getElementById('clockText').textContent = formatted;

    // 저녁 8시(1200분) 이상 도착 시 배드 엔딩 실행
    if (gameState.currentTimeMinutes >= gameState.maxTimeMinutes) {
        triggerBadEnding("⚠️ 시간 초과 (저녁 8시 도착)", "시계 바늘이 저녁 8시를 가리키며 산속에 짙은 어둠과 안개가 들이찼습니다.<br>아이가 사라졌던 바로 그 으스스한 산속에서...<br><b>@@씨는 진범의 덫에 걸려 똑같이 비극적인 운명을 맞이하고 말았습니다.</b>");
        return false;
    }
    return true;
}

// 장면 전환 함수
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

// 타자기 효과
function typeWriterEffect(element, text, speed = 35, callback = null) {
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

// 스푸키 입자 애니메이션
function initSpookyParticles() {
    const container = document.getElementById('spookyParticles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        const size = Math.random() * 4 + 2;
        p.style.cssText = `
            position: absolute;
            width: ${size}px; height: ${size}px;
            background: rgba(${Math.random() > 0.5 ? '239, 68, 68' : '168, 85, 247'}, ${Math.random() * 0.6 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%; left: ${Math.random() * 100}%;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
            animation: floatFog ${Math.random() * 8 + 4}s infinite alternate ease-in-out;
        `;
        container.appendChild(p);
    }
}

// 수사 노트에 기록 추가
function addLogToNotebook(text, logClass = 'search-log') {
    const body = document.getElementById('notebookBody');
    const defaultLog = body.querySelector('.default-log');
    if (defaultLog) defaultLog.remove();

    const timeStr = formatTime(gameState.currentTimeMinutes);
    const item = document.createElement('div');
    item.className = `log-item ${logClass}`;
    item.innerHTML = `<span style="font-weight:bold; color:#fca5a5;">[${timeStr}]</span> ${text}`;
    body.insertBefore(item, body.firstChild);
}

// 장소 수사 실행
function handleSearchLocation(target) {
    sounds.init();
    if (!advanceTime(30)) return;

    const data = locationData[target];
    if (data) {
        gameState.searchedTargets.add(target);
        addLogToNotebook(data.log, 'search-log');
    }
}

// 용의자 심문 실행
function handleInterrogateSuspect(target) {
    sounds.init();
    if (!advanceTime(30)) return;

    const data = suspectData[target];
    if (data) {
        gameState.interrogatedSuspects.add(target);
        addLogToNotebook(data.log, 'interrogate-log');
    }
}

// 모순 추리 모달 열기
function openDeductionModal() {
    sounds.init();
    sounds.playClick();

    gameState.selectedClue = null;
    gameState.selectedSuspect = null;

    document.querySelectorAll('.select-item').forEach(el => el.classList.remove('selected'));

    const modal = document.getElementById('deductionModal');
    modal.classList.remove('hidden');
}

// 모순 추리 모달 닫기
function closeDeductionModal() {
    sounds.playClick();
    const modal = document.getElementById('deductionModal');
    modal.classList.add('hidden');
}

// 추리 선택 처리
function setupDeductionSelection() {
    // 단서 선택
    document.querySelectorAll('#clueGroup .select-item').forEach(item => {
        item.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('#clueGroup .select-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            gameState.selectedClue = item.dataset.clue;
        });
    });

    // 용의자 선택
    document.querySelectorAll('#suspectGroup .select-item').forEach(item => {
        item.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('#suspectGroup .select-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            gameState.selectedSuspect = item.dataset.suspect;
        });
    });
}

// 모순 지목 및 추론 최종 제출
function submitDeduction() {
    if (!gameState.selectedClue || !gameState.selectedSuspect) {
        alert('단서 1개와 용의자 알리바이 1개를 모두 선택해 주세요!');
        return;
    }

    closeDeductionModal();

    // 시간 30분 차감
    if (!advanceTime(30)) return;

    // 성공 조건: 단서가 wooden_board 이고, 용의자가 carpenter(박씨) 인 경우!
    if (gameState.selectedClue === 'wooden_board' && gameState.selectedSuspect === 'carpenter') {
        // 진범 자백 연출 실행
        triggerConfessionScene();
    } else {
        // 실패 조건 ➔ 엉뚱한 용의자 지목 배드 엔딩!
        sounds.playShock();
        triggerBadEnding("⚠️ 엉뚱한 용의자 지목 및 모순 추론 실패", "잘못된 용의자를 지목하거나 모순을 찾지 못해 진범이 덜미를 잡히기 전에 움직였습니다...<br>아이가 숨졌던 그 으스스한 산속에서 <b>@@씨는 진범에게 똑같이 공격당하고 말았습니다.</b>");
    }
}

// 범인 자백 모달 실행
function triggerConfessionScene() {
    sounds.playShock();
    const modal = document.getElementById('confessionModal');
    modal.classList.remove('hidden');

    const confessionEl = document.getElementById('confessionText');
    const speechText = "범인 박씨: \"뭐... 뭐라고?! 장갑을 끼고 작업해서 지문 하나 안 남겼는데... 산에서 자라지 않는 내 가구점 삼나무 결과 대형 톱질 흔적으로 날 알아챘다고?! 빌어먹을... 내가 경고장을 깎아서 산 입구에 세워둔 건 맞다...! 그래, 전부 내가 한 짓이야!\"";

    typeWriterEffect(confessionEl, speechText, 35);
}

// 해피 / 진엔딩 실행
function triggerHappyEnding() {
    sounds.playSuccess();
    const confessionModal = document.getElementById('confessionModal');
    confessionModal.classList.add('hidden');

    document.getElementById('clearTimeText').textContent = formatTime(gameState.currentTimeMinutes);
    switchScene('investigationScreen', 'happyEndingScreen');
}

// 배드 엔딩 실행
function triggerBadEnding(reasonTitle, storyText) {
    sounds.playBadEnding();

    const deductionModal = document.getElementById('deductionModal');
    if (deductionModal) deductionModal.classList.add('hidden');

    document.getElementById('badEndingReason').textContent = reasonTitle;
    document.getElementById('badEndingStory').innerHTML = storyText;

    switchScene('investigationScreen', 'badEndingScreen');
}

// 게임 상태 리셋
function resetGame() {
    gameState.currentTimeMinutes = 13 * 60; // 오후 1시
    gameState.selectedClue = null;
    gameState.selectedSuspect = null;
    gameState.searchedTargets.clear();
    gameState.interrogatedSuspects.clear();

    document.getElementById('clockText').textContent = '오후 01:00';

    const notebookBody = document.getElementById('notebookBody');
    notebookBody.innerHTML = `
        <div class="log-item default-log">
            🕵️‍♂️ "오후 1시 수사 개시. 장소를 수사하거나 용의자를 심문하여 모순을 찾아내세요."
        </div>
    `;

    switchScene('happyEndingScreen', 'titleScreen');
    switchScene('badEndingScreen', 'titleScreen');
}

// 페이지 로드 완료 시 이벤트 바인딩
window.addEventListener('DOMContentLoaded', () => {
    initSpookyParticles();

    // 시작 버튼
    document.getElementById('startGameBtn').addEventListener('click', () => {
        sounds.init();
        sounds.playClick();
        switchScene('titleScreen', 'investigationScreen');
    });

    // 장소 수사 및 용의자 심문 버튼
    document.querySelectorAll('.action-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const target = btn.dataset.target;

            if (action === 'search') handleSearchLocation(target);
            else if (action === 'interrogate') handleInterrogateSuspect(target);
        });
    });

    // 모순 추리 모달 관련 버튼
    document.getElementById('openDeductionBtn').addEventListener('click', openDeductionModal);
    document.getElementById('closeDeductionBtn').addEventListener('click', closeDeductionModal);
    document.getElementById('submitDeductionBtn').addEventListener('click', submitDeduction);

    // 자백 후 진엔딩 이동 버튼
    document.getElementById('proceedToHappyEndingBtn').addEventListener('click', triggerHappyEnding);

    // 다시 시작 버튼
    document.querySelectorAll('.restartGameBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            resetGame();
        });
    });

    setupDeductionSelection();
});
