/**
 * Web Audio API and Haptic Vibration utilities for workout timers
 */

export function playBeep(freq = 880, durationMs = 250, type: OscillatorType = "sine") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio might be blocked by browser policy before first interaction
  }
}

export function playRestCompleteSound() {
  if (typeof window === "undefined") return;
  // Two-tone cheerful chime (e.g., 587Hz -> 880Hz)
  playBeep(587.33, 180, "triangle");
  setTimeout(() => {
    playBeep(880, 400, "sine");
  }, 180);

  triggerVibration([200, 100, 300]);
}

export function playTimerTick() {
  playBeep(440, 60, "sine");
}

export function triggerVibration(pattern: number | number[] = 150) {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported devices
  }
}
