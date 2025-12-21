import { Course } from './Course.js';
import type { Difficulty } from '../types.js';
import { MetadataParseException } from '../exception/ParseException.js';

export class Song {
    /**
     * @throws {MetadataParseException}
     */
    static parse(tja: string): Song {
        const lines = tja.split('\n').map((e) => e.trim()).filter((e) => e);

        const metadata = new this.Metadata();
        const song = new Song(metadata);

        let i = 0;
        for (; i < lines.length; i++) {
            if (lines[i].startsWith('COURSE')) {
                break;
            }
            const parsedMetadata = this.parseMetadata(lines[i]);
            metadata[parsedMetadata.key] = parsedMetadata.value;
        }

        let courseTja: string[] = [];
        for (; i < lines.length; i++) {
            courseTja.push(lines[i]);
            if (lines[i].startsWith('#END')) {
                const course = Course.parse(courseTja, song);
                song.course[course.difficulty] = course;
                courseTja = [];
            }
        };

        return song;
    }

    /**
     * @throws {MetadataParseException}
     */
    static parseMetadata(line: string): { key: string, value: string } {
        const colonIndex = line.indexOf(':');
        if (colonIndex < 0) {
            throw new MetadataParseException(line);
        }
        const key = line.slice(0, colonIndex).toLowerCase();
        const value = line.slice(colonIndex + 1);
        return {
            key: key.trim(),
            value: value.trim()
        }
    }

    metadata: Song.Metadata;
    course: Partial<Record<Difficulty, Course>> = {};

    constructor(metadata: Song.Metadata) {
        this.metadata = metadata;
    }

    /**
     * `metadata`에서 bpm을 가져옴.
     * `metadata`에 bpm이 존재하지 않으면 `160`을 반환.
     */
    getBPM(){
        return Number(this.metadata.bpm) || 160;
    }

    toJSON(){
        return {
            metadata: this.metadata,
            course: this.course
        }
    }
}

export namespace Song {
    export class Metadata {
        title?: string;
        subtitle?: string;
        bpm?: number;
        offset?: number;
        wave?: string;
        songvol?: number;
        sevol?: number;
        demostart?: number;
        [key: string]: string | number | undefined;
    }
}