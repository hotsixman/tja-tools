import { DON_SOUND } from "./assets/don.js";
import { KA_SOUND } from "./assets/ka.js";
import type { HitSoundData } from "./types.js";

export function audioBufferToWav(audioBuffer: AudioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const samples = audioBuffer.length;
    const blockAlign = numChannels * bitDepth / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    let offset = 0;

    const writeString = (str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    };

    // RIFF header
    writeString("RIFF");
    view.setUint32(offset, 36 + dataSize, true); offset += 4;
    writeString("WAVE");

    // fmt chunk
    writeString("fmt ");
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, format, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, byteRate, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitDepth, true); offset += 2;

    // data chunk
    writeString("data");
    view.setUint32(offset, dataSize, true); offset += 4;

    // PCM samples
    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(audioBuffer.getChannelData(ch));
    }

    for (let i = 0; i < samples; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            let sample = channelData[ch][i];
            sample = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: "audio/wav" });
}

/**
 * 오프셋 적용(+일경우 앞에 빈공간 추가)
 */
export function applyOffsetToBuffer(audioContext: AudioContext, audioBuffer: AudioBuffer, offset: number) {
    if (offset > 0) {
        const silenceSeconds = Math.abs(offset);
        const sampleRate = audioBuffer.sampleRate
        const silenceSamples = Math.floor(silenceSeconds * sampleRate)

        const newLength = audioBuffer.length + silenceSamples

        const newBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            newLength,
            sampleRate
        )

        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const newData = newBuffer.getChannelData(ch)
            const originalData = audioBuffer.getChannelData(ch)
            newData.set(originalData, silenceSamples)
        }

        return newBuffer
    }
    return audioBuffer
}

/**
 * 오디오 뒤에 빈공간을 추가하여 타겟 초 까지 연장
 */
export function extendAudioBuffer(audioContext: AudioContext, oldBuffer: AudioBuffer, targetSeconds: number) {
    const numberOfChannels = oldBuffer.numberOfChannels;
    const sampleRate = oldBuffer.sampleRate;
    const oldLength = oldBuffer.length;
    const targetLength = Math.floor(targetSeconds * sampleRate);

    // 새 버퍼 길이는 기존 길이 vs 목표 길이 중 큰 값
    const newLength = Math.max(oldLength, targetLength);

    const newBuffer = audioContext.createBuffer(
        numberOfChannels,
        newLength,
        sampleRate
    );

    for (let channel = 0; channel < numberOfChannels; channel++) {
        const oldData = oldBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);

        // 기존 데이터 복사
        newData.set(oldData, 0);

        // 뒤쪽은 자동으로 0 (무음)
    }

    return newBuffer;
}

/**
 * bpm에 대해 기본 딜레이 구함
 */
export function getDefaultDelay(bpm: number) {
    return 240 / bpm;
}

/**
 * 동캇 추가
 */
export async function mergeBuffersWithOverlays(
    audioContext: AudioContext,
    baseBuffer: AudioBuffer,
    overlays: HitSoundData[],
    songVol: number = 100,
    seVol: number = 100,
): Promise<AudioBuffer> {
    const donBuffer = await audioContext.decodeAudioData(DON_SOUND.slice(0));
    const kaBuffer = await audioContext.decodeAudioData(KA_SOUND.slice(0));

    const sampleRate = baseBuffer.sampleRate
    const channels = baseBuffer.numberOfChannels

    // 🔹 1. 최종 길이 계산
    let totalLength = baseBuffer.length

    for (const track of overlays) {
        const buffer = track.type === "don" ? donBuffer : kaBuffer

        const startSample = Math.floor(track.timing * sampleRate)
        const endSample = startSample + buffer.length

        if (endSample > totalLength) {
            totalLength = endSample
        }
    }

    // 🔹 2. 결과 버퍼 생성
    const output = new AudioBuffer({
        length: totalLength,
        numberOfChannels: channels,
        sampleRate
    })

    // 🔹 3. base 복사
    for (let ch = 0; ch < channels; ch++) {
        const baseData = baseBuffer.getChannelData(ch)
        const outData = output.getChannelData(ch)
        for (let i = 0; i < baseData.length; i++) {
            outData[i] = baseData[i] * (songVol / 100)
        }

        outData.set(baseData, 0)
    }

    // 🔹 4. overlay 직접 합산
    for (const track of overlays) {

        const buffer = track.type === "don" ? donBuffer : kaBuffer
        const startSample = Math.floor(track.timing * sampleRate)

        for (let ch = 0; ch < channels; ch++) {

            const outData = output.getChannelData(ch)

            // overlay 채널이 부족하면 0번 채널 사용 (mono 대응)
            const overlayChannel = Math.min(ch, buffer.numberOfChannels - 1)
            const overlayData = buffer.getChannelData(overlayChannel)

            for (let i = 0; i < overlayData.length; i++) {
                const index = startSample + i
                if (index >= totalLength) break

                outData[index] += overlayData[i] * (seVol / 100)
            }
        }
    }

    // 🔹 5. 클리핑 방지 (필요 시)
    let max = 0

    for (let ch = 0; ch < channels; ch++) {
        const data = output.getChannelData(ch)
        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i])
            if (abs > max) max = abs
        }
    }

    if (max > 1) {
        const scale = 1 / max
        for (let ch = 0; ch < channels; ch++) {
            const data = output.getChannelData(ch)
            for (let i = 0; i < data.length; i++) {
                data[i] *= scale
            }
        }
    }

    return output
}