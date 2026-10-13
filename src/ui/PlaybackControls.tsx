import { Play, Pause, Square } from 'lucide-react';
import { usePlayback } from '../store/playbackStore';
import HelpTip from './HelpTip';
import { animationHelp } from './animationHelp';

export default function PlaybackControls() {
  const playing = usePlayback(s => s.playing), time = usePlayback(s => s.time), duration = usePlayback(s => s.duration);
  return <div className="playback-controls"><button title={playing ? 'Pause · Space' : 'Play · Space'} onClick={() => {const state = usePlayback.getState(); if (playing) state.pause(); else state.play();}}>{playing ? <Pause size={15}/> : <Play size={15}/>}</button><button title="Stop" onClick={() => usePlayback.getState().stop()}><Square size={13}/></button><span aria-label="Current Time">{time.toFixed(2)} / {duration.toFixed(2)}s</span><HelpTip label="Play / Pause / Stop" text={`${animationHelp.play}\n\n${animationHelp.pause}\n\n${animationHelp.stop}`}/></div>;
}
