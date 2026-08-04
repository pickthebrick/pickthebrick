import "./marketing.css";

// Temporary home page: a simple Design/Build chooser. Will grow into the
// real marketing site later.
export default function Home() {
  return (
    <div className="ptb-marketing">
      <header>
        <div className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </div>
        <nav>
          <a href="/design">Design</a>
          <a href="/build">Build</a>
        </nav>
      </header>
      <main>
        <div className="hero">
          <h1>Office fitouts, done the easy way</h1>
          <p>Whether you need a design concept or you&apos;re ready to build, pick where you&apos;d like to start.</p>
        </div>

        <div className="choice-row">
          <a className="choice-card" href="/design">
            <div className="icon">✏️</div>
            <h2>Design</h2>
            <p>Browse our design packages and get a concept tailored to your space.</p>
            <span className="cta">Explore packages &rarr;</span>
          </a>
          <a className="choice-card" href="/build">
            <div className="icon">🧱</div>
            <h2>Build</h2>
            <p>Already know what you need? Build your fitout quote from our full catalog.</p>
            <span className="cta">Start building &rarr;</span>
          </a>
        </div>
      </main>
    </div>
  );
}
