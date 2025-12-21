import { CError } from "../Error/CError.js";
import { Course } from "./Course.js";

export class Song {
    static parse(tja: string) {
        const lines = tja.split('\n').map(e => e.trim());

        const courses: Partial<Record<Course.Difficulty, Course>> = {};
        const metadata: Partial<Song.MetadataRecord> = {};

        const song = new Song({courses, metadata});

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            if (line.length === 0) {
                i++;
            }
            else if (line.startsWith('COURSE')) {
                let j = i + 1;
                while (true) {
                    if (j >= lines.length) {
                        throw new CError("TJA_COURSE_NOT_ENDED");
                    }
                    if (lines[j] === '#END') {
                        break;
                    }
                    j++;
                }
                const courseTja = lines.slice(i, j + 1).join('\n');
                const course = Course.parse(courseTja, song);
                courses[course.difficulty] = course;
                i = j + 1;
            }
            else {
                const parsedMetadata = this.parseMetadata(line);
                metadata[parsedMetadata[0]] = parsedMetadata[1];
                i++;
            }
        }

        return song;
    }

    static parseMetadata(line: string): [key: string, value: string] {
        let key = '';
        let value = '';
        let mode = 0;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === ":") {
                mode = 1;
            }
            else if (mode === 0) {
                key += char;
            }
            else {
                value += char;
            }
        };
        return [key.trim(), value.trim()];
    }

    metadata: Partial<Song.MetadataRecord> = {};
    courses: Partial<Record<Course.Difficulty, Course>> = {};
    
    private constructor(data: Song.ConstructorData) {
        this.metadata = data.metadata;
        this.courses = data.courses;
    }

    getBPM(){
        const bpm = Number(this.metadata.BPM ?? '1');
        if(Number.isNaN(bpm)) return 1;
        return bpm;
    }

    getOffset(){
        const offset = Number(this.metadata.OFFSET ?? '0');
        if(Number.isNaN(offset)) return 0;
        return offset;
    }

    getSongVol(){
        const songVol = Number(this.metadata.SONGVOL ?? '0');
        if(Number.isNaN(songVol)) return 0;
        return songVol;
    }

    getSEVol(){
        const seVol = Number(this.metadata.SEVOL ?? '0');
        if(Number.isNaN(seVol)) return 0;
        return seVol;
    }

    getDemoStart(){
        const demoStart = Number(this.metadata.DEMOSTART ?? '0');
        if(Number.isNaN(demoStart)) return 0;
        return demoStart;
    }
}

export namespace Song {
    export type ConstructorData = {
        metadata: Partial<Song.MetadataRecord>,
        courses: Partial<Record<Course.Difficulty, Course>>
    }
    export type MetadataKey = 'TITLE' | 'SUBTITLE' | 'BPM' | 'OFFSET' | 'WAVE' | 'SONGVOL' | 'SEVOL' | 'DEMOSTART';
    export type MetadataRecord = Record<Song.MetadataKey | (string & {}), string>;
}