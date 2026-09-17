import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const defaultColors = { frame: "#309832", strip1: "#a8f29d", strip2: "#d8a7dc", strip3: "#b8caf0" };

function storedColors() {
  try { return { ...defaultColors, ...JSON.parse(localStorage.getItem("demoTicketColors") || "{}") }; }
  catch { return defaultColors; }
}

function useLongPress(onLongPress, onClick) {
  const timer = useRef(null);
  const didLongPress = useRef(false);
  const start = event => {
    didLongPress.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    timer.current = window.setTimeout(() => { didLongPress.current = true; onLongPress(); }, 500);
  };
  const clear = () => window.clearTimeout(timer.current);
  const finish = () => { clear(); if (!didLongPress.current) onClick?.(); };
  return { onPointerDown: start, onPointerUp: finish, onPointerCancel: clear, onPointerLeave: clear,
    onContextMenu: event => event.preventDefault() };
}

function ColorSheet({ name, value, onChange, onClose }) {
  const presets = ["#309832", "#086cf2", "#7b3fc6", "#ffb6c1", "#ff3341", "#808080"];
  return <div className="overlay" role="dialog" aria-modal="true">
    <section className="sheet">
      <div className="sheet-head"><h2>{name}</h2><button onClick={onClose}>Done</button></div>
      <input className="color-picker" type="color" value={value} onChange={e => onChange(e.target.value)} />
      <output>{value.toUpperCase()}</output>
      <div className="presets">{presets.map(color => <button key={color} style={{ background: color }}
        aria-label={`Use ${color}`} onClick={() => onChange(color)} />)}</div>
    </section>
  </div>;
}

function DemoQR({ color, onEdit }) {
  const [large, setLarge] = useState(false);
  const actions = useLongPress(onEdit, () => setLarge(true));
  const value = "STUDENT UI DEMO | NOT VALID FOR TRAVEL | NO FARE VALUE | VALIDATOR: REJECT | DEMO-2026";
  const qr = size => <QRCodeSVG value={value} size={size} level="H" marginSize={1} title="Non-valid demo QR" />;
  return <>
    <button className="qr-frame" style={{ borderColor: color }} {...actions} aria-label="Demo QR. Tap to enlarge; hold to change border color">
      {qr(210)}
    </button>
    <div className="qr-demo-mark">DEMO · NOT VALID FOR TRAVEL</div>
    {large && <div className="qr-overlay" role="dialog" aria-modal="true" onClick={() => setLarge(false)}>
      <section className="large-qr" style={{ borderColor: color }} onClick={event => event.stopPropagation()}>
        {qr(300)}<strong>DEMO — NOT VALID FOR TRAVEL</strong><button onClick={() => setLarge(false)}>Close</button>
      </section>
    </div>}
  </>;
}

function StripButton({ color, label, onEdit }) {
  const actions = useLongPress(onEdit, onEdit);
  return <button className="strip-part" style={{ backgroundColor: color }} {...actions} aria-label={label} />;
}

function Ticket({ zone, adults, colors, remaining, progress, onZone, onAdults, onColor }) {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  return <article className="ticket-slide">
    <section className="ticket-card">
      <DemoQR color={colors.frame} onEdit={() => onColor("frame", "QR border color")} />
      <strong className="tap-label">Tap to enlarge</strong>
      <div className="dash" />
      <h2>INTERSTATE</h2>
      <button className="zone-number" onClick={onZone} aria-label={`Zone ${zone}. Tap for next zone`}>{zone}</button>
      <h3>ZONE RIDE</h3>
      <button className="adult-count" onClick={onAdults} aria-label={`${adults} ${adults === 1 ? "Adult" : "Adults"}. Tap for next passenger count`}>
        {adults} {adults === 1 ? "Adult" : "Adults"}
      </button>
      <div className="ticket-bottom">
        <div className="validation-strip">
          <StripButton color={colors.strip1} label="Edit first strip color" onEdit={() => onColor("strip1", "First strip color")} />
          <StripButton color={colors.strip2} label="Edit second strip color" onEdit={() => onColor("strip2", "Second strip color")} />
          <StripButton color={colors.strip3} label="Edit third strip color" onEdit={() => onColor("strip3", "Third strip color")} />
        </div>
        <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
        <strong className="expiry">Expires in {minutes}:{seconds}</strong>
        <button className="instructions" onClick={() => alert("Student interface demonstration only. This QR has no fare value and cannot be validated for travel.")}>View Demo Validator Instructions</button>
      </div>
    </section>
  </article>;
}

export default function App() {
  const [now, setNow] = useState(Date.now());
  const [activatedAt] = useState(Date.now);
  const [colors, setColors] = useState(storedColors);
  const [selectedZone, setSelectedZone] = useState(1);
  const [adults, setAdults] = useState(1);
  const [colorSheet, setColorSheet] = useState(null);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  useEffect(() => localStorage.setItem("demoTicketColors", JSON.stringify(colors)), [colors]);

  const remaining = Math.max(0, 3600 - Math.floor((now - activatedAt) / 1000));
  const progress = Math.max(0, Math.min(100, (3600 - remaining) / 36));

  function nextZone() { setSelectedZone(zone => zone === 9 ? 1 : zone + 1); }
  function nextAdults() { setAdults(count => count === 7 ? 1 : count + 1); }

  return <main className="app-shell">
    <header><h1>One Way Ticket</h1></header>
    <div className="ticket-stage">
      <Ticket zone={selectedZone} adults={adults} colors={colors} remaining={remaining} progress={progress}
        onZone={nextZone} onAdults={nextAdults} onColor={(key, name) => setColorSheet({ key, name })} />
    </div>
    {colorSheet && <ColorSheet name={colorSheet.name} value={colors[colorSheet.key]}
      onChange={value => setColors(current => ({ ...current, [colorSheet.key]: value }))} onClose={() => setColorSheet(null)} />}
  </main>;
}
