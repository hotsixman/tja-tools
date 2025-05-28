<script lang="ts">
    import { Song } from "../../../../src/class/TJA/Song";
    import { CourseAutoPlayer } from '../../../../src/class/Player/auto/CourseAutoPlayer';

    let playerContainer = $state<HTMLDivElement>();
    let tjaInput = $state<HTMLInputElement>();
    let audioInput = $state<HTMLInputElement>();
    let song = $state<Song | null>(null);
    let difficulty = $state<string | null>(null);
    let coursePlayer = $state<CourseAutoPlayer | null>(null);
    let speed = $state<number>(1);
    let noScroll = $state<boolean>(false);
    let recorder: MediaRecorder | null = null;
    let download = $state<boolean>(false);
    let frameRate = $state<number>(60);
    let canvasWidth = $state<number>(1000);
    let videoBitRate = $state<number>(8000);

    $effect(() => {
        if (coursePlayer) {
            coursePlayer.playOption.speed = speed;
        }
        if (coursePlayer) {
            coursePlayer.playOption.noScroll = noScroll;
        }
    });

    async function onTjaLoad() {
        const file = tjaInput?.files?.[0];
        if (!file || !tjaInput) return;

        stop();
        difficulty = null;
        coursePlayer = null;

        try {
            const tja = await readText(file);
            song = Song.parse(tja);
            difficulty = Object.keys(song.courses)[0] ?? null;
            alert("Loading Successful");
        } catch (err) {
            alert("Loading Failed");
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

        stop();

        coursePlayer = new CourseAutoPlayer(course, {
            width: canvasWidth,
        });
        playerContainer?.append(coursePlayer.canvas);
        coursePlayer.canvas.style.width = "100%";

        const audioBlob = audioInput?.files?.[0];
        if (audioBlob) {
           await coursePlayer.audioPlayer.setMusic(audioBlob);
        }

        if (download) {
            coursePlayer.onPlay = () => {
                if (!coursePlayer) return;
                const canvasStream = coursePlayer.canvas.captureStream(
                    frameRate ?? 60,
                );
                const audioStream =
                    coursePlayer.audioPlayer.audioContext?.createMediaStreamDestination?.() ??
                    null;
                if (audioStream) {
                    coursePlayer.audioPlayer?.sourceNode?.connect(audioStream);
                }

                const mediaStreamParam = [...canvasStream.getVideoTracks()];
                if (audioStream) {
                    mediaStreamParam.push(
                        ...audioStream.stream.getAudioTracks(),
                    );
                }
                const stream = new MediaStream(mediaStreamParam);

                recorder = new MediaRecorder(stream, {
                    mimeType: "video/webm; codecs=vp9",
                    videoBitsPerSecond: videoBitRate * 1024,
                });

                const recordedChunks: Blob[] = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 6) {
                        recordedChunks.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(recordedChunks, {
                        type: "video/webm",
                    });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "recording.webm";
                    a.textContent = "Download Video";
                    a.click();
                    console.log(url);
                    a.remove();
                };

                recorder.start();
            };
            coursePlayer.onStop = () => {
                recorder?.stop();
            };
        }

        coursePlayer.play();
    }
    function stop() {
        playerContainer?.replaceChildren();
        coursePlayer?.stop();
    }
</script>

<main>
    <div class="player-container" bind:this={playerContainer}></div>
    <div class="controller-container">
        <div class="field">
            <div class="left">Tja</div>
            <div class="right">
                <input
                    type="file"
                    bind:this={tjaInput}
                    accept=".tja"
                    onchange={onTjaLoad}
                />
            </div>
        </div>
        <div class="field">
            <div class="left">Audio</div>
            <div class="right">
                <input type="file" bind:this={audioInput} accept="audio/*" />
            </div>
        </div>
        <div class="field">
            <div class="left">Difficulty</div>
            <div class="right">
                <select bind:value={difficulty}>
                    {#each ["easy", "normal", "hard", "oni", "edit"] as const as diff}
                        {#if song?.courses?.[diff]}
                            <option value={diff}>{diff}</option>
                        {/if}
                    {/each}
                </select>
            </div>
        </div>
        <div class="field">
            <div class="left">Play / Stop</div>
            <div class="right">
                <button onclick={play}> Play </button>
                <button onclick={stop}> Stop </button>
            </div>
        </div>
        <div class="field">
            <div class="left">Speed</div>
            <div class="right">
                <input type="number" bind:value={speed} />
            </div>
        </div>
        <div class="field">
            <div class="left">No scroll</div>
            <div class="right">
                <label>
                    <input type="checkbox" bind:checked={noScroll} />
                </label>
            </div>
        </div>
        <div class="field">
            <div class="left">Download</div>
            <div class="right">
                <label>
                    <input type="checkbox" bind:checked={download} />
                </label>
            </div>
        </div>
        {#if download}
            <div class="field">
                <div class="left">FPS</div>
                <div class="right">
                    <input
                        type="number"
                        bind:value={frameRate}
                        placeholder="FPS"
                    />
                </div>
            </div>
            <div class="field">
                <div class="left">Width</div>
                <div class="right">
                    <input
                        type="number"
                        bind:value={canvasWidth}
                        placeholder="px"
                    />
                </div>
            </div>
            <div class="field">
                <div class="left">Bitrate</div>
                <div class="right">
                    <input type="number" bind:value={videoBitRate} placeholder="kbps"/>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        row-gap: 10px;
    }
    .player-container {
        width: 100%;
        &:not(:has(:global(*))) {
            background-color: #282828;
            aspect-ratio: 30336 / 4160;
        }
    }
    .controller-container {
        width: min(100%, 500px);
        background-color: rgb(227, 219, 231);
        display: flex;
        flex-direction: column;

        border-radius: 10px;
        overflow: hidden;

        & .field {
            display: flex;

            & * {
                box-sizing: border-box;
                padding: 5px;
            }
            & .left {
                width: 100px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: rgb(231, 227, 219);
            }
            & .right {
                width: calc(100% - 100px);
                display: flex;
                justify-content: center;
                align-items: center;
                column-gap: 10px;
            }
        }
    }
</style>
