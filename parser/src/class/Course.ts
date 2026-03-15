import { UnknownCourseDifficultyException } from "../exception/ParseException.js";
import type { Difficulty } from "../types.js";
import { Bar } from "./Bar.js";
import { Branch } from "./Branch.js";
import { BarlineCommand, BPMChangeCommand, Command, MeasureCommand, ScrollCommand } from "./Command.js";
import type { Item } from "./Item.js";
import { BalloonNote, EmptyNote, HitNote, Note, RollEndNote, RollNote } from "./Note.js";
import { NoteGroup } from "./NoteGroup.js";
import { Song } from "./Song.js";
import * as math from 'mathjs';

export class Course {
    /**
     * @throws {MetadataParseException}
     * @throws {CourseParseException}
     * @todo command와 note 파싱할 것
     */
    static parse(courseTja: string | string[], song?: Song): Course {
        if (typeof (courseTja) === "string") {
            courseTja = courseTja.split('\n');
        }

        const metadata = new Course.Metadata();
        let difficulty: Difficulty | undefined;

        let i = 0;
        for (; i < courseTja.length; i++) {
            if (courseTja[i].startsWith('#START')) {
                break;
            }
            const parsedMetadata = Song.parseMetadata(courseTja[i]);
            if (parsedMetadata.key === "course") {
                if (parsedMetadata.value === "0" || parsedMetadata.value === "Easy") {
                    difficulty = 'easy';
                }
                else if (parsedMetadata.value === "1" || parsedMetadata.value === "Normal") {
                    difficulty = 'normal';
                }
                else if (parsedMetadata.value === "2" || parsedMetadata.value === "Hard") {
                    difficulty = 'hard';
                }
                else if (parsedMetadata.value === "3" || parsedMetadata.value === "Oni") {
                    difficulty = 'oni';
                }
                else if (parsedMetadata.value === "4" || parsedMetadata.value === "Edit") {
                    difficulty = 'edit';
                }
            }
            else {
                metadata[parsedMetadata.key] = parsedMetadata.value;
            }
        }

        if (!difficulty) {
            throw new UnknownCourseDifficultyException(courseTja[0]);
        }

        const course = new Course(difficulty, metadata, song);
        course.pushNoteGroups(...this.parseBar(courseTja.slice(i), course.getBalloonIterator(), course.getBPM()));

        return course;
    }

    private static parseBar(lines: string[], getNextBalloon: () => number, bpmInit: number): NoteGroup[] {
        const lineGroups = this.groupLines(lines);

        const noteGroups = this.convertLineGroupToNoteGroup(lineGroups, getNextBalloon, bpmInit).noteGroups;
        const barGroups: Bar[][] = [];
        let currentBarGroup: Bar[] = [];
        noteGroups.forEach((noteGroup) => {
            if (noteGroup instanceof Bar) {
                currentBarGroup.push(noteGroup);
            }
            else if (noteGroup instanceof Branch) {
                barGroups.push(currentBarGroup);
                currentBarGroup = [];
                if (noteGroup.normal) {
                    barGroups.push(noteGroup.normal)
                }
                if (noteGroup.advanced) {
                    barGroups.push(noteGroup.advanced)
                }
                if (noteGroup.master) {
                    barGroups.push(noteGroup.master)
                }
            }
        });
        if (currentBarGroup.length) {
            barGroups.push(currentBarGroup);
        }
        barGroups.forEach((barGroup) => {
            this.setRollEnd(barGroup)
        });

        return noteGroups;
    }

    /**
     * Tja line을 마디 별로 묶음
     */
    private static groupLines(lines: string[]) {
        const LineGroup = Course.LineGroup;
        const BranchedLineGroup = Course.BranchedLineGroup;
        type LineGroup = Course.LineGroup;
        type BranchedLineGroup = Course.BranchedLineGroup;

        const bars: (LineGroup | BranchedLineGroup)[] = [];
        let currentBar: LineGroup | null = null;
        let currentBranchedLineGroup: BranchedLineGroup | null = null;
        let currentCourse: 'normal' | 'advanced' | 'master' | null = null;
        let sectionCommand = false;
        for (const line of lines) {
            if (line === "#START") continue;
            if (line === "#END") break;

            if (line.startsWith("#BRANCHSTART")) {
                const branchRawDatas = line.replaceAll('#BRANCHSTART', '').split(',').map(e => e.trim()) as [string, string, string];
                const type = branchRawDatas[0] === "p" ? Branch.Type.ROLL : Branch.Type.ACCURACY;
                const criteria: [number, number] = [Number(branchRawDatas[1]) || 0, Number(branchRawDatas[2]) || 0];

                currentCourse = null;
                currentBranchedLineGroup = new BranchedLineGroup(type, criteria);
                if(sectionCommand){
                    currentBranchedLineGroup.sectionCommand = sectionCommand;
                    sectionCommand = false;
                }
                currentBar = new LineGroup();
                bars.push(currentBranchedLineGroup);
            }
            else if (line === "#BRANCHEND") {
                currentCourse = null;
                currentBar = new LineGroup();
                bars.push(currentBar);
            }
            else if (line === "#N") {
                currentCourse = "normal";
                currentBar = new LineGroup();
                currentBranchedLineGroup?.addNormal(currentBar);
            }
            else if (line === "#E") {
                currentCourse = 'advanced';
                currentBar = new LineGroup();
                currentBranchedLineGroup?.addAdvanced(currentBar);
            }
            else if (line === "#M") {
                currentCourse = 'master';
                currentBar = new LineGroup();
                currentBranchedLineGroup?.addMaster(currentBar);
            }
            else if (line === "#SECTION"){
                sectionCommand = true;
            }
            else {
                if (!currentBar) {
                    currentBar = new LineGroup();
                    bars.push(currentBar);
                }
                if(sectionCommand){
                    currentBar.sectionCommand = true;
                    sectionCommand = false;
                }
                currentBar.add(line);
                if (line.endsWith(',')) {
                    if (!currentCourse) {
                        currentBar = new LineGroup();
                        bars.push(currentBar);
                    }
                    else if (currentCourse === "normal") {
                        currentBar = new LineGroup();
                        currentBranchedLineGroup?.addNormal(currentBar);
                    }
                    else if (currentCourse === "advanced") {
                        currentBar = new LineGroup();
                        currentBranchedLineGroup?.addAdvanced(currentBar);
                    }
                    else if (currentCourse === "master") {
                        currentBar = new LineGroup();
                        currentBranchedLineGroup?.addMaster(currentBar);
                    }
                }
            }
        }

        return bars;
    }

    /**
     * `LineGroup`을 `NoteGroup`으로 변환
     */
    private static convertLineGroupToNoteGroup(
        lineGroups: (Course.LineGroup | Course.BranchedLineGroup)[],
        getNextBalloon: () => number,
        currentBPM: number,
        currentTiming: math.Fraction = math.fraction(0),
        currentMeasure: math.Fraction = math.fraction(1),
        currentScroll: number = 1,
        barlineHidden: boolean = false,
    ): {
        noteGroups: NoteGroup[],
        getNextBalloon: () => number,
        currentBPM: number,
        currentTiming: math.Fraction,
        currentMeasure: math.Fraction,
        currentScroll: number,
        barlineHidden: boolean
    } {
        /** 
         * 1000ms * (240 / BPM) * currentMeasure 
         */
        function getBarLength(): math.Fraction {
            return math.fraction(math.divide(math.multiply(1000, 240, currentMeasure), math.fraction(currentBPM)) as math.Fraction);
        }

        const noteGroups: (Bar | Branch)[] = [];
        for (const lineGroup of lineGroups) {
            if (lineGroup instanceof Course.LineGroup) {
                if (lineGroup.lines.length === 0) continue;

                const bar = new Bar(math.fraction(currentTiming), math.fraction(currentTiming));
                bar.sectionCommand = lineGroup.sectionCommand;
                let noteCount = 0;
                let items: Item[] = [];
                for (const line of lineGroup.lines) {
                    if (line.startsWith('#')) {
                        const command = Command.parse(line);
                        if (command) items.push(command);
                        if (command instanceof BarlineCommand) barlineHidden = command.getHide();
                    }
                    else {
                        for (const char of line) {
                            if (char === ',') break;
                            const note = Note.parse(char);
                            if (note) {
                                items.push(note);
                                noteCount++;
                            };
                            if (note instanceof BalloonNote) {
                                note.setCount(getNextBalloon());
                            }
                        }
                    }
                }

                if (noteCount === 0) {
                    items.forEach((item) => {
                        item.setTiming(currentTiming);
                        if (item instanceof Command) {
                            if (item instanceof MeasureCommand) {
                                currentMeasure = math.fraction(item.value);
                            }
                            else if (item instanceof BPMChangeCommand) {
                                currentBPM = item.value;
                            }
                            else if (item instanceof ScrollCommand) {
                                currentScroll = item.value;
                            }
                            else if (item instanceof MeasureCommand) {
                                currentMeasure = item.value;
                            }
                            else if (item instanceof BarlineCommand) {
                                barlineHidden = item.getHide();
                            }
                        }
                    });
                    bar.setBarlineHidden(barlineHidden);
                    bar.setBpm(currentBPM);
                    bar.setScroll(currentScroll);
                    bar.setMeasure(currentMeasure);
                    currentTiming = math.add(currentTiming, getBarLength());
                    bar.setEnd(currentTiming);
                }
                else {
                    let firstNoteChecked = false;
                    // 시작 타이밍 계산
                    const notes: Note[] = [];
                    items.forEach((item) => {
                        item.setTiming(currentTiming);
                        if (item instanceof Note) {
                            if (!firstNoteChecked) {
                                bar.setBarlineHidden(barlineHidden);
                                bar.setBpm(currentBPM);
                                bar.setScroll(currentScroll);
                                bar.setMeasure(currentMeasure);
                                firstNoteChecked = true;
                            }
                            const delay = math.fraction(math.divide(getBarLength(), noteCount) as math.Fraction);
                            item.setDelay(delay);
                            item.setBpm(currentBPM);
                            item.setScroll(currentScroll);
                            currentTiming = math.add(currentTiming, delay);
                            notes.push(item);
                        }
                        else if (item instanceof Command) {
                            if (item instanceof MeasureCommand) {
                                currentMeasure = math.fraction(item.value);
                            }
                            else if (item instanceof BPMChangeCommand) {
                                currentBPM = item.value;
                            }
                            else if (item instanceof ScrollCommand) {
                                currentScroll = item.value;
                            }
                            else if (item instanceof MeasureCommand) {
                                currentMeasure = item.value;
                            }
                            else if (item instanceof BarlineCommand) {
                                barlineHidden = item.getHide();
                            }
                        }
                    });
                    bar.setEnd(currentTiming);

                    // 노트의 delay와 연타 노트의 end 조정
                    let delaySum: math.Fraction = math.fraction(0);
                    let lengthSum: number = 1;
                    for (let i = notes.length - 1; i >= 0; i--) {
                        const note = notes[i];
                        if (note instanceof EmptyNote) {
                            delaySum = math.add(delaySum, note.getDelay());
                            lengthSum++;
                        }
                        else if (note instanceof RollEndNote) {
                            delaySum = math.add(delaySum, note.getDelay());
                            lengthSum++;
                        }
                        else if (note instanceof HitNote) {
                            note.setDelay(math.add(delaySum, note.getDelay()));
                            note.setNoteLength(lengthSum);
                            delaySum = math.fraction(0);
                            lengthSum = 1;
                        }
                        else if (note instanceof RollNote || note instanceof BalloonNote) {
                            note.setDelay(math.add(delaySum, note.getDelay()));
                            note.setNoteLength(lengthSum);
                            delaySum = math.fraction(0);
                            lengthSum = 1;
                        }
                    }

                    items = items.filter((item) => {
                        if (item instanceof EmptyNote) {
                            return false;
                        }
                        return true;
                    });

                    bar.pushItem(...items);
                }
                noteGroups.push(bar);
            }
            else {
                const branch = new Branch(lineGroup.type, lineGroup.criteria, math.fraction(currentTiming), math.fraction(currentTiming));
                branch.sectionCommand = lineGroup.sectionCommand;
                let result;
                if (lineGroup.normal) {
                    result = this.convertLineGroupToNoteGroup(lineGroup.normal, getNextBalloon, currentBPM, currentTiming, currentMeasure, currentScroll, barlineHidden);
                    branch.normal = result.noteGroups as Bar[];
                }
                if (lineGroup.advanced) {
                    result = this.convertLineGroupToNoteGroup(lineGroup.advanced, getNextBalloon, currentBPM, currentTiming, currentMeasure, currentScroll, barlineHidden);
                    branch.advanced = result.noteGroups as Bar[];
                }
                if (lineGroup.master) {
                    result = this.convertLineGroupToNoteGroup(lineGroup.master, getNextBalloon, currentBPM, currentTiming, currentMeasure, currentScroll, barlineHidden);
                    branch.master = result.noteGroups as Bar[];
                }

                if (result) {
                    currentBPM = result.currentBPM;
                    currentTiming = result.currentTiming;
                    currentMeasure = result.currentMeasure;
                    currentScroll = result.currentScroll;
                    barlineHidden = result.barlineHidden;
                    branch.setEnd(result.currentTiming);
                }
                noteGroups.push(branch);
            }
        }

        return {
            noteGroups,
            getNextBalloon,
            currentBPM,
            currentTiming,
            currentMeasure,
            currentScroll,
            barlineHidden
        }
    }

    /**
     * RollEndNote를 확인하고 앞의 RollNote의 end 타이밍을 설정. 그리고 RollNote를 제거
     */
    private static setRollEnd(barGroups: Bar[]) {
        const notes = barGroups.flatMap((bar) => bar.getNotes());

        let rollEnd: math.Fraction | null = null;
        notes.toReversed().forEach((note) => {
            if (note instanceof RollEndNote) {
                rollEnd = note.getTiming();
            }
            else if (note instanceof RollNote) {
                note.end = rollEnd ? rollEnd : note.getTiming();
                rollEnd = null;
            }
        });

        barGroups.forEach((bar) => {
            const items = bar.getItems().filter((item) => {
                if (item instanceof RollEndNote) {
                    return false;
                }
                return true;
            });
            bar.clearItems();
            bar.pushItem(...items)
        });
    }

    difficulty: Difficulty;
    metadata: Course.Metadata;
    noteGroups: NoteGroup[] = [];
    song?: Song;

    constructor(difficulty: Difficulty, metadata: Course.Metadata, song?: Song) {
        this.difficulty = difficulty;
        this.metadata = metadata;
        this.song = song;
    }

    /**
     * `song`의 `getBPM`을 호출하여 반환함.
     * `song`이 존재하지 않으면 160을 반환함.
     */
    getBPM() {
        return this.song?.getBPM() || 160;
    }

    /**
     * `metadata`에서 level을 가져옴.
     * `metadata`에 level이 존재하지 않으면 1을 반환함.
     */
    getLevel() {
        return Number(this.metadata.level) || 1;
    }

    pushNoteGroups(...noteGroups: NoteGroup[]) {
        this.noteGroups.push(...noteGroups);
    }

    getBalloon() {
        return (this.metadata.balloon as string ?? '').split(',').map((e) => Number(e));
    }

    getBalloonIterator() {
        let index = 0;
        const balloons = this.getBalloon();
        function getNext() {
            const balloon = balloons[index];
            index++;
            return balloon;
        }
        return getNext;
    }

    toJSON() {
        return {
            metadata: this.metadata,
            difficulty: this.difficulty,
            noteGroups: this.noteGroups
        }
    }
}

export namespace Course {
    export class Metadata {
        level?: number;
        [key: string]: string | number | undefined;
    }

    export class LineGroup {
        lines: string[] = [];
        sectionCommand: boolean = false;
        add(line: string) {
            this.lines.push(line);
        }
    }
    export class BranchedLineGroup {
        type: Branch.Type;
        criteria: [number, number];
        normal?: LineGroup[];
        advanced?: LineGroup[];
        master?: LineGroup[];
        sectionCommand: boolean = false;

        constructor(type: Branch.Type, criteria: [number, number]) {
            this.type = type;
            this.criteria = criteria;
        }

        addNormal(lineGroup: LineGroup) {
            if (!this.normal) this.normal = [];
            this.normal.push(lineGroup);
        }
        addAdvanced(lineGroup: LineGroup) {
            if (!this.advanced) this.advanced = [];
            this.advanced.push(lineGroup);
        }
        addMaster(lineGroup: LineGroup) {
            if (!this.master) this.master = [];
            this.master.push(lineGroup);
        }
    }
}