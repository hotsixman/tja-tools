import './style.css'
import sampleTja from './sample.tja?raw';
import { Song } from 'tja-parser';
import { Previewer } from '../../../src'

window.previewer = new Previewer(Song.parse(sampleTja), 'edit');