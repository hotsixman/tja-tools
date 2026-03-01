import { Course, Song } from 'tja-parser';
import { Previewer } from '../../src/index.ts';
import soundURL from './tokimeki.ogg?url';
import tjaURL from './tokimeki.tja?url';

const soundArrayBuffer = await fetch(soundURL).then((e) => e.arrayBuffer());
const tja = await fetch(tjaURL).then(e => e.text());

const song = Song.parse(tja);
const oni = song.course.oni as Course;
const canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = canvas.width / 4;
canvas.style.width = "100%";
document.body.appendChild(canvas);
const previewer = new Previewer(canvas);
await previewer.load(oni, 'master', soundArrayBuffer);