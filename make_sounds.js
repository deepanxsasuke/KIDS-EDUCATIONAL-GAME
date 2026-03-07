import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function writeWavHeader(buffer, sampleRate, numChannels, byteRate, blockAlign, bitsPerSample, dataSize) {
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
}

function generateSound(filename, type) {
    const sampleRate = 8000;
    const duration = 0.5; // seconds
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;

    const buffer = Buffer.alloc(44 + dataSize);
    writeWavHeader(buffer, sampleRate, numChannels, byteRate, blockAlign, bitsPerSample, dataSize);

    // Frequency
    const freq = type === 'correct' ? 800 : 150;

    for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        let sample;
        if (type === 'correct') {
            // Sine wave ding
            sample = Math.sin(2 * Math.PI * freq * time);
            // Envelope (decay)
            sample *= Math.max(0, 1 - (i / numSamples) * 2);
        } else {
            // Sawtooth buzzer
            sample = (time * freq) % 1;
            sample = (sample * 2 - 1) * 0.5; // quieter
        }

        // 16 bit PCM
        const value = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
        buffer.writeInt16LE(value, 44 + i * 2);
    }

    const outPath = path.join(__dirname, 'public', 'assets', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Wrote ${filename}`);
}

generateSound('correct.wav', 'correct');
generateSound('wrong.wav', 'wrong');
