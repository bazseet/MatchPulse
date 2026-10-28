import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, CircleDot,
  Clock3, Copy, Gauge, Goal, Radio, RefreshCw, ShieldCheck, Sparkles,
  Target, TrendingUp, Waves,
} from "lucide-react";
import { getHealth, simulateMatch, type Audience, type HealthResponse, type MatchResult, type SideStats } from "./lib/api";

const eventLabels: Record<string, string> = {
  goal: "GOAL", shot: "SHOT", chance: "CHANCE", press: "PRESS", turnover: "TURNOVER",
  yellow_card: "CARD", half_time: "HALF-TIME", full_time: "FULL-TIME",
};

function StatComparison({ label, home, away, format = (n: number) => String(n), icon }: { label: string; home: number; away: number; format?: (n: number) => string; icon: React.ReactNode }) {
  const max = Math.max(home, away, 1);
  return <div className="stat-row">
    <div className="stat-heading"><span className="stat-icon">{icon}</span><span>{label}</span></div>
    <div className="stat-values"><strong>{format(home)}</strong><div className="bar-track"><div className="bar-home" style={{ width: `${(home / max) * 100}%` }} /></div><div className="bar-track away-track"><div className="bar-away" style={{ width: `${(away / max) * 100}%` }} /></div><strong>{format(away)}</strong></div>
  </div>;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [homeTeam, setHomeTeam] = useState("Northbridge FC");
  const [awayTeam, setAwayTeam] = useState("Harbour City");
  const [seed, setSeed] = useState(42);
  const [audience, setAudience] = useState<Audience>("fan");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHealth().then(setHealth).catch((err: unknown) => setApiError(err instanceof Error ? err.message : "API unavailable"));
  }, []);

  async function runSimulation() {
    if (homeTeam.trim().length < 2 || awayTeam.trim().length < 2) {
      setSimulationError("Enter a name for both teams (at least 2 characters).");
      return;
    }
    if (homeTeam.trim().toLowerCase() === awayTeam.trim().toLowerCase()) {
      setSimulationError("Choose two different team names.");
      return;
    }
    setLoading(true); setSimulationError(null); setCopied(false);
    try {
      const result = await simulateMatch({ homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim(), seed, audience });
      setMatch(result);
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : "Unable to run simulation. Check that the API is running.");
    } finally { setLoading(false); }
  }

  function newSeed() { setSeed(Math.floor(Math.random() * 900_000) + 1); }
  async function copyRecap() {
    if (!match) return;
    const text = `${match.teams.home} ${match.score.home}–${match.score.away} ${match.teams.away}\n\n${match.narrative}\n\nKey insights:\n${match.insights.map(i => `• ${i.title}: ${i.finding}`).join("\n")}\n\n${match.disclaimer}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  }

  const home: SideStats | undefined = match?.stats.home;
  const away: SideStats | undefined = match?.stats.away;
  const homePassPct = home ? Math.round((home.completedPasses / home.passes) * 100) : 0;
  const awayPassPct = away ? Math.round((away.completedPasses / away.passes) * 100) : 0;

  return <main className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="page-wrap">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MatchPulse AI home"><span className="brand-mark"><Activity size={21} /></span><span>MatchPulse<span className="brand-ai"> AI</span><small>FOOTBALL INTELLIGENCE LAB</small></span></a>
        <div className="topbar-right"><span className={`status-pill ${health ? "status-online" : "status-offline"}`}><span className="status-dot" />{health ? "API connected" : "API disconnected"}</span><span className="version-label">DEMO / 01</span></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />SYNTHETIC MATCH INTELLIGENCE</div><h1>See the game<br /><span>behind the score.</span></h1><p>Simulate a football match, inspect the evidence, and turn match events into tactical takeaways for fans, analysts, and broadcasters.</p><div className="hero-points"><span><ShieldCheck size={15} /> Evidence-linked insights</span><span><RefreshCw size={15} /> Reproducible simulation</span></div></div>
        <div className="hero-visual" aria-hidden="true"><div className="pitch"><div className="pitch-midline" /><div className="pitch-circle" /><div className="pitch-box pitch-box-left" /><div className="pitch-box pitch-box-right" /><div className="pitch-dot pitch-dot-a" /><div className="pitch-dot pitch-dot-b" /><div className="pitch-dot pitch-dot-c" /><div className="pitch-dot pitch-dot-d" /><div className="pitch-route route-one" /><div className="pitch-route route-two" /><div className="pitch-ball"><CircleDot size={15} /></div></div><div className="visual-tag visual-tag-top"><span className="visual-tag-dot" /> LIVE SIMULATION</div><div className="visual-tag visual-tag-bottom"><Activity size={13} /> EVENT-DRIVEN ANALYSIS</div></div>
      </section>

      <section className="control-panel" aria-labelledby="setup-title"><div className="panel-heading"><div><span className="section-index">01 / MATCH SETUP</span><h2 id="setup-title">Configure your match</h2></div><span className="synthetic-tag"><AlertTriangle size={13} /> Synthetic data</span></div>
        <div className="team-fields"><label className="field"><span>HOME TEAM</span><div className="input-wrap"><span className="team-badge home-badge">H</span><input value={homeTeam} maxLength={40} onChange={e => setHomeTeam(e.target.value)} placeholder="Home team name" /></div></label><div className="versus">VS</div><label className="field"><span>AWAY TEAM</span><div className="input-wrap"><span className="team-badge away-badge">A</span><input value={awayTeam} maxLength={40} onChange={e => setAwayTeam(e.target.value)} placeholder="Away team name" /></div></label></div>
        <div className="control-bottom"><div className="seed-control"><label htmlFor="seed">SIMULATION SEED</label><div className="seed-input"><input id="seed" type="number" min={1} max={999999} value={seed} onChange={e => setSeed(Math.max(1, Math.min(999999, Number(e.target.value) || 1)))} /><button type="button" onClick={newSeed} className="icon-button" title="Generate new seed" aria-label="Generate new seed"><RefreshCw size={15} /></button></div><small>Same seed = same generated match</small></div><div className="audience-control"><label htmlFor="audience">INSIGHT STYLE</label><select id="audience" value={audience} onChange={e => setAudience(e.target.value as Audience)}><option value="fan">Fan-friendly</option><option value="analyst">Analyst detail</option><option value="broadcast">Broadcast recap</option></select></div><button className="primary-button" onClick={runSimulation} disabled={loading || !health}>{loading ? <><RefreshCw size={17} className="spin" /> Simulating…</> : <><Sparkles size={17} /> Simulate match <ArrowRight size={17} /></>}</button></div>
        {!health && <p className="inline-warning">{apiError ? `API unavailable: ${apiError}. Start the server, then refresh.` : "Connecting to the MatchPulse API…"}</p>}{simulationError && <p className="inline-error" role="alert">{simulationError}</p>}
      </section>

      {match ? <>
        <section className="scoreboard panel-enter" aria-label="Match result"><div className="score-meta"><span className="section-index">02 / MATCH CENTRE</span><span className="match-chip"><span /> FULL TIME · SIMULATED</span></div><div className="score-main"><div className="score-team"><span className="score-crest crest-home">{match.teams.home.slice(0, 1).toUpperCase()}</span><strong>{match.teams.home}</strong><small>HOME</small></div><div className="scoreline"><span>{match.score.home}</span><i>:</i><span>{match.score.away}</span></div><div className="score-team away-team"><span className="score-crest crest-away">{match.teams.away.slice(0, 1).toUpperCase()}</span><strong>{match.teams.away}</strong><small>AWAY</small></div></div><div className="score-footer"><span><Clock3 size={14} /> 90 minutes</span><span><CircleDot size={14} /> Seed {match.seed}</span><span><ShieldCheck size={14} /> Generated locally by API</span></div></section>

        <div className="section-title-row"><div><span className="section-index">03 / PERFORMANCE</span><h2>Match statistics</h2></div><span className="muted-note">Home vs away comparison</span></div>
        <section className="stats-grid" aria-label="Match statistics"><article className="stat-card feature-stat"><div className="stat-card-head"><span className="stat-label">EXPECTED GOALS</span><Target size={17} /></div><div className="xg-values"><strong>{home?.xg.toFixed(2)}</strong><span> xG </span><strong>{away?.xg.toFixed(2)}</strong></div><div className="xg-meter"><div style={{ width: `${home && away ? (home.xg / Math.max(home.xg + away.xg, 0.01)) * 100 : 50}%` }} /><div style={{ width: `${home && away ? (away.xg / Math.max(home.xg + away.xg, 0.01)) * 100 : 50}%` }} /></div><div className="stat-card-foot"><span>{match.teams.home}</span><span>{match.teams.away}</span></div></article>
          <article className="stat-card"><div className="stat-card-head"><span className="stat-label">POSSESSION</span><Waves size={17} /></div><div className="big-stat"><strong>{home?.possession}%</strong><span> / </span><strong>{away?.possession}%</strong></div><div className="dual-bar"><div style={{ width: `${home?.possession}%` }} /><div style={{ width: `${away?.possession}%` }} /></div><div className="stat-card-foot"><span>{match.teams.home}</span><span>{match.teams.away}</span></div></article>
          <article className="stat-card"><div className="stat-card-head"><span className="stat-label">TOTAL SHOTS</span><Goal size={17} /></div><div className="big-stat"><strong>{home?.shots}</strong><span> / </span><strong>{away?.shots}</strong></div><p className="stat-caption">On target: {home?.shotsOnTarget} / {away?.shotsOnTarget}</p><div className="stat-card-foot"><span>{match.teams.home}</span><span>{match.teams.away}</span></div></article>
          <article className="stat-card"><div className="stat-card-head"><span className="stat-label">PASS ACCURACY</span><Gauge size={17} /></div><div className="big-stat"><strong>{homePassPct}%</strong><span> / </span><strong>{awayPassPct}%</strong></div><div className="dual-bar"><div style={{ width: `${homePassPct}%` }} /><div style={{ width: `${awayPassPct}%` }} /></div><div className="stat-card-foot"><span>{home?.completedPasses} completed</span><span>{away?.completedPasses} completed</span></div></article></section>

        <div className="analysis-layout"><section className="insights-panel"><div className="section-title-row compact"><div><span className="section-index">04 / EVIDENCE</span><h2>Analyst insights</h2></div><span className="count-badge">{match.insights.length} FINDINGS</span></div><p className="section-intro">Each finding includes the simulated data used to support it. Open the evidence before drawing conclusions.</p><div className="insight-list">{match.insights.map((insight, index) => <article className="insight-card" key={insight.id}><div className="insight-number">0{index + 1}</div><div className="insight-content"><div className="insight-title-row"><h3>{insight.title}</h3><span className={`confidence confidence-${insight.confidence}`}>{insight.confidence} confidence</span></div><p>{insight.finding}</p><details><summary><BarChart3 size={14} /> View supporting evidence</summary><ul>{insight.evidence.map(item => <li key={item}>{item}</li>)}</ul><div className="impact-note"><TrendingUp size={14} /><span>{insight.impact}</span></div></details></div></article>)}</div></section>

          <aside className="timeline-panel"><div className="section-title-row compact"><div><span className="section-index">05 / EVENT LOG</span><h2>Match timeline</h2></div><span className="count-badge">{match.events.length} EVENTS</span></div><div className="timeline-legend"><span><i className="legend-home" /> {match.teams.home}</span><span><i className="legend-away" /> {match.teams.away}</span></div><div className="event-list">{match.events.map(event => <div className={`event-row event-${event.type}`} key={event.id}><span className="event-minute">{event.minute}'</span><span className={`event-team-mark ${event.team === "home" ? "mark-home" : "mark-away"}`} /><div className="event-description"><strong>{eventLabels[event.type] ?? event.type.toUpperCase()}</strong><p>{event.description}</p>{event.xg !== undefined && <small>xG {event.xg.toFixed(2)}</small>}</div></div>)}</div></aside></div>

        <section className="recap-panel"><div className="recap-icon"><Radio size={19} /></div><div className="recap-body"><span className="section-index">06 / STORY BUILDER · {match.narrativeSource === "microsoft-foundry" ? "MICROSOFT FOUNDRY AI" : "DETERMINISTIC FALLBACK"}</span><h2>{audience === "fan" ? "The story of the match" : audience === "analyst" ? "Technical match summary" : "Full-time broadcast recap"}</h2><p>{match.narrative}</p><small>{match.narrativeSource === "microsoft-foundry" ? "Generated by a Microsoft Foundry-deployed model and grounded in this synthetic match payload." : (match.narrativeNotice ?? "Deterministic fallback recap. Configure Microsoft Foundry on the API server to enable model-generated recaps.")}</small></div><button className="secondary-button" onClick={copyRecap}><Copy size={15} /> {copied ? "Copied" : "Copy recap"}</button></section>
        <div className="results-footer"><p><AlertTriangle size={15} /> {match.disclaimer}</p><button onClick={runSimulation} className="rerun-button" disabled={loading}><RefreshCw size={14} /> Run again</button></div>
      </> : <section className="empty-state"><div className="empty-graphic"><div className="empty-ring ring-one" /><div className="empty-ring ring-two" /><Activity size={32} /></div><span className="section-index">YOUR ANALYSIS WORKSPACE</span><h2>Ready when you are.</h2><p>Configure two teams above and run a simulation to generate a scoreline, performance metrics, evidence-linked insights, and an audience-specific recap.</p><div className="empty-features"><span><Target size={15} /> Chance quality</span><span><Waves size={15} /> Match control</span><span><BarChart3 size={15} /> Event evidence</span></div></section>}

      <footer className="footer"><a className="footer-brand" href="#top"><Activity size={15} /> MATCHPULSE AI</a><span>Built for the Inside the Game developer hackathon</span><span className="footer-disclaimer">Synthetic demo · Not official match data</span></footer>
    </div>
  </main>;
}

export default App;
