import { Course } from "../../TJA/Course.js"
import { Note } from "../../TJA/Note.js";
import { CourseObservingAudioPlayer } from "./CourseObservingAudioPlayer.js";
import { CourseRenderer } from "./CourseObservingRenderer.js";
import * as math from 'mathjs';

export class CourseObservingPlayer {
    course: Course;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    animationId: number | null = null;
    courseRenderer: CourseRenderer;
    audioPlayer: CourseObservingAudioPlayer;
    branch: 0 | 1 | 2 | 3 = 1;
    isPlaying: boolean = false;
    playingOption: CourseObservingPlayer.PlayingOption = {
        speed: 1.1,
        noScroll: false
    }
    onPlay: () => any | null = null;
    onStop: () => any | null = null;

    constructor(course: Course, option?: CourseObservingPlayer.ConstructionOption) {
        this.course = course;
        this.canvas = document.createElement('canvas');
        this.canvas.width = option?.width ?? 1000;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.courseRenderer = new CourseRenderer(this);
        this.canvas.style.backgroundColor = "#282828";
        this.audioPlayer = new CourseObservingAudioPlayer(this);
    }

    get width() {
        return this.canvas.width;
    }
    set width(width: number) {
        this.canvas.width = width;
        this.canvas.height = this.height;
    }
    get height() {
        return this.canvas.width * 320 / 237 * 13 / 128;
    }
    get hitXCoor() {
        return this.canvas.width * 320 / 237 / 16;
    }
    get noteRadius() {
        return this.width * 320 / 237 * 87 / 3200;
    }
    get yCoor() {
        return this.height / 2;
    }
    get speed(){
        return this.playingOption.speed;
    }
    set speed(speed: number){
        this.playingOption.speed = speed;
    }
    get noScroll(){
        return this.playingOption.noScroll
    }
    set noScroll(noScroll: boolean){
        this.playingOption.noScroll = noScroll;
    }
    setBranch(branch: 0 | 1 | 2 | 3) {
        this.branch = branch;
    }

    play() {
        if(this.isPlaying) return;
        this.ctx.reset();
        let start: number;
        const noteRenderingDatas: CourseRenderer.RenderingData[] = [];
        const barRenderingData: CourseRenderer.BarRenderingData[] = [];
        const thisObject = this;

        let rollOrBalloonStart: Note | null = null;
        this.course.bars.forEach((bar) => {
            barRenderingData.push({
                type: CourseRenderer.RENDERING_DATA_TYPE.BAR,
                x: 0,
                bar
            });
            bar.notes.forEach((note) => {
                switch (note.type) {
                    case 1: case 2: case 3: case 4: {
                        return noteRenderingDatas.push({
                            type: CourseRenderer.RENDERING_DATA_TYPE.NORMAL,
                            x: 0,
                            noteType: note.type,
                            note
                        })
                    }
                    case 5: case 6: case 7: {
                        return rollOrBalloonStart = note;
                    }
                    case 8: {
                        if (!rollOrBalloonStart) return;
                        switch (rollOrBalloonStart.type) {
                            case 5: case 6: {
                                noteRenderingDatas.push({
                                    type: CourseRenderer.RENDERING_DATA_TYPE.ROLL,
                                    startX: 0,
                                    endX: 0,
                                    noteType: rollOrBalloonStart.type,
                                    startNote: rollOrBalloonStart,
                                    endNote: note
                                });
                                return rollOrBalloonStart = null;
                            }
                            case 7: {
                                noteRenderingDatas.push({
                                    type: CourseRenderer.RENDERING_DATA_TYPE.BALLOON,
                                    startX: 0,
                                    endX: 0,
                                    noteType: rollOrBalloonStart.type,
                                    startNote: rollOrBalloonStart,
                                    endNote: note
                                })
                                return rollOrBalloonStart = null;
                            }
                        }
                    }
                }
            })
        })

        this.animationId = requestAnimationFrame(frameRender);
        this.audioPlayer.play();
        this.isPlaying = true;
        this.onPlay?.();

        function frameRender(timeStamp: DOMHighResTimeStamp) {
            if (!start) start = timeStamp - thisObject.course.song.getOffset() * 1000 + 1000;
            const {ctx} = thisObject;
            ctx.reset();
            ctx.fillStyle = "#282828";
            ctx.fillRect(0, 0, thisObject.width, thisObject.height);
            drawHit();

            const elapsed = timeStamp - start;
            let canRenderNextFrame = false;

            barRenderingData.toReversed().forEach((renderingData) => {
                let bar = renderingData.bar
                renderingData.x = thisObject.courseRenderer.getXCoor({
                    elapsed,
                    bpm: bar.bpm,
                    scroll: thisObject.playingOption.noScroll ? math.fraction(1) : bar.scroll.valueOf() * thisObject.playingOption.speed,
                    time: bar.time
                });
                canRenderNextFrame = thisObject.courseRenderer.render(renderingData, thisObject.branch) || canRenderNextFrame;
            })
            noteRenderingDatas.toReversed().forEach((renderingData) => {
                switch (renderingData.type) {
                    case 1: {
                        let note = renderingData.note
                        renderingData.x = thisObject.courseRenderer.getXCoor({
                            elapsed,
                            bpm: note.bpm,
                            scroll: thisObject.playingOption.noScroll ? math.fraction(1) : note.scroll.valueOf() * thisObject.playingOption.speed,
                            time: note.time
                        });
                        break;
                    }
                    case 2: case 3: {
                        let startNote = renderingData.startNote;
                        let endNote = renderingData.endNote;
                        renderingData.startX = thisObject.courseRenderer.getXCoor({
                            elapsed,
                            bpm: startNote.bpm,
                            scroll: thisObject.playingOption.noScroll ? math.fraction(1) : startNote.scroll.valueOf() * thisObject.playingOption.speed,
                            time: startNote.time
                        });
                        renderingData.endX = thisObject.courseRenderer.getXCoor({
                            elapsed,
                            bpm: endNote.bpm,
                            scroll: thisObject.playingOption.noScroll ? math.fraction(1) : endNote.scroll.valueOf() * thisObject.playingOption.speed,
                            time: endNote.time
                        });
                        break;
                    }
                }
                canRenderNextFrame = thisObject.courseRenderer.render(renderingData, thisObject.branch) || canRenderNextFrame;
            });
            if (canRenderNextFrame) {
                thisObject.animationId = requestAnimationFrame(frameRender);
            }
            else{
                thisObject.stop();
            }
        }

        function drawHit() {
            const { ctx } = thisObject;
            const color = 'gray';
            ctx.beginPath();
            ctx.arc(thisObject.hitXCoor, thisObject.height / 2, thisObject.noteRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = color ?? '';
            ctx.fill();
            ctx.closePath();
        }
    }

    stop() {
        if(!this.isPlaying) return;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.audioPlayer.stop();
        this.isPlaying = false;
        this.onStop?.();
    }
}

export namespace CourseObservingPlayer {
    export type ConstructionOption = {
        width?: number;
    }
    export type FrameState = {
        roll: null | RollState;
    }
    export type RollState = {
        x: number;
        y: number;
    }
    export type PlayingOption = {
        speed: number;
        noScroll: boolean;
    }
}