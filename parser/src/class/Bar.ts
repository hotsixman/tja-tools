import { Command } from "./Command.js";
import { Item } from "./Item.js";
import * as math from 'mathjs';
import { Note } from "./Note.js";

export class Bar {
    private items: Item[] = [];
    private notes: Note[] = [];
    private commands: Command[] = [];
    private start: math.Fraction;
    private end: math.Fraction;
    private barLength = 0;
    private barlineHidden = false;
    private bpm: number = 160;
    private scroll: number = 1;
    constructor(start: math.Fraction, end: math.Fraction) {
        this.start = start;
        this.end = end;
    }

    pushItem(...items: Item[]) {
        this.items.push(...items);
        this.notes.push(...items.filter((item) => item instanceof Note));
        this.commands.push(...items.filter((item) => item instanceof Command));
    }
    getItems() {
        return Array.from(this.items);
    }
    getNotes() {
        return Array.from(this.notes);
    }
    getCommands() {
        return Array.from(this.commands);
    }

    getStart() {
        return math.fraction(this.start);
    }
    setStart(start: math.Fraction) {
        this.start = math.fraction(start);
    }
    getEnd() {
        return math.fraction(this.end);
    }
    setEnd(end: math.Fraction) {
        this.end = math.fraction(end);
    }
    getBarLength() {
        return this.barLength;
    }
    setBarLength(barLength: number) {
        this.barLength = barLength;
    }

    getBarlineHidden() {
        return this.barlineHidden;
    }
    setBarlineHidden(barlineHidden: boolean) {
        this.barlineHidden = barlineHidden;
    }

    setBpm(bpm: number) {
        this.bpm = bpm;
    }
    getBpm() {
        return this.bpm;
    }
    setScroll(scroll: number) {
        this.scroll = scroll;
    }
    getScroll() {
        return this.scroll;
    }

    toJSON(): any {
        return {
            start: this.start.valueOf(),
            end: this.end.valueOf(),
            items: this.items,
            notes: this.notes,
            commands: this.commands,
            barLength: this.barLength,
            type: 'bar'
        }
    }
}