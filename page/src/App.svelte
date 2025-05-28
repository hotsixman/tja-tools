<script lang="ts">
  import { CourseAutoPlayer } from "../../src/class/Player/auto/CourseAutoPlayer";
  import { CourseObservingPlayer } from "../../src/class/Player/observe/CourseObservingPlayer";
  import Player from "./components/player/Player.svelte";
  import Player2 from "./components/player/Player2.svelte";

  let page = $state<"observe" | "auto">("auto");

  let coursePlayer = $state<CourseAutoPlayer | CourseObservingPlayer | null>(
    null,
  );

  function setCoursePlayer(player: CourseAutoPlayer | CourseObservingPlayer){
    coursePlayer = player;
  }

  $effect(() => {
    if (page) coursePlayer?.stop();
  });
</script>

{#if page === "observe"}
  <Player {setCoursePlayer}/>
{:else if page === "auto"}
  <Player2 {setCoursePlayer}/>
{/if}
mode:
<select bind:value={page}>
  <option value="observe">observe</option>
  <option value="auto">auto</option>
</select>
