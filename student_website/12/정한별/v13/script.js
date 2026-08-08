// --------------------------------------------------
// 살인의 미스터리 (v13) - 3단계 캠페인 & 4인 용의자 지문 수사 로직
// --------------------------------------------------

// Web Audio API 효과음 관리자
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
    cutsceneIndex: 0,
    visitedTargets: new Set()
};

// 🎬 오프닝 프롤로그 컷씬 데이터
const cutsceneData = [
    {
        tag: "사건 브리핑 1 / 4",
        speaker: "사건 현장 브리핑",
        emoji: "🌲",
        text: "산속에 짙은 안개가 깔리던 날... 마을의 어린아이가 흔적도 없이 사라진 미제 사건이 발생했습니다."
    },
    {
        tag: "사건 브리핑 2 / 4",
        speaker: "수사팀 현장조사",
        emoji: "🪵",
        text: "수사를 시작한 산 입구에서 누군가 의도적으로 깎아 세워둔 으스스한 나무판 경고장이 발견되었습니다."
    },
    {
        tag: "사건 브리핑 3 / 4",
        speaker: "강 형사 (선배)",
        emoji: "🚔",
        text: "\"이건 단순한 사고가 아니다! 범인은 분명 마을 용의자 4명 중 하나야. 제한 시간이 지나기 전에 진범을 잡아야 한다!\""
    },
    {
        tag: "사건 브리핑 4 / 4",
        speaker: "수사팀 결의",
        emoji: "🕵️‍♂️",
        text: "형사 특수수사팀이 수사를 개시합니다. 용의자 4명의 진술 모순과 증거물의 지문을 정밀 스캔하여 @@씨를 구출하세요!"
    }
];

// 레벨 1 데이터 (산속 나무판 사건)
const level1Data = {
    title: "레벨 1: 산속 나무판 사건",
    icon: "LEVEL 1",
    bgClass: "spooky-bg",
    targetText: "제한 시각: 저녁 8시 전",
    startMinutes: 13 * 60,
    maxMinutes: 20 * 60,
    locations: [
        {
            id: 'mountain',
            icon: '🌲',
            title: '아이가 사라진 산 입구',
            desc: '발자국과 억새풀 자국 정밀 현장조사',
            log: "🔎 [현장 조사 결과]: 산 입구 진흙밭에서 커다란 등산화 자국(270mm)과 억새풀 흔적을 관찰했습니다. 나뭇가지 부근에서 미세하게 깎인 삼나무 파편이 수거되었습니다.<br>💬 <b>강 형사:</b> \"삼나무 파편이 중요한 열쇠다. 결을 잘 기록해 둬!\""
        },
        {
            id: 'board',
            icon: '🪵',
            title: '지문이 안 나온 나무판 (경고장)',
            desc: '결정적 증거물 특수 감식',
            log: "🔎 [증거 감식 결과]: 나무판 감식 결과 장갑을 끼고 제작되어 지문이 안 보이나, 산속에서 안 자라는 희귀 삼나무이며 가구용 대형 톱날 흔적이 또렷합니다.<br>💬 <b>한 형사:</b> \"특수 시약 감식으로 지문 복원을 진행합니다.\""
        },
        {
            id: 'footprint_loc',
            icon: '👟',
            title: '진흙밭 등산화 자국',
            desc: '신발 크기 및 진흙 분석',
            log: "🔎 [발자국 감식 결과]: 진흙밭 발자국은 270mm 크기의 작업용 등산화로 확인되었습니다."
        },
        {
            id: 'rope_loc',
            icon: '🧵',
            title: '끊어진 새끼줄 수거지',
            desc: '매듭 자국과 섬유 분석',
            log: "🔎 [새끼줄 감식 결과]: 나무 기둥 옆에서 끊어진 굵은 새끼줄 마디가 발견되었습니다."
        }
    ],
    suspects: [
        {
            id: 'carpenter',
            icon: '🪚',
            title: '가구점 사장 박씨',
            desc: '"오후 2시에 삼나무 의자 만듦"',
            log: "💬 [가구점 사장 박씨 심문]: \"허허, 난 사건 당일 오후 2시에 가게에서 장갑을 끼고 삼나무판을 깎아 의자를 만들었소! 내 가구점 작업에 시비 걸지 마시오!\""
        },
        {
            id: 'herbalist',
            icon: '🌿',
            title: '약초꾼 이씨',
            desc: '"오후 2시에 산 중턱 약초 채집"',
            log: "💬 [약초꾼 이씨 심문]: \"오후 2시엔 산 중턱에서 칙뿌리를 파내고 있었습니다. 산 입구 경고판은 본 적도 없어요.\""
        },
        {
            id: 'hunter',
            icon: '🏹',
            title: '사냥꾼 최씨',
            desc: '"오후 2시에 오두막에서 총 정비"',
            log: "💬 [사냥꾼 최씨 심문]: \"오후 2시엔 산기슭 오두막에서 엽총 기름칠을 하며 쉬고 있었소. 난 가구용 톱이나 도구가 없소.\""
        },
        {
            id: 'miller',
            icon: '🌾',
            title: '방앗간 주인 강씨',
            desc: '"오후 2시에 쌀포대 이송 작업"',
            log: "💬 [방앗간 주인 강씨 심문]: \"오후 2시엔 방앗간에서 쌀포대를 나르고 있었소. 거친 포대를 만지느라 손이 얼얼하오.\""
        }
    ],
    clues: [
        { id: 'wooden_board', title: '지문이 안 나온 나무판(경고장)', desc: '희귀 삼나무 결 및 가구용 대형 톱질 흔적 발견!', thumb: '../assets/images/wooden_board_clue.jpg' },
        { id: 'footprint', title: '진흙밭 270mm 발자국', desc: '비 온 뒤 산길에 남아있는 커다란 등산화 자국', emoji: '👟' },
        { id: 'rope_piece', title: '끊어진 굵은 새끼줄', desc: '나무 기둥에서 끊어진 마디 자국', emoji: '🧵' },
        { id: 'flint_stone', title: '부싯돌 조각', desc: '풀숲에서 발견된 불피우기용 부싯돌', emoji: '🪨' }
    ],
    correctClue: 'wooden_board',
    correctSuspect: 'carpenter',
    // 중복 문구 전면 제거 및 단정한 자백 대사로 수정!
    confessionText: "범인 박씨: \"으윽... 장갑까지 끼고 작업했는데 희귀 삼나무 결을 알아챘을 줄이야! 그래, 내가 경고판을 깎아 산 입구에 세워둔 범인이 맞소!\"",
    confessionPortrait: "🪚",
    clearStory: "지문 감식으로 박씨가 진범임을 밝혀내고 체포하였습니다!<br>하지만 박씨의 주머니에서 <b>'폐가 지하실 비밀 거래 장부'</b>가 발견되었습니다.<br><b>\"강 형사: '배후 조종자를 찾으러 폐가 지하실로 이동한다!'\"</b>"
};

// 레벨 2 데이터 (폐가 지하실 사건)
const level2Data = {
    title: "레벨 2: 폐가 지하실 사건",
    icon: "LEVEL 2",
    bgClass: "house-bg",
    targetText: "제한 시각: 밤 10시 전",
    startMinutes: 16 * 60,
    maxMinutes: 22 * 60,
    locations: [
        {
            id: 'basement',
            icon: '🏚️',
            title: '폐가 지하실 비밀 금고',
            desc: '어두운 지하실 낡은 금고 조사',
            log: "🔎 [현장 조사 결과]: 폐가 지하실 낡은 금고 안에서 특수 제작 도구와 인쇄용 푸른 잉크 자국이 수거되었습니다.<br>💬 <b>강 형사:</b> \"금고 손잡이 지문을 채취해라!\""
        },
        {
            id: 'ledger',
            icon: '📕',
            title: '비밀 거래 장부',
            desc: '의뢰인 서명과 지문 자국 감식',
            log: "🔎 [증거 감식 결과]: 먼지 낀 장부 속 범행 의뢰서에 미술관 관장 정씨의 서명과 인장 옆 엄지 지문이 남아있습니다.<br>💬 <b>한 형사:</b> \"정 관장의 지문과 일치하는지 스캔해 봅시다.\""
        },
        {
            id: 'blue_ink_loc',
            icon: '🧪',
            title: '특수 푸른 잉크 자국',
            desc: '지하실 책상 잉크 얼룩 분석',
            log: "🔎 [잉크 감식 결과]: 미술관 고급 안료에만 사용되는 특수 푸른 잉크 성분임이 밝혀졌습니다."
        },
        {
            id: 'rusty_key_loc',
            icon: '🔑',
            title: '지하실 녹슨 철제 열쇠',
            desc: '금고 및 열쇠 고리 감식',
            log: "🔎 [열쇠 감식 결과]: 지하실 문을 여는 고풍스러운 녹슨 철제 열쇠입니다."
        }
    ],
    suspects: [
        {
            id: 'director',
            icon: '🖼️',
            title: '미술관 관장 정씨',
            desc: '"오후 5시에 미술관에서 그림 관람"',
            log: "💬 [미술관 관장 정씨 심문]: \"전 사건 시각에 미술관에서 그림을 감상 중이었습니다. 폐가 지하실이나 장부 따위는 나와 아무 상관이 없어요!\""
        },
        {
            id: 'antique',
            icon: '🏺',
            title: '골동품상 윤씨',
            desc: '"오후 5시에 가게 도자기 청소"',
            log: "💬 [골동품상 윤씨 심문]: \"오후 5시엔 가게에서 옛 도자기 먼지를 털고 있었습니다. 폐가엔 간 적이 없어요.\""
        },
        {
            id: 'pawn',
            icon: '🗝️',
            title: '전당포 주인 백씨',
            desc: '"오후 5시에 귀금속 장부 정리"',
            log: "💬 [전당포 주인 백씨 심문]: \"오후 5시엔 가게에서 귀금속을 감정하고 장부를 정리하고 있었소.\""
        },
        {
            id: 'builder',
            icon: '📐',
            title: '건축업자 서씨',
            desc: '"오후 5시에 건축 도면 검토"',
            log: "💬 [건축업자 서씨 심문]: \"오후 5시엔 사무실에서 건물 보수 도면을 검토하고 있었습니다.\""
        }
    ],
    clues: [
        { id: 'secret_ledger', title: '비밀 거래 장부 서명 지문', desc: '장부 범행 의뢰서 옆에 찍힌 붉은 인장 엄지 지문 자국', emoji: '📕' },
        { id: 'safe_lock', title: '금고 손잡이 미세 지문', desc: '폐가 지하실 금고 손잡이에서 채취한 미세 손가락 지문', emoji: '🔑' },
        { id: 'blue_ink_stain', title: '특수 푸른 잉크 안료', desc: '미술관용 특수 고급 안료 성분 잉크', emoji: '🧪' },
        { id: 'rusty_key', title: '녹슨 철제 열쇠', desc: '고풍스러운 지하실 전용 열쇠', emoji: '🗝️' }
    ],
    correctClue: 'secret_ledger',
    correctSuspect: 'director',
    confessionText: "배후 범인 정 관장: \"박씨 놈이 실패할 줄은 몰랐군... 장부 서명 지문이 남았으니 더 이상 변명하지 않겠다. 하지만 나 역시 최종 흑막이 아니다!\"",
    confessionPortrait: "🖼️",
    clearStory: "정 관장의 자백으로 2차 배후를 체포하였습니다!<br>정 관장의 서재에서 <b>'산장 저택 김 회장의 붉은 협박장'</b>이 발견되었습니다.<br><b>\"강 형사: '마지막 3단계! 산장 저택 김 회장을 조사하러 간다!'\"</b>"
};

// 레벨 3 데이터 (최종 산장 저택 흑막 사건)
const level3Data = {
    title: "레벨 3: 최종 산장 저택 흑막 사건",
    icon: "LEVEL 3",
    bgClass: "mansion-bg",
    targetText: "제한 시각: 새벽 2시 전",
    startMinutes: 20 * 60,
    maxMinutes: 26 * 60,
    locations: [
        {
            id: 'mansion_study',
            icon: '🏰',
            title: '산장 저택 대서재',
            desc: '김 회장의 집무실 및 비밀 서류 조사',
            log: "🔎 [현장 조사 결과]: 김 회장의 대서재 비밀 서랍에서 사건 관련 최종 지시 서류와 붉은 인장이 발견되었습니다.<br>💬 <b>강 형사:</b> \"마지막 범인이다! 인장 옆 지문을 감식해라!\""
        },
        {
            id: 'master_seal_loc',
            icon: '📜',
            title: '비밀 산장 지장 서명 지문',
            desc: '최종 흑막 의뢰서 지장 자국 감식',
            log: "🔎 [증거 감식 결과]: 붉은 인장 옆에 선명한 오른손 검지 지문이 찍혀있습니다."
        },
        {
            id: 'watch_loc',
            icon: '⌚',
            title: '금시계 지문 자국',
            desc: '책상 위 고급 회중시계 분석',
            log: "🔎 [시계 감식 결과]: 김 회장의 전용 회중시계에서 미세 손가락 자국이 발견되었습니다."
        },
        {
            id: 'letter_loc',
            icon: '✉️',
            title: '붉은 협박장 원본',
            desc: '필적 및 잉크 성분 분석',
            log: "🔎 [협박장 감식 결과]: 최종 흑막이 적어 보낸 협박장 원본이 확인되었습니다."
        }
    ],
    suspects: [
        {
            id: 'chairman',
            icon: '🏰',
            title: '산장 대표 김 회장',
            desc: '"밤 9시엔 서재에서 독서 중"',
            log: "💬 [산장 대표 김 회장 심문]: \"어허! 경찰들이 감히 내 산장에 난입하다니! 밤 9시엔 서재에서 독서를 하고 있었소. 난 범행과 상관없소!\""
        },
        {
            id: 'secretary',
            icon: '💼',
            title: '비서 한씨',
            desc: '"밤 9시엔 서류 정리 중"',
            log: "💬 [비서 한씨 심문]: \"밤 9시엔 회장님의 일정표와 서류를 정리하고 있었습니다. 전 경고판이나 범행에 관여한 적 없습니다.\""
        },
        {
            id: 'gardener',
            icon: '✂️',
            title: '정원사 오씨',
            desc: '"밤 9시엔 온실 가위 정비"',
            log: "💬 [정원사 오씨 심문]: \"밤 9시엔 온실에서 정원 가위를 정비하고 있었습니다.\""
        },
        {
            id: 'driver',
            icon: '🚘',
            title: '운전기사 임씨',
            desc: '"밤 9시엔 전용차 세차 중"',
            log: "💬 [운전기사 임씨 심문]: \"밤 9시엔 차고에서 회장님 전용차를 세차하고 있었습니다.\""
        }
    ],
    clues: [
        { id: 'master_seal', title: '비밀 산장 지장 서명 지문', desc: '최종 흑막 의뢰서 옆에 찍힌 붉은 인장 검지 지문', emoji: '📜' },
        { id: 'gold_watch', title: '금시계 지문 자국', desc: '회장실 책상 위 고급 금시계 지문', emoji: '⌚' },
        { id: 'threat_letter', title: '붉은 협박장 원본', desc: '최종 지시 내용이 담긴 협박장', emoji: '✉️' },
        { id: 'poison_vial', title: '의심스러운 약병', desc: '서재 구석에서 발견된 특수 약병', emoji: '🧪' }
    ],
    correctClue: 'master_seal',
    correctSuspect: 'chairman',
    confessionText: "최종 범인 김 회장: \"평생 숨겨온 비밀이 결국 밝혀지는구려... 지장 지문이 증거로 남았으니 내 모든 죄를 인정하겠소.\"",
    confessionPortrait: "🏰",
    clearStory: "최종 배후 김 회장의 자백으로 3단계 거대 사건이 완벽하게 해결되었습니다!"
};

function getCurrentLevelData() {
    if (gameState.currentLevel === 1) return level1Data;
    if (gameState.currentLevel === 2) return level2Data;
    return level3Data;
}

// 시계 분 ➔ 한국어 시각 변환
function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const period = (hours >= 12 && hours < 24) ? '오후' : (hours >= 0 && hours < 6 ? '새벽' : '오전');
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
        let timeLimitName = "제한 시간";
        if (gameState.currentLevel === 1) timeLimitName = "저녁 8시";
        else if (gameState.currentLevel === 2) timeLimitName = "밤 10시";
        else timeLimitName = "새벽 2시";

        triggerBadEnding(`⚠️ 시간 초과 (${timeLimitName} 도착)`, `시계 바늘이 ${timeLimitName}를 가리키며 수사 현장에 짙은 어둠이 들이찼습니다.<br><b>@@씨는 진범의 덫에 걸려 똑같이 비극적인 운명을 맞이하고 말았습니다.</b>`);
        return false;
    }
    return true;
}

// 장면 전환 함수
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

// 타자기 효과 (글자 중복 입력 방지 타이머 정돈)
function typeWriterEffect(element, text, speed = 30, callback = null) {
    if (!element) return;

    // 이전에 돌아가던 타자기 타이머가 있으면 깨끗하게 멈춤!
    if (element._typeWriterTimer) {
        clearInterval(element._typeWriterTimer);
        element._typeWriterTimer = null;
    }

    element.textContent = '';
    let i = 0;
    element._typeWriterTimer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(element._typeWriterTimer);
            element._typeWriterTimer = null;
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
        bgLayer.className = `bg-layer ${lvl.bgClass}`;
    }

    // 장소 리스트 렌더링 (4개 장소)
    const locContainer = document.getElementById('locationList');
    locContainer.innerHTML = '';
    lvl.locations.forEach(loc => {
        const btn = document.createElement('button');
        const isVisited = gameState.visitedTargets.has(loc.id);
        btn.className = `action-card-btn ${isVisited ? 'completed' : ''}`;
        btn.innerHTML = `
            <span class="card-icon">${loc.icon}</span>
            <div class="card-info">
                <strong>${loc.title}</strong>
                <small>${loc.desc}</small>
            </div>
        `;
        btn.addEventListener('click', () => {
            if (gameState.visitedTargets.has(loc.id)) {
                sounds.playClick();
                alert(`[${loc.title}] 이미 수사를 완료하고 단서를 파악했습니다. 다른 장소나 용의자를 수사하세요!`);
                return;
            }
            if (!advanceTime(30)) return;
            gameState.visitedTargets.add(loc.id);
            btn.classList.add('completed');
            addLogToNotebook(loc.log, 'search-log');
        });
        locContainer.appendChild(btn);
    });

    // 용의자 리스트 렌더링 (4명 용의자)
    const susContainer = document.getElementById('suspectList');
    susContainer.innerHTML = '';
    lvl.suspects.forEach(sus => {
        const btn = document.createElement('button');
        const isVisited = gameState.visitedTargets.has(sus.id);
        btn.className = `action-card-btn ${isVisited ? 'completed' : ''}`;
        btn.innerHTML = `
            <span class="card-icon">${sus.icon}</span>
            <div class="card-info">
                <strong>${sus.title}</strong>
                <small>${sus.desc}</small>
            </div>
        `;
        btn.addEventListener('click', () => {
            if (gameState.visitedTargets.has(sus.id)) {
                sounds.playClick();
                alert(`[${sus.title}] 이미 심문을 마치고 진술을 확보했습니다. 다른 대상을 수사하세요!`);
                return;
            }
            if (!advanceTime(30)) return;
            gameState.visitedTargets.add(sus.id);
            btn.classList.add('completed');
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
                text.innerHTML = '🚨 <span style="color:#10b981;">지문 감식 결과: 진범 확인!</span>';
                proceedBtn.classList.remove('hidden');
                proceedBtn.onclick = () => {
                    modal.classList.add('hidden');
                    if (onComplete) onComplete();
                };
            } else {
                sounds.playShock();
                fill.style.width = '25%';
                text.innerHTML = '❌ <span style="color:#ef4444;">지문 불일치 - 엉뚱한 용의자</span>';
                setTimeout(() => {
                    modal.classList.add('hidden');
                    triggerBadEnding("⚠️ 지문 불일치 및 모순 지목 실패", "용의자의 지문이 증거물 지문과 일치하지 않아 사건 수사에 빈틈이 생겼습니다...<br><b>@@씨는 진범의 습격을 받아 비극을 맞이했습니다.</b>");
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

// 범인 자백 후 바로 다음 레벨로 직행!
function triggerConfessionScene() {
    const lvl = getCurrentLevelData();
    const modal = document.getElementById('confessionModal');
    modal.classList.remove('hidden');

    document.getElementById('confessionPortrait').textContent = lvl.confessionPortrait;
    const confessionEl = document.getElementById('confessionText');
    typeWriterEffect(confessionEl, lvl.confessionText, 35);

    const nextBtn = document.getElementById('proceedNextLevelOrEndingBtn');
    if (gameState.currentLevel < 3) {
        nextBtn.textContent = `🔥 바로 레벨 ${gameState.currentLevel + 1} 수사로 이동 ➔`;
    } else {
        nextBtn.textContent = `🏆 사건 완전 종결 (최종 진엔딩) ➔`;
    }

    nextBtn.onclick = () => {
        modal.classList.add('hidden');
        if (gameState.currentLevel < 3) {
            // intermediate 모달 없이 바로 다음 레벨로 직행!
            startNextLevelDirect();
        } else {
            triggerHappyEnding();
        }
    };
}

// 다음 레벨 즉시 시작 처리 (레벨 1 ➔ 2 ➔ 3)
function startNextLevelDirect() {
    sounds.playSuccess();

    gameState.currentLevel++;
    gameState.visitedTargets.clear(); // 레벨 전환 시 조사 대상 초기화

    const lvl = getCurrentLevelData();
    gameState.currentTimeMinutes = lvl.startMinutes;
    gameState.maxTimeMinutes = lvl.maxMinutes;

    renderInvestigationUI();

    const notebookBody = document.getElementById('notebookBody');
    notebookBody.innerHTML = `
        <div class="log-item interrogate-log">
            🚨 [레벨 ${gameState.currentLevel} 즉시 개시] ${lvl.title} 시작! 범인을 체포하고 다음 배후 수사에 착수합니다.
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
    gameState.visitedTargets.clear();

    renderInvestigationUI();

    const notebookBody = document.getElementById('notebookBody');
    notebookBody.innerHTML = `
        <div class="log-item default-log">
            🕵️‍♂️ "현장을 정밀 조사하고 용의자 4명의 진술 모순을 찾아 지문 대조를 진행하세요."
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
