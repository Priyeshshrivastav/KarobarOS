'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!supported) {
      alert('Voice speech recognition is not supported in this browser. Please use Google Chrome or an Android device.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    // Prefer Indian English / Hindi recognition
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? 'Listening... Boliye' : 'Tap to speak (Hindi/English)'}
      className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all ${
        isListening
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105 animate-pulse'
          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
      }`}
    >
      {isListening ? (
        <>
          <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping" />
          <Mic className="w-5 h-5 relative z-10" />
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}
