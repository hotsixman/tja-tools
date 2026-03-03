<script lang="ts">
    import type { Previewer } from "tja-previewer";
    import type { Song, Course, Difficulty } from "tja-parser";

    interface Props {
        previewer?: Previewer;
        difficulties: Difficulty[];
        loadSong: (tja: string) => void;
        loadPreviewer: (
            course: Course,
            branch: "normal" | "advanced" | "master",
            audioFile: ArrayBuffer,
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
        if(playerContainer && audioPlayer){
            playerContainer.replaceChildren();
            playerContainer.appendChild(audioPlayer);
        }
    })
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
                    if (!audioFile) {
                        alert("No song file.");
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

                    try{
                        await loadPreviewer(course, branch, audioFile.slice(0));
                        audioPlayer = previewer?.audioPlayer?.audio ?? null;
                        alert("Preview loaded.")
                    }
                    catch(err){
                        console.error(err);
                        alert("Error.")
                    }
                }}
            >
                Load
            </button>
        </div>
    </div>
    <div class="section">
        <div class="section-name">Player</div>
        <div class="section-content" bind:this={playerContainer}>
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
