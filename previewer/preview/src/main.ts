import { Course, Song } from 'tja-parser';
import { Previewer } from '../../src/index.ts';
import soundURL from './igallta.ogg?url';
import tjaURL from './Igallta.tja?url';

const soundArrayBuffer = await fetch(soundURL).then((e) => e.arrayBuffer());
const tja = await fetch(tjaURL).then(e => e.text());

const song = Song.parse(tja);
const oni = song.course.oni as Course;
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth - 50;
canvas.height = canvas.width * 150 / 1000;
document.body.appendChild(canvas);
const previewer = await Previewer.getInstance(oni, 'master', soundArrayBuffer, canvas);

window.play = () => { previewer.play() };