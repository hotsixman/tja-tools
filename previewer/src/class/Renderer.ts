import { BalloonNote, Bar, HitNote, Note, RollNote } from "tja-parser";
import type { Previewer } from "./Previewer.js";

export class Renderer {
    previewer: Previewer;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(previewer: Previewer, canvas: HTMLCanvasElement) {
        this.previewer = previewer;
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Cannot get 2d context.");
        }
        this.ctx = ctx;
    }

    render(time: number) {
        this.ctx.reset();
        this.renderBackground();
        this.renderHit();
        if (!this.previewer.loaded) {
            return;
        }
        this.previewer.bars.toReversed().forEach((bar, i, a) => {
            const index = a.length - i;
            this.renderBar(bar, index, time);
        });
        this.renderCombo(time);
        this.renderBPM(time);
        this.renderScroll(time);
    }

    renderBackground() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#282828";
        this.ctx.fillRect(0, (this.canvas.height - this.courseHeight) / 2, this.canvas.width, this.courseHeight);
    }

    renderHit() {
        const color = 'gray';
        this.ctx.beginPath();
        this.ctx.arc(this.hitXCoor, this.canvas.height / 2, this.noteRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fillStyle = color ?? '';
        this.ctx.fill();
        this.ctx.closePath();
    }

    renderBar(bar: Bar, index: number, time: number) {
        const xCoor = this.getXCoor(bar.getStart().valueOf() / 1000, time, bar.getBpm(), bar.getScroll());
        this.renderBarLine(xCoor, index, bar.getBarlineHidden());
        bar.getNotes().toReversed().forEach((note) => {
            this.renderNote(note, time);
        })
    }

    renderBarLine(xCoor: number, index: number, hidden: boolean) {
        if (!hidden) {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(xCoor - 1, (this.canvas.height - this.courseHeight) / 2, 2, this.courseHeight);
        }
        this.ctx.fillStyle = "white";
        const fontSize = this.courseHeight / 10;
        this.ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = this.ctx.measureText(index.toString()).width;
        this.ctx.fillText(index.toString(), xCoor - textWidth / 2, (this.canvas.height - this.courseHeight - fontSize) / 2);
    }

    renderNote(note: Note, time: number) {
        if (note instanceof HitNote) {
            if (time > note.getTimingMS() / 1000) {
                return;
            }
            const xCoor = this.getXCoor(note.getTimingMS() / 1000, time, note.getBPM(), note.getScroll());

            const ctx = this.ctx;
            let isBig = note.type === Note.Type.DON_BIG || note.type === Note.Type.KA_BIG;
            let radius = isBig ? this.noteRadius * 1.3 : this.noteRadius;

            if (xCoor < 0 - radius * 2) return false;
            if (xCoor > this.canvas.width + radius * 2) return true;

            let color = (note.type === Note.Type.KA_SMALL || note.type === Note.Type.KA_BIG) ? '#42bfbd' : '#f84927';
            // 검은색 테두리
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(xCoor, this.canvas.height / 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
            // 회색 테두리
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(xCoor, this.canvas.height / 2, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
            ctx.fillStyle = '#ece7d9';
            ctx.fill();
            ctx.closePath();
            // 안에
            ctx.beginPath();
            ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
            ctx.arc(xCoor, this.canvas.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
            ctx.fillStyle = color ?? '';
            ctx.fill();
            ctx.closePath();
        }
        else if (note instanceof BalloonNote) {
            let xCoor: number;
            if (time < note.getTimingMS() / 1000) {
                xCoor = this.getXCoor(note.getTimingMS() / 1000, time, note.getBPM(), note.getScroll())
            }
            else if (time < note.getEnd().valueOf() / 1000) {
                xCoor = this.hitXCoor
            }
            else {
                xCoor = this.getXCoor(note.getEnd().valueOf() / 1000, time, note.getBPM(), note.getScroll())
            }

            let radius = this.noteRadius;
            if (xCoor < 0 - radius * 2) return;
            if (xCoor > this.canvas.width + radius * 2) return true;

            const ctx = this.ctx;
            const color = '#f97900';
            // 검은색 테두리
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(xCoor, this.canvas.height / 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
            // 회색 테두리
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(xCoor, this.canvas.height / 2, this.noteRadius ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
            ctx.fillStyle = '#ece7d9';
            ctx.fill();
            ctx.closePath();
            // 안에
            ctx.beginPath();
            ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
            ctx.arc(xCoor, this.canvas.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
            ctx.fillStyle = color ?? '';
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = "white";
            const fontSize = this.noteRadius / 1.5;
            ctx.font = `bold ${fontSize}px sans-serif`;
            const metrics = ctx.measureText(note.getCount().toString());
            ctx.fillText(note.getCount().toString(), xCoor - metrics.width / 2, (this.canvas.height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2)
        }
        else if (note instanceof RollNote) {
            const isBig = note.type === Note.Type.ROLL_BIG;
            const radius = isBig ? this.noteRadius * 1.3 : this.noteRadius;

            const startXCoor = this.getXCoor(note.getTimingMS() / 1000, time, note.getBPM(), note.getScroll());
            const endXCoor = this.getXCoor(note.getEnd().valueOf() / 1000, time, note.getBPM(), note.getScroll());

            if (endXCoor < 0 - radius * 2) return false;
            if (startXCoor > this.canvas.width + radius * 2) return true;

            const startX = Math.max(startXCoor, 0);
            const endX = Math.min(endXCoor, this.canvas.width);
            const color = '#f7b800';
            const lineWidth = this.noteRadius / 12;
            const halfWidth = lineWidth / 2;
            const ctx = this.ctx;

            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            // 윗 변
            ctx.moveTo(startX, this.canvas.height / 2 - radius + halfWidth);
            ctx.lineTo(endX, this.canvas.height / 2 - radius + halfWidth);
            // 오른쪽 호
            ctx.arc(endX, this.canvas.height / 2, radius - halfWidth, Math.PI * -1 * 0.5, Math.PI * 0.5);
            // 밑 변
            ctx.moveTo(endX, this.canvas.height / 2 + radius - halfWidth);
            ctx.lineTo(startX, this.canvas.height / 2 + radius - halfWidth);
            // 왼쪽 호
            ctx.arc(startX, this.canvas.height / 2, radius - halfWidth, Math.PI * 0.5, Math.PI * 1.5);
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
            ctx.arc(startXCoor, this.canvas.height / 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
            // 회색 테두리
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(startXCoor, this.canvas.height / 2, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
            ctx.fillStyle = '#ece7d9';
            ctx.fill();
            ctx.closePath();
            // 안에
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(startXCoor, this.canvas.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }
    }

    renderCombo(time: number) {
        const combo = this.previewer.getCurrentCombo(time);
        if (combo === null) return;

        this.ctx.fillStyle = "white";
        const fontSize = this.courseHeight / 8;
        this.ctx.font = `bold ${fontSize}px sans-serif`;

        const text = `Combo: ${combo}`;
        const metrics = this.ctx.measureText(text);

        this.ctx.fillText(text, this.canvas.width / 100, (this.canvas.height + this.courseHeight + fontSize) / 2 + metrics.actualBoundingBoxAscent);
    }

    renderBPM(time: number){
        const BPM = this.previewer.getCurrentBPM(time);

        this.ctx.fillStyle = "white";
        const fontSize = this.courseHeight / 8;
        this.ctx.font = `bold ${fontSize}px sans-serif`;

        const text = `BPM: ${BPM}`;
        const metrics = this.ctx.measureText(text);

        this.ctx.fillText(text, this.canvas.width / 100 * 16, (this.canvas.height + this.courseHeight + fontSize) / 2 + metrics.actualBoundingBoxAscent);
    }

    renderScroll(time: number){
        const scroll = this.previewer.getCurrentScroll(time);

        this.ctx.fillStyle = "white";
        const fontSize = this.courseHeight / 8;
        this.ctx.font = `bold ${fontSize}px sans-serif`;

        const text = `Scroll: ${scroll}`;
        const metrics = this.ctx.measureText(text);

        this.ctx.fillText(text, this.canvas.width / 100 * 31, (this.canvas.height + this.courseHeight + fontSize) / 2 + metrics.actualBoundingBoxAscent);
    }

    getXCoor(timing: number, time: number, bpm: number, scroll: number) {
        const mode = this.previewer.getMode();
        if (mode.type === "normal") {
            return this.hitXCoor + ((timing - time) * (this.canvas.width) * (mode.scroll * scroll.valueOf() * bpm.valueOf() / 240));
        }
        else if (mode.type === "fixedScroll") {
            return this.hitXCoor + ((timing - time) * (this.canvas.width) * (mode.scroll * bpm.valueOf() / 240));
        }
        else {
            return this.hitXCoor + ((timing - time) * (this.canvas.width) * (mode.BPM / 240));
        }
    }

    get courseWidth() {
        return this.canvas.width;
    }
    get courseHeight() {
        return this.canvas.width * 320 / 237 * 13 / 128;
    }
    get hitXCoor() {
        return this.canvas.width * 320 / 237 / 16;
    }
    get noteRadius() {
        return this.canvas.width * 320 / 237 * 87 / 3200;
    }
}