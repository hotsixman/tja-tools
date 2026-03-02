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