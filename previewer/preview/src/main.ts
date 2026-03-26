import { Course, Song } from 'tja-parser';
import { Previewer } from '../../src/index.ts';
import tjaURL from './1369.tja?url';

const tja = await fetch(tjaURL).then(e => e.text());

const song = Song.parse(tja);
const oni = (song.course.edit ?? song.course.oni) as Course;
const canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = canvas.width / 4;
canvas.style.width = "100%";
document.body.appendChild(canvas);
const previewer = new Previewer(canvas);
await previewer.load(oni, 'master');

document.body.append(previewer.audioPlayer.audio)

const hs = document.createElement('input');
const hsText = document.createElement('span');
hsText.textContent = "1";
hs.type = "range";
hs.min = "0.5"
hs.max = "4"
hs.step = "0.1"
hs.value = "1"
hs.onchange = (ev) => {
    previewer.setMode("normal", hs.valueAsNumber);
    hsText.textContent = hs.value;
};
document.body.appendChild(hs);
document.body.appendChild(hsText);

window.previewer = previewer;