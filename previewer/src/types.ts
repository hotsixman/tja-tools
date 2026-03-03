export type HitSoundData = { type: 'don' | 'ka', timing: number, vol?: number };
export type PreviewMode =
    {
        type: "normal",
        scroll: number
    } | {
        type: "fixedScroll",
        scroll: number
    } | {
        type: "fixedBPM",
        BPM: number
    };

export type BPMChangeData = {
    BPM: number,
    timing: number
}

export type ScrollChangeData = {
    scroll: number,
    timing: number
}