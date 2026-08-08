// --------------------------------------------------
// 살인의 미스터리 (v12) - 1인칭 애니메이션 & 지문 스캐너 로직
// --------------------------------------------------

// Web Audio API 효과음 관리자 (안전 가드 처리)
class SoundManager {
    constructor() { this.ctx = null; }

    init() {
        try {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.log("Audio init error:", e);
        }
    }

    playClick() {
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {}
    }

    playTick() {
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.1);
        } catch (e) {}
    }

    playScan() {
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) {}
    }

    playSuccess() {
        try {
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
        } catch (e) {}
    }

    playShock() {
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    }

    playBadEnding() {
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(65, this.ctx.currentTime + 0.8);
            gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.8);
        } catch (e) {}
    }
}

const sounds = new SoundManager();

// 게임 전체 상태
const gameState = {
    currentLevel: 1,
    currentTimeMinutes: 13 * 60, // 레벨 1: 오후 1시
    maxTimeMinutes: 20 * 60,     // 레벨 1: 저녁 8시
    selectedClue: null,
    selectedSuspect: null,
    cutsceneIndex: 0
};

// 🎬 프롤로그 애니메이션 컷씬 데이터
const cutsceneData = [
    {
        tag: "사건 개요 1 / 4",
        speaker: "사건 현장",
        emoji: "🌲",
        text: "산속에 짙은 안개가 깔리던 날... 마을의 한 어린아이가 흔적도 없이 사라졌습니다."
    },
    {
        tag: "사건 개요 2 / 4",
        speaker: "단서 발견",
        emoji: "🪵",
        text: "수사를 시작한 산 입구에서 누군가 의도적으로 깎아 세워둔 으스스한 나무판 경고장이 발견되었습니다."
    },
    {
        tag: "사건 개요 3 / 4",
        speaker: "강 형사 (선배)",
        emoji: "🚔",
        text: "\"이건 단순한 사고가 아니다! 범인은 분명 이 마을 사람 중 하나야. 시계 바늘이 저녁 8시를 가리키기 전에 꼭 진범을 잡아야 한다!\""
    },
    {
        tag: "사건 개요 4 / 4",
        speaker: "나 (주인공 1인칭)",
        emoji: "🕵️‍♂️",
        text: "\"@@씨가 위험해지기 전, 내 손으로 직접 1인칭 현장 수사를 펼쳐 진짜 범인의 지문과 모순을 밝혀내겠다!\""
    }
];

// 레벨 1 데이터 (산속 나무판 사건)
const level1Data = {
    title: "레벨 1: 산속 나무판 사건",
    icon: "LEVEL 1",
    targetText: "제한 시각: 저녁 8시 전",
    startMinutes: 13 * 60,
    maxMinutes: 20 * 60,
    locations: [
        {
            id: 'mountain',
            icon: '🌲',
            title: '아이가 사라진 산 입구',
            desc: '발자국과 억새풀 자국 1인칭 관찰',
            log: "🕵️‍♂️ [나의 1인칭 현장 관찰]: 내가 산 입구 진흙밭을 유심히 살폈다. 커다란 등산화 자국(270mm)과 나뭇가지 부근에서 미세하게 깎인 삼나무 파편을 발견했다!<br>💬 <b>강 형사:</b> \"좋은 눈썰미다, 신참! 그 삼나무 결을 기억해 둬.\""
        },
        {
            id: 'board',
            icon: '🪵',
            title: '지문이 안 나온 나무판 (경고장)',
            desc: '결정적 증거물 1인칭 감식',
            log: "🕵️‍♂️ [나의 1인칭 정밀 감식]: 나무판을 돋보기로 들여다보았다. 범인이 장갑을 끼고 깎아 눈으로는 지문이 안 보인다. 하지만 산속엔 안 자라는 희귀 삼나무 결이며, 대형 가구용 톱날 자국이 뚜렷하다!<br>💬 <b>한 형사:</b> \"용의자 지문 시약 감식을 준비해 두겠습니다.\""
        }
    ],
    suspects: [
        {
            id: 'carpenter',
            icon: '🪚',
            title: '가구점 사장 박씨',
            desc: '"오후 2시에 삼나무 의자 만듦"',
            log: "🕵️‍♂️ [가구점 사장 박씨 심문]: \"허허, 난 사건 당일 오후 2시에 가게에서 장갑을 끼고 삼나무판을 깎아 의자를 만들었소! 내 장갑 때문에 지문 따위는 안 묻었... 아니, 내 가구점 작업에 시비 걸지 마시오!\""
        },
        {
            id: 'herbalist',
            icon: '🌿',
            title: '약초꾼 이씨',
            desc: '"오후 2시에 산 중턱 약초 채집"',
            log: "🕵️‍♂️ [약초꾼 이씨 심문]: \"오후 2시엔 산 중턱에서 칙뿌리를 파내고 있었습니다. 산 입구 경고판이요? 전 문맹이라 글씨를 쓸 줄도 몰라요.\""
        },
        {
            id: 'hunter',
            icon: '🏹',
            title: '사냥꾼 최씨',
            desc: '"오후 2시에 오두막에서 총 정비"',
            log: "🕵️‍♂️ [사냥꾼 최씨 심문]: \"오후 2시엔 엽총 기름칠을 하며 쉬고 있었소. 난 목재를 다룰 줄도 모르고 톱이나 가구용 도구도 갖고 있지 않소.\""
        }
    ],
    clues: [
        { id: 'wooden_board', title: '지문이 안 나온 나무판(경고장)', desc: '장갑을 껴 지문이 안 보이나 희귀 삼나무 결 및 톱질 흔적 발견!', thumb: '../assets/images/wooden_board_clue.jpg' },
        { id: 'footprint', title: '진흙밭 270mm 발자국', desc: '비 온 뒤 산길에 남아있는 커다란 등산화 자국', emoji: '👟' }
    ],
    correctClue: 'wooden_board',
    correctSuspect: 'carpenter',
    confessionText: "범인 박씨: \"뭐... 뭐라고?! 장갑을 끼고 작업해서 지문 하나 안 남겼는데... 특수 시약으로 복원된 내 미세 지문과 가구점 삼나무 결이 똑같다고?! 빌어먹을... 내가 깎아 만든 경고장이 맞다! 그래, 전부 내가 한 짓이야!\"",
    confessionPortrait: "🪚"
};

// 레벨 2 데이터 (폐가 지하실 배후 사건)
const level2Data = {
    title: "레벨 2: 폐가 지하실 배후 사건",
    icon: "LEVEL 2",
    targetText: "제한 시각: 밤 10시 전",
    startMinutes: 16 * 60, // 오후 4시
    maxMinutes: 22 * 60,   // 밤 10시
    locations: [
        {
            id: 'basement',
            icon: '🏚️',
            title: '폐가 지하실 비밀 금고',
            desc: '어두운 지하실 현장 1인칭 수사',
            log: "🕵️‍♂️ [나의 1인칭 현장 수사]: 내가 조심스럽게 폐가 지하실 낡은 금고를 열었다. 수제 제작 도구와 특수 지문 인쇄 도구가 숨겨져 있다!<br>💬 <b>강 형사:</b> \"박씨 뒤에 진짜 배후 조종자가 따로 있었군! 금고 손잡이 지문을 채취해라!\""
        },
        {
            id: 'ledger',
            icon: '📕',
            title: '비밀 거래 장부',
            desc: '의뢰인 서명과 지문 자국 감식',
            log: "🕵️‍♂️ [나의 1인칭 장부 감식]: 먼지 낀 장부를 훑어보았다. 미술관 관장 정씨의 이름으로 범행 의뢰서와 돈 거래 내역이 적혀있고, 붉은 인장 옆에 엄지 지문이 선명하다!<br>💬 <b>한 형사:</b> \"정 관장의 지문과 99.9% 일치하는지 스캔해 봅시다.\""
        }
    ],
    suspects: [
        {
            id: 'director',
            icon: '🖼️',
            title: '미술관 관장 정씨',
            desc: '"오후 5시에 미술관에서 그림 관람"',
            log: "🕵️‍♂️ [미술관 관장 정씨 심문]: \"어허, 무슨 소리를 하시는 겁니다? 전 사건 시각에 미술관에서 그림을 감상 중이었습니다. 폐가 지하실이나 장부 따위는 나와 아무 상관이 없어요!\""
        },
        {
            id: 'antique',
            icon: '🏺',
            title: '골동품상 윤씨',
            desc: '"오후 5시에 가게 도자기 청소"',
            log: "🕵️‍♂️ [골동품상 윤씨 심문]: \"오후 5시엔 가게에서 옛 도자기 먼지를 털고 있었습니다. 전 장부를 적은 적도 없고 폐가엔 간 적이 없어요.\""
        }
    ],
    clues: [
        { id: 'secret_ledger', title: '비밀 거래 장부 서명 지문', desc: '장부 범행 의뢰서 옆에 찍힌 붉은 인장 엄지 지문 자국', emoji: '📕' },
        { id: 'safe_lock', title: '금고 손잡이 미세 지문', desc: '폐가 지하실 금고 손잡이에서 채취한 미세 손가락 지문', emoji: '🔑' }
    ],
    correctClue: 'secret_ledger',
    correctSuspect: 'director',
    confessionText: "배후 범인 정 관장: \"으윽... 박씨 그 바보 놈이 지하실 장부까지 빼앗겼단 말인가?! 내 엄지손가락 지문이 장부 서명과 99.9% 완벽히 일치한다고?! 젠장... 내 완벽한 계획이 이렇게 망가지다니...!\"",
    confessionPortrait: "🖼️"
};

function getCurrentLevelData() {
    return gameState.currentLevel === 1 ? level1Data : level2Data;
}

// 시계 분 ➔ 한국어 시각 변환
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? '오후' : '오전';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    
    const padHours = String(displayHours).padStart(2, '0');
    const padMinutes = String(minutes).padStart(2, '0');
    return `${period} ${padHours}:${padMinutes}`;
}

// 시간 차감 및 체크
function advanceTime(minutesToConsume = 30) {
    const lvl = getCurrentLevelData();
    gameState.currentTimeMinutes += minutesToConsume;
    sounds.playTick();

    const formatted = formatTime(gameState.currentTimeMinutes);
    document.getElementById('clockText').textContent = formatted;

    if (gameState.currentTimeMinutes >= gameState.maxTimeMinutes) {
        const timeLimitName = gameState.currentLevel === 1 ? "저녁 8시" : "밤 10시";
        triggerBadEnding(`⚠️ 시간 초과 (${timeLimitName} 도착)`, `시계 바늘이 ${timeLimitName}를 가리키며 수사 현장에 짙은 어둠이 들이찼습니다.<br><b>@@씨는 진범의 덫에 걸려 똑같이 비극적인 운명을 맞이하고 말았습니다.</b>`);
        return false;
    }
    return true;
}

// 장면 전환 함수 (즉시 반응형으로 수정)
function switchScene(fromSceneId, toSceneId) {
    document.querySelectorAll('.scene').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    const toScene = document.getElementById(toSceneId);
    if (toScene) {
        toScene.classList.remove('hidden');
        toScene.classList.add('active');
    }
}

// 🎮 시작 버튼 흐름
function startGameFlow() {
    sounds.init();
    sounds.playClick();
    gameState.cutsceneIndex = 0;
    switchScene('titleScreen', 'cutsceneScreen');
    updateCutsceneDisplay();
}

function nextCutsceneFlow() {
    sounds.playClick();
    gameState.cutsceneIndex++;
    if (gameState.cutsceneIndex < cutsceneData.length) {
        updateCutsceneDisplay();
    } else {
        switchScene('cutsceneScreen', 'investigationScreen');
    }
}

function skipCutsceneFlow() {
    sounds.playClick();
    switchScene('cutsceneScreen', 'investigationScreen');
}

// 타자기 효과
function typeWriterEffect(element, text, speed = 30, callback = null) {
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

// 🎬 컷씬 업데이트
function updateCutsceneDisplay() {
    const data = cutsceneData[gameState.cutsceneIndex];
    document.getElementById('cutsceneStepTag').textContent = data.tag;
    document.getElementById('cutsceneSpeakerEmoji').textContent = data.emoji;
    document.getElementById('cutsceneSpeakerName').textContent = data.speaker;

    const cutsceneTextEl = document.getElementById('cutsceneText');
    typeWriterEffect(cutsceneTextEl, data.text, 30);
}

// 수사 UI 초기화 및 레벨 동적 렌더링
function renderInvestigationUI() {
    const lvl = getCurrentLevelData();

    document.getElementById('levelBadgeIcon').textContent = lvl.icon;
    document.getElementById('levelTitleText').textContent = lvl.title;
    document.getElementById('targetStatusText').textContent = lvl.targetText;
    document.getElementById('clockText').textContent = formatTime(gameState.currentTimeMinutes);

    // 배경화면 변경
    const bgLayer = document.querySelector('#investigationScreen .bg-layer');
    if (bgLayer) {
        if (gameState.currentLevel === 1) {
            bgLayer.className = 'bg-layer spooky-bg';
        } else {
            bgLayer.className = 'bg-layer house-bg';
        }
    }

    // 장소 리스트 렌더링
    const locContainer = document.getElementById('locationList');
    locContainer.innerHTML = '';
    lvl.locations.forEach(loc => {
        const btn = document.createElement('button');
        btn.className = 'action-card-btn';
        btn.innerHTML = `
            <span class="card-icon">${loc.icon}</span>
            <div class="card-info">
                <strong>${loc.title}</strong>
                <small>${loc.desc}</small>
            </div>
        `;
        btn.addEventListener('click', () => {
            if (!advanceTime(30)) return;
            addLogToNotebook(loc.log, 'search-log');
        });
        locContainer.appendChild(btn);
    });

    // 용의자 리스트 렌더링
    const susContainer = document.getElementById('suspectList');
    susContainer.innerHTML = '';
    lvl.suspects.forEach(sus => {
        const btn = document.createElement('button');
        btn.className = 'action-card-btn';
        btn.innerHTML = `
            <span class="card-icon">${sus.icon}</span>
            <div class="card-info">
                <strong>${sus.title}</strong>
                <small>${sus.desc}</small>
            </div>
        `;
        btn.addEventListener('click', () => {
            if (!advanceTime(30)) return;
            addLogToNotebook(sus.log, 'interrogate-log');
        });
        susContainer.appendChild(btn);
    });

    // 모순 추리 모달 카드 렌더링
    renderDeductionModalCards();
}

// 모순 추리 카드 동적 생성
function renderDeductionModalCards() {
    const lvl = getCurrentLevelData();

    const clueGroup = document.getElementById('clueGroup');
    clueGroup.innerHTML = '';
    lvl.clues.forEach(c => {
        const div = document.createElement('div');
        div.className = 'select-item';
        div.dataset.clue = c.id;

        let iconHtml = c.thumb ? `<img src="${c.thumb}" class="clue-thumb">` : `<span class="clue-emoji">${c.emoji}</span>`;
        div.innerHTML = `
            ${iconHtml}
            <div class="select-text">
                <strong>${c.title}</strong>
                <p>${c.desc}</p>
            </div>
        `;
        div.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('#clueGroup .select-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            gameState.selectedClue = c.id;
        });
        clueGroup.appendChild(div);
    });

    const suspectGroup = document.getElementById('suspectGroup');
    suspectGroup.innerHTML = '';
    lvl.suspects.forEach(s => {
        const div = document.createElement('div');
        div.className = 'select-item';
        div.dataset.suspect = s.id;

        div.innerHTML = `
            <span class="suspect-emoji">${s.icon}</span>
            <div class="select-text">
                <strong>${s.title}</strong>
                <p>${s.desc}</p>
            </div>
        `;
        div.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('#suspectGroup .select-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            gameState.selectedSuspect = s.id;
        });
        suspectGroup.appendChild(div);
    });
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

// 모순 추리 모달 닫기 / 열기
function openDeductionModal() {
    sounds.init();
    sounds.playClick();
    gameState.selectedClue = null;
    gameState.selectedSuspect = null;
    document.querySelectorAll('.select-item').forEach(el => el.classList.remove('selected'));
    document.getElementById('deductionModal').classList.remove('hidden');
}

function closeDeductionModal() {
    sounds.playClick();
    document.getElementById('deductionModal').classList.add('hidden');
}

// 🔬 지문 대조 정밀 스캐너 실행
function startFingerprintScan(isMatch, onComplete) {
    const modal = document.getElementById('fingerprintModal');
    modal.classList.remove('hidden');

    const fill = document.getElementById('scanFill');
    const text = document.getElementById('scanMatchText');
    const proceedBtn = document.getElementById('proceedConfessionBtn');
    proceedBtn.classList.add('hidden');

    let percent = 0;
    fill.style.width = '0%';
    text.textContent = '지문 대조 분석 중... 0%';

    const timer = setInterval(() => {
        percent += Math.floor(Math.random() * 15 + 10);
        sounds.playScan();

        if (percent >= 100) {
            percent = 100;
            clearInterval(timer);

            if (isMatch) {
                sounds.playSuccess();
                fill.style.width = '100%';
                text.innerHTML = '🚨 <span style="color:#10b981;">지문 99.9% 일치 확인! (진범 확정)</span>';
                proceedBtn.classList.remove('hidden');
                proceedBtn.onclick = () => {
                    modal.classList.add('hidden');
                    if (onComplete) onComplete();
                };
            } else {
                sounds.playShock();
                fill.style.width = '30%';
                text.innerHTML = '❌ <span style="color:#ef4444;">지문 불일치 (0% Match) - 엉뚱한 용의자</span>';
                setTimeout(() => {
                    modal.classList.add('hidden');
                    triggerBadEnding("⚠️ 지문 불일치 및 모순 지목 실패", "용의자의 지문이 증거물 지문과 일치하지 않아 사건에 허점이 생겼습니다...<br><b>@@씨는 진범의 공습을 받아 비극을 맞이했습니다.</b>");
                }, 1500);
            }
        } else {
            fill.style.width = percent + '%';
            text.textContent = `지문 대조 분석 중... ${percent}%`;
        }
    }, 250);
}

// 추리 및 지문 대조 제출
function submitDeduction() {
    if (!gameState.selectedClue || !gameState.selectedSuspect) {
        alert('단서 1개와 용의자 알리바이 1개를 모두 선택해 주세요!');
        return;
    }

    const modal = document.getElementById('deductionModal');
    modal.classList.add('hidden');

    if (!advanceTime(30)) return;

    const lvl = getCurrentLevelData();
    const isMatch = (gameState.selectedClue === lvl.correctClue && gameState.selectedSuspect === lvl.correctSuspect);

    startFingerprintScan(isMatch, () => {
        triggerConfessionScene();
    });
}

// 범인 자백 모달 실행
function triggerConfessionScene() {
    const lvl = getCurrentLevelData();
    const modal = document.getElementById('confessionModal');
    modal.classList.remove('hidden');

    document.getElementById('confessionPortrait').textContent = lvl.confessionPortrait;
    const confessionEl = document.getElementById('confessionText');
    typeWriterEffect(confessionEl, lvl.confessionText, 35);

    const nextBtn = document.getElementById('proceedNextLevelOrEndingBtn');
    nextBtn.onclick = () => {
        modal.classList.add('hidden');
        if (gameState.currentLevel === 1) {
            const clearModal = document.getElementById('levelClearModal');
            clearModal.classList.remove('hidden');
        } else {
            triggerHappyEnding();
        }
    };
}

// 레벨 2 시작 처리
function startLevel2() {
    sounds.playSuccess();
    document.getElementById('levelClearModal').classList.add('hidden');

    gameState.currentLevel = 2;
    gameState.currentTimeMinutes = level2Data.startMinutes;
    gameState.maxTimeMinutes = level2Data.maxMinutes;

    renderInvestigationUI();

    const notebookBody = document.getElementById('notebookBody');
    notebookBody.innerHTML = `
        <div class="log-item detective-log">
            🚨 [레벨 2 수사 개시] 오후 4시 폐가 지하실 수사 개시! 박씨 뒤에 숨은 배후 조종자를 밝혀내세요.
        </div>
    `;
}

// 최종 진엔딩 실행
function triggerHappyEnding() {
    sounds.playSuccess();
    document.getElementById('clearTimeText').textContent = formatTime(gameState.currentTimeMinutes);
    switchScene('investigationScreen', 'happyEndingScreen');
}

// 배드 엔딩 실행
function triggerBadEnding(reasonTitle, storyText) {
    sounds.playBadEnding();
    document.getElementById('deductionModal').classList.add('hidden');
    document.getElementById('fingerprintModal').classList.add('hidden');

    document.getElementById('badEndingReason').textContent = reasonTitle;
    document.getElementById('badEndingStory').innerHTML = storyText;

    switchScene('investigationScreen', 'badEndingScreen');
}

// 게임 리셋
function resetGame() {
    gameState.currentLevel = 1;
    gameState.currentTimeMinutes = level1Data.startMinutes;
    gameState.maxTimeMinutes = level1Data.maxMinutes;
    gameState.selectedClue = null;
    gameState.selectedSuspect = null;
    gameState.cutsceneIndex = 0;

    renderInvestigationUI();

    const notebookBody = document.getElementById('notebookBody');
    notebookBody.innerHTML = `
        <div class="log-item default-log">
            🕵️‍♂️ "내 눈으로 직접 사건 현장을 확인하고 강 형사, 한 형사와 협력하여 지문 모순을 찾아내자."
        </div>
    `;

    switchScene('happyEndingScreen', 'titleScreen');
    switchScene('badEndingScreen', 'titleScreen');
}

// 페이지 로드 완료 시 이벤트 바인딩
window.addEventListener('DOMContentLoaded', () => {
    initSpookyParticles();
    renderInvestigationUI();

    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGameFlow);
    }
});
