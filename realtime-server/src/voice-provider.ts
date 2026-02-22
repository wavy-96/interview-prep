/**
 * Voice provider abstraction for Epic 4.2.
 * Both OpenAI and Gemini implement this interface so the client receives
 * identical event shapes (response.output_audio.delta, etc.).
 */

export interface VoiceProviderCallbacks {
  onMessage: (data: string | Buffer) => void;
  onError: (code: string, message?: string) => void;
  onClose: () => void;
}

export interface VoiceProvider {
  send(data: string): void;
  injectTimeWarning(text: string): void;
  disconnect(): void;
}
