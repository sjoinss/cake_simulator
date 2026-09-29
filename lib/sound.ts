// 효과음·배경음악. 이미지처럼 오디오 파일 없이 Web Audio API로 합성한다
// (cake-tycoon-prompt.md 16장 "이미지 에셋 최소화" 원칙을 오디오로 확장 적용).
// 브라우저 자동재생 정책상 페이지를 한 번이라도 누르기 전에는 소리가 나지 않는다 — 첫 입력 때 컨텍스트를 깨우고
// 배경음악도 그때 시작한다 (unlockAudio).

// ── 설정 (켜기/끄기). 가게 이름·테마처럼 진행 초기화와 무관하게 브라우저에 저장 ──
export type SoundSettings = { sfx: boolean; bgm: boolean };
const SETTINGS_KEY = 'cake-tycoon.sound';
const DEFAULT_SETTINGS: SoundSettings = { sfx: true, bgm: true };

let settings: SoundSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (saved && typeof saved === 'object') settings = { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    // 기본값
  }
}

export const getSoundSettings = () => settings;
export function subscribeSoundSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setSoundSettings(next: Partial<SoundSettings>) {
  settings = { ...settings, ...next };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 이번 판에서만 적용
  }
  listeners.forEach((listener) => listener());
  if (settings.bgm) startMusic();
  else stopMusic();
}

// ── 오디오 그래프: 효과음 / 배경음악 볼륨을 따로 ──
let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let bgmBus: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  if (!ctx) {
    ctx = new AudioContext();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.7;
    sfxBus.connect(ctx.destination);
    bgmBus = ctx.createGain();
    bgmBus.gain.value = 0.09;
    bgmBus.connect(ctx.destination);
    // 다른 탭으로 가면 멈추고, 돌아오면 이어서
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (unlocked) void ctx.resume();
    });
  }
  return ctx;
}

let unlocked = false;
// 첫 입력 때 한 번 불린다 (GameRoot). 이후로 소리가 난다
export function unlockAudio() {
  const context = audio();
  if (!context) return;
  unlocked = true;
  if (context.state === 'suspended') void context.resume();
  if (settings.bgm) startMusic();
}

// 효과음을 낼 수 있으면 컨텍스트를, 아니면 null
function sfx(): AudioContext | null {
  if (!settings.sfx || !unlocked) return null;
  const context = audio();
  if (!context || context.state !== 'running') return null;
  return context;
}

type ToneOptions = {
  type?: OscillatorType;
  volume?: number;
  glideTo?: number; // 끝 주파수 (미끄러지는 소리)
  attack?: number;
  bus?: GainNode | null;
};

// 짧은 음 하나: 빠르게 올라갔다 지수적으로 사라진다
function tone(context: AudioContext, frequency: number, start: number, duration: number, options: ToneOptions = {}) {
  const { type = 'sine', volume = 0.25, glideTo, attack = 0.008, bus = sfxBus } = options;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(bus ?? context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;
// 걸러낸 잡음 한 번 (붓기, 크림, 오븐 문, 휙)
function noise(
  context: AudioContext,
  start: number,
  duration: number,
  { frequency = 1200, q = 0.8, volume = 0.2, type = 'bandpass' as BiquadFilterType, sweepTo = 0 } = {},
) {
  if (!noiseBuffer) {
    noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, start);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
  filter.Q.value = q;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(sfxBus ?? context.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

// ── 효과음 ──
export const sounds = {
  // 손님 등장: 맑은 종소리
  bell() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 1320, t, 0.6, { glideTo: 880, volume: 0.22 });
    tone(c, 1980, t, 0.35, { volume: 0.06 });
  },
  // 가벼운 버튼 (탭 이동 등)
  click() {
    const c = sfx();
    if (!c) return;
    tone(c, 1100, c.currentTime, 0.05, { type: 'triangle', volume: 0.08 });
  },
  // 재료 고르기, 토핑 올리기: 뽁
  pop() {
    const c = sfx();
    if (!c) return;
    tone(c, 520, c.currentTime, 0.1, { glideTo: 980, volume: 0.2 });
  },
  // 토핑 빼기: 뽁 반대
  unpop() {
    const c = sfx();
    if (!c) return;
    tone(c, 820, c.currentTime, 0.09, { glideTo: 420, volume: 0.14 });
  },
  // 손님 주문 말풍선 하나
  talk() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    const base = 520 + Math.random() * 180;
    tone(c, base, t, 0.07, { type: 'triangle', volume: 0.1 });
    tone(c, base * 1.25, t + 0.07, 0.08, { type: 'triangle', volume: 0.08 });
  },
  // 주문 확정: 주문서가 레일에 걸리는 소리
  orderTaken() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 784, t, 0.12, { volume: 0.14 });
    tone(c, 1175, t + 0.1, 0.2, { volume: 0.14 });
  },
  // 반죽 붓기 시작: 꿀렁
  pour() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 180, t, 0.18, { glideTo: 320, volume: 0.18 });
    tone(c, 240, t + 0.14, 0.18, { glideTo: 400, volume: 0.12 });
  },
  // 크림 짜기 시작: 슉
  squish() {
    const c = sfx();
    if (!c) return;
    noise(c, c.currentTime, 0.22, { frequency: 700, sweepTo: 1600, q: 1.2, volume: 0.16 });
  },
  // 오븐에 넣기: 문 닫히는 텅
  ovenIn() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.12, { frequency: 500, type: 'lowpass', volume: 0.25 });
    tone(c, 150, t, 0.22, { glideTo: 70, volume: 0.3 });
  },
  // 다 구워짐: 딩-동
  ovenDing() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 1568, t, 0.5, { volume: 0.2 });
    tone(c, 1245, t + 0.22, 0.8, { volume: 0.2 });
  },
  // 타기 시작: 삐삐
  ovenWarning() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 880, t, 0.1, { type: 'square', volume: 0.07 });
    tone(c, 880, t + 0.16, 0.1, { type: 'square', volume: 0.07 });
  },
  // 오븐에서 꺼내기: 휙
  whoosh() {
    const c = sfx();
    if (!c) return;
    noise(c, c.currentTime, 0.28, { frequency: 400, sweepTo: 2400, q: 0.7, volume: 0.18 });
  },
  // 단계 완료 (필링·크림·토핑 완료, 오븐으로 보내기)
  done() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 660, t, 0.12, { type: 'triangle', volume: 0.14 });
    tone(c, 990, t + 0.09, 0.18, { type: 'triangle', volume: 0.14 });
  },
  // 케이크 완성: 반짝반짝
  sparkle() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    [1047, 1319, 1568, 2093].forEach((frequency, index) =>
      tone(c, frequency, t + index * 0.07, 0.3, { volume: 0.12 }),
    );
  },
  // 서빙·돈 받기: 짤랑
  coin() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 988, t, 0.08, { type: 'square', volume: 0.06 });
    tone(c, 1319, t + 0.08, 0.35, { type: 'square', volume: 0.06 });
    tone(c, 2637, t + 0.08, 0.3, { volume: 0.05 });
  },
  // 버리기: 뿅 내려감
  trash() {
    const c = sfx();
    if (!c) return;
    tone(c, 440, c.currentTime, 0.25, { type: 'triangle', glideTo: 110, volume: 0.15 });
  },
  // 잘못 놓음 (드래그가 되돌아감)
  nope() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 220, t, 0.09, { type: 'triangle', volume: 0.12 });
    tone(c, 196, t + 0.1, 0.12, { type: 'triangle', volume: 0.12 });
  },
  // 랭크업: 빰빠밤
  fanfare() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    const notes: [number, number, number][] = [
      [523, 0, 0.12],
      [659, 0.12, 0.12],
      [784, 0.24, 0.12],
      [1047, 0.38, 0.5],
    ];
    notes.forEach(([frequency, at, duration]) => {
      tone(c, frequency, t + at, duration, { type: 'square', volume: 0.07 });
      tone(c, frequency * 2, t + at, duration, { volume: 0.05 });
    });
  },
  // 하루 마감: 짧은 마무리 멜로디
  dayEnd() {
    const c = sfx();
    if (!c) return;
    const t = c.currentTime;
    [784, 659, 523, 659, 784, 1047].forEach((frequency, index) =>
      tone(c, frequency, t + index * 0.14, 0.3, { type: 'triangle', volume: 0.14 }),
    );
  },
};

// ── 배경음악: 오르골 같은 짧은 곡을 반복한다 ──
// 코드 진행 C–Am–F–G(한 마디 4박) 위에 펜타토닉 멜로디. 미리 정한 음표를 조금 앞서 예약하는 방식
const BPM = 92;
const BEAT = 60 / BPM;
const N = (semitone: number) => 523.25 * Math.pow(2, semitone / 12); // C5 기준 반음
// [박, 반음(C5=0), 길이(박)] — 4마디 = 16박
const MELODY: [number, number, number][] = [
  [0, 4, 1], [1, 7, 1], [2, 9, 1], [3, 7, 1],
  [4, 4, 1.5], [5.5, 2, 0.5], [6, 0, 2],
  [8, 5, 1], [9, 4, 1], [10, 2, 1], [11, 0, 1],
  [12, 2, 1.5], [13.5, 4, 0.5], [14, 7, 2],
];
const CHORDS: number[][] = [
  [-12, -8, -5], // C
  [-15, -12, -8], // Am
  [-19, -15, -12], // F
  [-17, -13, -10], // G
];
const LOOP_BEATS = 16;

let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextLoopAt = 0;
// 예약해 둔 반복 한 번마다 볼륨 노드 하나 — 끌 때 이걸 끊으면 이미 예약된 음까지 바로 멈춘다
let loopGains: GainNode[] = [];

function scheduleLoop(context: AudioContext, start: number) {
  const loopGain = context.createGain();
  loopGain.connect(bgmBus ?? context.destination);
  loopGains = [...loopGains.slice(-2), loopGain];
  MELODY.forEach(([beat, semitone, length]) =>
    tone(context, N(semitone), start + beat * BEAT, length * BEAT * 0.95, {
      type: 'triangle',
      volume: 0.5,
      attack: 0.01,
      bus: loopGain,
    }),
  );
  CHORDS.forEach((chord, bar) =>
    chord.forEach((semitone) =>
      tone(context, N(semitone), start + bar * 4 * BEAT, 3.8 * BEAT, { volume: 0.18, attack: 0.05, bus: loopGain }),
    ),
  );
}

function startMusic() {
  if (musicTimer || !unlocked || !settings.bgm) return;
  const context = audio();
  if (!context) return;
  nextLoopAt = context.currentTime + 0.1;
  const pump = () => {
    // 1초 앞까지 채워 둔다 (탭이 멈췄다 돌아오면 현재 시각부터 다시)
    if (nextLoopAt < context.currentTime) nextLoopAt = context.currentTime + 0.1;
    while (nextLoopAt < context.currentTime + 1) {
      scheduleLoop(context, nextLoopAt);
      nextLoopAt += LOOP_BEATS * BEAT;
    }
  };
  pump();
  musicTimer = setInterval(pump, 400);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  loopGains.forEach((gain) => gain.disconnect());
  loopGains = [];
}
