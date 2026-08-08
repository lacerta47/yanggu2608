// --------------------------------------------------
// 살인의 미스터리 (v14) - 20단계 대규모 마스터 수사 캠페인
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
    totalLevels: 20,
    currentTimeMinutes: 13 * 60,
    maxTimeMinutes: 20 * 60,
    selectedClue: null,
    selectedSuspect: null,
    cutsceneIndex: 0,
    visitedTargets: new Set()
};

// 🎬 오프닝 프롤로그 컷씬 데이터
const cutsceneData = [
    {
        tag: "마스터 수사 1 / 4",
        speaker: "사건 현장 브리핑",
        emoji: "🌲",
        text: "전국을 뒤흔드는 20단계 거대 범죄 조직의 미스터리 사건 수사가 시작되었습니다."
    },
    {
        tag: "마스터 수사 2 / 4",
        speaker: "수사팀 현장조사",
        emoji: "🪵",
        text: "산속 경고판부터 지하 조직 본부까지 20개 거점에 걸친 범죄 단서와 지문이 포착되었습니다."
    },
    {
        tag: "마스터 수사 3 / 4",
        speaker: "강 형사 (선배)",
        emoji: "🚔",
        text: "\"20단계 거점마다 범인과 조종 배후가 숨어있다. 제한 시각 내에 정밀 지문 대조로 20명의 범인을 모조리 검거해라!\""
    },
    {
        tag: "마스터 수사 4 / 4",
        speaker: "수사팀 결의",
        emoji: "🕵️‍♂️",
        text: "형사 특수수사팀이 20단계 마스터 수사를 개시합니다. @@씨를 구출하고 최후 흑막까지 전부 밝혀내세요!"
    }
];

// 20개 레벨 템플릿 데이터 정의
const levelsDatabase = [
    // Level 1: 산속 나무판 사건
    {
        title: "레벨 1: 산속 나무판 사건",
        icon: "LEVEL 1 / 20", bgClass: "spooky-bg", targetText: "제한 시각: 저녁 8시 전", startMinutes: 13 * 60, maxMinutes: 20 * 60,
        locations: [
            { id: 'l1_1', icon: '🌲', title: '아이가 사라진 산 입구', desc: '발자국 현장조사', log: "🔎 [현장 조사]: 산 입구 진흙밭에서 삼나무 파편과 270mm 발자국이 관찰되었습니다." },
            { id: 'l1_2', icon: '🪵', title: '지문이 안 나온 나무판', desc: '경고판 특수 감식', log: "🔎 [증거 감식]: 장갑을 끼고 깎은 삼나무판에서 가구용 대형 톱 흔적이 수거되었습니다." },
            { id: 'l1_3', icon: '👟', title: '진흙밭 등산화 자국', desc: '신발 분석', log: "🔎 [발자국 감식]: 진흙밭 발자국은 270mm 작업용 등산화입니다." },
            { id: 'l1_4', icon: '🧵', title: '끊어진 새끼줄 수거지', desc: '매듭 분석', log: "🔎 [새끼줄 감식]: 나무 기둥 옆에서 끊어진 굵은 새끼줄 마디가 발견되었습니다." }
        ],
        suspects: [
            { id: 's1_1', icon: '🪚', title: '가구점 사장 박씨', desc: '"삼나무 의자 만듦"', log: "💬 [박씨 심문]: \"난 오후 2시에 가게에서 장갑을 끼고 삼나무 의자를 만들었소!\"" },
            { id: 's1_2', icon: '🌿', title: '약초꾼 이씨', desc: '"산 중턱 약초 채집"', log: "💬 [이씨 심문]: \"오후 2시엔 산 중턱에서 칙뿌리를 파내고 있었습니다.\"" },
            { id: 's1_3', icon: '🏹', title: '사냥꾼 최씨', desc: '"오두막에서 총 정비"', log: "💬 [최씨 심문]: \"오후 2시엔 오두막에서 엽총 기름칠을 하며 쉬고 있었소.\"" },
            { id: 's1_4', icon: '🌾', title: '방앗간 주인 강씨', desc: '"쌀포대 이송 작업"', log: "💬 [강씨 심문]: \"오후 2시엔 방앗간에서 쌀포대를 나르고 있었소.\"" }
        ],
        clues: [
            { id: 'c1_1', title: '지문이 안 나온 나무판', desc: '희귀 삼나무 결 및 가구용 대형 톱질 흔적!', thumb: '../assets/images/wooden_board_clue.jpg' },
            { id: 'c1_2', title: '진흙밭 270mm 발자국', desc: '비 온 뒤 산길의 커다란 등산화 자국', emoji: '👟' },
            { id: 'c1_3', title: '끊어진 굵은 새끼줄', desc: '나무 기둥의 끊어진 마디 자국', emoji: '🧵' },
            { id: 'c1_4', title: '부싯돌 조각', desc: '풀숲에서 발견된 부싯돌', emoji: '🪨' }
        ],
        correctClue: 'c1_1', correctSuspect: 's1_1', confessionPortrait: '🪚',
        confessionText: "범인 박씨: \"으윽... 장갑을 꼈는데 가구점 삼나무 결을 알아챘을 줄이야! 그래, 경고판은 내가 세운 것이 맞소!\""
    },
    // Level 2: 폐가 지하실 사건
    {
        title: "레벨 2: 폐가 지하실 사건",
        icon: "LEVEL 2 / 20", bgClass: "house-bg", targetText: "제한 시각: 밤 10시 전", startMinutes: 16 * 60, maxMinutes: 22 * 60,
        locations: [
            { id: 'l2_1', icon: '🏚️', title: '폐가 지하실 비밀 금고', desc: '낡은 금고 조사', log: "🔎 [현장 조사]: 금고 안에서 특수 안료 푸른 잉크 자국이 수거되었습니다." },
            { id: 'l2_2', icon: '📕', title: '비밀 거래 장부', desc: '의뢰인 서명 감식', log: "🔎 [증거 감식]: 장부 서명 옆 붉은 인장에 엄지 지문이 찍혀 있습니다." },
            { id: 'l2_3', icon: '🧪', title: '특수 푸른 잉크 자국', desc: '안료 분석', log: "🔎 [잉크 감식]: 미술관 특수 고급 안료 잉크로 확인되었습니다." },
            { id: 'l2_4', icon: '🔑', title: '녹슨 철제 열쇠', desc: '열쇠 감식', log: "🔎 [열쇠 감식]: 고풍스러운 지하실 전용 철제 열쇠입니다." }
        ],
        suspects: [
            { id: 's2_1', icon: '🖼️', title: '미술관 관장 정씨', desc: '"미술관 그림 관람"', log: "💬 [정 관장 심문]: \"전 사건 시각에 미술관에서 그림을 관람하고 있었습니다.\"" },
            { id: 's2_2', icon: '🏺', title: '골동품상 윤씨', desc: '"도자기 먼지 청소"', log: "💬 [윤씨 심문]: \"가게에서 옛 도자기 먼지를 털고 있었습니다.\"" },
            { id: 's2_3', icon: '🗝️', title: '전당포 주인 백씨', desc: '"귀금속 장부 정리"', log: "💬 [백씨 심문]: \"가게에서 장부를 정리하고 있었소.\"" },
            { id: 's2_4', icon: '📐', title: '건축업자 서씨', desc: '"건축 도면 검토"', log: "💬 [서씨 심문]: \"사무실에서 보수 도면을 검토하고 있었습니다.\"" }
        ],
        clues: [
            { id: 'c2_1', title: '비밀 거래 장부 서명 지문', desc: '붉은 인장 옆 엄지 지문 자국', emoji: '📕' },
            { id: 'c2_2', title: '금고 손잡이 지문', desc: '지하실 금고 손잡이 지문', emoji: '🔑' },
            { id: 'c2_3', title: '특수 푸른 잉크', desc: '미술관 고급 안료 잉크', emoji: '🧪' },
            { id: 'c2_4', title: '녹슨 철제 열쇠', desc: '지하실 전용 열쇠', emoji: '🗝️' }
        ],
        correctClue: 'c2_1', correctSuspect: 's2_1', confessionPortrait: '🖼️',
        confessionText: "배후 범인 정 관장: \"으윽... 장부 인장 지문이 증거로 남았으니 더 이상 변명하지 않겠다!\""
    },
    // Level 3: 산장 저택 사건
    {
        title: "레벨 3: 산장 저택 사건",
        icon: "LEVEL 3 / 20", bgClass: "mansion-bg", targetText: "제한 시각: 새벽 2시 전", startMinutes: 20 * 60, maxMinutes: 26 * 60,
        locations: [
            { id: 'l3_1', icon: '🏰', title: '산장 대서재', desc: '집무실 비밀 서류', log: "🔎 [현장 조사]: 비밀 서랍에서 최종 지시 서류가 발견되었습니다." },
            { id: 'l3_2', icon: '📜', title: '지장 서명 지문', desc: '의뢰서 검지 지문', log: "🔎 [증거 감식]: 인장 옆에 오른쪽 검지 지문이 남아있습니다." },
            { id: 'l3_3', icon: '⌚', title: '금시계 지문', desc: '회중시계 분석', log: "🔎 [시계 감식]: 회중시계에서 미세 손가락 지문이 수거되었습니다." },
            { id: 'l3_4', icon: '✉️', title: '붉은 협박장', desc: '필적 분석', log: "🔎 [협박장 감식]: 최종 흑막의 지시 협박장입니다." }
        ],
        suspects: [
            { id: 's3_1', icon: '🏰', title: '산장 대표 김 회장', desc: '"서재에서 독서 중"', log: "💬 [김 회장 심문]: \"밤 9시엔 서재에서 독서를 하고 있었소.\"" },
            { id: 's3_2', icon: '💼', title: '비서 한씨', desc: '"서류 정리 중"', log: "💬 [한씨 심문]: \"회장님의 일정표와 서류를 정리했습니다.\"" },
            { id: 's3_3', icon: '✂️', title: '정원사 오씨', desc: '"온실 가위 정비"', log: "💬 [오씨 심문]: \"온실에서 정원 가위를 정비했습니다.\"" },
            { id: 's3_4', icon: '🚘', title: '운전기사 임씨', desc: '"전용차 세차 중"', log: "💬 [임씨 심문]: \"차고에서 전용차를 세차하고 있었습니다.\"" }
        ],
        clues: [
            { id: 'c3_1', title: '비밀 지장 서명 지문', desc: '붉은 인장 검지 지문', emoji: '📜' },
            { id: 'c3_2', title: '금시계 지문 자국', desc: '회중시계 미세 지문', emoji: '⌚' },
            { id: 'c3_3', title: '붉은 협박장', desc: '최종 지시 협박장', emoji: '✉️' },
            { id: 'c3_4', title: '의심스러운 약병', desc: '서재 약병', emoji: '🧪' }
        ],
        correctClue: 'c3_1', correctSuspect: 's3_1', confessionPortrait: '🏰',
        confessionText: "범인 김 회장: \"검지 지장이 증거로 남았으니 죄를 모두 인정하겠소.\""
    }
];

// 레벨 4부터 레벨 20까지 동적 생성기 (총 20개 레벨 완비)
const locationsList = [
    { title: '항구 비밀 창고', icon: '⚓', desc: '선적 화물 정밀 조사' },
    { title: '시계탑 톱니 조작실', icon: '🕰️', desc: '태엽 장치 지문 채취' },
    { title: '폐광산 지하 갱도', icon: '⛏️', desc: '다이너마이트 장치 분석' },
    { title: '안개 호숫가 선착장', icon: '🎣', desc: '보트 손잡이 지문 감식' },
    { title: '오래된 극장 조명실', icon: '🎭', desc: '스위치 안료 및 지문 감식' },
    { title: '약국 밀실 연구실', icon: '🧪', desc: '약병 지문 분석' },
    { title: '도서관 금서 보관소', icon: '📚', desc: '양장본 고서 지문 채취' },
    { title: '심야 열차 특실', icon: '🚆', desc: '열차 승차권 지장 감식' },
    { title: '버려진 공장 기계실', icon: '⚙️', desc: '제어반 기름 지문 감식' },
    { title: '비밀 지하도 통로', icon: '🗝️', desc: '통로 횃대 지문 수거' },
    { title: '고성 탑 꼭대기', icon: '🏰', desc: '망원경 렌즈 지문 감식' },
    { title: '설산 산장 3호실', icon: '🏔️', desc: '스키 장비 지문 수거' },
    { title: '등대 해안 관측소', icon: '🚨', desc: '등대 신호기 지문 감식' },
    { title: '비밀 경매장 창고', icon: '💎', desc: '보석함 손잡이 지문 감식' },
    { title: '카지노 VIP 룸', icon: '🎰', desc: '금고 패드 지문 감식' },
    { title: '오페라 분장실', icon: '🎻', desc: '거울 프레임 지문 수거' },
    { title: '최종 흑막 본부 통제실', icon: '👑', desc: '메인 컴퓨터 지장 스캔' }
];

const suspectRoles = [
    { name: '선장 오씨', icon: '⚓', job: '"배 점검 중"' },
    { name: '시계공 윤씨', icon: '🕰️', job: '"태엽 수리 중"' },
    { name: '광산주 최씨', icon: '⛏️', job: '"채굴 지시 중"' },
    { name: '어부 서씨', icon: '🎣', job: '"그물 정리 중"' },
    { name: '연출가 백씨', icon: '🎭', job: '"무대 점검 중"' },
    { name: '약사 이씨', icon: '🧪', job: '"시약 조제 중"' },
    { name: '사서 강씨', icon: '📚', job: '"책 분류 중"' },
    { name: '차장 차씨', icon: '🚆', job: '"승차권 검표 중"' },
    { name: '엔지니어 류씨', icon: '⚙️', job: '"기계 기름칠 중"' },
    { name: '정보원 하씨', icon: '🗝️', job: '"암호해독 중"' },
    { name: '남작 한씨', icon: '🏰', job: '"영지 관리 중"' },
    { name: '대장 표씨', icon: '🏔️', job: '"순찰 정비 중"' },
    { name: '등대지기 원씨', icon: '🚨', job: '"신호등 점검 중"' },
    { name: '경매사 권씨', icon: '💎', job: '"보석 감정 중"' },
    { name: '딜러 신씨', icon: '🎰', job: '"카드 정비 중"' },
    { name: '지휘자 성씨', icon: '🎻', job: '"악보 검토 중"' },
    { name: '총수 장 회장', icon: '👑', job: '"조직 지시 중"' }
];

// 레벨 4부터 20까지 자동 채우기
for (let lvl = 4; lvl <= 20; lvl++) {
    const idx = lvl - 4;
    const locMeta = locationsList[idx % locationsList.length];
    const susMeta = suspectRoles[idx % suspectRoles.length];

    levelsDatabase.push({
        title: `레벨 ${lvl}: ${locMeta.title} 사건`,
        icon: `LEVEL ${lvl} / 20`,
        bgClass: lvl % 3 === 0 ? "mansion-bg" : (lvl % 2 === 0 ? "house-bg" : "spooky-bg"),
        targetText: `제한 시각: ${lvl % 2 === 0 ? '밤 11시 전' : '새벽 3시 전'}`,
        startMinutes: (14 + (lvl % 5)) * 60,
        maxMinutes: (21 + (lvl % 5)) * 60,
        locations: [
            { id: `l${lvl}_1`, icon: locMeta.icon, title: locMeta.title, desc: locMeta.desc, log: `🔎 [현장 조사]: ${locMeta.title}에서 중요한 지문 흔적이 관찰되었습니다.` },
            { id: `l${lvl}_2`, icon: '📜', title: '범행 증거물 문서', desc: '지무 지장 감식', log: `🔎 [증거 감식]: 의뢰 문서에 엄지 지문이 찍혀 있습니다.` },
            { id: `l${lvl}_3`, icon: '🔍', title: '현장 미세 돋보기 흔적', desc: '안료 분석', log: `🔎 [미세 감식]: 범인의 흔적이 포착되었습니다.` },
            { id: `l${lvl}_4`, icon: '🗝️', title: '열쇠 뭉치 수거지', desc: '금속 분석', log: `🔎 [열쇠 감식]: 범인의 전용 열쇠입니다.` }
        ],
        suspects: [
            { id: `s${lvl}_1`, icon: susMeta.icon, title: susMeta.name, desc: susMeta.job, log: `💬 [${susMeta.name} 심문]: "사건 시각에 난 업무 중이었소!"` },
            { id: `s${lvl}_2`, icon: '👤', title: `용의자 A (${lvl}구역)`, desc: '"알리바이 주장"', log: `💬 [용의자 A 심문]: "전 상관없습니다."` },
            { id: `s${lvl}_3`, icon: '🕵️', title: `용의자 B (${lvl}구역)`, desc: '"현장 부인"', log: `💬 [용의자 B 심문]: "거기 안 갔습니다."` },
            { id: `s${lvl}_4`, icon: '💼', title: `용의자 C (${lvl}구역)`, desc: '"외출 진술"', log: `💬 [용의자 C 심문]: "외출 중이었습니다."` }
        ],
        clues: [
            { id: `c${lvl}_1`, title: `${locMeta.title} 증거 지문`, desc: '현장 증거물 지문', emoji: locMeta.icon },
            { id: `c${lvl}_2`, title: '미세 안료 자국', desc: '특수 성분 안료', emoji: '🧪' },
            { id: `c${lvl}_3`, title: '현장 신발 자국', desc: '작업화 흔적', emoji: '👟' },
            { id: `c${lvl}_4`, title: '끊어진 열쇠고리', desc: '금속 고리', emoji: '🔑' }
        ],
        correctClue: `c${lvl}_1`,
        correctSuspect: `s${lvl}_1`,
        confessionPortrait: susMeta.icon,
        confessionText: `범인 ${susMeta.name}: "내 지문이 남아있을 줄이야... 레벨 ${lvl} 범행을 인정하겠소!"`
    });
}

function getCurrentLevelData() {
    return levelsDatabase[gameState.currentLevel - 1] || levelsDatabase[0];
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
        triggerBadEnding(`⚠️ 시간 초과 (제한 시각 도착)`, `시계 바늘이 제한 시각을 가리키며 수사 현장에 짙은 어둠이 들이찼습니다.<br><b>@@씨는 진범의 덫에 걸려 똑같이 비극적인 운명을 맞이하고 말았습니다.</b>`);
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

// 타자기 효과 (타이머 충돌 차단)
function typeWriterEffect(element, text, speed = 30, callback = null) {
    if (!element) return;

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

// 수사 UI 초기화 및 레벨 동적 렌더링 (20단계 진행바 연동)
function renderInvestigationUI() {
    const lvl = getCurrentLevelData();

    document.getElementById('levelBadgeIcon').textContent = lvl.icon;
    document.getElementById('levelTitleText').textContent = lvl.title;
    document.getElementById('targetStatusText').textContent = lvl.targetText;
    document.getElementById('clockText').textContent = formatTime(gameState.currentTimeMinutes);

    // 20단계 진행바 업데이트
    const progressPercent = Math.round((gameState.currentLevel / gameState.totalLevels) * 100);
    const progressFill = document.getElementById('levelProgressFill');
    const progressText = document.getElementById('levelProgressText');
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `캠페인 진행률: ${progressPercent}% (${gameState.currentLevel} / ${gameState.totalLevels} 레벨)`;

    // 배경화면 변경
    const bgLayer = document.querySelector('#investigationScreen .bg-layer');
    if (bgLayer) {
        bgLayer.className = `bg-layer ${lvl.bgClass}`;
    }

    // 장소 리스트 렌더링
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

    // 용의자 리스트 렌더링
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

// 범인 자백 후 바로 다음 레벨로 직행! (20레벨까지 서포트)
function triggerConfessionScene() {
    const lvl = getCurrentLevelData();
    const modal = document.getElementById('confessionModal');
    modal.classList.remove('hidden');

    document.getElementById('confessionPortrait').textContent = lvl.confessionPortrait;
    const confessionEl = document.getElementById('confessionText');
    typeWriterEffect(confessionEl, lvl.confessionText, 35);

    const nextBtn = document.getElementById('proceedNextLevelOrEndingBtn');
    if (gameState.currentLevel < gameState.totalLevels) {
        nextBtn.textContent = `🔥 바로 레벨 ${gameState.currentLevel + 1} 수사로 이동 ➔`;
    } else {
        nextBtn.textContent = `🏆 20단계 사건 완전 종결 (마스터 진엔딩) ➔`;
    }

    nextBtn.onclick = () => {
        modal.classList.add('hidden');
        if (gameState.currentLevel < gameState.totalLevels) {
            startNextLevelDirect();
        } else {
            triggerHappyEnding();
        }
    };
}

// 다음 레벨 즉시 시작 처리 (20레벨 연동)
function startNextLevelDirect() {
    sounds.playSuccess();

    gameState.currentLevel++;
    gameState.visitedTargets.clear();

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

// 최종 20단계 마스터 진엔딩 실행
function triggerHappyEnding() {
    sounds.playSuccess();
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
    const lvl = getCurrentLevelData();
    gameState.currentTimeMinutes = lvl.startMinutes;
    gameState.maxTimeMinutes = lvl.maxMinutes;
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
