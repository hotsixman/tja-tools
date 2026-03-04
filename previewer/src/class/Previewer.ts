import { Bar, BPMChangeCommand, Branch, Course, HitNote, Note, NoteGroup, ScrollCommand } from "tja-parser";
import { Renderer } from "./Renderer.js";
import { AudioPlayer } from "./AudioPlayer.js";
import type { BPMChangeData, HitSoundData, PreviewMode, ScrollChangeData } from "../types.js";
import { SILENT_OGG } from "../assets/silent.js";

export class Previewer {
    renderer: Renderer;
    audioPlayer: AudioPlayer | null = null;

    course: Course | null = null;
    branch: 'normal' | 'advanced' | 'master' | null = null;

    bars: Bar[] | null = null;
    comboTiming: number[] | null = null;
    BPMChangeTiming: BPMChangeData[] | null = null;
    scrollChangeTiming: ScrollChangeData[] | null = null;

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

    async load(course: Course, branch: 'normal' | 'advanced' | 'master', audioFile?: ArrayBuffer) {
        const { bars, comboTiming, hitSoundDatas, BPMChangeTiming, scrollChangeTiming } = this.getBars(course.noteGroups, branch);

        const songOffset = Number(course.song?.metadata.offset || 0) || 0;
        const lastBarEndTiming = bars[bars.length - 1].getEnd().valueOf() / 1000;
        const audioPlayer = await AudioPlayer.getInstance(audioFile ?? SILENT_OGG.slice(0), hitSoundDatas, songOffset, course.getBPM(), lastBarEndTiming);

        this.audioPlayer = audioPlayer;
        this.course = course;
        this.branch = branch;
        this.bars = bars;
        this.comboTiming = comboTiming;
        this.BPMChangeTiming = BPMChangeTiming;
        this.scrollChangeTiming = scrollChangeTiming;
    }

    private getBars(noteGroups: NoteGroup[], branch: 'normal' | 'advanced' | 'master') {
        this.audioPlayer?.destroy();
        this.audioPlayer = null;

        const hitSoundDatas: HitSoundData[] = [];
        const comboTiming: number[] = [];
        const BPMChangeTiming: BPMChangeData[] = [];
        const scrollChangeTiming: ScrollChangeData[] = [];
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
            bar.getCommands().forEach((command) => {
                if (command instanceof BPMChangeCommand) {
                    BPMChangeTiming.push({
                        timing: command.getTimingMS() / 1000,
                        BPM: command.value
                    });
                }
                else if (command instanceof ScrollCommand) {
                    scrollChangeTiming.push({
                        timing: command.getTimingMS() / 1000,
                        scroll: command.value
                    });
                }
            })
        });

        return { bars, comboTiming, hitSoundDatas, BPMChangeTiming, scrollChangeTiming }
    }

    get loaded() {
        return this.audioPlayer && this.course && this.branch && this.bars && this.comboTiming && this.BPMChangeTiming && this.scrollChangeTiming;
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

    getCurrentCombo(time: number) {
        if (!this.loaded) return;

        let left = 0;
        let right = this.comboTiming.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.comboTiming[mid] <= time && time < (this.comboTiming[mid + 1] ?? Infinity)) {
                return mid + 1; // 찾은 경우 인덱스 반환
            } else if (this.comboTiming[mid] < time) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return 0; // 못 찾은 경우
    }

    getCurrentBPM(time: number) {
        if (!this.loaded) return;

        let left = 0;
        let right = this.BPMChangeTiming.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.BPMChangeTiming[mid].timing <= time && time < (this.BPMChangeTiming[mid + 1]?.timing ?? Infinity)) {
                return this.BPMChangeTiming[mid].BPM; // 찾은 경우 인덱스 반환
            } else if (this.BPMChangeTiming[mid].timing < time) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return this.course.song.getBPM(); // 못 찾은 경우
    }

    getCurrentScroll(time: number) {
        if (!this.loaded) return;

        let left = 0;
        let right = this.scrollChangeTiming.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.scrollChangeTiming[mid].timing <= time && time < (this.scrollChangeTiming[mid + 1]?.timing ?? Infinity)) {
                return this.scrollChangeTiming[mid].scroll; // 찾은 경우 인덱스 반환
            } else if (this.scrollChangeTiming[mid].timing < time) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return 1; // 못 찾은 경우
    }
}