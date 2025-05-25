import { Course } from "../TJA/Course.js"
import { Note } from "../TJA/Note.js";
import { CourseRenderer } from "./CourseRenderer.js";
import { NoteRenderingObject } from "./NoteRenderingObject.js";

export class CoursePlayer {
    course: Course;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    animationId: number | null = null;
    courseRenderer: CourseRenderer;

    constructor(course: Course, option?: CoursePlayer.ConstructionOption) {
        this.course = course;
        this.canvas = document.createElement('canvas');
        this.canvas.width = option?.width ?? 1000;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.courseRenderer = new CourseRenderer(this);
        this.canvas.style.backgroundColor = "#282828";
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

    play() {
        this.ctx.reset();
        let start: number;
        const noteRenderingDatas: CourseRenderer.RenderingData[] = [];
        const barRenderingData: CourseRenderer.BarRenderingData[] = [];
        const frameState: CoursePlayer.FrameState = { roll: null };
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

        function frameRender(timeStamp: DOMHighResTimeStamp) {
            if (!start) start = timeStamp - thisObject.course.song.getOffset() * 1000;
            thisObject.ctx.reset();
            drawHit();

            const elapsed = timeStamp - start;

            barRenderingData.toReversed().forEach((renderingData) => {
                let bar = renderingData.bar
                renderingData.x = thisObject.courseRenderer.getXCoor({
                    elapsed,
                    bpm: bar.bpm,
                    scroll: bar.scroll,
                    time: bar.time
                });
                thisObject.courseRenderer.render(renderingData);
            })
            noteRenderingDatas.toReversed().forEach((renderingData) => {
                switch (renderingData.type) {
                    case 1: {
                        let note = renderingData.note
                        renderingData.x = thisObject.courseRenderer.getXCoor({
                            elapsed,
                            bpm: note.bpm,
                            scroll: note.scroll,
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
                            scroll: startNote.scroll,
                            time: startNote.time
                        });
                        renderingData.endX = thisObject.courseRenderer.getXCoor({
                            elapsed,
                            bpm: endNote.bpm,
                            scroll: endNote.scroll,
                            time: endNote.time
                        });
                        break;
                    }
                }
                thisObject.courseRenderer.render(renderingData);
            });
            thisObject.animationId = requestAnimationFrame(frameRender);
        }
        this.animationId = requestAnimationFrame(frameRender);

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
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

export namespace CoursePlayer {
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
}