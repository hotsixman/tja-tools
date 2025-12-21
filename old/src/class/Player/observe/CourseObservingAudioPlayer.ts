import { CourseObservingPlayer } from "./CourseObservingPlayer";

export class CourseObservingAudioPlayer {
    coursePlayer: CourseObservingPlayer;
    audioBuffer: AudioBuffer | null;
    isPlaying: boolean = false;
    sourceNode: AudioBufferSourceNode | null = null;
    audioContext: AudioContext | null = null;
    onPlay: () => any | null = null;
    onStop: () => any | null = null;

    constructor(player: CourseObservingPlayer) {
        this.coursePlayer = player;
    }

    async setAudio(audioBlob: Blob) {
        this.audioContext = new AudioContext();
        this.audioBuffer = await this.audioContext.decodeAudioData(
            await audioBlob.arrayBuffer(),
        );
    }

    play() {
        if (this.isPlaying) false;
        if (this.audioContext && this.audioBuffer) {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.audioContext.destination);
            this.sourceNode.start(this.audioContext.currentTime + 1);
        }
        this.isPlaying = true;
        this.onPlay?.();
    }

    stop() {
        if (!this.isPlaying) return;
        this.sourceNode?.stop();
        this.isPlaying = true;
        this.onStop?.();
    }
}