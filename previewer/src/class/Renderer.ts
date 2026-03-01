import { Bar, HitNote, Note } from "tja-parser";
import type { Previewer } from "./Previewer";

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
        this.drawBackground();
        this.drawHit();
        if (!this.previewer.loaded) {
            return;
        }
        this.previewer.bars.toReversed().forEach((bar, i, a) => {
            const index = a.length - i;
            this.renderBar(bar, index, time);
        })
    }

    drawBackground() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#282828";
        this.ctx.fillRect(0, (this.canvas.height - this.courseHeight) / 2, this.canvas.width, this.courseHeight);
    }

    drawHit() {
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
        const fontSize = this.courseHeight / 15;
        this.ctx.font = `${fontSize}px sans-serif`;
        const textWidth = this.ctx.measureText(index.toString()).width;
        this.ctx.fillText(index.toString(), xCoor - textWidth / 2, (this.canvas.height - this.courseHeight - fontSize) / 2);
    }

    renderNote(note: Note, time: number) {
        const xCoor = this.getXCoor(note.getTimingMS() / 1000, time, note.getBPM(), note.getScroll());
        if (time > note.getTimingMS() / 1000) {
            return;
        }
        if (note instanceof HitNote) {
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
    }

    getXCoor(timing: number, time: number, bpm: number, scroll: number) {
        return this.hitXCoor + ((timing - time) * (this.canvas.width) * (scroll.valueOf() * bpm.valueOf() / 240));
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