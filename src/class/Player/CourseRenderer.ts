import { ValueOf } from "../../types.js";
import { Bar } from "../TJA/Bar.js";
import { Note } from "../TJA/Note.js";
import { CoursePlayer } from "./CoursePlayer.js";

export class CourseRenderer {
    coursePlayer: CoursePlayer

    constructor(player: CoursePlayer) {
        this.coursePlayer = player;
    }

    getXCoor({ elapsed, bpm, scroll, time }: CourseRenderer.GetCoorParam) {
        return this.coursePlayer.hitXCoor + ((time.valueOf() - (elapsed / 1000)) * (this.coursePlayer.width) * (scroll.valueOf() * bpm.valueOf() / 240));
    }

    render(renderingData: CourseRenderer.RenderingData) {
        const { ctx } = this.coursePlayer;
        switch (renderingData.type) {
            case CourseRenderer.RENDERING_DATA_TYPE.BAR: {
                if(renderingData.x < 0 - this.coursePlayer.noteRadius * 2 || !renderingData.bar.barline) return;
                ctx.fillStyle = "white";
                ctx.fillRect(renderingData.x - 1, 0, 2, this.coursePlayer.height);
                return;
            }
            case CourseRenderer.RENDERING_DATA_TYPE.NORMAL: {
                let radius = this.coursePlayer.noteRadius;
                if(renderingData.x < 0 - radius * 2) return;
                if(renderingData.noteType === 3 || renderingData.noteType === 4){
                    radius *= 1.3;
                }
                let color = renderingData.noteType % 2 === 0 ? '#42bfbd' : '#f84927';
                // 검은색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, radius, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.closePath();
                // 회색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, radius * 11 / 12, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fillStyle = '#ece7d9';
                ctx.fill();
                ctx.closePath();
                // 안에
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fillStyle = color ?? '';
                ctx.fill();
                ctx.closePath();
                return;
            }
        }
    }
}

export namespace CourseRenderer {
    export const RENDERING_DATA_TYPE = {
        BAR: 0,
        NORMAL: 1,
        ROLL: 2,
        BALLOON: 3
    } as const;
    interface RenderingDataBase {
        type: ValueOf<typeof RENDERING_DATA_TYPE>
    }
    export interface NormalRenderingData extends RenderingDataBase {
        type: typeof RENDERING_DATA_TYPE['NORMAL'],
        noteType: 1 | 2 | 3 | 4,
        note: Note,
        x: number,
    }
    export interface BarRenderingData extends RenderingDataBase {
        type: typeof RENDERING_DATA_TYPE['BAR'],
        bar: Bar,
        x: number,
    }
    export interface RollRenderingData extends RenderingDataBase {
        type: typeof RENDERING_DATA_TYPE['ROLL'],
        noteType: 5 | 6,
        startNote: Note,
        endNote: Note,
        startX: number,
        endX: number
    }
    export interface BalloonRenderingData extends RenderingDataBase {
        type: typeof RENDERING_DATA_TYPE['BALLOON'],
        noteType: 7,
        startNote: Note,
        endNote: Note,
        startX: number,
        endX: number
    }
    export type RenderingData = NormalRenderingData | BarRenderingData | RollRenderingData | BalloonRenderingData;

    export type GetCoorParam = {
        elapsed: number,
        bpm: math.Fraction,
        scroll: math.Fraction,
        time: math.Fraction
    }
}