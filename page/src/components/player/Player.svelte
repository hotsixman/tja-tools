<script lang="ts">
    import { Song } from "../../../../src/class/TJA/Song";
    import { CoursePlayer } from "../../../../src/class/Player/CoursePlayer";

    let playerContainer = $state<HTMLDivElement>();
    let tjaInput = $state<HTMLInputElement>();
    let audioInput = $state<HTMLInputElement>();
    let song = $state<Song | null>(null);
    let difficulty = $state<string | null>(null);
    let coursePlayer = $state<CoursePlayer | null>(null);
    let sourceNode = $state<AudioBufferSourceNode | null>(null);

    async function onTjaLoad() {
        const file = tjaInput?.files?.[0];
        if (!file || !tjaInput) return;

        stop();
        difficulty = null;
        coursePlayer = null;

        try {
            const tja = await readText(file);
            song = Song.parse(tja);
            alert("로딩 완료");
        } catch (err) {
            alert("로딩 실패");
        }

        function readText(blob: Blob) {
            return new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as string);
                reader.onerror = () => rej(reader.error);
                reader.readAsText(blob);
            });
        }
    }
    async function onAudioLoad() {
        if (!audioInput?.files?.[0]) return;
        const audioFile = audioInput?.files?.[0];
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(
            await audioFile.arrayBuffer(),
        );
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioContext.destination);
    }

    async function play() {
        //@ts-expect-error
        const course = song?.courses?.[difficulty];
        if (!course) return;
        
        coursePlayer = new CoursePlayer(course, {width: 1920});
        playerContainer?.append(coursePlayer.canvas);
        coursePlayer.canvas.style.width = "100%";

        await onAudioLoad();

        sourceNode?.start();
        coursePlayer.play();
    }
    function stop() {
        playerContainer?.replaceChildren();
        coursePlayer?.stop();
        sourceNode?.stop();
    }
</script>

<div class="player-container" bind:this={playerContainer}></div>

TJA: <input type="file" bind:this={tjaInput} accept=".tja" onchange={onTjaLoad} />
오디오: <input type="file" bind:this={audioInput} accept="audio/*" onchange={onAudioLoad}/>
{#if song}
    <select bind:value={difficulty}>
        {#each ["easy", "normal", "hard", "oni", "edit"] as const as diff}
            {#if song.courses[diff]}
                <option value={diff}>{diff}</option>
            {/if}
        {/each}
    </select>
    <button onclick={play}> 재생 </button>
    <button onclick={stop}> 정지 </button>
{/if}
