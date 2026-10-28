export type HealthResponse = {
  status: "ok";
  service: "matchpulse-api";
  environment: "development" | "test" | "production";
  timestamp: string;
};

export type Audience = "fan" | "analyst" | "broadcast";
export type MatchEvent = {
  id: string;
  minute: number;
  team: "home" | "away";
  type: "goal" | "shot" | "chance" | "press" | "turnover" | "yellow_card" | "half_time" | "full_time";
  description: string;
  xg?: number;
};
export type SideStats = {
  shots: number; shotsOnTarget: number; possession: number; corners: number;
  passes: number; completedPasses: number; xg: number; goals: number;
  pressingActions: number; turnovers: number;
};
export type MatchResult = {
  matchId: string;
  synthetic: true;
  disclaimer: string;
  teams: { home: string; away: string };
  score: { home: number; away: number; label: string };
  stats: { home: SideStats; away: SideStats };
  events: MatchEvent[];
  insights: { id: string; title: string; finding: string; evidence: string[]; confidence: "high" | "medium"; impact: string }[];
  narrative: string;
  narrativeSource: "template" | "microsoft-foundry";
  narrativeNotice?: string;
  audience: Audience;
  seed: number;
  generatedAt: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");
  if (!response.ok) throw new Error(`Health check failed with status ${response.status}`);
  return (await response.json()) as HealthResponse;
}

export async function simulateMatch(input: { homeTeam: string; awayTeam: string; seed: number; audience: Audience }): Promise<MatchResult> {
  const response = await fetch("/api/matches/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Simulation failed with status ${response.status}`);
  }
  return (await response.json()) as MatchResult;
}
