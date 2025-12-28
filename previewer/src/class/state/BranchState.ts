import * as Tja from 'tja-parser'
import { Item } from './types';
import { Command } from './CommandState';
import { BalloonRollNoteState, HitNoteState, RollNoteState } from './NoteState';

export class BranchState {
    branch: 'normal' | 'advanced' | 'master' = 'normal';
    barAndBranches: (Bar | Branch)[] = [];
    branchStartFrameMap = new Map<number, { type: Tja.Branch.Type, criteria: [number, number] }>();

    constructor(course: Tja.Course) {
        for (const bar of course.bars) {
            if (bar instanceof Tja.Branch) {
                const branch = new Branch(bar);
                this.barAndBranches.push(branch);
                this.branchStartFrameMap.set(branch.startFrame, {
                    type: branch.type,
                    criteria: branch.criteria
                });
            }
            else {
                this.barAndBranches.push(new Bar(bar));
            }
        }
    }

    getCurrentBranchBars(): Bar[] {
        const bars: Bar[] = [];
        for (const b of this.barAndBranches) {
            if (b instanceof Bar) {
                bars.push(b);
            }
            else {
                bars.push(...b[this.branch]);
            }
        }
        return bars;
    }

    updateCurrentBranch(frame: number, accuracy: number, roll: number) {
        const branch = this.branchStartFrameMap.get(frame);
        if (!branch) return;
        if (branch.type === Tja.Branch.Type.ROLL) {
            var value = roll;
        }
        else {
            var value = accuracy;
        }

        if (branch.criteria[1] <= value) {
            this.branch = 'master';
        }
        else if (branch.criteria[0] <= value) {
            this.branch = 'advanced';
        }
        else {
            this.branch = 'normal';
        }
    }

    getCurrentBranch() {
        return this.branch;
    }
}

export class Bar {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly items: Item[] = [];
    readonly bpm: number;
    readonly scroll: number;

    constructor(bar: Tja.Bar) {
        this.startFrame = Math.round(bar.getStart().valueOf() * 120 / 1000);
        this.endFrame = Math.round(bar.getEnd().valueOf() * 120 / 1000);
        this.bpm = bar.getBpm();
        this.scroll = bar.getScroll();

        for (const item of bar.getItems()) {
            if (item instanceof Tja.Command) {
                const commandState = new Command(item);
                this.items.push(commandState);
            }
            else if (item instanceof Tja.BalloonNote) {
                const noteState = new BalloonRollNoteState(item);
                this.items.push(noteState);
            }
            else if (item instanceof Tja.RollNote) {
                const noteState = new RollNoteState(item);
                this.items.push(noteState);
            }
            else if (item instanceof Tja.HitNote) {
                const noteState = new HitNoteState(item);
                this.items.push(noteState);
            }
        }
    }
}

export class Branch {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly type: Tja.Branch.Type;
    readonly criteria: [number, number];
    readonly normal: Bar[] = [];
    readonly advanced: Bar[] = [];
    readonly master: Bar[] = [];

    constructor(branch: Tja.Branch) {
        this.startFrame = Math.round(branch.getStart().valueOf() * 120 / 1000);
        this.endFrame = Math.round(branch.getEnd().valueOf() * 120 / 1000);
        this.type = branch.type;
        this.criteria = branch.criteria;

        if (branch.normal) {
            for (const bar of branch.normal) {
                this.normal.push(new Bar(bar));
            }
        }
        if (branch.advanced) {
            for (const bar of branch.advanced) {
                this.advanced.push(new Bar(bar));
            }
        }
        if (branch.master) {
            for (const bar of branch.master) {
                this.master.push(new Bar(bar));
            }
        }
    }
}