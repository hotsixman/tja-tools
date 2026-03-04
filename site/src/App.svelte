<script lang="ts">
  import { onMount } from "svelte";
  import { Course, Song, type Difficulty } from "tja-parser";
  import Previewer from "tja-previewer";
  import Controller from "./components/Controller.svelte";

  let canvas = $state<HTMLCanvasElement>();
  let previewer = $state<Previewer>();
  let song = $state<Song | null>(null);
  let difficulties = $state<Difficulty[]>([]);

  let canvasWidth = $state(window.innerWidth * (window.devicePixelRatio || 1));
  let canvasHeight = $derived(canvasWidth / 5);

  onMount(() => {
    if (!canvas) return;
    previewer = new Previewer(canvas);
  });

  function loadSong(tja: string) {
    reset();
    song = Song.parse(tja);
    (["easy", "normal", "hard", "oni", "edit"] as const).forEach((diff) => {
      if (song?.course[diff]) {
        difficulties.push(diff);
      }
    });
  }

  async function loadPreviewer(
    course: Course,
    branch: "normal" | "advanced" | "master",
    audioFile?: ArrayBuffer,
  ) {
    if (!previewer) return;
    await previewer.load(course, branch, audioFile);
  }

  function reset() {
    difficulties = [];
  }

  $inspect(difficulties);
</script>

<main>
  <canvas bind:this={canvas} width={canvasWidth} height={canvasHeight}>
  </canvas>
  <Controller {difficulties} {previewer} {loadSong} {loadPreviewer} {song}/>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  canvas {
    width: 100%;
  }
</style>
