import { Item } from "./Item";

export class BarLine extends Item {
    type = 'barline'
    private hidden: boolean = false;

    isHidden() {
        return this.hidden;
    }
    hide() {
        this.hidden = true;
    }
    show(){
        this.hidden = false;
    }

    toJSON(){
        return {
            ...super.toJSON(),
            type: this.type,
            hidden: this.hidden
        }
    }
}