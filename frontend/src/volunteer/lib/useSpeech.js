import { useCallback, useEffect, useRef, useState } from 'react';

const SPEECH_LOCALE = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

function getRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Voice input for the open comment.
 *
 * Speaking is faster than typing on a phone, and it matters far more in
 * Marathi and Hindi than in English — typing Devanagari on a mobile keyboard
 * is slow enough that people simply skip the field.
 *
 * `supported` is false where the API is missing (Firefox, older browsers),
 * and the caller must not render a microphone button in that case. A dead
 * button is worse than no button.
 */
export default function useSpeech(lang = 'en') {
  const [listeningFor, setListeningFor] = useState(null);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const supported = Boolean(getRecognition());

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListeningFor(null);
  }, []);

  /* Never leave the microphone open when the page unmounts. */
  useEffect(() => stop, [stop]);

  const start = useCallback(
    (field, onResult) => {
      const Recognition = getRecognition();
      if (!Recognition) return;

      stop();
      setError(null);

      const recognition = new Recognition();
      recognition.lang = SPEECH_LOCALE[lang] ?? SPEECH_LOCALE.en;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(' ')
          .trim();
        if (transcript) onResult(transcript);
      };

      recognition.onerror = (event) => {
        setError(
          event.error === 'not-allowed'
            ? 'Microphone access is blocked. You can type instead.'
            : 'We could not hear that. Try again, or type instead.',
        );
        setListeningFor(null);
      };

      recognition.onend = () => setListeningFor(null);

      recognitionRef.current = recognition;
      setListeningFor(field);
      recognition.start();
    },
    [lang, stop],
  );

  return { supported, listeningFor, error, start, stop };
}
