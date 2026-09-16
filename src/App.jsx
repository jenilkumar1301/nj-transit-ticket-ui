import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const tickets = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  zones: index + 1,
  passengers: index < 4 ? "1 Adult" : `${index - 2} Adults`
}));

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
  const presets = ["#309832", "#086cf2", "#ff3341", "#ffb000", "#6f42c1", "#111111", "#ffffff"];
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

function ZoneSheet({ active, onChoose, onClose }) {
  return <div className="overlay" role="dialog" aria-modal="true">
    <section className="sheet">
      <div className="sheet-head"><h2>Select zone</h2><button onClick={onClose}>Close</button></div>
      <div className="zone-grid">{tickets.map(ticket => <button key={ticket.zones}
        className={ticket.zones === active ? "active" : ""} onClick={() => onChoose(ticket.zones)}>
        {ticket.zones}
      </button>)}</div>
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
    {large && <div className="qr-overlay" role="dialog" aria-modal="true" onClick={() => setLarge(false)}>
      <section className="large-qr" style={{ borderColor: color }} onClick={event => event.stopPropagation()}>
        {qr(300)}<strong>DEMO — NOT VALID</strong><button onClick={() => setLarge(false)}>Close</button>
      </section>
    </div>}
  </>;
}

function StripButton({ color, label, onEdit }) {
  const actions = useLongPress(onEdit, onEdit);
  return <button className="strip-part" style={{ backgroundColor: color }} {...actions} aria-label={label} />;
}

function Ticket({ data, colors, remaining, progress, onZone, onColor }) {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  return <article className="ticket-slide">
    <section className="ticket-card">
      <DemoQR color={colors.frame} onEdit={() => onColor("frame", "QR border color")} />
      <strong className="tap-label">Tap to enlarge</strong>
      <div className="dash" />
      <h2>INTERSTATE</h2>
      <button className="zone-number" onClick={() => onZone(data.zones)}>{data.zones}</button>
      <h3>ZONE RIDE</h3><p>{data.passengers}</p>
      <div className="ticket-bottom">
        <div className="validation-strip">
          <StripButton color={colors.strip1} label="Edit first strip color" onEdit={() => onColor("strip1", "First strip color")} />
          <StripButton color={colors.strip2} label="Edit second strip color" onEdit={() => onColor("strip2", "Second strip color")} />
          <StripButton color={colors.strip3} label="Edit third strip color" onEdit={() => onColor("strip3", "Third strip color")} />
        </div>
        <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
        <strong className="expiry">Expires in {minutes}:{seconds}</strong>
        <button className="instructions" onClick={() => alert("Student interface demonstration only. This QR has no fare value and cannot be validated for travel.")}>View Demo Validator Instructions</button>
        <div className="demo-mark">DEMO · NOT VALID FOR TRAVEL</div>
      </div>
    </section>
  </article>;
}

export default function App() {
  const [now, setNow] = useState(Date.now());
  const [activatedAt] = useState(Date.now);
  const [colors, setColors] = useState(storedColors);
  const [selectedZone, setSelectedZone] = useState(1);
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const [colorSheet, setColorSheet] = useState(null);
  const carousel = useRef(null);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  useEffect(() => localStorage.setItem("demoTicketColors", JSON.stringify(colors)), [colors]);

  const remaining = Math.max(0, 3600 - Math.floor((now - activatedAt) / 1000));
  const progress = Math.max(0, Math.min(100, (3600 - remaining) / 36));

  function chooseZone(zone) {
    setSelectedZone(zone);
    requestAnimationFrame(() => carousel.current?.children[zone - 1]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }));
  }

  function syncZone() {
    const width = carousel.current?.clientWidth || 1;
    setSelectedZone(Math.min(9, Math.max(1, Math.round(carousel.current.scrollLeft / width) + 1)));
  }

  return <main className="app-shell">
    <header><h1>One Way Ticket</h1></header>
    <div className="carousel" ref={carousel} onScroll={syncZone} aria-label="Demo tickets, swipe horizontally">
      {tickets.map(ticket => <Ticket key={ticket.id} data={ticket} colors={colors} remaining={remaining}
        progress={progress} onZone={() => setZoneSheetOpen(true)} onColor={(key, name) => setColorSheet({ key, name })} />)}
    </div>
    <nav className="dots" aria-label="Ticket pages">{tickets.map(ticket => <button key={ticket.id}
      className={selectedZone === ticket.zones ? "active" : ""} aria-label={`Go to zone ${ticket.zones}`}
      onClick={() => chooseZone(ticket.zones)} />)}</nav>
    <p className="swipe-hint">Swipe left or right to change zones</p>
    {zoneSheetOpen && <ZoneSheet active={selectedZone} onChoose={zone => { chooseZone(zone); setZoneSheetOpen(false); }} onClose={() => setZoneSheetOpen(false)} />}
    {colorSheet && <ColorSheet name={colorSheet.name} value={colors[colorSheet.key]}
      onChange={value => setColors(current => ({ ...current, [colorSheet.key]: value }))} onClose={() => setColorSheet(null)} />}
  </main>;
}
