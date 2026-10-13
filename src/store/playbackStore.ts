import { create } from 'zustand';

interface PlaybackState {time: number; playing: boolean; duration: number; seek: (time: number) => void; play: () => void; pause: () => void; stop: () => void; configure: (duration: number) => void}
let frame: number | undefined;
let startTimestamp: number | undefined;
let startTime = 0;
function cancel() {if (frame !== undefined && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame); frame = undefined; startTimestamp = undefined;}
export const usePlayback = create<PlaybackState>((set, get) => ({
  time: 0, playing: false, duration: 10,
  seek(time) {get().pause(); set({time: Math.max(0, Math.min(get().duration, Number.isFinite(time) ? time : 0))});},
  play() {
    if (get().playing) return;
    cancel(); startTime = get().time >= get().duration ? 0 : get().time;
    set({playing: true, time: startTime});
    const tick = (timestamp: number) => {
      if (!get().playing) return;
      startTimestamp ??= timestamp;
      const time = Math.min(get().duration, startTime+(timestamp-startTimestamp)/1000);
      set({time});
      if (time >= get().duration) {cancel(); set({playing: false});}
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  },
  pause() {cancel(); set({playing: false});},
  stop() {cancel(); set({playing: false, time: 0});},
  configure(duration) {get().pause(); set({duration, time: Math.min(get().time, duration)});},
}));
