/**
 * The first speechSynthesis.speak() in a page load starts the browser's voice engine, which can freeze the page
 * for a few hundred milliseconds. Doing it once, silently, on the visitor's first click or key press
 * (typing in the intro form counts) means the real first line speaks smoothly, long before it is needed.
 */
let warmed = false;

export function warmSpeech() {
  if (warmed || typeof window === "undefined" || !("speechSynthesis" in window))
    return;
  warmed = true;
  try {
    const synth = window.speechSynthesis;
    synth.getVoices(); // starts loading the voice list
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0; // silent
    u.rate = 2;
    synth.speak(u);
  } catch {
    /* not critical */
  }
}

/** Warms speech up on the first pointer or key event. Returns a cleanup function. */
export function armSpeechWarmup() {
  if (typeof window === "undefined") return () => {};
  const run = () => {
    warmSpeech();
    off();
  };
  const off = () => {
    window.removeEventListener("pointerdown", run);
    window.removeEventListener("keydown", run);
  };
  window.addEventListener("pointerdown", run);
  window.addEventListener("keydown", run);
  return off;
}
