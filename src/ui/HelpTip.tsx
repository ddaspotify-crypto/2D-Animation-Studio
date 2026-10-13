import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

/** Portal keeps help visible outside scrolling/narrow editor panels. */
export default function HelpTip({label, text}: {label: string; text: string}) {
  const id = useId(), anchor = useRef<HTMLSpanElement>(null), popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [position, setPosition] = useState({left: 0, top: 0});
  useLayoutEffect(() => {
    if (!open || !anchor.current || !popup.current) return;
    const rect = anchor.current.getBoundingClientRect(), tip = popup.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth-tip.width-8, rect.left));
    const top = rect.bottom+8+tip.height <= window.innerHeight-8 ? rect.bottom+8 : Math.max(8, rect.top-tip.height-8);
    setPosition({left, top});
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {if (event.key === 'Escape') {event.stopPropagation(); setOpen(false);}};
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close);
    window.addEventListener('keydown', escape, true);
    return () => {window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); window.removeEventListener('keydown', escape, true);};
  }, [open]);
  return <>
    <span ref={anchor} className="help-tip-trigger" tabIndex={0} role="button" aria-label={`Giải thích: ${label}`} aria-describedby={open ? id : undefined}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onPointerDown={event => event.stopPropagation()} onClick={event => {event.preventDefault(); event.stopPropagation(); setOpen(true);}}
      onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation(); setOpen(false);} if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.stopPropagation(); setOpen(true);}}}>
      <CircleHelp size={12}/>
    </span>
    {open && createPortal(<div ref={popup} id={id} role="tooltip" className="help-tip-popup" style={position}><strong>{label}</strong><p>{text}</p></div>, document.body)}
  </>;
}
