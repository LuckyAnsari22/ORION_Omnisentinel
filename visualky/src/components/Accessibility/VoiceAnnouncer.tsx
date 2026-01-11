interface AnnouncementOptions {
  priority?: 'normal' | 'high' | 'immediate';
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface VoiceAnnouncerContextType {
  announce: (text: string, options?: AnnouncementOptions) => Promise<void>;
  speak: (text: string, options?: AnnouncementOptions) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

// Create a simple queue and state management without React hooks
class VoiceAnnouncerSingleton implements VoiceAnnouncerContextType {
  private queue: Array<{ text: string; options?: AnnouncementOptions }> = [];
  private isSpeakingValue = false;
  private synth = window.speechSynthesis;

  get isSpeaking(): boolean {
    return this.isSpeakingValue;
  }

  async speak(text: string, options: AnnouncementOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice preferences
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      // Add visual feedback for screen readers
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('role', 'status');
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.className = 'sr-only';
      ariaLive.textContent = text;
      document.body.appendChild(ariaLive);

      utterance.onstart = () => {
        this.isSpeakingValue = true;
      };

      utterance.onend = () => {
        this.isSpeakingValue = false;
        ariaLive.remove();
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeakingValue = false;
        ariaLive.remove();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  async announce(text: string, options: AnnouncementOptions = {}): Promise<void> {
    this.queue.push({ text, options });
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isSpeakingValue || this.queue.length === 0) {
      return;
    }

    const { text, options } = this.queue.shift()!;
    await this.speak(text, options);
  }

  stop(): void {
    this.synth.cancel();
    this.isSpeakingValue = false;
    this.queue = [];
  }
}

// Create a singleton instance at module load
const voiceAnnouncerInstance = new VoiceAnnouncerSingleton();

export const useVoiceAnnouncer = () => voiceAnnouncerInstance;

export default voiceAnnouncerInstance;
