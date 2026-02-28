import { Bar } from "tja-parser";

export class BarRenderingObject{
    bar: Bar;
    index: number;

    constructor(bar: Bar, index: number){
        this.bar = bar;
        this.index = index;
    }
}