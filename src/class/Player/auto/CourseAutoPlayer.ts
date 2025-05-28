import { Bar } from "../../TJA/Bar";
import { Course } from "../../TJA/Course";
import { Note } from "../../TJA/Note";

export class CourseAutoPlayer {
    course: Course;
    canvas: HTMLCanvasElement;
    isPlaying: boolean = false;
    ctx: CanvasRenderingContext2D;
    animationId?: number;
    renderer: CourseAutoPlayer.Renderer;
    audioPlayer: CourseAutoPlayer.AudioPlayer;
    branch: 1 | 2 | 3 = 1;
    playOption: CourseAutoPlayer.PlayOption = {
        speed: 1.1,
        noScroll: false
    }
    onPlay: () => any | null = null;
    onStop: () => any | null = null;


    constructor(course: Course, option: CourseAutoPlayer.ConstructorOption) {
        this.course = course;
        this.canvas = option?.canvas ?? document.createElement('canvas');
        this.width = option.width ?? 1000;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.renderer = new CourseAutoPlayer.Renderer(this);
        this.audioPlayer = new CourseAutoPlayer.AudioPlayer(this);
    }

    get width() {
        return this.canvas.width;
    }
    set width(width: number) {
        this.canvas.width = width;
        this.canvas.height = this.height;
    }
    get height() {
        return this.laneWidth * 320 / 237 * 13 / 128;
    }
    get laneWidth() {
        const f = 320 / 237 * 13 / 128
        return this.width / (f + 1);
    }
    get laneStart() {
        return this.width - this.laneWidth;
    }

    play() {
        if (this.isPlaying) return;
        const THIS = this;
        THIS.ctx.reset();

        let start: number;
        const end = (THIS.course.bars.at(-1)?.entries?.at(-1)?.time ?? THIS.course.bars.at(-1).time).valueOf() * 1000 + 1000;

        const barRenderingDatas: CourseAutoPlayer.Renderer.BarRenderingData[] = [];
        const noteRenderingDatas: CourseAutoPlayer.Renderer.NoteRenderingData[] = [];

        let rollOrBalloonStart: Note | null = null;
        THIS.course.bars.forEach((bar) => initRenderingData(bar));
        barRenderingDatas.reverse();
        noteRenderingDatas.reverse();

        const hitableNotes = THIS.course.notes.filter((note) => note.type === 1 || note.type === 2 || note.type === 3 || note.type === 4);
        let lastHitNoteIndex = -1;

        THIS.animationId = requestAnimationFrame(renderFrame);
        this.audioPlayer.play();
        THIS.isPlaying = true;
        this.onPlay?.();

        function renderFrame(timeStamp: DOMHighResTimeStamp) {
            if (!start) start = timeStamp - THIS.course.song.getOffset() * 1000 + 1000;
            const elapsed = timeStamp - start;
            if (elapsed >= end) {
                return THIS.stop();
            }

            THIS.renderer.fillBackground();
            THIS.renderer.drawHit();

            barRenderingDatas.forEach((data) => updateBarRenderingData(data, elapsed));
            noteRenderingDatas.forEach((data) => updateNoteRenderingData(data, elapsed));

            barRenderingDatas.forEach((data) => THIS.renderer.renderBar(data, THIS.branch));
            noteRenderingDatas.forEach((data) => THIS.renderer.renderNote(data, THIS.branch));

            THIS.renderer.drawDrum();
            if(hitableNotes[lastHitNoteIndex + 1]){
                while(hitableNotes[lastHitNoteIndex + 1].time.valueOf() * 1000 < elapsed){
                    lastHitNoteIndex++;
                }
                const note = hitableNotes[lastHitNoteIndex + 1];
                const noteTime = hitableNotes[lastHitNoteIndex + 1].time.valueOf();
                if(elapsed <= noteTime * 1000 && noteTime * 1000 <= elapsed + 25){
                    if(note.type === 1 || note.type === 3){
                        THIS.audioPlayer.playHit('don');
                    }
                    else{
                        THIS.audioPlayer.playHit('ka');
                    }
                    lastHitNoteIndex++;
                }
            }

            THIS.animationId = requestAnimationFrame(renderFrame);
        }

        function initRenderingData(bar: Bar) {
            barRenderingDatas.push({
                type: 0,
                bar,
                x: 0
            });
            bar.notes.forEach((note) => {
                switch (note.type) {
                    case 1: case 2: case 3: case 4: {
                        return noteRenderingDatas.push({
                            type: 1,
                            x: 0,
                            y: 0,
                            note
                        })
                    }
                    case 5: case 6: case 7: {
                        return rollOrBalloonStart = note;
                    }
                    case 8: {
                        if (!rollOrBalloonStart) return;
                        switch (rollOrBalloonStart.type) {
                            case 5: case 6: {
                                noteRenderingDatas.push({
                                    type: 2,
                                    startX: 0,
                                    endX: 0,
                                    startNote: rollOrBalloonStart,
                                    endNote: note
                                });
                                return rollOrBalloonStart = null;
                            }
                            case 7: {
                                noteRenderingDatas.push({
                                    type: 3,
                                    startX: 0,
                                    endX: 0,
                                    startNote: rollOrBalloonStart,
                                    endNote: note
                                })
                                return rollOrBalloonStart = null;
                            }
                        }
                    }
                }
            })
        }

        function updateBarRenderingData(data: CourseAutoPlayer.Renderer.BarRenderingData, elapsed: number) {
            data.x = THIS.renderer.getXCoor({
                elapsed,
                bpm: data.bar.bpm,
                scroll: THIS.playOption.noScroll ? THIS.playOption.speed : THIS.playOption.speed * data.bar.scroll.valueOf(),
                time: data.bar.time
            })
        }

        function updateNoteRenderingData(data: CourseAutoPlayer.Renderer.NoteRenderingData, elapsed: number) {
            switch (data.type) {
                case 1: {
                    const { x, y } = THIS.renderer.getNormalNoteCoor({
                        elapsed,
                        bpm: data.note.bpm,
                        scroll: THIS.playOption.noScroll ? THIS.playOption.speed : THIS.playOption.speed * data.note.scroll.valueOf(),
                        time: data.note.time
                    });
                    data.x = x;
                    data.y = y;
                    break;
                }
                case 2: case 3: {
                    data.startX = THIS.renderer.getXCoor({
                        elapsed,
                        bpm: data.startNote.bpm,
                        scroll: THIS.playOption.noScroll ? THIS.playOption.speed : THIS.playOption.speed * data.startNote.scroll.valueOf(),
                        time: data.startNote.time
                    });
                    data.endX = THIS.renderer.getXCoor({
                        elapsed,
                        bpm: data.endNote.bpm,
                        scroll: THIS.playOption.noScroll ? THIS.playOption.speed : THIS.playOption.speed * data.endNote.scroll.valueOf(),
                        time: data.endNote.time
                    });
                    break;
                }
            }
        }
    }

    stop() { 
        if(!this.isPlaying) return;
        this.audioPlayer.stop();
        if(this.animationId) cancelAnimationFrame(this.animationId);
        this.isPlaying = false;
        this.onStop?.();
    }
}

export namespace CourseAutoPlayer {
    export class Renderer {
        player: CourseAutoPlayer;

        constructor(player: CourseAutoPlayer) {
            this.player = player;
        }

        get hitXCoor() {
            return this.player.laneStart + this.player.laneWidth * 320 / 237 / 16;
        }

        get noteRadius() {
            return this.player.laneWidth * 320 / 237 * 87 / 3200;
        }

        fillBackground() {
            const { ctx } = this.player;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.player.height, this.player.height);
            ctx.fillStyle = "#282828";
            ctx.fillRect(this.player.height, 0, this.player.laneWidth, this.player.height);
        }

        drawDrum() {
            const { ctx } = this.player;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.player.height, this.player.height);
        }

        drawHit() {
            const { ctx } = this.player;
            const color = 'gray';
            ctx.beginPath();
            ctx.arc(this.hitXCoor, this.player.height / 2, this.noteRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = color ?? '';
            ctx.fill();
            ctx.closePath();
        }

        getXCoor({ elapsed, bpm, scroll, time }: Renderer.GetXCoorParam) {
            return this.hitXCoor + ((time.valueOf() - (elapsed / 1000)) * (this.player.laneWidth) * (scroll.valueOf() * bpm.valueOf() / 240));
        }

        getNormalNoteCoor({ elapsed, bpm, scroll, time }: Renderer.GetXCoorParam) {
            if (time.valueOf() * 1000 > elapsed) {
                return {
                    x: this.getXCoor({ elapsed, bpm, scroll, time }),
                    y: this.player.height / 2
                }
            }
            else if (time.valueOf() * 1000 + 300 > elapsed) {
                const startX = this.hitXCoor;
                const endX = this.player.width;
                const radius = (endX - startX) / 2;
                const centerX = (endX + startX) / 2;
                const destX = this.player.width - this.noteRadius * 1.4;
                const destAngle = Math.acos((destX - centerX) / radius);

                const angle = (destAngle - Math.PI) * ((time.valueOf() * 1000 - elapsed) / 520) + Math.PI;
                return {
                    x: centerX + radius * Math.cos(angle),
                    y: this.player.height / 2 + (radius * Math.sin(angle) * 0.45)
                }
            }
            else {
                return {
                    x: null,
                    y: null
                }
            }
        }

        renderBar(data: Renderer.BarRenderingData, branch: 1 | 2 | 3) {
            if (data.bar.branch > 0 && data.bar.branch != branch) return;

            const width = this.player.laneWidth / 500;

            if (data.x < this.player.laneStart - width * 2) {
                return;
            }
            if (data.x > this.player.width + width * 2 || !data.bar.barline) {
                return;
            };

            const { ctx } = this.player;
            ctx.fillStyle = "white";
            ctx.fillRect(data.x - 1, 0, width, this.player.height);
        }

        renderNote(data: Renderer.NoteRenderingData, branch: 1 | 2 | 3) {
            switch (data.type) {
                case 1: {
                    if (data.note.branch > 0 && data.note.branch != branch) return;

                    const isBig = data.note.type === 3 || data.note.type === 4;
                    let radius = isBig ? this.noteRadius * 1.3 : this.noteRadius;

                    if (data.x > this.player.width + radius * 2) {
                        return;
                    }
                    if (data.x === null || data.y === null) {
                        return;
                    }

                    const { ctx } = this.player;

                    let color = data.note.type % 2 === 0 ? '#42bfbd' : '#f84927';
                    // 검은색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = 'black';
                    ctx.fill();
                    ctx.closePath();
                    // 회색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(data.x, data.y, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
                    ctx.fillStyle = '#ece7d9';
                    ctx.fill();
                    ctx.closePath();
                    // 안에
                    ctx.beginPath();
                    ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
                    ctx.arc(data.x, data.y, radius * 3 / 4, 0, 2 * Math.PI);
                    ctx.fillStyle = color ?? '';
                    ctx.fill();
                    ctx.closePath();

                    break;
                }
                case 2: {
                    if (data.startNote.branch > 0 && data.startNote.branch != branch) return;

                    let isBig = data.startNote.type === 6;
                    let radius = isBig ? this.noteRadius * 1.3 : this.noteRadius;

                    if (data.endX < 0 - radius * 2) return;
                    if (data.startX > this.player.width + radius * 2) return;

                    const startX = Math.max(data.startX, 0);
                    const endX = Math.min(data.endX, this.player.width);
                    const color = '#f7b800';
                    const lineWidth = this.noteRadius / 12;
                    const halfWidth = lineWidth / 2;

                    const { ctx } = this.player;

                    ctx.beginPath();
                    ctx.lineWidth = lineWidth;
                    // 윗 변
                    ctx.moveTo(startX, this.player.height / 2 - radius + halfWidth);
                    ctx.lineTo(endX, this.player.height / 2 - radius + halfWidth);
                    // 오른쪽 호
                    ctx.arc(endX, this.player.height / 2, radius - halfWidth, Math.PI * -1 * 0.5, Math.PI * 0.5);
                    // 밑 변
                    ctx.moveTo(endX, this.player.height / 2 + radius - halfWidth);
                    ctx.lineTo(startX, this.player.height / 2 + radius - halfWidth);
                    // 왼쪽 호
                    ctx.arc(startX, this.player.height / 2, radius - halfWidth, Math.PI * 0.5, Math.PI * 1.5);
                    // 채우기
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();
                    ctx.closePath();

                    // 시작점 그리기
                    // 검은색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(data.startX, this.player.height / 2, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = 'black';
                    ctx.fill();
                    ctx.closePath();
                    // 회색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(data.startX, this.player.height / 2, isBig ? radius * (1 - 1 / (12 * 1.3)) : radius * (1 - 1 / 12), 0, 2 * Math.PI);
                    ctx.fillStyle = '#ece7d9';
                    ctx.fill();
                    ctx.closePath();
                    // 안에
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(data.startX, this.player.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.closePath();
                    break;
                }
                case 3: {
                    if (data.startNote.branch > 0 && data.startNote.branch != branch) return;

                    let radius = this.noteRadius;
                    const x = data.startX > this.hitXCoor ? data.startX
                        : data.endX > this.hitXCoor ? this.hitXCoor
                            : data.endX;

                    if (x < 0 - radius * 2) return;
                    if (x > this.player.width + radius * 2) return;

                    const { ctx } = this.player;
                    const color = '#f97900';
                    // 검은색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(x, this.player.height / 2, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = 'black';
                    ctx.fill();
                    ctx.closePath();
                    // 회색 테두리
                    ctx.beginPath();
                    ctx.lineWidth = 0;
                    ctx.arc(x, this.player.height / 2, radius * (1 - 1 / 12), 0, 2 * Math.PI);
                    ctx.fillStyle = '#ece7d9';
                    ctx.fill();
                    ctx.closePath();
                    // 안에
                    ctx.beginPath();
                    ctx.lineWidth = 0; // isBig ? radius * (1 - 1 / (4 * 1.3)) : radius * (1 - 1 / 4)
                    ctx.arc(x, this.player.height / 2, radius * 3 / 4, 0, 2 * Math.PI);
                    ctx.fillStyle = color ?? '';
                    ctx.fill();
                    ctx.closePath();
                    break;
                }
            }
        }
    }
    export namespace Renderer {
        export type BarRenderingData = {
            type: 0,
            bar: Bar,
            x: number
        }
        export type NormalRenderingData = {
            type: 1,
            note: Note,
            x: number | null,
            y: number | null
        }
        export type RollRenderingData = {
            type: 2,
            startNote: Note,
            endNote: Note,
            startX: number,
            endX: number
        }
        export type BalloonRenderingData = {
            type: 3,
            startNote: Note,
            endNote: Note,
            startX: number,
            endX: number
        }
        export type NoteRenderingData = NormalRenderingData | RollRenderingData | BalloonRenderingData;

        export type GetXCoorParam = {
            elapsed: number,
            bpm: math.Fraction | number,
            scroll: math.Fraction | number,
            time: math.Fraction | number
        }
    }

    export class AudioPlayer {
        player: CourseAutoPlayer;
        musicBuffer: AudioBuffer | null;
        hitBuffer: {
            don?: AudioBuffer,
            ka?: AudioBuffer
        } = {};
        isPlaying: boolean = false;
        musicSourceNode: AudioBufferSourceNode | null = null;
        audioContext: AudioContext | null = null;
        onPlay: () => any | null = null;
        onStop: () => any | null = null;

        constructor(player: CourseAutoPlayer) {
            this.player = player;
        }

        async setMusic(audioBlob: Blob) {
            if(!this.audioContext) this.audioContext = new AudioContext();
            this.musicBuffer = await this.audioContext.decodeAudioData(
                await audioBlob.arrayBuffer(),
            );
        }

        async setHitSound(audioBlob: Blob, hit: 'don' | 'ka'){
            if(!this.audioContext) this.audioContext = new AudioContext();
            this.hitBuffer[hit] = await this.audioContext.decodeAudioData(await audioBlob.arrayBuffer());
        }

        play() {
            if (this.isPlaying) false;
            if (this.audioContext && this.musicBuffer) {
                this.musicSourceNode = this.audioContext.createBufferSource();
                this.musicSourceNode.buffer = this.musicBuffer;
                const gainNode = this.audioContext.createGain();
                gainNode.connect(this.audioContext.destination);
                gainNode.gain.value = 1;
                this.musicSourceNode.connect(gainNode);
                this.musicSourceNode.start(this.audioContext.currentTime + 1);
            }
            this.isPlaying = true;
            this.onPlay?.();
        }

        playHit(hit: 'don' | 'ka'){
            if (this.audioContext && this.hitBuffer?.[hit]) {
                const sourceNode = this.audioContext.createBufferSource();
                sourceNode.buffer = this.hitBuffer[hit];
                sourceNode.connect(this.audioContext.destination);
                sourceNode.start();
            }
        }

        stop() {
            if (!this.isPlaying) return;
            this.musicSourceNode?.stop();
            this.isPlaying = true;
            this.onStop?.();
        }
    }
    export namespace AudioPlayer {

    }
}

export namespace CourseAutoPlayer {
    export type ConstructorOption = {
        canvas?: HTMLCanvasElement,
        width?: number
    }

    export type PlayOption = {
        speed: number,
        noScroll: boolean
    }
}