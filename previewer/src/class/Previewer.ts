import { Bar, Branch, Course, HitNote, Note, NoteGroup } from "tja-parser";
import { Renderer } from "./Renderer";
import { AudioPlayer } from "./AudioPlayer";
import type { HitSoundData, PreviewMode } from "../types";

export class Previewer {
    renderer: Renderer;
    audioPlayer: AudioPlayer | null = null;

    course: Course | null = null;
    branch: 'normal' | 'advanced' | 'master' | null = null;

    bars: Bar[] | null = null;
    comboTiming: number[] | null = null;

    requestAnimationFrameId: number | null = null;
    mode: PreviewMode = { type: "normal", scroll: 1 };

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(this, canvas);

        const step = () => {
            const currentTime = this.audioPlayer?.getCurrentTime() ?? -100;
            this.renderer.render(currentTime);
            this.requestAnimationFrameId = requestAnimationFrame(step);
        }
        this.requestAnimationFrameId = requestAnimationFrame(step);
    }

    async load(course: Course, branch: 'normal' | 'advanced' | 'master', audioFile: ArrayBuffer) {
        const { bars, comboTiming, hitSoundDatas } = this.getBars(course.noteGroups, branch);

        const songOffset = Number(course.song?.metadata.offset || 0) || 0;
        const lastBarEndTiming = bars[bars.length - 1].getEnd().valueOf() / 1000;
        const audioPlayer = await AudioPlayer.getInstance(audioFile, hitSoundDatas, songOffset, course.getBPM(), lastBarEndTiming);

        this.audioPlayer = audioPlayer;
        this.course = course;
        this.branch = branch;
        this.bars = bars;
        this.comboTiming = comboTiming;
    }

    private getBars(noteGroups: NoteGroup[], branch: 'normal' | 'advanced' | 'master') {
        this.audioPlayer?.destroy();
        this.audioPlayer = null;

        const hitSoundDatas: HitSoundData[] = [];
        const comboTiming: number[] = [];
        const bars: Bar[] = [];

        noteGroups.forEach((noteGroup) => {
            if (noteGroup instanceof Bar) {
                bars.push(noteGroup);
            }
            else if (noteGroup instanceof Branch) {
                let barGroup: Bar[] | undefined;
                if (branch === "master") {
                    barGroup = noteGroup.master ?? noteGroup.advanced ?? noteGroup.normal;
                }
                else if (branch === "advanced") {
                    barGroup = noteGroup.advanced ?? noteGroup.normal;
                }
                else {
                    barGroup = noteGroup.normal;
                }

                if (barGroup) {
                    barGroup.forEach((bar) => {
                        bars.push(bar);
                    })
                }
            }
        });

        bars.forEach((bar) => {
            bar.getNotes().forEach((note) => {
                if (note instanceof HitNote) {
                    const timing = note.getTimingMS() / 1000;

                    hitSoundDatas.push({
                        timing,
                        type: (note.type === Note.Type.DON_SMALL || note.type === Note.Type.DON_BIG) ? 'don' : 'ka'
                    });
                    comboTiming.push(timing);
                }
            });
        });

        return { bars, comboTiming, hitSoundDatas }
    }

    get loaded() {
        return this.audioPlayer && this.course && this.branch && this.bars && this.comboTiming;
    }

    play() {
        this.audioPlayer.play();
    }

    pause() {
        this.audioPlayer.pause();
    }

    seek(second: number) {
        this.audioPlayer.seek(second);
    }

    destroy() {
        cancelAnimationFrame(this.requestAnimationFrameId)
    }

    setMode(type: "normal" | "fixedScroll", scroll: number): void
    setMode(type: "fixedBPM", bpm: number): void
    setMode(type: PreviewMode['type'], num: number): void {
        if (type === "normal" || type === "fixedScroll") {
            this.mode = {
                type,
                scroll: num
            }
        }
        else {
            this.mode = {
                type,
                BPM: num
            }
        }
    }

    getMode() {
        return this.mode;
    }
}