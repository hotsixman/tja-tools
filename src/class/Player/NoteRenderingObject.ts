import { Note } from "../TJA/Note.js";
import { CoursePlayer } from "./CoursePlayer.js";

export class NoteRenderingObject {
    note: Note;
    coursePlayer: CoursePlayer;
    elapsed: number;

    xCoor: number;
    yCoor: number;

    constructor(option: NoteRenderingObject.ConstructionOption) {
        this.note = option.note;
        this.coursePlayer = option.coursePlayer;
        this.elapsed = option.elapsed;

        this.xCoor = this.coursePlayer.hitXCoor + ((this.note.time.valueOf() - (this.elapsed / 1000)) * (this.coursePlayer.width) * (this.note.scroll.valueOf() * this.note.bpm.valueOf() / 240));
        this.yCoor = this.coursePlayer.height / 2;
    }

    draw(frameState: CoursePlayer.FrameState, [x, y, radius]: [number, number, number]) {
        const { ctx } = this.coursePlayer;
        // 검은색 테두리
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();
        // 회색 테두리
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.arc(x, y, radius * 11 / 12, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#ece7d9';
        ctx.fill();
        ctx.closePath();
        // 안에
        const color = this.getColor();
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.arc(x, y, radius * 3 / 4, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = color ?? '';
        ctx.fill();
        ctx.closePath();
    }

    getCanvasDrawingData(frameState: CoursePlayer.FrameState): [x: number, y: number, radius: number] {
        /*
        if (this.note.type === 8 && frameState.roll === 0) {
            return [0, 0, 0];
        }
        */

        let radius = this.coursePlayer.noteRadius;
        let x = this.xCoor;
        let y = this.yCoor;

        if (this.note.type === 3 || this.note.type === 4 || this.note.type === 6 || (this.note.type === 8)) {
            radius *= 1.3;
        }

        return [x, y, radius];
    }

    getColor() {
        switch (this.note.type) {
            case 1: {
                return '#f84927';
            }
            case 3: {
                return '#f84927';
            }
            case 2: {
                return '#42bfbd';
            }
            case 4: {
                return '#42bfbd';
            }
            case 5: {
                return 'yellow';
            }
            case 6: {
                return 'yellow';
            }
            case 7: {
                return 'orange';
            }
            default: {
                return 'green';
            }
        }
    }
}

export namespace NoteRenderingObject {
    export type ConstructionOption = {
        note: Note;
        elapsed: number;
        coursePlayer: CoursePlayer;
    }
}