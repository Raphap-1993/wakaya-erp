export default function HomePage() {
  return (
    <main className="wakaya-launcher">
      <section className="wakaya-launcher__hero">
        <p className="wakaya-launcher__eyebrow">Wakaya</p>
        <h1>Public hospitality site and internal reservations monitor.</h1>
        <p className="wakaya-launcher__lead">
          Split product surface for the public experience and the operational monitor.
        </p>
      </section>

      <nav className="wakaya-launcher__cards" aria-label="Wakaya surfaces">
        <a className="wakaya-launcher__card" href="/prototype/public-site">
          <strong>Public site prototype</strong>
          <span>Warm hospitality homepage, rooms, events, and full day.</span>
        </a>
        <a className="wakaya-launcher__card" href="/admin/reservations">
          <strong>Reservations monitor</strong>
          <span>Reception list, detail, assignment, state changes, and audit.</span>
        </a>
      </nav>
    </main>
  );
}
