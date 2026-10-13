import { useEffect, useState } from 'react';
import HelpTip from './HelpTip';

export default function NumberField({label, help, value, onCommit, min = -1e7, max = 1e7, step = 1, disabled = false}: {label: string; help?: string; value: number; onCommit: (value: number) => void; min?: number; max?: number; step?: number; disabled?: boolean}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Math.round(value*10000)/10000)), [value]);
  function commit() {
    const number = Number(draft);
    if (draft.trim() && Number.isFinite(number) && number >= min && number <= max) {
      if (number !== Math.round(value*10000)/10000) onCommit(number);
      setDraft(String(Math.round(value*10000)/10000));
    }
    else setDraft(String(value));
  }
  return <label className="field"><span className="field-label">{label}{help && <HelpTip label={label} text={help}/>}</span><input aria-label={label} type="number" value={draft} min={min} max={max} step={step} disabled={disabled}
    onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => {if (event.key === 'Enter') event.currentTarget.blur();}}/></label>;
}
