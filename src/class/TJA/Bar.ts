import { Command } from "./Command.js";
import * as math from 'mathjs';
import { Course } from "./Course.js";
import { Note } from "./Note.js";

export class Bar {
    static parseTempBars(tempBars: Bar.TempBar[], course: Course): Bar[] {
        const state: Bar.ParseState = {
            bpm: math.fraction(course.song.getBPM()),
            scroll: math.fraction(1),
            barline: false,
            branch: 0,
            time: math.fraction(0),
            measure: { n: 4, d: 4 }
        }

        const bars: Bar[] = tempBars.map((tempBar) => Bar.parse(tempBar, state, course));

        return bars;
    }
    static parse(tempBar: Bar.TempBar, state: Bar.ParseState, course: Course): Bar {
        const entries: (Note | Command)[] = [];
        const notes: Note[] = [];
        const commands: Command[] = [];
        let bpmInit = state.bpm;
        let scrollInit = state.scroll;

        let length = 0;
        tempBar.forEach((part) => {
            if (part.type === "notes") {
                if (part.value.endsWith(',')) {
                    length += part.value.length - 1;
                }
                else {
                    length += part.value.length;
                }
            }
        });

        const time = state.time;
        tempBar.forEach((part) => {
            if (part.type === "command") {
                const command = Command.parse(part.value, state.time);
                commands.push(command);
                entries.push(command);
                switch (command.name) {
                    case "BPMCHANGE": {
                        state.bpm = math.fraction(Number(command.value));
                        break;
                    }
                    case "SCROLL": {
                        state.scroll = math.fraction(Number(command.value));
                        break;
                    }
                    case "MEASURE": {
                        const r = command.value.split('/');
                        state.measure = { n: Number(r[0]), d: Number(r[1]) };
                    }
                }
            }
            else {
                for (const char of part.value) {
                    if (char === ',') break;

                    const noteSpace = length === 0 ? math.fraction(0) : math.fraction(math.divide(math.multiply(240, state.measure.n / state.measure.d), math.multiply(state.bpm, length)) as math.Unit);
                    if (char !== "0") {
                        const note = Note.parse(char, state.bpm, state.scroll, state.time);
                        notes.push(note);
                        entries.push(note);
                    }
                    state.time = math.fraction(math.add(state.time, noteSpace));
                }
            }
        });

        return new Bar({
            time,
            entries,
            notes,
            commands,
            course,
            bpm: bpmInit,
            scroll: scrollInit
        })
    }

    time: math.Fraction;
    entries: (Note | Command)[];
    notes: Note[];
    commands: Command[];
    course: Course;

    private constructor(data: Bar.ConstructorData) {
        this.entries = data.entries;
        this.notes = data.notes;
        this.commands = data.commands;
        this.course = data.course;
        this.time = data.time;
    }

    toJSON() {
        return {
            entries: this.entries,
            notes: this.notes,
            commands: this.commands,
            time: this.time
        }
    }
}

export namespace Bar {
    export type ConstructorData = {
        time: math.Fraction;
        entries: (Note | Command)[];
        notes: Note[];
        commands: Command[];
        course: Course;
        bpm: math.Fraction;
        scroll: math.Fraction;
    }

    export type TempBar = ({ type: 'notes' | 'command', value: string })[];

    export type ParseState = {
        bpm: math.Fraction;
        scroll: math.Fraction;
        barline: boolean;
        branch: 0 | 1 | 2 | 3; // null, n, e, m
        time: math.Fraction;
        measure: { n: number, d: number };
    }
}