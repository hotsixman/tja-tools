import * as math from 'mathjs';
import { Bar } from './Bar.js';

export class Branch extends Bar {
    type: Branch.Type;
    criteria: [number, number];
    normal?: Bar[];
    advanced?: Bar[];
    master?: Bar[];

    constructor(type: Branch.Type, criteria1: [number, number], start: math.Fraction, end: math.Fraction) {
        super(start, end);
        this.type = type;
        this.criteria = criteria1;
    }

    toJSON(){
        const superJSON = super.toJSON();
        return {
            start: superJSON.start,
            end: superJSON.end,
            normal: this.normal,
            advanced: this.advanced,
            master: this.master,
            criteria: this.criteria,
            type: 'branch',
            branchType: this.type === Branch.Type.ROLL ? 'roll' : 'acc'
        }
    }
}

export namespace Branch {
    export enum Type { ROLL, ACCURACY }
}