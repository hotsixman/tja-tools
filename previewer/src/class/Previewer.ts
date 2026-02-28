import { Bar, Branch, Course, HitNote, Note } from "tja-parser";
import { Renderer } from "./Renderer";
import { AudioPlayer } from "./AudioPlayer";
import type { HitSoundData } from "../types";

export class Previewer {
    static async getInstance(course: Course, branch: 'normal' | 'advanced' | 'master', audioFile: ArrayBuffer, canvas: HTMLCanvasElement) {
        const hitSoundDatas: HitSoundData[] = [];
        const comboTiming: number[] = [];

        const bars: Bar[] = [];
        let barIndex = 0;
        course.noteGroups.forEach((noteGroup) => {
            if (noteGroup instanceof Bar) {
                bars.push(noteGroup);
                this.barProcess(noteGroup, hitSoundDatas, comboTiming);
                barIndex++;
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
                        this.barProcess(bar, hitSoundDatas, comboTiming);
                        barIndex++;
                    })
                }
            }
        });

        const songOffset = Number(course.song?.metadata.offset || 0) || 0;
        const lastBarEndTiming = bars[bars.length - 1].getEnd().valueOf() / 1000;
        const audioPlayer = await AudioPlayer.getInstance(audioFile, hitSoundDatas, songOffset, course.getBPM(), lastBarEndTiming);

        return new Previewer(course, branch, bars, comboTiming, audioPlayer, canvas);
    }

    static barProcess(bar: Bar, hitSoundDatas: HitSoundData[], comboTiming: number[]) {
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
    }

    renderer: Renderer;
    course: Course;
    branch: 'normal' | 'advanced' | 'master';
    audioPlayer: AudioPlayer;

    bars: Bar[];
    comboTiming: number[];

    requestAnimationFrameId: number | null = null;

    private constructor(
        course: Course,
        branch: 'normal' | 'advanced' | 'master',
        bars: Bar[],
        comboTiming: number[],
        audioPlayer: AudioPlayer,
        canvas: HTMLCanvasElement
    ) {
        this.renderer = new Renderer(this, canvas);
        this.course = course;
        this.bars = bars;
        this.comboTiming = comboTiming;
        this.audioPlayer = audioPlayer;
        this.branch = branch;
    }

    play() {
        const step = () => {
            const currentTime = this.audioPlayer.getCurrentTime();
            this.renderer.render(currentTime);

            this.requestAnimationFrameId = requestAnimationFrame(step);
        }
        this.requestAnimationFrameId = requestAnimationFrame(step);
        this.audioPlayer.play();
    }

    seek(second: number) {
        this.audioPlayer.seek(second);
    }
}