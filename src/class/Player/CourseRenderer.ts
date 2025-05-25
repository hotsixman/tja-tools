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
                if (renderingData.x < 0 - this.coursePlayer.noteRadius * 2 || renderingData.x > this.coursePlayer.width + this.coursePlayer.noteRadius * 2 || !renderingData.bar.barline) return false;
                ctx.fillStyle = "white";
                ctx.fillRect(renderingData.x - 1, 0, 2, this.coursePlayer.height);
                return true;
            }
            case CourseRenderer.RENDERING_DATA_TYPE.NORMAL: {
                let isBig = renderingData.noteType === 3 || renderingData.noteType === 4;
                let radius = isBig ? this.coursePlayer.noteRadius * 1.3 : this.coursePlayer.noteRadius;
                if (renderingData.x < 0 - radius * 2 || renderingData.x > this.coursePlayer.width + radius * 2) return false;
                let color = renderingData.noteType % 2 === 0 ? '#42bfbd' : '#f84927';
                // 검은색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.closePath();
                // 회색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
                ctx.fillStyle = '#ece7d9';
                ctx.fill();
                ctx.closePath();
                // 안에
                ctx.beginPath();
                ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
                ctx.arc(renderingData.x, this.coursePlayer.height / 2, radius * 3 / 4 , 0, 2 * Math.PI);
                ctx.fillStyle = color ?? '';
                ctx.fill();
                ctx.closePath();
                return true;
            }
            case CourseRenderer.RENDERING_DATA_TYPE.ROLL: {
                let isBig = renderingData.noteType === 6;
                let radius = isBig ? this.coursePlayer.noteRadius * 1.3 : this.coursePlayer.noteRadius;
                if (renderingData.endX < 0 - radius * 2 || renderingData.startX > this.coursePlayer.width + radius * 2) return false;

                const startX = Math.max(renderingData.startX, 0);
                const endX = Math.min(renderingData.endX, this.coursePlayer.width);
                const color = '#f7b800';
                const lineWidth = this.coursePlayer.noteRadius / 12;
                const halfWidth = lineWidth / 2;

                ctx.beginPath();
                ctx.lineWidth = lineWidth;
                // 윗 변
                ctx.moveTo(startX, this.coursePlayer.height / 2 - radius + halfWidth);
                ctx.lineTo(endX, this.coursePlayer.height / 2 - radius + halfWidth);
                // 오른쪽 호
                ctx.arc(endX, this.coursePlayer.height / 2, radius - halfWidth, Math.PI * -1 * 0.5, Math.PI * 0.5);
                // 밑 변
                ctx.moveTo(endX, this.coursePlayer.height / 2 + radius - halfWidth);
                ctx.lineTo(startX, this.coursePlayer.height / 2 + radius - halfWidth);
                // 왼쪽 호
                ctx.arc(startX, this.coursePlayer.height / 2, radius - halfWidth, Math.PI * 0.5, Math.PI * 1.5);
                // 채우기
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'black';
                ctx.stroke();
                ctx.closePath();

                // 시작점 그리기
                // 검은색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.startX, this.coursePlayer.height / 2, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.closePath();
                // 회색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.startX, this.coursePlayer.height / 2, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
                ctx.fillStyle = '#ece7d9';
                ctx.fill();
                ctx.closePath();
                // 안에
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(renderingData.startX, this.coursePlayer.height / 2, radius * 3 / 4 , 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();
                return true;
            }
            case CourseRenderer.RENDERING_DATA_TYPE.BALLOON:{
                let radius = this.coursePlayer.noteRadius;
                const x = renderingData.startX > this.coursePlayer.hitXCoor ? renderingData.startX 
                : renderingData.endX > this.coursePlayer.hitXCoor ? this.coursePlayer.hitXCoor
                : renderingData.endX ;

                if (x < 0 - radius * 2 || x > this.coursePlayer.width + radius * 2) return false;
                const color = '#f97900';
                // 검은색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(x, this.coursePlayer.height / 2, radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.closePath();
                // 회색 테두리
                ctx.beginPath();
                ctx.lineWidth = 0;
                ctx.arc(x, this.coursePlayer.height / 2, this.coursePlayer.noteRadius ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
                ctx.fillStyle = '#ece7d9';
                ctx.fill();
                ctx.closePath();
                // 안에
                ctx.beginPath();
                ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
                ctx.arc(x, this.coursePlayer.height / 2, radius * 3 / 4 , 0, 2 * Math.PI);
                ctx.fillStyle = color ?? '';
                ctx.fill();
                ctx.closePath();
                return true;
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