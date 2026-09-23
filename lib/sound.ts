// Phase 1: 오디오도 이미지처럼 별도 에셋 파일 없이 Web Audio API로 합성한다 (cake-tycoon-prompt.md 16장 "이미지 에셋 최소화" 원칙을 오디오로 확장 적용).

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// 손님 등장 시 울리는 맑은 종소리. 브라우저 자동재생 정책상 페이지와 한 번이라도
// 상호작용하기 전에는 소리가 나지 않을 수 있다 (사양이며 별도 처리 불필요).
export function playBellSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1320, now);
  oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.3);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.6);
}
