export class InputManager {
    static instance?: InputManager;
    static getInstance(){
        if(!this.instance){
            this.instance = new InputManager();
        }
        return this.instance;
    }

    private active: boolean = false;
    private pressedKeySet = new Set<string>();

    private constructor() {
        document.addEventListener('keydown', (event) => {
            if (!this.active) return;
            event.preventDefault();
            this.pressedKeySet.add(event.key);
        });
        document.addEventListener('keyup', (event) => {
            if (!this.active) return;
            event.preventDefault();
            this.pressedKeySet.delete(event.key);
        })
    }

    isPressed(key: string) {
        return this.pressedKeySet.has(key);
    }
    getAllPressedKeys() {
        return new Set(...this.pressedKeySet);
    }
    isActive() {
        return this.active;
    }

    keydown(key: string) {
        if (!this.active) return;
        this.pressedKeySet.add(key);
    }
    keyup(key: string){
        if (!this.active) return;
        this.pressedKeySet.delete(key);
    }

    enable() {
        this.active = true;
        this.pressedKeySet.clear();
    }
    disable() {
        this.active = false;
        this.pressedKeySet.clear();
    }
}