import * as math from 'mathjs';

export class Item {
    private timing: math.Fraction;

    constructor(timing: math.Fraction) {
        this.timing = timing;
    }

    setTiming(timing: math.Fraction){
        this.timing = math.fraction(timing);
    }

    getTiming() {
        return math.fraction(this.timing);
    }

    getTimingMS() {
        return this.timing.valueOf();
    }

    toJSON(){
        return {
            timing: this.getTimingMS()
        }
    }
}