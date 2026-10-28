import { z } from "zod";

export const simulateMatchRequestSchema = z.object({
  homeTeam: z.string().trim().min(2).max(40).default("Northbridge FC"),
  awayTeam: z.string().trim().min(2).max(40).default("Harbour City"),
  seed: z.number().int().min(1).max(999_999).default(42),
  audience: z.enum(["fan", "analyst", "broadcast"]).default("fan"),
});

export const matchEventSchema = z.object({
  id: z.string(),
  minute: z.number().int().min(0).max(90),
  team: z.enum(["home", "away"]),
  type: z.enum(["goal", "shot", "chance", "press", "turnover", "yellow_card", "half_time", "full_time"]),
  description: z.string(),
  xg: z.number().min(0).max(1).optional(),
});

export type SimulateMatchRequest = z.infer<typeof simulateMatchRequestSchema>;
export type MatchEvent = z.infer<typeof matchEventSchema>;
