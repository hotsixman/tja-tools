import { ValueOf } from "../../types.js";
import { CoursePlayer } from "./CoursePlayer.js";

export class CourseRenderer{
    coursePlayer: CoursePlayer

    constructor(player: CoursePlayer){
        this.coursePlayer = player;
    }

    getXCoor({elapsed, bpm, scroll, time}: CourseRenderer.GetCoorParam){
        return this.coursePlayer.hitXCoor + ((time.valueOf() - (elapsed / 1000)) * (this.coursePlayer.width) * (scroll.valueOf() * bpm.valueOf() / 240));
    }
}

export namespace CourseRenderer{
    export const RENDERING_DATA_TYPE = {
        bar: 0,
        normal: 1,
        roll: 2,
        balloon: 3
    }
    export interface RenderingData{
        type: ValueOf<typeof RENDERING_DATA_TYPE>
    }
    export interface NormalRenderingData extends RenderingData{
        type: typeof RENDERING_DATA_TYPE['normal'],
        noteType: 1 | 2 | 3 | 4,
        x: number
    }
    
    export type GetCoorParam = {
        elapsed: number,
        bpm: math.Fraction,
        scroll: math.Fraction,
        time: math.Fraction
    }
}