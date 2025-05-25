<script lang="ts">
    import { Song } from "../../../../src/class/TJA/Song";
    import { CourseObservingPlayer } from "../../../../src/class/Player/observe/CourseObservingPlayer";

    let playerContainer = $state<HTMLDivElement>();
    let tjaInput = $state<HTMLInputElement>();
    let audioInput = $state<HTMLInputElement>();
    let song = $state<Song | null>(null);
    let difficulty = $state<string | null>(null);
    let coursePlayer = $state<CourseObservingPlayer | null>(null);
    let speed = $state<number>(1);
    
    $effect(() => {
        if(coursePlayer){
            coursePlayer.speed = speed;
        }
    })

    async function onTjaLoad() {
        const file = tjaInput?.files?.[0];
        if (!file || !tjaInput) return;

        stop();
        playerContainer?.replaceChildren();
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

    async function play() {
        //@ts-expect-error
        const course = song?.courses?.[difficulty];
        if (!course) return;

        coursePlayer = new CourseObservingPlayer(course, { width: 1920 });
        playerContainer?.append(coursePlayer.canvas);
        coursePlayer.canvas.style.width = "100%";

        const audioBlob = audioInput?.files?.[0];
        if (audioBlob) {
            await coursePlayer.audioPlayer.setAudio(audioBlob);
        }
        coursePlayer.play();
    }
    function stop() {
        playerContainer?.replaceChildren();
        coursePlayer?.stop();
    }
</script>

<main>

</main>

<div class="player-container" bind:this={playerContainer}></div>

TJA:<input
    type="file"
    bind:this={tjaInput}
    accept=".tja"
    onchange={onTjaLoad}
/>
오디오:
<input type="file" bind:this={audioInput} accept="audio/*" />
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
    <input type="number" bind:value={speed}/>
{/if}
