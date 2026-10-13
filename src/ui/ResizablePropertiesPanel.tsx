import { useEffect, useRef, useState } from 'react';
import PropertiesPanel from './PropertiesPanel';

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 260;

export default function ResizablePropertiesPanel() {
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{startX: number; startWidth: number; previousCursor: string; previousSelect: string} | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH), [maximum, setMaximum] = useState(800), [resizing, setResizing] = useState(false);
  function maxWidth() {
    const layout = panel.current?.parentElement;
    const available = layout?.getBoundingClientRect().width ?? window.innerWidth;
    const leftWidth = layout?.querySelector('.left-sidebar')?.getBoundingClientRect().width ?? 255;
    return Math.max(MIN_WIDTH, Math.min(available*.52, available-leftWidth-230));
  }
  function adjust(next: number) {setWidth(Math.max(MIN_WIDTH, Math.min(maxWidth(), next)));}
  function finish() {
    const current = drag.current; if (!current) return;
    document.body.style.cursor = current.previousCursor; document.body.style.userSelect = current.previousSelect;
    drag.current = null; setResizing(false);
  }
  useEffect(() => {
    const layout = panel.current!.parentElement!;
    const observer = new ResizeObserver(() => {
      const limit = maxWidth(); setMaximum(limit); setWidth(previous => Math.max(MIN_WIDTH, Math.min(previous, limit)));
    });
    observer.observe(layout);
    const left = layout.querySelector('.left-sidebar'); if (left) observer.observe(left);
    return () => {observer.disconnect(); if (drag.current) {document.body.style.cursor = drag.current.previousCursor; document.body.style.userSelect = drag.current.previousSelect;}};
  }, []);
  return <aside ref={panel} className={`right-sidebar properties-resizable ${resizing ? 'resizing' : ''}`} style={{width}}>
    <div className="properties-resize-handle" role="separator" aria-label="Điều chỉnh chiều rộng Properties" aria-orientation="vertical" tabIndex={0}
      aria-valuemin={MIN_WIDTH} aria-valuemax={Math.round(maximum)} aria-valuenow={Math.round(width)}
      title="Kéo mép này sang trái để mở rộng Properties. Double-click để về 320px."
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {startX: event.clientX, startWidth: width, previousCursor: document.body.style.cursor, previousSelect: document.body.style.userSelect};
        document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; setResizing(true);
      }}
      onPointerMove={event => {if (drag.current) adjust(drag.current.startWidth+drag.current.startX-event.clientX);}}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onDoubleClick={() => adjust(DEFAULT_WIDTH)}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {event.preventDefault(); adjust(width+(event.shiftKey ? 50 : 10));}
        if (event.key === 'ArrowRight') {event.preventDefault(); adjust(width-(event.shiftKey ? 50 : 10));}
        if (event.key === 'Home') {event.preventDefault(); adjust(DEFAULT_WIDTH);}
      }}/>
    <PropertiesPanel/>
  </aside>;
}
