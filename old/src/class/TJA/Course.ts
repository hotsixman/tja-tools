import { Bar } from "./Bar.js";
import { Command } from "./Command.js";
import { CError } from "../Error/CError.js";
import { Note } from "./Note.js";
import { Song } from "./Song.js";

export class Course {
    static parse(courseTja: string, song: Song): Course {
        const lines = courseTja.split('\n').map(e => e.trim());

        const metadata: Partial<Course.MetadataRecord> = {};
        const notes: Note[] = [];
        const entries: (Note | Command)[] = [];
        const commands: Command[] = [];

        const tempBars: Bar.TempBar[] = [[]];
        let i = 0;
        let isMetadata = true;
        while (i < lines.length) {
            const line = lines[i];
            if (line === '#START') {
                isMetadata = false;
            }
            else if (isMetadata) {
                const [key, value] = Song.parseMetadata(line);
                if (key) metadata[key] = value;
            }
            else if (line.startsWith('#')) {
                tempBars.at(-1)?.push({
                    type: 'command',
                    value: line
                });
                if (line === "#END") {
                    tempBars.pop();
                }
            }
            else {
                tempBars.at(-1)?.push({
                    type: 'notes',
                    value: line
                });
                if (line.endsWith(',')) {
                    tempBars.push([]);
                }
            }
            i++;
        }

        let difficulty: Course.Difficulty;
        {
            const course = (metadata.COURSE ?? 'easy').toLowerCase();
            if (course === "easy" || course === "0") {
                difficulty = "easy";
            }
            else if (course === "normal" || course === "1") {
                difficulty = "normal";
            }
            else if (course === "hard" || course === "2") {
                difficulty = "hard";
            }
            else if (course === "oni" || course === "3") {
                difficulty = "oni";
            }
            else if (course === "edit" || course === "4") {
                difficulty = "edit";
            }
            else {
                throw new CError("UNKNOWN_DIFFICULTY");
            }
        }

        const course = new Course({
            metadata,
            notes,
            entries,
            difficulty,
            commands,
            bars: [],
            song
        })

        const bars = Bar.parseTempBars(tempBars, course);

        course.bars = bars;
        bars.forEach((bar) => {
            notes.push(...bar.notes);
            commands.push(...bar.commands);
            entries.push(...bar.entries);
        })

        return course;
    }

    difficulty: Course.Difficulty;
    metadata: Partial<Course.MetadataRecord>;
    entries: (Note | Command)[];
    commands: Command[];
    notes: Note[];
    bars: Bar[];
    song: Song;

    private constructor(data: Course.ConstructorData) {
        this.metadata = data.metadata;
        this.entries = data.entries;
        this.notes = data.notes;
        this.commands = data.commands;
        this.difficulty = data.difficulty;
        this.bars = data.bars;
        this.song = data.song;
    }

    toJSON() {
        return {
            metadata: this.metadata,
            notes: this.notes,
            commands: this.commands,
            difficulty: this.difficulty,
            bars: this.bars,
        }
    }
}

export namespace Course {
    export type ConstructorData = {
        metadata: Partial<MetadataRecord>,
        notes: Note[],
        commands: Command[],
        entries: (Note | Command)[];
        difficulty: Course.Difficulty,
        bars: Bar[];
        song: Song,
    }

    export type Difficulty = 'easy' | 'normal' | 'hard' | 'oni' | 'edit';
    export type MetadataKey = 'COURSE' | 'LEVEL' | 'BALLOON' | 'SCOREINIT';
    export type MetadataRecord = Record<Course.MetadataKey | (string & {}), string>;
}