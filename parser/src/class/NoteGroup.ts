import * as math from 'mathjs';

export abstract class NoteGroup {
    private start: math.Fraction;
    private end: math.Fraction;
    sectionCommand: boolean = false;

    constructor(start: math.Fraction, end: math.Fraction) {
        this.start = start;
        this.end = end;
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

    toJSON() {
        const ob: any = {
            start: this.getStart().valueOf(),
            end: this.getEnd().valueOf(),
        }
        if (this.sectionCommand) {
            ob.sectionCommand = true;
        }
        return ob;
    }
}