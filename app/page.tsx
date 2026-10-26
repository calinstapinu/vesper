import Candles from "@/components/Candles";
import FX from "@/components/FX";
import HeroNotch from "@/components/HeroNotch";
import StatusDemo from "@/components/StatusDemo";
import DemoSection from "@/components/DemoSection";
import Nots from "@/components/Nots";
import Reveal from "@/components/Reveal";
import ScrollFX from "@/components/ScrollFX";
import Words from "@/components/Words";
import DownloadLink from "@/components/DownloadLink";


const FAQ = [
  ["Does Vesper give signals or predictions?", "No. Vesper shows timing, news, your own checklist and position size. It has no signals, no predictions and no price feed."],
  ["Which instruments does the size calculator support?", "Index futures (NQ, MNQ, ES, MES, YM, MYM, RTY, M2K), index CFDs (NAS100, US30, SPX500, GER40) and gold (XAUUSD CFD, GC, MGC). CFD contract sizes differ by broker, so every value can be edited, and you can add your own instruments. The values on this page are illustrative."],
  ["Which Macs does it run on?", "Vesper lives in the notch, so it is built for MacBooks with a notch. Full system requirements will be listed with the beta download."],
  ["macOS says it can't verify Vesper. What do I do?", "The beta is not notarized by Apple yet, so macOS blocks the first launch. Open Vesper once, click Done, then go to System Settings > Privacy & Security and click Open Anyway. You only do this once."],
  ["What does it cost?", "The beta is free for 7 days. After that you need an activation key from us. Pricing after the beta has not been announced."],
  ["What does Vesper send to your servers?", "Only what the beta needs: your email, a hashed ID of your Mac, the app and macOS versions, and when it last checked in. No trades, no checklists, no settings, no prices. We use it to run the 7-day beta, to help you if something goes wrong, and to turn access off when asked. Ask us to delete your data any time through the feedback form."],
  ["Is this financial advice?", "No. Vesper is a timing and discipline tool. Not financial advice."],
];

export default function Home() {
  return (
    <>
      <FX />
      <ScrollFX />
      <header className="nav">
        <a className="brand" href="#top" aria-label="Vesper home">
          <img src="/mascot/session_lupa.svg" alt="" width="28" height="28" />
          <span>Vesper</span>
        </a>
        <nav aria-label="Primary">
          <DownloadLink className="pill">Free beta for Mac</DownloadLink>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <Candles />
          <div className="rim" aria-hidden="true" />
          <HeroNotch />
          <div className="copy">
            <Words as="h1" text="Know when to trade and when not to." />
            <p className="sub">Vesper turns your MacBook notch into a live trading cockpit. Your window, the news, your rules and your size, right where your eyes already are.</p>
            <div className="actions">
              <DownloadLink className="cta">Free beta for Mac</DownloadLink>
              <a className="ghost" href="#how" data-magnet>See how it works</a>
            </div>
            <p className="trust">No signals &nbsp;·&nbsp; No predictions &nbsp;·&nbsp; No price feed</p>
          </div>
        </section>

        <section id="how" className="sec">
          <div className="head">
            <Words text="Your window, at a glance." />
            <Reveal delay={150}><p>The mascot is your status. It sleeps when you are outside your session, searches when you are in it, and takes your own colour inside a custom window.</p></Reveal>
          </div>
          <Reveal className="stage wide" delay={80}><StatusDemo /></Reveal>
        </section>

        <section className="sec">
          <div className="duo news">
            <div className="text">
              <Words text="Beat the news." />
              <Reveal delay={150}><p>A countdown to the release, then a blackout when it is time to stand aside. You pick the currencies and impacts that matter.</p></Reveal>
            </div>
            <Reveal className="stage" delay={80}>
              <ul className="nots lvl">
                <li data-spot className="not hi"><b>High impact</b><span>Red blackout. Stand aside until it ends.</span></li>
                <li data-spot className="not md"><b>Medium impact</b><span>Orange blackout, if you choose to track it.</span></li>
              </ul>
            </Reveal>
          </div>
        </section>

        <DemoSection />

        <section className="sec who">
          <div className="duo">
            <div className="text">
              <Words text="Made for traders with rules." />
              <Reveal delay={150}><p>Session-based and ICT-style traders in futures and index CFDs, on a MacBook, with a chart already open. Vesper adds the timing and the discipline, and leaves the decisions to you.</p></Reveal>
            </div>
            <Reveal className="stage" delay={80}>
              <Nots />
            </Reveal>
          </div>
        </section>

        <section id="faq" className="sec faq">
          <div className="duo flip">
          <div className="text"><Words text="Questions." /><Reveal delay={150}><p>The short answers. Anything missing, ask in the beta.</p></Reveal></div>
          <div className="qa">
            {FAQ.map(([q, a], i) => (
              <Reveal key={q} delay={i * 50}>
                <details data-spot className="card q">
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          </div>
        </section>

        <section id="get" className="sec final">
          <Reveal>
            <img src="/mascot/checklist_done.svg" alt="" width={120} height={120} />
            <Words text="Get the free beta." />
            <p>Know when to trade and when not to, right at the notch.</p>
            <DownloadLink className="cta">Free beta for Mac</DownloadLink>
          </Reveal>
        </section>
      </main>

      <footer className="foot">
        <span className="brand"><img src="/mascot/session_lupa.svg" alt="" width="24" height="24" />Vesper</span>
        <p>Not financial advice. Vesper gives no signals and no predictions.</p>
        <p><a href="#faq">FAQ</a> · © 2026 Vesper</p>
      </footer>
    </>
  );
}
