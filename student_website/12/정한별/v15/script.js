// --------------------------------------------------
// 살인의 미스터리 (v15) - 20단계 랜덤 진범 & 추리 다채화 마스터
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
        text: "전국 20개 거점에 숨어있는 거대 범죄 조직의 미스터리 수사가 개시되었습니다."
    },
    {
        tag: "마스터 수사 2 / 4",
        speaker: "수사팀 현장조사",
        emoji: "🪵",
        text: "범인은 4명의 용의자 중 매번 다른 사람이 진범으로 숨어있습니다. 정밀 단서를 찾으세요!"
    },
    {
        tag: "마스터 수사 3 / 4",
        speaker: "강 형사 (선배)",
        emoji: "🚔",
        text: "\"용의자 4명의 진술 모순과 증거 지문을 비교해라. 뻔하게 1번째 용의자만 범인인 것은 절대 아니다!\""
    },
    {
        tag: "마스터 수사 4 / 4",
        speaker: "수사팀 결의",
        emoji: "🕵️‍♂️",
        text: "형사 특수수사팀이 20단계 수사를 개시합니다. 진범을 지목하고 99.9% 지문 대조로 검거하세요!"
    }
];

// 20개 레벨 데이터 베이스 (다채로운 대사 & 4명 중 범인 위치 가변 배치!)
const rawLevelsDatabase = [
    // Level 1: 산속 나무판 사건 (범인: 1번째 박씨)
    {
        title: "레벨 1: 산속 나무판 사건", icon: "LEVEL 1 / 20", bgClass: "spooky-bg", targetText: "제한 시각: 저녁 8시 전", startMinutes: 13 * 60, maxMinutes: 20 * 60,
        locations: [
            { id: 'l1_1', icon: '🌲', title: '아이가 사라진 산 입구', desc: '발자국 현장조사', log: "🔎 [현장 조사]: 산 입구 진흙밭에서 삼나무 파편과 270mm 작업화 발자국이 발견되었습니다." },
            { id: 'l1_2', icon: '🪵', title: '지문이 안 나온 나무판', desc: '경고판 특수 감식', log: "🔎 [증거 감식]: 장갑을 끼고 깎은 삼나무판에서 가구용 대형 톱날 흔적이 수거되었습니다." },
            { id: 'l1_3', icon: '👟', title: '진흙밭 등산화 자국', desc: '신발 분석', log: "🔎 [발자국 감식]: 진흙밭 발자국은 270mm 가구점 작업화입니다." },
            { id: 'l1_4', icon: '🧵', title: '끊어진 새끼줄 수거지', desc: '매듭 분석', log: "🔎 [새끼줄 감식]: 나무 기둥 옆에서 끊어진 굵은 새끼줄 마디가 발견되었습니다." }
        ],
        suspects: [
            { id: 's1_1', icon: '🪚', title: '가구점 사장 박씨', desc: '"삼나무 의자 만드는 중"', log: "💬 [가구점 사장 박씨]: \"오후 2시에 삼나무판을 깎아 의자를 만들었소! 내 톱이나 작업에 시비 걸지 마시오!\"" },
            { id: 's1_2', icon: '🌿', title: '약초꾼 이씨', desc: '"산 중턱 약초 파내는 중"', log: "💬 [약초꾼 이씨]: \"오후 2시엔 산 중턱에서 칙뿌리를 파내고 있었습니다. 글씨도 몰라요.\"" },
            { id: 's1_3', icon: '🏹', title: '사냥꾼 최씨', desc: '"오두막 총 기름칠 중"', log: "💬 [사냥꾼 최씨]: \"오후 2시엔 오두막에서 엽총 기름칠을 하고 있었소. 난 가구 도구가 없소.\"" },
            { id: 's1_4', icon: '🌾', title: '방앗간 주인 강씨', desc: '"방앗간 쌀포대 운반"', log: "💬 [방앗간 주인 강씨]: \"오후 2시엔 방앗간에서 쌀포대를 나르고 있었소.\"" }
        ],
        clues: [
            { id: 'c1_1', title: '지문이 안 나온 삼나무판', desc: '희귀 삼나무 결 및 가구용 대형 톱질 흔적', thumb: '../assets/images/wooden_board_clue.jpg' },
            { id: 'c1_2', title: '진흙밭 270mm 발자국', desc: '비 온 뒤 산길 작업화 자국', emoji: '👟' },
            { id: 'c1_3', title: '끊어진 새끼줄 마디', desc: '나무 기둥 마디 자국', emoji: '🧵' },
            { id: 'c1_4', title: '부싯돌 조각', desc: '풀숲 부싯돌 조각', emoji: '🪨' }
        ],
        correctClueIdx: 0, correctSuspectIdx: 0, confessionPortrait: '🪚',
        confessionText: "범인 박씨: \"으윽... 장갑을 꼈는데 가구점 삼나무 결을 알아챘을 줄이야! 경고판은 내가 깎은 것이 맞소!\""
    },
    // Level 2: 폐가 지하실 사건 (범인: 2번째 골동품상 윤씨!)
    {
        title: "레벨 2: 폐가 지하실 사건", icon: "LEVEL 2 / 20", bgClass: "house-bg", targetText: "제한 시각: 밤 10시 전", startMinutes: 16 * 60, maxMinutes: 22 * 60,
        locations: [
            { id: 'l2_1', icon: '🏚️', title: '폐가 지하실 금고', desc: '낡은 금고 조사', log: "🔎 [현장 조사]: 금고 손잡이에서 골동품 청소용 광택 안료 지문이 발견되었습니다." },
            { id: 'l2_2', icon: '🏺', title: '골동품 수거함 청소건', desc: '안료 잉크 분석', log: "🔎 [증거 감식]: 골동품 닦기용 붉은 안료 시약 지문이 감식되었습니다." },
            { id: 'l2_3', icon: '📕', title: '장부 수거용 의뢰서', desc: '서명 및 지문', log: "🔎 [장부 감식]: 의뢰서 옆 인장에 윤씨의 오른쪽 엄지 지문이 남아있습니다." },
            { id: 'l2_4', icon: '🔑', title: '녹슨 철제 열쇠', desc: '열쇠 분석', log: "🔎 [열쇠 감식]: 고풍스러운 지하실 열쇠입니다." }
        ],
        suspects: [
            { id: 's2_1', icon: '🖼️', title: '미술관 관장 정씨', desc: '"전시관 그림 관람 중"', log: "💬 [미술관 정 관장]: \"전 전시관에서 수집품을 관람하고 있었어요. 지하실 장부 따위 몰라요!\"" },
            { id: 's2_2', icon: '🏺', title: '골동품상 윤씨', desc: '"골동품 광택 안료 작업"', log: "💬 [골동품상 윤씨]: \"오후 5시엔 가게에서 붉은 광택 안료를 손으로 닦으며 도자기를 정리했소!\"" },
            { id: 's2_3', icon: '🗝️', title: '전당포 주인 백씨', desc: '"귀금속 장부 정리"', log: "💬 [전당포 백씨]: \"오후 5시엔 귀금속 장부를 정리하고 있었습니다.\"" },
            { id: 's2_4', icon: '📐', title: '건축업자 서씨', desc: '"건물 보수 도면 검토"', log: "💬 [건축업자 서씨]: \"사무실에서 건물 도면을 보고 있었습니다.\"" }
        ],
        clues: [
            { id: 'c2_1', title: '미술관 전시 안료', desc: '전시실 고급 물감 성분', emoji: '🧪' },
            { id: 'c2_2', title: '골동품 붉은 안료 지문', desc: '골동품 청소용 붉은 광택 시약 지문', emoji: '🏺' },
            { id: 'c2_3', title: '장부 붉은 인장', desc: '붉은 인장 자국', emoji: '📕' },
            { id: 'c2_4', title: '녹슨 철제 열쇠', desc: '지하실 열쇠', emoji: '🔑' }
        ],
        correctClueIdx: 1, correctSuspectIdx: 1, confessionPortrait: '🏺',
        confessionText: "범인 윤씨: \"크윽... 도자기를 닦던 붉은 광택 안료 지문이 지하실 금고에 남았을 줄이야! 내가 장부를 훔친 범인이다!\""
    },
    // Level 3: 산장 저택 사건 (범인: 3번째 정원사 오씨!)
    {
        title: "레벨 3: 산장 저택 사건", icon: "LEVEL 3 / 20", bgClass: "mansion-bg", targetText: "제한 시각: 새벽 2시 전", startMinutes: 20 * 60, maxMinutes: 26 * 60,
        locations: [
            { id: 'l3_1', icon: '🏰', title: '산장 대서재', desc: '비밀 서류 가위 자국', log: "🔎 [현장 조사]: 비밀 서랍이 정원용 가위 톱날로 강제 개착되어 있습니다." },
            { id: 'l3_2', icon: '✂️', title: '정원 가위 수거지', desc: '가위 손잡이 감식', log: "🔎 [증거 감식]: 가위 손잡이에서 오씨의 검지 지문이 선명히 발견되었습니다." },
            { id: 'l3_3', icon: '⌚', title: '회중시계 파편', desc: '시계 유리 지문', log: "🔎 [시계 감식]: 회중시계 조각 지문이 수거되었습니다." },
            { id: 'l3_4', icon: '✉️', title: '붉은 협박장', desc: '협박장 감식', log: "🔎 [협박장 감식]: 서재에서 발견된 붉은 협박장입니다." }
        ],
        suspects: [
            { id: 's3_1', icon: '🏰', title: '산장 대표 김 회장', desc: '"서재에서 독서 중"', log: "💬 [김 회장]: \"밤 9시엔 독서를 하며 휴식을 취하고 있었소. 감히 날 의심하다니!\"" },
            { id: 's3_2', icon: '💼', title: '비서 한씨', desc: '"일정표 서류 정리"', log: "💬 [비서 한씨]: \"밤 9시엔 차고 옆 사무실에서 서류를 정리하고 있었습니다.\"" },
            { id: 's3_3', icon: '✂️', title: '정원사 오씨', desc: '"정원 가위 날 갈기"', log: "💬 [정원사 오씨]: \"밤 9시엔 온실에서 대형 가위를 기름으로 닦고 날을 갈고 있었습니다!\"" },
            { id: 's3_4', icon: '🚘', title: '운전기사 임씨', desc: '"전용 세차 작업"', log: "💬 [운전기사 임씨]: \"차고에서 회장님 차량을 세차 중이었습니다.\"" }
        ],
        clues: [
            { id: 'c3_1', title: '서재 가위 개착 흔적', desc: '정원용 대형 가위 톱날 흔적', emoji: '✂️' },
            { id: 'c3_2', title: '정원 가위 검지 지문', desc: '온실 가위 손잡이 검지 지문 자국', emoji: '✂️' },
            { id: 'c3_3', title: '회중시계 유리 지문', desc: '깨진 시계 유리 지문', emoji: '⌚' },
            { id: 'c3_4', title: '붉은 협박장', desc: '서재 협박장', emoji: '✉️' }
        ],
        correctClueIdx: 1, correctSuspectIdx: 2, confessionPortrait: '✂️',
        confessionText: "범인 오씨: \"으아악! 온실 가위 기름 자국과 검지 지문이 서재 비밀 서랍에 찍혔다고?! 내가 서재 서랍을 털었습니다!\""
    },
    // Level 4: 항구 창고 밀수 사건 (범인: 4번째 선장 오씨!)
    {
        title: "레벨 4: 항구 창고 밀수 사건", icon: "LEVEL 4 / 20", bgClass: "spooky-bg", targetText: "제한 시각: 밤 11시 전", startMinutes: 17 * 60, maxMinutes: 23 * 60,
        locations: [
            { id: 'l4_1', icon: '⚓', title: '항구 3번 창고', desc: '밀수 화물 상자 감식', log: "🔎 [현장 조사]: 3번 창고 밀수 상자 밧줄 타르 칠에서 선장 장갑 지문이 포착되었습니다." },
            { id: 'l4_2', icon: '📦', title: '밀수 목재 궤짝', desc: '궤짝 도장 감식', log: "🔎 [증거 감식]: 궤짝 잠금 고리에서 뱃선장 전용 타르 지문이 감식되었습니다." },
            { id: 'l4_3', icon: '🚤', title: '소형 엔진 보트', desc: '보트 조타륜 지문', log: "🔎 [보트 감식]: 조타륜 손잡이 지문입니다." },
            { id: 'l4_4', icon: '📜', title: '항해 일지 수거지', desc: '출항 기록 분석', log: "🔎 [일지 감식]: 심야 출항 기록 일지입니다." }
        ],
        suspects: [
            { id: 's4_1', icon: '👷', title: '창고 하역 인부 강씨', desc: '"화물 짐 나르기"', log: "💬 [인부 강씨]: \"전 저녁 6시부터 하역장에서 상자를 옮기고 있었습니다.\"" },
            { id: 's4_2', icon: '👮', title: '항만 경비원 표씨', desc: '"초소 순찰 근무"', log: "💬 [경비원 표씨]: \"초소에서 항만 정문을 순찰 중이었습니다.\"" },
            { id: 's4_3', icon: '👨‍💼', title: '무역 상인 남씨', desc: '"장부 서류 검토"', log: "💬 [상인 남씨]: \"사무실에서 무역 인보이스를 검토하고 있었습니다.\"" },
            { id: 's4_4', icon: '⚓', title: '선장 오씨', desc: '"보트 기름 타르 칠"', log: "💬 [선장 오씨]: \"저녁 6시엔 배 조타륜에 선박용 검은 타르 기름을 바르고 있었소!\"" }
        ],
        clues: [
            { id: 'c4_1', title: '하역장 등산 장갑', desc: '인부 등산 장갑', emoji: '👷' },
            { id: 'c4_2', title: '경비원 순찰 봉 지문', desc: '순찰 봉 지문', emoji: '👮' },
            { id: 'c4_3', title: '무역 만년필 잉크', desc: '만년필 잉크 자국', emoji: '🖋️' },
            { id: 'c4_4', title: '밀수 궤짝 선박 타르 지문', desc: '선박용 검은 타르 지문 자국', emoji: '⚓' }
        ],
        correctClueIdx: 3, correctSuspectIdx: 3, confessionPortrait: '⚓',
        confessionText: "범인 오 선장: \"으윽! 조타륜에 바르던 선박 타르 지문이 밀수 궤짝 고리에 묻어있을 줄이야! 내가 밀수를 지시했습니다!\""
    }
];

// 레벨 5부터 20까지 다채로운 사건 & 범인 위치 무작위 배치 데이터 생성기
const levelTemplates = [
    { title: '시계탑 비밀 장치 사건', icon: '🕰️', suspect: '시계공 윤씨', job: '"태엽 청소"', clue: '시계 태엽 기름 지문', ansIdx: 1 },
    { title: '폐광산 지하 갱도 사건', icon: '⛏️', suspect: '광산 기술자 최씨', job: '"착암기 정비"', clue: '착암기 흑연 지문', ansIdx: 2 },
    { title: '안개 호숫가 선착장 사건', icon: '🎣', suspect: '밀낚시꾼 서씨', job: '"그물 칠하기"', clue: '그물 니스 지문', ansIdx: 3 },
    { title: '오래된 극장 조명실 사건', icon: '🎭', suspect: '조명 기사 백씨', job: '"조명 안료 교체"', clue: '조명 스위치 붉은 분진 지문', ansIdx: 0 },
    { title: '약국 밀실 연구실 사건', icon: '🧪', suspect: '독약 조제자 이씨', job: '"시약 병 조제"', clue: '독약 병 황산 지문', ansIdx: 2 },
    { title: '도서관 금서 보관소 사건', icon: '📚', suspect: '고서 사서 강씨', job: '"양장본 책 제본"', clue: '양장본 고서 풀 지문', ansIdx: 1 },
    { title: '심야 열차 침대칸 사건', icon: '🚆', suspect: '열차 차장 차씨', job: '"승차권 집표"', clue: '특실 도난 승차권 도장 지문', ansIdx: 3 },
    { title: '버려진 공장 기계실 사건', icon: '⚙️', suspect: '공장 정비공 류씨', job: '"제어반 기름 칠"', clue: '제어반 그리스 기름 지문', ansIdx: 0 },
    { title: '비밀 지하도 통로 사건', icon: '🗝️', suspect: '지하 암호원 하씨', job: '"횃불 안료 작업"', clue: '횃대 그을음 지문', ansIdx: 2 },
    { title: '고성 탑 꼭대기 사건', icon: '🏰', suspect: '고성 기사 한씨', job: '"갑옷 안료 정비"', clue: '망원경 렌즈 안료 지문', ansIdx: 1 },
    { title: '설산 산장 비밀 객실 사건', icon: '🏔️', suspect: '산악 구조원 표씨', job: '"왁스 스키 정비"', clue: '객실 손잡이 스키 왁스 지문', ansIdx: 3 },
    { title: '등대 해안 관측소 사건', icon: '🚨', suspect: '등대 관리원 원씨', job: '"신호 렌즈 닦기"', clue: '신호기 렌즈 지문', ansIdx: 0 },
    { title: '비밀 경매장 창고 사건', icon: '💎', suspect: '경매 장물아비 권씨', job: '"보석 귀금속 감정"', clue: '보석함 붉은 융단 지문', ansIdx: 2 },
    { title: '카지노 VIP 룸 사건', icon: '🎰', suspect: '카지노 딜러 신씨', job: '"카지노 칩 소독"', clue: '금고 패드 시약 지문', ansIdx: 1 },
    { title: '오페라 분장실 사건', icon: '🎻', suspect: '오페라 지휘자 성씨', job: '"지휘봉 왁스 칠"', clue: '분장실 거울 왁스 지문', ansIdx: 3 },
    { title: '최종 흑막 본부 사건', icon: '👑', suspect: '흑막 총수 장 회장', job: '"조직 메인 컴퓨터 컨트롤"', clue: '메인 컴퓨터 붉은 도장 지장', ansIdx: 3 }
];

// 레벨 5~20 채우기
for (let lvl = 5; lvl <= 20; lvl++) {
    const tmpl = levelTemplates[(lvl - 5) % levelTemplates.length];
    const targetAnsIdx = tmpl.ansIdx; // 0, 1, 2, 3 무작위 골고루 분배!

    const susList = [
        { id: `s${lvl}_1`, icon: '👤', title: `용의자 A (${lvl}구역)`, desc: '"알리바이 주장"', log: `💬 [용의자 A]: "전 사건 시각에 현장에 없었습니다!"` },
        { id: `s${lvl}_2`, icon: '🕵️', title: `용의자 B (${lvl}구역)`, desc: '"부인 진술"', log: `💬 [용의자 B]: "전 그 물건에 손댄 적도 없어요!"` },
        { id: `s${lvl}_3`, icon: '💼', title: `용의자 C (${lvl}구역)`, desc: '"업무 수행 중"', log: `💬 [용의자 C]: "전 사무실에서 서류를 정리했습니다."` },
        { id: `s${lvl}_4`, icon: '🛠️', title: `용의자 D (${lvl}구역)`, desc: '"외출 정황"', log: `💬 [용의자 D]: "전 외출을 다녀왔을 뿐입니다."` }
    ];

    const clueList = [
        { id: `c${lvl}_1`, title: `일반 현장 자국 A`, desc: '일반 먼지 자국', emoji: '🔍' },
        { id: `c${lvl}_2`, title: `일반 현장 자국 B`, desc: '일반 신발 자국', emoji: '👟' },
        { id: `c${lvl}_3`, title: `일반 현장 자국 C`, desc: '일반 유리기스', emoji: '🧪' },
        { id: `c${lvl}_4`, title: `일반 현장 자국 D`, desc: '일반 끈 조각', emoji: '🧵' }
    ];

    // 지정된 범인 위치(targetAnsIdx)에 진범 배치!
    susList[targetAnsIdx] = {
        id: `s${lvl}_${targetAnsIdx + 1}`,
        icon: tmpl.icon,
        title: tmpl.suspect,
        desc: tmpl.job,
        log: `💬 [${tmpl.suspect}]: "사건 시각에 난 ${tmpl.job} 작업을 손으로 직접 하고 있었소!"`
    };

    clueList[targetAnsIdx] = {
        id: `c${lvl}_${targetAnsIdx + 1}`,
        title: tmpl.clue,
        desc: `${tmpl.suspect}의 특수 작업 지문 자국`,
        emoji: tmpl.icon
    };

    rawLevelsDatabase.push({
        title: `레벨 ${lvl}: ${tmpl.title}`,
        icon: `LEVEL ${lvl} / 20`,
        bgClass: lvl % 3 === 0 ? "mansion-bg" : (lvl % 2 === 0 ? "house-bg" : "spooky-bg"),
        targetText: `제한 시각: ${lvl % 2 === 0 ? '밤 11시 전' : '새벽 3시 전'}`,
        startMinutes: (14 + (lvl % 5)) * 60,
        maxMinutes: (21 + (lvl % 5)) * 60,
        locations: [
            { id: `l${lvl}_1`, icon: tmpl.icon, title: `${tmpl.title} 중심 구역`, desc: '정밀 현장 감식', log: `🔎 [현장 조사]: ${tmpl.clue} 흔적이 결정적으로 수거되었습니다.` },
            { id: `l${lvl}_2`, icon: '📜', title: '의뢰인 특수 서류', desc: '지장 서명 감식', log: `🔎 [증거 감식]: 서류 옆에 선명한 손가락 지문이 남아있습니다.` },
            { id: `l${lvl}_3`, icon: '🔍', title: '수거용 도구 받침대', desc: '안료 분석', log: `🔎 [도구 감식]: 작업 도구에서 범인의 미세 지문이 확인되었습니다.` },
            { id: `l${lvl}_4`, icon: '🗝️', title: '비밀 열쇠 수거지', desc: '금속 분석', log: `🔎 [열쇠 감식]: 범인의 전용 열쇠입니다.` }
        ],
        suspects: susList,
        clues: clueList,
        correctClueIdx: targetAnsIdx,
        correctSuspectIdx: targetAnsIdx,
        confessionPortrait: tmpl.icon,
        confessionText: `범인 ${tmpl.suspect}: "으윽! 내가 작업할 때 남긴 ${tmpl.clue} 흔적이 발목을 잡을 줄이야! 내가 레벨 ${lvl} 범인이다!"`
    });
}

function getCurrentLevelData() {
    const raw = rawLevelsDatabase[gameState.currentLevel - 1] || rawLevelsDatabase[0];
    return {
        ...raw,
        correctClue: raw.clues[raw.correctClueIdx].id,
        correctSuspect: raw.suspects[raw.correctSuspectIdx].id
    };
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

// 타자기 효과 (타이머 중복 생성 완전 방지)
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

// 수사 UI 초기화 및 레벨 동적 렌더링
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

// 범인 자백 후 바로 다음 레벨로 직행!
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
