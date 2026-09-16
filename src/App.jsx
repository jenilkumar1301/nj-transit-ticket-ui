import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const tickets = [
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

function loadColors() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("ticketDemoColors") || "{}") };
  } catch {
    return defaults;
  }
}

function useHold(onHold, onTap) {
  const timer = useRef(null);
  const held = useRef(false);

  function start() {
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
    if (!held.current && onTap) onTap();
  }

  return {
    onPointerDown: start,
    onPointerUp: finish,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: event => event.preventDefault()
  };
}

function ColorControl({ color, label, onChange, children, className = "" }) {
  const picker = useRef(null);
  const hold = useHold(() => picker.current?.click());

  return <div className={"color-control " + className} {...hold} role="button" tabIndex="0"
    aria-label={"Press and hold to change " + label}
    onKeyDown={event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        picker.current?.click();
      }
    }}>
    {children}
    <input ref={picker} className="hidden-picker" type="color" value={color}
      aria-label={"Choose " + label} onChange={event => onChange(event.target.value)} />
  </div>;
}

function DemoQr({ frame, onFrameChange }) {
  const [large, setLarge] = useState(false);
  const picker = useRef(null);
  const hold = useHold(() => picker.current?.click(), () => setLarge(true));

  const qr = <QRCodeSVG
    value="CLASS PROJECT — NOT VALID FOR TRAVEL"
    size={large ? 290 : 190}
    level="H"
    marginSize={2}
    title="Class project demo QR code"
  />;

  return <>
    <button className={"qr-frame" + (large ? " enlarged" : "")} style={{ borderColor: frame }}
      {...hold} aria-label="Tap to enlarge. Press and hold to change the border color.">
      {qr}
    </button>
    <input ref={picker} className="hidden-picker" type="color" value={frame}
      aria-label="Choose QR frame color" onChange={event => onFrameChange(event.target.value)} />

    {large && <div className="qr-modal" onClick={() => setLarge(false)} role="dialog" aria-modal="true"
      aria-label="Enlarged class demo QR code">
      <div className="large-qr" style={{ borderColor: frame }} onClick={event => event.stopPropagation()}>
        {qr}
        <strong>CLASS PROJECT</strong>
        <span>NOT VALID FOR TRAVEL</span>
        <button onClick={() => setLarge(false)}>Close</button>
      </div>
    </div>}
  </>;
}

function Ticket({ ticket, colors, setColor, now, activatedAt }) {
  const duration = 60 * 60;
  const left = Math.max(0, duration - Math.floor((now - activatedAt) / 1000));
  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");
  const progress = left / duration * 100;

  return <article className="ticket-slide">
    <section className="real-style-card">
      <DemoQr frame={colors.frame} onFrameChange={value => setColor("frame", value)} />
      <strong className="tap-to-enlarge">Tap to enlarge</strong>
      <span className="hold-hint">Hold the border to change its color</span>
      <div className="dash-line" />

      <h2>INTERSTATE</h2>
      <strong className="zones">{ticket.zones}</strong>
      <h3>ZONE RIDE</h3>
      <p>{ticket.passengers}</p>

      <div className="ticket-footer">
        <div className="custom-strip">
          {["strip1", "strip2", "strip3"].map(key =>
            <ColorControl key={key} color={colors[key]} label="validation strip color"
              onChange={value => setColor(key, value)}>
              <span style={{ backgroundColor: colors[key] }} />
            </ColorControl>
          )}
        </div>
        <span className="hold-hint">Hold a strip section to change its color</span>
        <div className="time-track"><span style={{ width: progress + "%" }} /></div>
        <strong className="expiry">Expires in {minutes}:{seconds}</strong>
        <button className="validator-link" onClick={() => alert("Class project demo. No onboard validation is available.")}>
          View Demo Validator Instructions
        </button>
      </div>
    </section>
  </article>;
}

export default function App() {
  const [now, setNow] = useState(Date.now());
  const [activatedAt] = useState(() => Date.now() - 3 * 60 * 1000);
  const [colors, setColors] = useState(loadColors);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("ticketDemoColors", JSON.stringify(colors));
  }, [colors]);

  function setColor(key, value) {
    setColors(current => ({ ...current, [key]: value }));
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
        <Ticket key={ticket.id} ticket={ticket} colors={colors} setColor={setColor}
          now={now} activatedAt={activatedAt} />
      )}
    </div>
    <div className="swipe-note">Swipe for another sample ticket</div>
    <div className="permanent-demo">DEMO · NOT VALID FOR TRAVEL</div>
  </main>;
}
