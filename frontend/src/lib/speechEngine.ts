/**
 * Browser-native speech engines for voice-to-text and text-to-voice.
 */

/** Language code mapping for speech recognition and synthesis */
export const speechLanguageCodes: Record<string, string> = {
  en: "en-US",
  yo: "yo-NG",
  ha: "ha-NG",
  ig: "ig-NG",
  fr: "fr-FR",
};

// ── Voice-to-Text (Speech Recognition) ──

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

/**
 * Start listening for speech and return transcribed text.
 * Uses the Web Speech API's SpeechRecognition interface.
 */
export function startVoiceRecognition(
  language: string,
  onResult: (result: SpeechRecognitionResult) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
): { stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.("Speech recognition is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = speechLanguageCodes[language] || "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event: any) => {
    const result = event.results[0]?.[0];
    if (result) {
      onResult({
        transcript: result.transcript,
        confidence: result.confidence,
      });
    }
  };

  recognition.onerror = (event: any) => {
    onError?.(event.error || "Speech recognition error");
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    },
  };
}

/** Check if speech recognition is supported */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

// ── Text-to-Voice (Speech Synthesis) ──

/**
 * Speak text aloud using the browser's SpeechSynthesis API.
 */
export function speakText(
  text: string,
  language: string,
  onEnd?: () => void
): { cancel: () => void } | null {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    !window.SpeechSynthesisUtterance
  ) {
    return null;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguageCodes[language] || "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);

    return {
      cancel: () => {
        try {
          window.speechSynthesis?.cancel();
        } catch (e) {
          console.warn("speechSynthesis.cancel failed:", e);
        }
      },
    };
  } catch (error) {
    console.error("speakText failed to execute:", error);
    return null;
  }
}

/** Speak an array of step instructions sequentially */
export function speakDirections(
  steps: string[],
  language: string,
  onComplete?: () => void
): { cancel: () => void } {
  let currentIndex = 0;
  let cancelled = false;

  function speakNext() {
    if (cancelled || currentIndex >= steps.length) {
      onComplete?.();
      return;
    }

    const instance = speakText(steps[currentIndex], language, () => {
      currentIndex++;
      speakNext();
    });

    // If speech engine failed to initialize, skip this step or progress automatically
    if (!instance) {
      currentIndex++;
      speakNext();
    }
  }

  speakNext();

  return {
    cancel: () => {
      cancelled = true;
      try {
        window.speechSynthesis?.cancel();
      } catch (e) {
        console.warn("speechSynthesis.cancel failed in speakDirections:", e);
      }
    },
  };
}

/** Check if speech synthesis is supported */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}
