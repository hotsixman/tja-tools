import { Bar, BarLine, Branch, Command, Difficulty, Song } from "tja-parser";
import { Item } from "tja-parser";
import { HitNote, Note, RollNote } from "tja-parser/dist/class/Note";
import { InputManager } from "./InputManager";

export class State {
    song: Song;
    difficulty: Difficulty;
    inputManager = InputManager.getInstance();

    itemAndBranchStates: (ItemState | ItemStateBranch)[] = [];
    branchStates: ItemStateBranch[] = [];

    currentBranch: 'normal' | 'advanced' | 'master' = 'normal';
    currentBranchItemStates: ItemState[] = [];
    currentRoll: RollNoteState | null = null;

    frame: number = -1;

    constructor(song: Song, difficulty: Difficulty) {
        this.song = song;
        this.difficulty = difficulty;

        if (!this.song.course[difficulty]) throw new Error('그 난이도는 없다맨');

        const course = this.song.course[difficulty];
        const offset = (Number(this.song.metadata.offset) || 0) * 1000;
        for (const bar of course.bars) {
            if (bar instanceof Branch) {
                const itemStateBranch = new ItemStateBranch(bar, offset);
                this.itemAndBranchStates.push(itemStateBranch);
                this.branchStates.push(itemStateBranch);
            }
            else {
                const itemStates = ItemState.parseBar(bar, offset);
                this.itemAndBranchStates.push(...itemStates);
            }
        }
    }

    private getCurrentBranchItemStates() {
        const itemStates: ItemState[] = [];
        for (const is of this.itemAndBranchStates) {
            if (is instanceof ItemState) {
                itemStates.push(is);
            }
            else {
                if (this.currentBranch === "normal") {
                    itemStates.push(...is.getNormal())
                }
                else if (this.currentBranch === "advanced") {
                    itemStates.push(...is.getAdvanced())
                }
                else if (this.currentBranch === "master") {
                    itemStates.push(...is.getMaster())
                }
            }
        }
        this.currentBranchItemStates = itemStates;
    }

    private getMostCloseHitNoteState() {
        let mostCloseHitNoteState: HitNoteState | null = null;
        for (let i = 0; i < this.currentBranchItemStates.length; i++) {
            const itemState = this.currentBranchItemStates[i] as ItemState;
            if (!(itemState instanceof HitNoteState)) continue;

            if (!mostCloseHitNoteState) {
                mostCloseHitNoteState = itemState;
                continue;
            }

            if ((mostCloseHitNoteState.timingFrame - this.frame) ** 2 >= (itemState.timingFrame - this.frame) ** 2) {
                mostCloseHitNoteState = itemState;
            }
        }
        return mostCloseHitNoteState;
    }

    private checkRoll() {
        for (let i = 0; i < this.currentBranchItemStates.length; i++) {
            const itemState = this.currentBranchItemStates[i] as ItemState;
            if (!(itemState instanceof RollNoteState)) continue;

            if (itemState.startFrame <= this.frame && this.frame <= itemState.endFrame) {
                this.currentRoll = itemState;
                return;
            }
        }
        this.currentRoll = null;
    }

    update() {
        this.frame++;
        for (const itemStateBranch of this.branchStates) {
            if (this.frame === itemStateBranch.timingFrame) {
                /** @todo 분기 조정 */
                this.currentBranch = 'normal';
                break;
            }
        }
        this.getCurrentBranchItemStates();
        this.checkRoll();
        if (this.currentRoll) {

        }
        else {
            const mostCloseNoteState = this.getMostCloseHitNoteState();
        }
    }
}

abstract class ItemState {
    static parseBar(bar: Bar, offset: number = 0) {
        const itemStates: ItemState[] = [];
        for (const item of bar.getItems()) {
            if (item instanceof BarLine) {
                itemStates.push(new BarLineState(item.getTimingMS(), offset))
            }
            else if (item instanceof Note && item instanceof HitNote) {
                const noteState = new HitNoteState(item, offset);
                itemStates.push(noteState);
            }
            else if (item instanceof Command) {
                const commandState = new CommandState(item, offset);
                itemStates.push(commandState);
            }
        }
        return itemStates;
    }

    timing: number;
    timingFrame: number;

    /**
     * @param timing ms
     * @param offset ms
     */
    constructor(timing: number, offset: number = 0) {
        if (offset < 0) {
            timing -= offset;
        }

        this.timing = timing;
        this.timingFrame = Math.round(timing * 120 / 1000)
    }
}

class BarLineState extends ItemState { };

class CommandState extends ItemState {
    item: Command;

    constructor(command: Command, offset: number = 0) {
        super(command.getTimingMS(), offset);
        this.item = command;
    }
};

class NoteState extends ItemState { };

class HitNoteState extends NoteState {
    type: 1 | 2 | 3 | 4;
    hitFrame: number | null = null;
    timingBorder: [number, number, number, number, number, number];

    constructor(note: HitNote, offset: number = 0) {
        super(note.getTimingMS(), offset);
        this.type = note.type;
        this.timingBorder = [this.timingFrame - 13, this.timingFrame - 9, this.timingFrame - 3, this.timingFrame + 3, this.timingFrame + 9, this.timingFrame + 13];
    }
}

class RollNoteState extends NoteState {
    startFrame: number;
    endFrame: number;
}

class ItemStateBranch {
    timing: number;
    timingFrame: number;
    branch: Branch;
    normal: ItemState[] = [];
    advanced: ItemState[] = [];
    master: ItemState[] = [];

    constructor(branch: Branch, offset: number = 0) {
        this.branch = branch;
        let timing = branch.getStart().valueOf();
        if (offset < 0) {
            timing -= offset;
        }
        this.timing = timing;
        this.timingFrame = Math.round(timing * 120 / 1000);

        if (branch.normal) {
            for (const bar of branch.normal) {
                this.normal.push(...ItemState.parseBar(bar));
            }
        }
        if (branch.advanced) {
            for (const bar of branch.advanced) {
                this.advanced.push(...ItemState.parseBar(bar));
            }
        }
        if (branch.master) {
            for (const bar of branch.master) {
                this.master.push(...ItemState.parseBar(bar));
            }
        }
    }

    getNormal() {
        return this.normal;
    }
    getAdvanced() {
        return this.advanced;
    }
    getMaster() {
        return this.master;
    }
}