import { InputManager } from "../InputManager";

export class InputState {
    private lastFramePressedKeySet = new Set<string>();
    private drumInput: InputState.DrumInput | null = null;
    private inputManager: InputManager = InputManager.getInstance();

    update() {
        const currentFramePressedKeySet = this.inputManager.getAllPressedKeys();
        const currentFrameInputKeySet = new Set<string>();
        for (const key of currentFramePressedKeySet) {
            if (!this.lastFramePressedKeySet.has(key)) {
                currentFrameInputKeySet.add(key);
            }
        }
        this.lastFramePressedKeySet = currentFramePressedKeySet;

        if (currentFrameInputKeySet.has('k')) {
            this.drumInput = 'rk';
        }
        else if (currentFrameInputKeySet.has('d')) {
            this.drumInput = 'lk';
        }
        else if (currentFrameInputKeySet.has('j')) {
            this.drumInput = 'rd';
        }
        else if (currentFrameInputKeySet.has('f')) {
            this.drumInput = 'ld';
        }
        else {
            this.drumInput = null;
        }
    }

    getDrumInput() {
        return this.drumInput;
    }
}
export namespace InputState {
    export type DrumInput = 'ld' | 'rd' | 'lk' | 'rk';
}