/**
 * Resampling utilities for voice provider abstraction.
 * OpenAI uses 24kHz; Gemini uses 16kHz input. We resample to normalize.
 */
/** Resample 24kHz 16-bit PCM to 16kHz (for Gemini input). */
export function resample24kTo16k(input) {
    const samples = new Int16Array(input);
    const inRate = 24000;
    const outRate = 16000;
    const ratio = inRate / outRate;
    const outLength = Math.floor(samples.length / ratio);
    const output = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
        const srcIdx = i * ratio;
        const idx0 = Math.floor(srcIdx);
        const idx1 = Math.min(idx0 + 1, samples.length - 1);
        const frac = srcIdx - idx0;
        const v0 = samples[idx0];
        const v1 = samples[idx1];
        output[i] = Math.round(v0 + frac * (v1 - v0));
    }
    return output.buffer;
}
