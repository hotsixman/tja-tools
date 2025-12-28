import * as Tja from "tja-parser";
import { InputState } from "./InputState";
import { HitNoteState, RollNoteState } from "./NoteState";
import { Bar, Branch, BranchState } from "./BranchState";

export class State {
    readonly course: Tja.Course;

    // frame
    frame: number = -120;

    // input
    readonly inputState = new InputState();
    drumInput: InputState.DrumInput | null = null;

    // closest note & current roll
    closestHitNoteState: HitNoteState | null = null;
    currentRollNoteState: RollNoteState | null = null;

    // branch
    branchState: BranchState;
    bars: Bar[] = [];

    constructor(course: Tja.Course) {
        this.course = course;
        this.branchState = new BranchState(course);
    }

    update() {
        // frame
        this.frame++;
        // game input
        this.inputState.update();
        this.drumInput = this.inputState.getDrumInput();


    }

    private updateBranch() {
        const bars = this.branchState.getCurrentBranchBars();
        let closestHitNoteState = null;
        let currentRollNoteState = null;

        for(const )
    }
}