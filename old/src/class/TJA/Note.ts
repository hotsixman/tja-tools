import { ValueOf } from "../../types.js";
import * as math from 'mathjs';

export class Note {
    static parse(noteText: string, bpm: math.Fraction, scroll: math.Fraction, time: math.Fraction, branch: 0 | 1 | 2 | 3) {
        return new Note({
            type: Number(noteText) as ValueOf<typeof Note.NoteType>,
            bpm,
            scroll,
            time,
            branch
        })
    }

    type: ValueOf<typeof Note.NoteType>;
    bpm: math.Fraction;
    scroll: math.Fraction;
    time: math.Fraction;
    branch: 0 | 1 | 2 | 3

    private constructor(data: Note.ConstructorData) {
        this.type = data.type;
        this.bpm = data.bpm;
        this.scroll = data.scroll;
        this.time = data.time;
        this.branch = data.branch;
    }
}

export namespace Note {
    export type ConstructorData = {
        type: ValueOf<typeof Note.NoteType>;
        bpm: math.Fraction;
        scroll: math.Fraction;
        time: math.Fraction;
        branch: 0 | 1 | 2 | 3;
    }

    export namespace NoteType {
        export const empty = 0;
        export const don = 1;
        export const ka = 2;
        export const DON = 3;
        export const KA = 4;
        export const roll = 5;
        export const ROLL = 6;
        export const balloon = 7;
        export const endroll = 8;
        export const CODON = 0xA;
        export const COKA = 0xB;
    }
}