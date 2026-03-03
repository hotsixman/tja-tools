import { Command } from "./Command.js";
import { Item } from "./Item.js";
import { Note } from "./Note.js";
import { NoteGroup } from "./NoteGroup.js";
import * as math from 'mathjs';

export class Bar extends NoteGroup {
    private items: Item[] = [];
    private notes: Note[] = [];
    private commands: Command[] = [];
    private measure = math.fraction(1);
    private barlineHidden = false;
    private bpm: number = 160;
    private scroll: number = 1;

    pushItem(...items: Item[]) {
        this.items.push(...items);
        this.notes.push(...items.filter((item) => item instanceof Note));
        this.commands.push(...items.filter((item) => item instanceof Command));
    }
    clearItems() {
        this.items = [];
        this.notes = [];
        this.commands = [];
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

    setMeasure(measure: math.Fraction) {
        this.measure = measure;
    }
    getMeasure() {
        return this.measure;
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
            ...super.toJSON(),
            items: this.items,
            notes: this.notes,
            commands: this.commands,
            type: 'bar'
        }
    }
}