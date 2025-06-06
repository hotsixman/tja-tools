import { Command } from "./Command.js";
import * as math from 'mathjs';
import { Course } from "./Course.js";
import { Note } from "./Note.js";

export class Bar {
    static parseTempBars(tempBars: Bar.TempBar[], course: Course): Bar[] {
        const state: Bar.ParseState = {
            bpm: math.fraction(course.song.getBPM()),
            scroll: math.fraction(1),
            barline: true,
            branch: 0,
            branchTime: null,
            time: math.fraction(0),
            measure: { n: 4, d: 4 },
        }

        const bars: Bar[] = tempBars.map((tempBar) => Bar.parse(tempBar, state, course));

        return bars;
    }
    static parse(tempBar: Bar.TempBar, state: Bar.ParseState, course: Course): Bar {
        const entries: (Note | Command)[] = [];
        const notes: Note[] = [];
        const commands: Command[] = [];

        let time = state.time;
        let bpm = state.bpm;
        let scroll = state.scroll;
        let barline = state.barline;
        let canChangeBarData = true;
        let branch = state.branch;

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

        tempBar.forEach((part) => {
            if (part.type === "command") {
                const command = Command.parse(part.value, state.time);
                commands.push(command);
                entries.push(command);
                switch (command.name) {
                    case "BPMCHANGE": {
                        state.bpm = math.fraction(Number(command.value));
                        if(canChangeBarData) bpm = state.bpm;
                        break;
                    }
                    case "SCROLL": {
                        state.scroll = math.fraction(Number(command.value));
                        if(canChangeBarData) scroll = state.scroll;
                        break;
                    }
                    case "MEASURE": {
                        const r = command.value.split('/');
                        state.measure = { n: Number(r[0]), d: Number(r[1]) };
                        break;
                    }
                    case "BARLINEON":{
                        state.barline = true;
                        if(canChangeBarData) barline = state.barline;
                        break;
                    }
                    case "BARLINEOFF":{
                        state.barline = false;
                        if(canChangeBarData) barline = state.barline;
                        break;
                    }
                    case "BRANCHSTART":{
                        state.branch = 0;
                        state.branchTime = state.time;
                        if(canChangeBarData) branch = state.branch;
                        break;
                    }
                    case "N":{
                        state.time = state.branchTime;
                        state.branch = 1;
                        if(canChangeBarData) time = state.time;
                        if(canChangeBarData) branch = state.branch;
                        break;
                    }
                    case "E":{
                        state.time = state.branchTime;
                        state.branch = 2;
                        if(canChangeBarData) time = state.time;
                        if(canChangeBarData) branch = state.branch;
                        break;
                    }
                    case "M":{
                        state.time = state.branchTime;
                        state.branch = 3;
                        if(canChangeBarData) time = state.time;
                        if(canChangeBarData) branch = state.branch;
                        break;
                    }
                    case "BRANCHEND":{
                        state.branch = 0;
                        state.branchTime = null;
                        if(canChangeBarData) branch = state.branch;
                        break;
                    }
                }
            }
            else {
                canChangeBarData = false;
                for (const char of part.value) {
                    if (char === ',') break;

                    const noteSpace = length === 0 ? math.fraction(0) : math.fraction(math.divide(math.multiply(240, state.measure.n / state.measure.d), math.multiply(state.bpm, length)) as math.Unit);
                    if (char !== "0") {
                        const note = Note.parse(char, state.bpm, state.scroll, state.time, state.branch);
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
            bpm,
            scroll,
            barline,
            branch
        })
    }

    time: math.Fraction;
    entries: (Note | Command)[];
    notes: Note[];
    commands: Command[];
    course: Course;
    bpm: math.Fraction;
    scroll: math.Fraction;
    barline: boolean;
    branch: 0 | 1 | 2 | 3;

    private constructor(data: Bar.ConstructorData) {
        this.entries = data.entries;
        this.notes = data.notes;
        this.commands = data.commands;
        this.course = data.course;
        this.time = data.time;
        this.bpm = data.bpm;
        this.scroll = data.scroll;
        this.barline = data.barline;
        this.branch = data.branch;
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
        barline: boolean;
        branch: 0 | 1 | 2 | 3;
    }

    export type TempBar = ({ type: 'notes' | 'command', value: string })[];

    export type ParseState = {
        bpm: math.Fraction;
        scroll: math.Fraction;
        barline: boolean;
        branch: 0 | 1 | 2 | 3; // null, n, e, m
        time: math.Fraction;
        measure: { n: number, d: number };
        branchTime: math.Fraction | null;
    }
}