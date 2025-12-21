import { Item } from "./Item.js";
import * as math from 'mathjs';

export abstract class Note extends Item {
    static parse(char: string): Note | null {
        if (char === "0") {
            return new EmptyNote(Note.Type.EMPTY, math.fraction(0), math.fraction(0));
        }
        else if (char === "1") {
            return new HitNote(Note.Type.DON_SMALL, math.fraction(0), math.fraction(0));
        }
        else if (char === "2") {
            return new HitNote(Note.Type.KA_SMALL, math.fraction(0), math.fraction(0));
        }
        else if (char === "3") {
            return new HitNote(Note.Type.DON_BIG, math.fraction(0), math.fraction(0));
        }
        else if (char === "4") {
            return new HitNote(Note.Type.KA_BIG, math.fraction(0), math.fraction(0));
        }
        else if (char === "5") {
            return new RollNote(Note.Type.ROLL_SMALL, math.fraction(0), math.fraction(0), math.fraction(0));
        }
        else if (char === "6") {
            return new RollNote(Note.Type.ROLL_BIG, math.fraction(0), math.fraction(0), math.fraction(0));
        }
        else if (char === "7") {
            return new BalloonNote(0, math.fraction(0), math.fraction(0), math.fraction(0));
        }
        else if (char === "8") {
            return new RollEndNote(math.fraction(0), math.fraction(0));
        }
        return null;
    }

    protected type: Note.Type;
    private delay: math.Fraction;
    private scroll: number = 1;
    private bpm: number = 160;
    private noteLength: number = 1;
    constructor(type: Note.Type, timing: math.Fraction, delay: math.Fraction) {
        super(timing);
        this.type = type;
        this.delay = delay;
    }

    getScroll() {
        return this.scroll;
    }
    setScroll(scroll: number) {
        this.scroll = scroll;
    }
    getBPM() {
        return this.bpm;
    }
    setBpm(bpm: number) {
        this.bpm = bpm;
    }
    getDelay() {
        return math.fraction(this.delay);
    }
    setDelay(delay: math.Fraction) {
        this.delay = math.fraction(delay);
    }
    getNoteLength(){
        return this.noteLength;
    }
    setNoteLength(noteLength: number){
        this.noteLength = noteLength;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: this.type,
            delay: this.delay.valueOf(),
            scroll: this.scroll,
            bpm: this.bpm,
            noteLength: this.noteLength
        }
    }
}

export namespace Note {
    export enum Type {
        EMPTY,
        DON_SMALL,
        KA_SMALL,
        DON_BIG,
        KA_BIG,
        ROLL_SMALL,
        ROLL_BIG,
        BALLOON,
        ROLL_END
    }

    export type HitType = Type.DON_SMALL | Type.KA_SMALL | Type.DON_BIG | Type.KA_BIG;
    export type RollType = Type.ROLL_SMALL | Type.ROLL_BIG | Type.BALLOON;
}

export class HitNote extends Note {
    declare type: Note.HitType;
    constructor(type: Note.HitType, timing: math.Fraction, delay: math.Fraction) {
        super(type, timing, delay);
    }
}

export class RollNote extends Note {
    declare type: Note.RollType;
    end: math.Fraction;
    constructor(type: Note.RollType, timing: math.Fraction, end: math.Fraction, delay: math.Fraction) {
        super(type, timing, delay);
        this.end = end;
    }

    getEnd(){
        return math.fraction(this.end);
    }
    setEnd(end: math.Fraction){
        this.end = math.fraction(end);
    }

    toJSON(){
        return {
            ...super.toJSON(),
            end: this.end.valueOf()
        }
    }
}

export class BalloonNote extends RollNote {
    declare type: Note.Type.BALLOON;
    private count: number;
    constructor(count: number, timing: math.Fraction, end: math.Fraction, delay: math.Fraction) {
        super(Note.Type.BALLOON, timing, end, delay);
        this.count = count;
    }

    getCount(){
        return this.count;
    }
    setCount(count: number){
        this.count = count;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            count: this.count
        }
    }
}

/**
 * `EmptyNote`는 파싱 과정에서만 사용합니다.
 */
export class EmptyNote extends Note {
    declare type: Note.Type.EMPTY;
    constructor(type: Note.Type.EMPTY, timing: math.Fraction, delay: math.Fraction) {
        super(type, timing, delay);
    }
}

/**
 * `RollEndNote`는 파싱 과정에서만 사용합니다.
 */
export class RollEndNote extends Note {
    declare type: Note.Type.ROLL_END;
    constructor(timing: math.Fraction, delay: math.Fraction) {
        super(Note.Type.ROLL_END, timing, delay);
    }
}