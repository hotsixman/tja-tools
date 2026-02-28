import { Bar, Note } from "tja-parser";
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
        this.drawBackground();
        this.drawHit();
        this.previewer.bars.toReversed().forEach((bar, i, a) => {
            const index = a.length - i;
            this.renderBar(bar, index, time);
        })
    }

    drawBackground() {
        this.ctx.reset();
        this.ctx.fillStyle = "#282828";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        if (!bar.getBarlineHidden()) {
            this.renderBarLine(xCoor);
        }
        this.ctx.font = "60px"
        this.ctx.fillText(index.toString(), xCoor, this.canvas.height - 10);
    }

    renderBarLine(xCoor: number) {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(xCoor - 1, 0, 2, this.height);
        return true;
    }

    getXCoor(timing: number, time: number, bpm: number, scroll: number) {
        return this.hitXCoor + ((timing - time) * (this.canvas.width) * (scroll.valueOf() * bpm.valueOf() / 240));
    }

    get height() {
        return this.canvas.width * 320 / 237 * 13 / 128;
    }
    get hitXCoor() {
        return this.canvas.width * 320 / 237 / 16;
    }
    get noteRadius() {
        return this.canvas.width * 320 / 237 * 87 / 3200;
    }
}