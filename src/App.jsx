import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const initialTickets = [
  { id: 1, zones: 1, passengers: "1 Adult" },
  { id: 2, zones: 5, passengers: "1 Adult" },
  { id: 3, zones: 7, passengers: "1 Adult" },
  { id: 4, zones: 9, passengers: "2 Adults" },
  { id: 5, zones: 9, passengers: "5 Adults" }
];

const defaults = {
  frame: "#086cf2",
  strip1: "#c65b3e",
  strip2: "#26261d",
  strip3: "#3f424d"
};

function readColors() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("ticketDemoColors") || "{}") };
  } catch {
    return defaults;
  }
}

function useHold(onHold, onTap) {
  const timer = useRef();
  const held = useRef(false);

  function start(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    held.current = false;
    timer.current = window.setTimeout(() => {
      held.current = true;
      onHold();
    }, 550);
  }

  function cancel() {
    window.clearTimeout(timer.current);
  }

  function finish() {
    cancel();
    if (!held.current) onTap?.();
  }

  return {
    onPointerDown: start,
    onPointerUp: finish,
    onPointerCancel: cancel,
    onContextMenu: event => event.preventDefault()
  };
}

function ColorEditor({ label, value, onChange, onClose }) {
  return <div className="editor-backdrop" role="dialog" aria-modal="true" aria-labelledby="color-title">
    <section className="editor-panel">
      <h2 id="color-title">Choose {label}</h2>
      <input className="visible-color-picker" type="color" value={value}
        onChange={event => onChange(event.target.value)} />
      <code>{value.toUpperCase()}</code>
      <div className="preset-colors">
        {["#086CF2", "#FF3341", "#08A05C", "#FFB000", "#6F42C1", "#111111", "#FFFFFF"].map(color =>
          <button key={color} aria-label={"Select " + color} style={{ background: color }}
            onClick={() => onChange(color)} />
        )}
      </div>
      <button className="done-button" onClick={onClose}>Done</button>
    </section>
  </div>;
}

function ZoneEditor({ value, onChange, onClose }) {
  return <div className="editor-backdrop" role="dialog" aria-modal="true" aria-labelledby="zone-title">
    <section className="editor-panel">
      <h2 id="zone-title">Select zones</h2>
      <div className="zone-grid">
        {Array.from({ length: 9 }, (_, index) => index + 1).map(zone =>
          <button key={zone} className={zone === value ? "selected-zone" : ""}
            onClick={() => { onChange(zone); onClose(); }}>{zone}</button>
        )}
      </div>
      <button className="done-button secondary" onClick={onClose}>Cancel</button>
    </section>
  </div>;
}

function DemoQr({ frame, onEdit }) {
  const [large, setLarge] = useState(false);
  const hold = useHold(onEdit, () => setLarge(true));
  const payload = [
    "CLASS PROJECT DEMONSTRATION",
    "NOT VALID FOR TRAVEL",
    "NO FARE VALUE",
    "STUDENT UI PROTOTYPE",
    "IDENTIFIER: DEMO-NJT-2026-000000",
    "VALIDATOR RESULT: REJECT"
  ].join("|");

  const qr = <QRCodeSVG value={payload} size={large ? 310 : 205} level="H" marginSize={1}
    title="Class project demonstration QR code" />;

  return <>
    <button className="qr-frame" style={{ borderColor: frame }} {...hold}
      aria-label="Tap to enlarge. Press and hold to edit border color.">
      {qr}
    </button>
    {large && <div className="qr-modal" onClick={() => setLarge(false)} role="dialog" aria-modal="true">
      <section className="large-qr" style={{ borderColor: frame }} onClick={event => event.stopPropagation()}>
        {qr}
        <strong>CLASS PROJECT</strong>
        <span>NOT VALID FOR TRAVEL</span>
        <button onClick={() => setLarge(false)}>Close</button>
      </section>
    </div>}
  </>;
}

function Ticket({ ticket, colors, now, activatedAt, editColor, editZone }) {
  const left = Math.max(0, 60 * 60 - Math.floor((now - activatedAt) / 1000));
  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");
  const progress = left / 3600 * 100;

  return <article className="ticket-slide">
    <section className="real-style-card">
      <DemoQr frame={colors.frame} onEdit={() => editColor("frame", "QR border")} />
      <strong className="tap-to-enlarge">Tap to enlarge</strong>
      <span className="hold-hint">Press and hold the blue border to change its color</span>
      <div className="dash-line" />

      <h2>INTERSTATE</h2>
      <button className="zone-button" onClick={() => editZone(ticket.id, ticket.zones)}
        aria-label={"Current zones " + ticket.zones + ". Tap to change."}>
        {ticket.zones}
      </button>
      <h3>ZONE RIDE</h3>
      <p>{ticket.passengers}</p>
      <span className="zone-hint">Tap the number to select zones 1–9</span>

      <div className="ticket-footer">
        <div className="custom-strip">
          {["strip1", "strip2", "strip3"].map((key, index) =>
            <button key={key} className="strip-button"
              style={{ backgroundColor: colors[key] }}
              {...useHold(() => editColor(key, "bottom strip " + (index + 1)), () => editColor(key, "bottom strip " + (index + 1)))}
              aria-label={"Edit bottom strip color " + (index + 1)} />
          )}
        </div>
        <span className="hold-hint">Tap or hold a strip section to change its color</span>
        <div className="time-track"><span style={{ width: progress + "%" }} /></div>
        <strong className="expiry">Expires in {minutes}:{seconds}</strong>
        <button className="validator-link" onClick={() => alert("Class project demo. No transit validation is available.")}>
          View Demo Validator Instructions
        </button>
      </div>
    </section>
  </article>;
}

export default function App() {
  const [now, setNow] = useState(Date.now());
  const [activatedAt] = useState(() => Date.now() - 3 * 60 * 1000);
  const [tickets, setTickets] = useState(initialTickets);
  const [colors, setColors] = useState(readColors);
  const [colorEditor, setColorEditor] = useState(null);
  const [zoneEditor, setZoneEditor] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("ticketDemoColors", JSON.stringify(colors));
  }, [colors]);

  function changeZone(zone) {
    setTickets(current => current.map(ticket =>
      ticket.id === zoneEditor.ticketId ? { ...ticket, zones: zone } : ticket
    ));
  }

  return <main className="ticket-app">
    <div className="phone-status">
      <strong>{new Date(now).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong>
      <span>CLASS DEMO</span>
      <strong>91%</strong>
    </div>
    <h1>One Way Ticket</h1>

    <div className="ticket-carousel" aria-label="Sample tickets">
      {tickets.map(ticket =>
        <Ticket key={ticket.id} ticket={ticket} colors={colors} now={now} activatedAt={activatedAt}
          editColor={(key, label) => setColorEditor({ key, label })}
          editZone={(ticketId, value) => setZoneEditor({ ticketId, value })} />
      )}
    </div>

    <div className="swipe-note">Swipe for another sample ticket</div>
    <div className="permanent-demo">DEMO · NOT VALID FOR TRAVEL</div>

    {colorEditor && <ColorEditor label={colorEditor.label} value={colors[colorEditor.key]}
      onChange={value => setColors(current => ({ ...current, [colorEditor.key]: value }))}
      onClose={() => setColorEditor(null)} />}
    {zoneEditor && <ZoneEditor value={zoneEditor.value} onChange={changeZone}
      onClose={() => setZoneEditor(null)} />}
  </main>;
}
