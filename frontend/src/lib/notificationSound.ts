let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } catch {
    // Autoplay restrictions or an unsupported browser shouldn't break notifications.
  }
}
