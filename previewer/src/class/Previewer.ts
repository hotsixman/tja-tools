import { Difficulty, Song } from "tja-parser";
import { Renderer } from "./Renderer";
import { State } from "./state/State";
import { InputManager } from "./InputManager";

export class Previewer {
    state: State;
    renderer: Renderer = new Renderer();
    song: Song;
    active: boolean = false;

    constructor(song: Song, difficulty: Difficulty) {
        this.song = song;
        this.state = new State(song, difficulty);
    }

    start() {
        this.active = true;
        InputManager.getInstance().enable();
        const state = this.state;
        const renderer = this.renderer;
        const THIS = this;

        const FIXED_DT = 1000 / 120; // ms
        const startTime = performance.now();
        let lastTime = startTime;
        let accumulator = 0;

        function frame(now: number) {
            if(!THIS.active) return;
            let delta = now - lastTime;
            lastTime = now;

            // 탭 전환 등으로 폭주 방지
            if (delta > 250) delta = 250;

            accumulator += delta;

            while (accumulator >= FIXED_DT) {
                state.update(); // 항상 120fps 기준 상태 업데이트
                accumulator -= FIXED_DT;
            }

            renderer.render(state); // 모니터 주사율 따라감 (60/144/240 상관없음)
            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    stop(){
        this.active = false;
    }
}