import { Router } from "express";
import { simulateMatchRequestSchema } from "../schemas/match";
import { simulateMatch } from "../services/simulation";
import { createFoundryNarrative } from "../services/foundryNarrative";

export const matchesRouter = Router();

matchesRouter.post("/matches/simulate", async (request, response) => {
  const parsed = simulateMatchRequestSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid simulation settings", details: parsed.error.flatten() });
    return;
  }

  const result = simulateMatch(parsed.data);
  const narrative = await createFoundryNarrative({
    teams: result.teams, score: result.score, stats: result.stats, events: result.events,
    insights: result.insights, audience: result.audience, seed: result.seed,
  }, result.narrative);

  response.status(200).json({ ...result, ...narrative });
});
