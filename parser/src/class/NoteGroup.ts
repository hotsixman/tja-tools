import * as math from 'mathjs';

export abstract class NoteGroup {
    private start: math.Fraction;
    private end: math.Fraction;

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
}