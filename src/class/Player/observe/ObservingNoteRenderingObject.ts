import { Note } from "../../TJA/Note.js";
import { CoursePlayer } from "./CourseObservingPlayer.js";

export class ObservingNoteRenderingObject {
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