import type { HitSoundData } from "../types";
import { applyOffsetToBuffer, audioBufferToWav, extendAudioBuffer, getDefaultDelay, mergeBuffersWithOverlays } from "../util";

export class AudioPlayer {
    static async getInstance(audioFile: ArrayBuffer, hitSoundDatas: HitSoundData[], offset: number, bpm: number, lastBarEndTiming: number) {
        const audioLengthSecond = lastBarEndTiming + getDefaultDelay(bpm) * 2 + Math.max(0, offset);

        const audioContext = new AudioContext();
        let audioBuffer = await audioContext.decodeAudioData(audioFile);
        audioBuffer = applyOffsetToBuffer(audioContext, audioBuffer, offset);
        audioBuffer = applyOffsetToBuffer(
            audioContext,
            audioBuffer,
            getDefaultDelay(bpm)
        );
        const offsetAppliedHitSoundDatas: HitSoundData[] = [];
        hitSoundDatas.forEach((e) => {
            const newTiming = e.timing - offset;
            if (newTiming < 0) {
                return;
            }
            offsetAppliedHitSoundDatas.push({
                type: e.type,
                timing: newTiming + getDefaultDelay(bpm)
            })
        })
        audioBuffer = await mergeBuffersWithOverlays(audioContext, audioBuffer, offsetAppliedHitSoundDatas);
        if (audioLengthSecond > audioBuffer.length / audioBuffer.sampleRate) {
            audioBuffer = extendAudioBuffer(audioContext, audioBuffer, audioLengthSecond);
        }
        const offsetAppliedAudioFile = audioBufferToWav(audioBuffer);

        const url = URL.createObjectURL(offsetAppliedAudioFile);
        const audio = new Audio(url);
        audio.controls = true;
        document.body.appendChild(audio);

        return new AudioPlayer(audio, offset, bpm);
    }

    audio: HTMLAudioElement;
    offset: number;
    bpm: number;

    private constructor(audio: HTMLAudioElement, offset: number, bpm: number) {
        this.audio = audio;
        this.offset = offset;
        this.bpm = bpm;
    }

    play() {
        this.audio.play();
    }
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }
    seek(time: number) {
        this.audio.currentTime = time;
    }
    getCurrentTime() {
        return this.audio.currentTime + Math.min(this.offset, 0) - getDefaultDelay(this.bpm);
    }
}