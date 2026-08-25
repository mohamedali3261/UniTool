import { BookChunk, DeviceVoice, ReaderSettings } from '../types';
import { cleanTextForSpeech } from './textProcessor';

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onWordBoundary?: (charIndex: number, charLength: number) => void;
}

class SpeechEngineService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveInterval: any = null;
  private voicesCache: DeviceVoice[] = [];
  private isSpeakingInternal = false;
  private isPausedInternal = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Fetch all system voices with retry for browsers where voices load asynchronously
   */
  public async getAvailableVoices(): Promise<DeviceVoice[]> {
    if (!this.synth) return [];

    let rawVoices = this.synth.getVoices();
    if (rawVoices.length === 0) {
      // Wait for onvoiceschanged event
      await new Promise<void>((resolve) => {
        const handleVoicesChanged = () => {
          if (this.synth) {
            this.synth.removeEventListener('voiceschanged', handleVoicesChanged);
          }
          resolve();
        };

        if (this.synth) {
          this.synth.addEventListener('voiceschanged', handleVoicesChanged);
        }

        // Timeout fallback after 1.5s
        setTimeout(() => {
          if (this.synth) {
            this.synth.removeEventListener('voiceschanged', handleVoicesChanged);
          }
          resolve();
        }, 1500);
      });
      rawVoices = this.synth.getVoices();
    }

    this.voicesCache = rawVoices.map((v) => {
      const lowerLang = v.lang.toLowerCase();
      const lowerName = v.name.toLowerCase();
      const isArabic = lowerLang.startsWith('ar') || lowerName.includes('arabic') || lowerName.includes('عربي') || lowerName.includes('maged') || lowerName.includes('tarik') || lowerName.includes('laila') || lowerName.includes('zeina');
      const isEnglish = lowerLang.startsWith('en') || lowerName.includes('english');

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        isArabic,
        isEnglish,
        localService: v.localService,
      };
    });

    return this.voicesCache;
  }

  /**
   * Find the matching SpeechSynthesisVoice by URI or language
   */
  public findVoice(
    lang: 'ar' | 'en',
    preferredUri: string | null,
    autoSelect: boolean = true
  ): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return null;

    // 1. If explicit preferred URI matched
    if (preferredUri) {
      const matched = voices.find((v) => v.voiceURI === preferredUri);
      if (matched) return matched;
    }

    // 2. Auto-select best voice for language
    if (autoSelect || !preferredUri) {
      if (lang === 'ar') {
        // Priority 1: Exact ar-SA or ar-* natural voice
        const arVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith('ar') || n.includes('arabic') || n.includes('maged') || n.includes('tarik') || n.includes('laila');
        });
        if (arVoice) return arVoice;
      } else {
        const enVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          return l === 'en-us' || l === 'en-gb' || l.startsWith('en');
        });
        if (enVoice) return enVoice;
      }
    }

    // Fallback to default or first available voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  /**
   * Speaks a specific chunk with precision boundaries and error handling
   */
  public speak(
    chunk: BookChunk,
    settings: ReaderSettings,
    callbacks: SpeechCallbacks
  ): void {
    if (!this.synth) {
      callbacks.onError?.('Web Speech API is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech cleanly
    this.stop();

    const cleanText = cleanTextForSpeech(chunk.text);
    if (!cleanText) {
      callbacks.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Determine voice
    const preferredUri = chunk.language === 'ar' ? settings.selectedArabicVoiceURI : settings.selectedEnglishVoiceURI;
    const selectedVoice = this.findVoice(chunk.language, preferredUri, settings.autoVoiceSelect);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = chunk.language === 'ar' ? 'ar-SA' : 'en-US';
    }

    utterance.rate = Math.max(0.5, Math.min(2.0, settings.speechRate));
    utterance.pitch = Math.max(0.5, Math.min(1.5, settings.pitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, settings.volume));

    utterance.onstart = () => {
      this.isSpeakingInternal = true;
      this.isPausedInternal = false;
      this.startKeepAlive();
      callbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeakingInternal = false;
      this.isPausedInternal = false;
      this.stopKeepAlive();
      this.currentUtterance = null;
      callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingInternal = false;
      this.isPausedInternal = false;
      this.stopKeepAlive();
      this.currentUtterance = null;

      // Ignore 'canceled' or 'interrupted' errors when switching chunks
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis error:', e.error);
        callbacks.onError?.(`Speech error: ${e.error}`);
      }
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' && typeof event.charIndex === 'number') {
        const charLength = (event as any).charLength || 5;
        callbacks.onWordBoundary?.(event.charIndex, charLength);
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err: any) {
      console.error('Failed to trigger speak:', err);
      callbacks.onError?.(err.message || 'Error initializing voice playback');
    }
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPausedInternal = true;
      this.isSpeakingInternal = false;
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPausedInternal = false;
      this.isSpeakingInternal = true;
    }
  }

  public stop(): void {
    this.stopKeepAlive();
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.isSpeakingInternal = false;
    this.isPausedInternal = false;
  }

  /**
   * Speak a short test sentence for voice preview
   */
  public testVoice(
    voiceURI: string,
    sampleTextArabic: string = 'مرحباً بك في قارئ الكتب والمستندات الذكي.',
    sampleTextEnglish: string = 'Hello, this is a voice preview for the audio book reader.'
  ): void {
    if (!this.synth) return;
    this.stop();

    const voices = this.synth.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (!voice) return;

    const isAr = voice.lang.toLowerCase().startsWith('ar');
    const text = isAr ? sampleTextArabic : sampleTextEnglish;
    const testUtterance = new SpeechSynthesisUtterance(text);
    testUtterance.voice = voice;
    testUtterance.lang = voice.lang;
    testUtterance.rate = 1.0;

    this.synth.speak(testUtterance);
  }

  /**
   * Keep-alive workaround for Chrome speech synthesis pauses
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

export const speechEngine = new SpeechEngineService();
