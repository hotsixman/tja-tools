import { Item } from "./Item.js";
import * as math from 'mathjs';

export class Command extends Item {
    static parse(line: string): Command | null {
        if (line === '#BARLINEON') {
            return new BarlineCommand(false, math.fraction(0));
        }
        else if (line === "#BARLINEOFF") {
            return new BarlineCommand(true, math.fraction(0));
        }
        else if (line === "#GOGOSTART") {
            return new GOGOCommand(GOGOCommand.Type.START, math.fraction(0));
        }
        else if (line === "#GOGOEND") {
            return new GOGOCommand(GOGOCommand.Type.END, math.fraction(0));
        }
        else if (line === "#SECTION") {
            return new SectionCommand(math.fraction(0));
        }
        else if (line.startsWith('#BPMCHANGE')) {
            const value = Number(line.replace('#BPMCHANGE', ''));
            if (Number.isNaN(value)) return null;
            return new BPMChangeCommand(value, math.fraction(0));
        }
        else if (line.startsWith('#MEASURE')) {
            return new MeasureCommand(math.fraction(line.replace('#MEASURE', '').trim()), math.fraction(0));
        }
        else if (line.startsWith('#SCROLL')) {
            const value = Number(line.replace('#SCROLL', ''));
            if (Number.isNaN(value)) return null;
            return new ScrollCommand(value, math.fraction(0));
        }
        return null;
    }

    constructor(timing: math.Fraction) {
        super(timing);
    }
}

export class BarlineCommand extends Command {
    private hide: boolean;
    constructor(hide: boolean, timing: math.Fraction) {
        super(timing);
        this.hide = hide;
    }

    getHide(){
        return this.hide;
    }
    
    toJSON(){
        return {
            ...super.toJSON(),
            type: 'command-barline',
            hide: this.hide
        }
    }
}

export class BPMChangeCommand extends Command {
    value: number;
    constructor(value: number, timing: math.Fraction) {
        super(timing);
        this.value = value;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: 'command-bpmchange',
            value: this.value
        }
    }
}

export class MeasureCommand extends Command {
    value: math.Fraction;
    constructor(value: math.Fraction, timing: math.Fraction) {
        super(timing);
        this.value = value;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: 'command-measure',
            value: this.value.toString()
        }
    }
}

export class ScrollCommand extends Command {
    value: number;
    constructor(value: number, timing: math.Fraction) {
        super(timing);
        this.value = value;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: 'command-scroll',
            value: this.value
        }
    }
}

export class SectionCommand extends Command {
    toJSON() {
        return {
            ...super.toJSON(),
            type: 'command-section'
        }
    }
}

export class GOGOCommand extends Command {
    type: GOGOCommand.Type;
    constructor(type: GOGOCommand.Type, timing: math.Fraction) {
        super(timing);
        this.type = type;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: 'command-gogo',
            start: this.type === GOGOCommand.Type.START
        }
    }
}
export namespace GOGOCommand {
    export enum Type {
        START,
        END
    }
}