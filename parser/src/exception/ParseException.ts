import { TjaException } from './TjaException.js';

export class ParseException extends TjaException {
    line?: string;

    constructor(line?: string) {
        super();
        this.line = line;
    }
};
export class MetadataParseException extends ParseException { };
export class CourseParseException extends ParseException { };
export class UnknownCourseDifficultyException extends CourseParseException { };