import { Command } from "./Command.js";
import { Item } from "./Item.js";
import { Note } from "./Note.js";
import { NoteGroup } from "./NoteGroup.js";

export class Bar extends NoteGroup {
    private items: Item[] = [];
    private notes: Note[] = [];
    private commands: Command[] = [];
    /** Count of notes */ private barLength = 0;
    private barlineHidden = false;
    private bpm: number = 160;
    private scroll: number = 1;

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
            start: this.getStart().valueOf(),
            end: this.getEnd().valueOf(),
            items: this.items,
            notes: this.notes,
            commands: this.commands,
            barLength: this.barLength,
            type: 'bar'
        }
    }
}