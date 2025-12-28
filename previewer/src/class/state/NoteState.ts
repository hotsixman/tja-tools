import { InputState } from "./InputState";
import { Item } from "./types";
import * as Tja from 'tja-parser';

export class HitNoteState implements Item {
    readonly startFrame: number;
    readonly goodFrame: [number, number];
    readonly okFrame: [number, number];
    readonly badFrame: [number, number];
    readonly type: 1 | 2 | 3 | 4;
    readonly bpm: number;
    readonly scroll: number;
    hit: boolean = false;
    missed: boolean = false;

    constructor(note: Tja.HitNote) {
        this.startFrame = Math.round(note.getTimingMS() * 120 / 1000);
        this.goodFrame = [this.startFrame - 3, this.startFrame + 3];
        this.okFrame = [this.startFrame - 9, this.startFrame + 9];
        this.badFrame = [this.startFrame - 13, this.startFrame + 13];
        this.type = note.type;
        this.bpm = note.getBPM();
        this.scroll = note.getScroll();
    }

    update(frame: number, drumInput: InputState.DrumInput | null): 'good' | 'ok' | 'bad' | null {
        if (this.hit || this.missed) return null;
        // 지나가버린 노트
        if (frame > this.badFrame[1]) {
            this.missed = true;
            return 'bad';
        }
        // 타격 검사
        if ((this.type === 1 || this.type === 3) && (drumInput !== 'ld' && drumInput !== 'rd')) {
            return null;
        }
        if ((this.type === 2 || this.type === 4) && (drumInput !== 'lk' && drumInput !== 'rk')) {
            return null;
        }
        // 프레임 검사
        if (this.goodFrame[0] <= frame && frame <= this.goodFrame[1]) {
            this.hit = true;
            return 'good';
        }
        if (this.okFrame[0] <= frame && frame <= this.okFrame[1]) {
            this.hit = true;
            return 'ok';
        }
        if (this.badFrame[0] <= frame && frame <= this.badFrame[1]) {
            this.hit = true;
            this.missed = true;
            return 'bad';
        };
        return null;
    }
}

export class RollNoteState implements Item {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly type: 5 | 6 | 7;
    readonly bpm: number;
    readonly scroll: number;
    hitCount: number = 0;
    hitRage: number = 0;

    constructor(note: Tja.RollNote) {
        this.startFrame = Math.round(note.getTimingMS() * 120 / 1000);
        this.endFrame = Math.round(note.getEnd().valueOf() * 120 / 1000);
        this.type = note.type;
        this.bpm = note.getBPM();
        this.scroll = note.getScroll();
    }

    update(frame: number, drumInput: InputState.DrumInput | null) {
        if (!(this.startFrame <= frame && frame <= this.endFrame) || !drumInput) {
            if (this.hitRage > 0) this.hitRage--;
            return;
        }

        this.hitCount++;
        if (this.hitRage < 4) {
            this.hitRage++;
        }
    }
}

export class BalloonRollNoteState extends RollNoteState {
    declare type: 7;
    readonly balloonCount: number;

    constructor(note: Tja.BalloonNote) {
        super(note);
        this.balloonCount = note.getCount();
    }

    update(frame: number, drumInput: InputState.DrumInput | null) {
        if (!(this.startFrame <= frame && frame <= this.endFrame) || !drumInput) {
            return;
        }

        if (this.hitCount < this.balloonCount) {
            this.hitCount++;
        }
    }
}