import { Item } from "./types";
import * as Tja from 'tja-parser';

export class Command implements Item {
    startFrame: number;
    readonly command: Tja.Command;

    constructor(command: Tja.Command) {
        this.startFrame = Math.round(command.getTimingMS() * 120 / 1000);
        this.command = command;
    }
}