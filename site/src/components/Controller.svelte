<script lang="ts">
    import type { Previewer, PreviewMode } from "tja-previewer";
    import type { Song, Course, Difficulty } from "tja-parser";

    interface Props {
        previewer?: Previewer;
        difficulties: Difficulty[];
        loadSong: (tja: string) => void;
        loadPreviewer: (
            course: Course,
            branch: "normal" | "advanced" | "master",
            audioFile?: ArrayBuffer,
        ) => Promise<void>;
        song: Song | null;
    }

    let { previewer, difficulties, loadSong, loadPreviewer, song }: Props =
        $props();

    let audioFile = $state<ArrayBuffer | null>(null);
    let difficulty = $state<Difficulty | undefined>();
    let branch = $state<"normal" | "advanced" | "master">("master");
    let playerContainer = $state<HTMLDivElement>();
    let audioPlayer = $state<HTMLAudioElement | null>(null);
    $effect(() => {
        if (playerContainer && audioPlayer) {
            playerContainer.replaceChildren();
            playerContainer.appendChild(audioPlayer);
        }
    });

    let mode = $state<PreviewMode["type"]>("normal");
    let scroll = $state<number>(1);
    let bpm = $state<number>(song?.getBPM() ?? 200);
    $effect(() => {
        if (!previewer) return;
        if (mode === "normal") {
            previewer?.setMode("normal", scroll);
        } else if (mode === "fixedScroll") {
            previewer?.setMode("fixedScroll", scroll);
        } else if (mode === "fixedBPM") {
            previewer?.setMode("fixedBPM", bpm);
        }
    });
    $effect(() => {
        bpm = song?.getBPM() ?? 200;
    });
</script>

<div class="container">
    <div class="section">
        <div class="section-name">Tja</div>
        <div class="section-content">
            <input
                type="file"
                accept=".tja"
                onchange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) {
                        alert("Error.");
                        return;
                    }
                    const tja = await file.text();
                    try {
                        loadSong(tja);
                        alert("Tja loaded.");
                    } catch (err) {
                        console.error(err);
                        alert("Error.");
                    }
                }}
            />
        </div>
    </div>
    <div class="section">
        <div class="section-name">Song</div>
        <div class="section-content">
            <input
                type="file"
                accept="audio/*"
                onchange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) {
                        alert("Error.");
                        return;
                    }
                    audioFile = await file.arrayBuffer();
                }}
            />
        </div>
    </div>
    <div class="section">
        <div class="section-name">Course</div>
        <div class="section-content">
            <select bind:value={difficulty}>
                {#each difficulties as diff}
                    <option value={diff}>{diff}</option>
                {/each}
            </select>
        </div>
    </div>
    <div class="section">
        <div class="section-name">Branch</div>
        <div class="section-content">
            <select bind:value={branch}>
                {#each ["normal", "advanced", "master"] as const as branch}
                    <option value={branch} selected={branch === "master"}
                        >{branch}</option
                    >
                {/each}
            </select>
        </div>
    </div>
    <div class="section">
        <div class="section-name">Load</div>
        <div class="section-content">
            <button
                onclick={async () => {
                    if (!song) {
                        alert("Tja not loaded.");
                        return;
                    }
                    if (!difficulty) {
                        alert("Please select course.");
                        return;
                    }
                    const course = song.course[difficulty];
                    if (!course) {
                        alert("No course.");
                        return;
                    }

                    try {
                        await loadPreviewer(course, branch, audioFile?.slice?.(0));
                        audioPlayer = previewer?.audioPlayer?.audio ?? null;
                        alert("Preview loaded.");
                    } catch (err) {
                        console.error(err);
                        alert("Error.");
                    }
                }}
            >
                Load
            </button>
        </div>
    </div>
    <div class="section">
        <div class="section-name">Player</div>
        <div class="section-content" bind:this={playerContainer}></div>
    </div>
    <div class="section">
        <div class="section-name">Mode</div>
        <div class="section-content">
            <select bind:value={mode}>
                <option value="normal" selected>Normal</option>
                <option value="fixedScroll" selected>Fixed scroll</option>
                <option value="fixedBPM" selected>Fixed BPM</option>
            </select>
        </div>
    </div>
    <div class="section">
        <div class="section-name">
            {mode === "fixedBPM" ? "Scroll BPM" : "Scroll speed"}
        </div>
        <div class="section-content">
            {#if mode === "fixedBPM"}
                <input type="number" bind:value={bpm} />
            {:else}
                {`${scroll.toFixed(1)}x`}
                <input
                    type="range"
                    bind:value={scroll}
                    min="0.1"
                    max="4"
                    step="0.1"
                />
            {/if}
        </div>
    </div>
</div>

<style>
    .container {
        width: 500px;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        margin-top: 20px;
    }
    .section {
        display: flex;
        flex-direction: row;
        min-height: 50px;
    }
    .section-name {
        width: 100px;
        background-color: lightgray;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .section-content {
        background-color: rgb(236, 236, 236);
        display: flex;
        flex: 1 0 auto;
        justify-content: center;
        align-items: center;
    }
</style>
