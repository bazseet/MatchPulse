import type { MatchEvent, SimulateMatchRequest } from "../schemas/match";

type SideStats = { shots: number; shotsOnTarget: number; possession: number; corners: number; passes: number; completedPasses: number; xg: number; goals: number; pressingActions: number; turnovers: number };
type Insight = { id: string; title: string; finding: string; evidence: string[]; confidence: "high" | "medium"; impact: string };

function rngFromSeed(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function pick<T>(rng: () => number, values: T[]): T { return values[Math.floor(rng() * values.length)]!; }
function int(rng: () => number, min: number, max: number) { return Math.floor(rng() * (max - min + 1)) + min; }

export function simulateMatch(input: SimulateMatchRequest) {
  const rng = rngFromSeed(input.seed);
  const home: SideStats = { shots: int(rng, 8, 17), shotsOnTarget: 0, possession: int(rng, 42, 62), corners: int(rng, 2, 8), passes: int(rng, 360, 560), completedPasses: 0, xg: 0, goals: 0, pressingActions: int(rng, 8, 19), turnovers: int(rng, 7, 16) };
  const away: SideStats = { shots: int(rng, 7, 16), shotsOnTarget: 0, possession: 0, corners: int(rng, 1, 7), passes: int(rng, 320, 520), completedPasses: 0, xg: 0, goals: 0, pressingActions: int(rng, 7, 18), turnovers: int(rng, 8, 18) };
  away.possession = 100 - home.possession;
  for (const s of [home, away]) {
    s.shotsOnTarget = Math.min(s.shots, int(rng, 2, Math.max(3, Math.floor(s.shots * 0.65))));
    s.completedPasses = Math.round(s.passes * (0.72 + rng() * 0.19));
    s.xg = Number((s.shotsOnTarget * (0.12 + rng() * 0.12) + (s.shots - s.shotsOnTarget) * (0.025 + rng() * 0.045)).toFixed(2));
  }
  const events: MatchEvent[] = [];
  const descriptions = {
    shot: ["tests the goalkeeper from the edge of the area", "fires narrowly wide after a quick transition", "forces a save from a tight angle", "tries a first-time effort from a cut-back"],
    chance: ["breaks the lines with a forward pass", "creates space with a quick switch of play", "wins the ball high and attacks immediately", "finds room between midfield and defence"],
    press: ["wins possession with an aggressive press", "forces a rushed pass in the middle third", "closes down the build-up and wins a throw-in"],
    turnover: ["loses possession under pressure", "gives the ball away in midfield", "is caught in transition after a misplaced pass"],
  };
  let id = 1;
  const allEvents: MatchEvent[] = [];
  for (const team of ["home", "away"] as const) {
    const s = team === "home" ? home : away;
    let eventXgTotal = 0;
    for (let i = 0; i < s.shots; i++) {
      const minute = int(rng, 2, 89);
      const xg = Number((0.02 + rng() * 0.38).toFixed(2));
      eventXgTotal += xg;
      const isGoal = rng() < xg * 0.45;
      allEvents.push({ id: `evt-${id++}`, minute, team, type: isGoal ? "goal" : "shot", description: isGoal ? "scores after a well-worked attacking move" : pick(rng, descriptions.shot), xg });
    }
    // The displayed team xG is the sum of the shot events shown in the timeline.
    s.xg = Number(eventXgTotal.toFixed(2));
    for (let i = 0; i < int(rng, 2, 5); i++) allEvents.push({ id: `evt-${id++}`, minute: int(rng, 1, 89), team, type: "chance", description: pick(rng, descriptions.chance) });
    for (let i = 0; i < s.pressingActions; i++) if (rng() > 0.25) allEvents.push({ id: `evt-${id++}`, minute: int(rng, 1, 89), team, type: "press", description: pick(rng, descriptions.press) });
    for (let i = 0; i < s.turnovers; i++) allEvents.push({ id: `evt-${id++}`, minute: int(rng, 1, 89), team, type: "turnover", description: pick(rng, descriptions.turnover) });
    s.goals = allEvents.filter(e => e.team === team && e.type === "goal").length;
  }
  events.push(...allEvents.sort((a, b) => a.minute - b.minute));
  events.push({ id: "evt-half-time", minute: 45, team: "home", type: "half_time", description: "Half-time" });
  events.push({ id: "evt-full-time", minute: 90, team: "home", type: "full_time", description: "Full-time" });
  events.sort((a, b) => a.minute - b.minute || (a.type === "half_time" ? -1 : 1));

  const homeName = input.homeTeam;
  const awayName = input.awayTeam;
  const stats = { home, away };
  const insights: Insight[] = [];
  if (home.possession >= 56 || away.possession >= 56) {
    const side = home.possession > away.possession ? "home" : "away";
    const team = side === "home" ? homeName : awayName;
    const s = stats[side];
    insights.push({ id: "ins-possession", title: "Territorial control", finding: `${team} held ${s.possession}% possession, giving them the larger share of the ball. Possession alone does not prove attacking dominance.`, evidence: [`${team}: ${s.possession}% possession`, `${team}: ${s.passes} attempted passes, ${s.completedPasses} completed`], confidence: "high", impact: "Compare possession with shots and xG before concluding which team controlled the game." });
  }
  const chanceSide = home.xg >= away.xg ? "home" : "away";
  const chanceTeam = chanceSide === "home" ? homeName : awayName;
  const hs = home.xg, as = away.xg;
  insights.push({ id: "ins-xg", title: "Chance quality", finding: `${chanceTeam} generated the higher modelled expected-goals total (${Math.max(hs, as).toFixed(2)} xG vs ${Math.min(hs, as).toFixed(2)}). This estimates chance quality, not a guaranteed scoreline.`, evidence: [`${homeName}: ${home.xg.toFixed(2)} xG from ${home.shots} shots`, `${awayName}: ${away.xg.toFixed(2)} xG from ${away.shots} shots`], confidence: "medium", impact: "Review shot locations and the quality of chances before changing the attacking approach." });
  const pressSide = home.pressingActions >= away.pressingActions ? "home" : "away";
  const pressTeam = pressSide === "home" ? homeName : awayName;
  const ps = stats[pressSide];
  insights.push({ id: "ins-press", title: "Pressing activity", finding: `${pressTeam} recorded ${ps.pressingActions} simulated pressing actions. These are generated event counts, not tracking-derived pressure measurements.`, evidence: [`${homeName}: ${home.pressingActions} pressing actions`, `${awayName}: ${away.pressingActions} pressing actions`], confidence: "medium", impact: "Use as a prompt to inspect the event timeline, not as a definitive measure of pressing effectiveness." });

  const score = `${home.goals}–${away.goals}`;
  const narrativeByAudience = {
    fan: `${homeName} ${score} ${awayName}. In this synthetic simulation, ${chanceTeam} produced the stronger xG estimate. The match timeline highlights key chances, pressing moments and turnovers to explain how the contest developed.`,
    analyst: `Modelled score: ${homeName} ${score} ${awayName}. ${homeName} recorded ${home.shots} shots and ${home.xg.toFixed(2)} xG; ${awayName} recorded ${away.shots} shots and ${away.xg.toFixed(2)} xG. ${chanceTeam} led the xG comparison. Treat all metrics as synthetic, and interpret possession alongside chance quality.`,
    broadcast: `Full-time in the MatchPulse synthetic match: ${homeName} ${score} ${awayName}. The xG comparison favoured ${chanceTeam}, while the event log captures the simulated chances and momentum swings. These are generated demo events, not official match data.`,
  };
  return {
    matchId: `synthetic-${input.seed}-${Date.now().toString(36)}`,
    synthetic: true,
    disclaimer: "Synthetic demonstration only. Events and metrics are generated for this demo and are not official Premier League data.",
    teams: { home: homeName, away: awayName },
    score: { home: home.goals, away: away.goals, label: score },
    stats,
    events,
    insights,
    narrative: narrativeByAudience[input.audience],
    audience: input.audience,
    seed: input.seed,
    generatedAt: new Date().toISOString(),
  };
}
