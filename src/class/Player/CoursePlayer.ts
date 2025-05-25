import { Course } from "../TJA/Course.js"
import { Note } from "../TJA/Note.js";
import { NoteRenderingObject } from "./NoteRenderingObject.js";

export class CoursePlayer {
    course: Course;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    animationId: number | null = null;

    constructor(course: Course, option?: CoursePlayer.ConstructionOption) {
        this.course = course;
        this.canvas = document.createElement('canvas');
        this.canvas.width = option?.width ?? 1000;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
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
        let drawalbeNotes: Note[] = Array.from(this.course.notes);
        const frameState: CoursePlayer.FrameState = { roll: null };
        const thisObject = this;

        function frameRender(timeStamp: DOMHighResTimeStamp) {
            if (drawalbeNotes.length === 0) {
                console.log('stoped');
                return;
            }
            if (!start) start = timeStamp;

            thisObject.ctx.reset();
            drawHit();

            const elapsed = timeStamp - start;
            let newDrawableNotes: Note[] = [];
            for (let i = drawalbeNotes.length - 1; i >= 0; i--) {
                const note = drawalbeNotes[i];
                const noteRenderingObject = new NoteRenderingObject({
                    note,
                    elapsed,
                    coursePlayer: thisObject
                });

                const [x, y, radius] = noteRenderingObject.getCanvasDrawingData(frameState);
                if (x < 0 - radius * 2) {
                    continue;
                }
                if(note.type === Note.NoteType.endroll){
                    
                }
                if (x > thisObject.width + radius * 2) {
                    newDrawableNotes.unshift(note);
                    continue;
                }
                else {
                    noteRenderingObject.draw(frameState, [x, y, radius]);
                    newDrawableNotes.unshift(note);
                }
            }
            //console.log(`time: ${drawalbeNotes[0].time}, notes: ${thisObject.course.notes.length - drawalbeNotes.length}`);
            drawalbeNotes = newDrawableNotes;

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