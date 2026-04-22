import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function WelcomeSound() {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const welcomeMessage = `Hello and welcome to Farness.
Your autonomous future starts now.
We revolutionize industrial inspections with AI-powered drone technology.
Explore our platform, learn about our solutions, or schedule a demo.
The future of autonomous operations awaits.`;

  // Generate speech using Web Speech API
  const generateAndPlayWelcomeSound = async () => {
    if (!isSoundEnabled || isPlaying) return;

    try {
      setIsPlaying(true);

      // Use browser's Web Speech API for text-to-speech
      const utterance = new SpeechSynthesisUtterance(welcomeMessage);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Use a professional voice if available
      const voices = window.speechSynthesis.getVoices();
      const professionalVoice = voices.find(
        (voice) =>
          voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.name.includes('Samantha')
      ) || voices[0];

      if (professionalVoice) {
        utterance.voice = professionalVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setHasPlayed(true);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing welcome sound:', error);
      setIsPlaying(false);
    }
  };

  // Play sound on component mount (first visit)
  useEffect(() => {
    // Wait for voices to load
    const handleVoicesChanged = () => {
      if (!hasPlayed && isSoundEnabled) {
        // Delay to ensure smooth page load
        const timer = setTimeout(() => {
          generateAndPlayWelcomeSound();
        }, 1000);
        return () => clearTimeout(timer);
      }
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    // If voices already loaded
    if (!hasPlayed && isSoundEnabled && window.speechSynthesis.getVoices().length > 0) {
      const timer = setTimeout(() => {
        generateAndPlayWelcomeSound();
      }, 1000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [hasPlayed, isSoundEnabled]);

  const toggleSound = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setIsSoundEnabled(!isSoundEnabled);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setHasPlayed(false);
      generateAndPlayWelcomeSound();
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-30 p-4 flex items-center gap-2">
      {/* Play Button */}
      <button
        onClick={togglePlayback}
        title="Play welcome message"
        className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
      >
        <Volume2 size={18} />
        {isPlaying && (
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-pulse opacity-30" />
        )}
        <span className="absolute -top-10 right-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {isPlaying ? 'Playing...' : 'Play message'}
        </span>
      </button>

      {/* Mute Toggle */}
      <button
        onClick={toggleSound}
        title={isSoundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        className="group relative bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg transition-all border border-gray-200 dark:border-white/10"
      >
        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span className="absolute -top-10 right-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {isSoundEnabled ? 'Sound ON' : 'Sound OFF'}
        </span>
      </button>
    </div>
  );
}
