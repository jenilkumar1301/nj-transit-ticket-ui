import { useEffect, useMemo, useState } from "react";

const sampleRoutes = [
  { id: "r1", from: "Secaucus", to: "New York", zones: 2, price: 3.50 },
  { id: "r2", from: "Jersey City", to: "New York", zones: 3, price: 4.25 },
  { id: "r3", from: "Newark", to: "New York", zones: 4, price: 5.15 }
];

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function loadWallet() {
  try {
    return JSON.parse(localStorage.getItem("transitDemoWallet") || "[]");
  } catch {
    return [];
  }
}

function Header({ title, onBack }) {
  return <header className="topbar">
    {onBack ? <button className="header-button" onClick={onBack} aria-label="Go back">‹</button> : <span className="header-space" />}
    <h1>{title}</h1>
    <span className="header-space" />
  </header>;
}

function BuyTicket({ onPurchased }) {
  const [routeId, setRouteId] = useState(sampleRoutes[0].id);
  const [fare, setFare] = useState("Adult");
  const route = sampleRoutes.find(item => item.id === routeId);

  function purchase() {
    onPurchased({
      id: crypto.randomUUID(),
      route,
      fare,
      purchasedAt: Date.now(),
      activatedAt: null
    });
  }

  return <>
    <Header title="Buy Tickets" />
    <main className="screen">
      <div className="notice">CLASS PROJECT · SAMPLE FARES ONLY</div>
      <section className="panel">
        <h2>Select your trip</h2>
        <label>Bus route
          <select value={routeId} onChange={event => setRouteId(event.target.value)}>
            {sampleRoutes.map(item =>
              <option key={item.id} value={item.id}>{item.from} to {item.to}</option>
            )}
          </select>
        </label>
        <div className="route-summary">
          <div><small>Origin</small><strong>{route.from}</strong></div>
          <span>→</span>
          <div><small>Destination</small><strong>{route.to}</strong></div>
        </div>
        <p>{route.zones} zone interstate bus ride</p>
      </section>

      <section className="panel">
        <h2>Fare type</h2>
        {["Adult", "Child/Senior"].map(type =>
          <label className="radio-row" key={type}>
            <input type="radio" name="fare" checked={fare === type} onChange={() => setFare(type)} />
            <span><strong>One Way · {type}</strong><small>Valid for one demo activation</small></span>
            <strong>{money(type === "Adult" ? route.price : route.price / 2)}</strong>
          </label>
        )}
      </section>

      <section className="checkout">
        <div><small>Total</small><strong>{money(fare === "Adult" ? route.price : route.price / 2)}</strong></div>
        <button className="primary" onClick={purchase}>Add Sample Ticket</button>
      </section>
    </main>
  </>;
}

function Wallet({ tickets, onOpen, onBuy }) {
  const unused = tickets.filter(ticket => !ticket.activatedAt);
  const used = tickets.filter(ticket => ticket.activatedAt);

  return <>
    <Header title="My Tickets" />
    <main className="screen">
      <div className="notice">DEMO ONLY · NOT VALID FOR TRAVEL</div>
      <section className="tabs"><button className="selected">Available ({unused.length})</button><button>History ({used.length})</button></section>
      {unused.length === 0 ? <section className="empty-state">
        <div className="ticket-icon">▤</div>
        <h2>No available tickets</h2>
        <p>Add a sample ticket to test the activation experience.</p>
        <button className="primary" onClick={onBuy}>Buy Sample Ticket</button>
      </section> : unused.map(ticket =>
        <button className="wallet-ticket" onClick={() => onOpen(ticket)} key={ticket.id}>
          <div className="bus-icon">BUS</div>
          <div><small>ONE WAY · {ticket.fare.toUpperCase()}</small><h2>{ticket.route.from} → {ticket.route.to}</h2>
            <p>{ticket.route.zones} Zones · Purchased {new Date(ticket.purchasedAt).toLocaleDateString()}</p></div>
          <span>›</span>
        </button>
      )}
    </main>
  </>;
}

function TicketDetails({ ticket, onBack, onActivate }) {
  const [confirming, setConfirming] = useState(false);

  return <>
    <Header title="Ticket Details" onBack={onBack} />
    <main className="screen">
      <div className="notice">DEMO — NOT VALID FOR TRAVEL</div>
      <section className="paper-ticket">
        <small>ONE WAY · {ticket.fare.toUpperCase()}</small>
        <h2>{ticket.route.from}</h2>
        <div className="route-line"><span>●</span><i /><span>●</span></div>
        <h2>{ticket.route.to}</h2>
        <dl>
          <div><dt>Service</dt><dd>Bus</dd></div>
          <div><dt>Zones</dt><dd>{ticket.route.zones}</dd></div>
          <div><dt>Fare</dt><dd>{money(ticket.fare === "Adult" ? ticket.route.price : ticket.route.price / 2)}</dd></div>
        </dl>
      </section>
      <p className="warning">Only activate when your instructor asks you to demonstrate the countdown.</p>
      <button className="primary full" onClick={() => setConfirming(true)}>Activate Demo Ticket</button>
    </main>

    {confirming && <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="activate-title">
        <h2 id="activate-title">Activate this sample ticket?</h2>
        <p>The demo countdown will begin immediately and cannot be paused.</p>
        <div className="modal-actions"><button onClick={() => setConfirming(false)}>Cancel</button>
          <button className="primary" onClick={onActivate}>Activate</button></div>
      </section>
    </div>}
  </>;
}

export default function App() {
  const [page, setPage] = useState("wallet");
  const [tickets, setTickets] = useState(loadWallet);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    localStorage.setItem("transitDemoWallet", JSON.stringify(tickets));
  }, [tickets]);

  function purchase(ticket) {
    setTickets(current => [ticket, ...current]);
    setPage("wallet");
  }

  function activate() {
    const activated = { ...selected, activatedAt: Date.now() };
    setTickets(current => current.map(item => item.id === selected.id ? activated : item));
    setSelected(activated);
    setPage("active");
  }

  const content = useMemo(() => {
    if (page === "buy") return <BuyTicket onPurchased={purchase} />;
    if (page === "details" && selected) return <TicketDetails ticket={selected} onBack={() => setPage("wallet")} onActivate={activate} />;
    if (page === "active" && selected) return <ActiveTicket ticket={selected} onDone={() => setPage("wallet")} />;
    return <Wallet tickets={tickets} onBuy={() => setPage("buy")} onOpen={ticket => { setSelected(ticket); setPage("details"); }} />;
  }, [page, selected, tickets]);

  return <div className="phone">
    {content}
    {page !== "active" && <nav className="bottom-nav">
      <button className={page === "wallet" || page === "details" ? "active" : ""} onClick={() => setPage("wallet")}><span>▤</span>My Tickets</button>
      <button className={page === "buy" ? "active" : ""} onClick={() => setPage("buy")}><span>＋</span>Buy</button>
      <button disabled><span>?</span>Help</button>
    </nav>}
  </div>;
}

function ActiveTicket({ ticket, onDone }) {
  const demoDuration = 60;
  const [now, setNow] = useState(Date.now());
  const seconds = Math.max(0, demoDuration - Math.floor((now - ticket.activatedAt) / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  if (seconds === 0) return <main className="active-ticket expired">
    <div className="demo-stamp">DEMO — NOT VALID FOR TRAVEL</div>
    <h1>Ticket Expired</h1>
    <p>This sample ticket can no longer be displayed as active.</p>
    <button onClick={onDone}>Return to Wallet</button>
  </main>;

  return <main className="active-ticket">
    <div className="moving-background" aria-hidden="true" />
    <div className="demo-stamp">DEMO — NOT VALID FOR TRAVEL</div>
    <p className="current-time">{new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
    <section className="active-card">
      <small>SAMPLE BUS TICKET</small>
      <h1>{ticket.route.zones} Zones</h1>
      <h2>{ticket.route.from} → {ticket.route.to}</h2>
      <div className="countdown"><small>Demo expires in</small><strong>{minutes}:{remainder}</strong></div>
      <div className="non-scannable">CLASS PROJECT<br /><strong>NO VALID BARCODE</strong></div>
      <p>One Way · {ticket.fare}</p>
    </section>
    <button className="close-active" onClick={onDone}>Close Demo</button>
  </main>;
}
