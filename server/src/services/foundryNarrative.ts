import { config } from "../config/env";

export type NarrativeAudience = "fan" | "analyst" | "broadcast";

export type NarrativeEvidence = {
  teams: { home: string; away: string };
  score: { home: number; away: number; label: string };
  stats: { home: Record<string, number>; away: Record<string, number> };
  events: Array<{ minute: number; team: "home" | "away"; type: string; description: string; xg?: number }>;
  insights: Array<{ title: string; finding: string; evidence: string[]; impact: string }>;
  audience: NarrativeAudience;
  seed: number;
};

export type NarrativeResult = { narrative: string; narrativeSource: "microsoft-foundry" | "template"; narrativeNotice?: string };

export function isFoundryConfigured(): boolean {
  return Boolean(config.FOUNDRY_CHAT_COMPLETIONS_URL && config.FOUNDRY_API_KEY && config.FOUNDRY_MODEL);
}

/** Calls a Foundry-deployed model through its OpenAI-compatible Chat Completions URL.
 * The URL must be the full chat/completions endpoint copied from the model deployment.
 * Credentials remain on the server and never reach the browser.
 */
export async function createFoundryNarrative(evidence: NarrativeEvidence, fallback: string): Promise<NarrativeResult> {
  if (!isFoundryConfigured()) return { narrative: fallback, narrativeSource: "template", narrativeNotice: "Microsoft Foundry is not configured; showing the deterministic fallback recap." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.FOUNDRY_TIMEOUT_MS);
  try {
    const response = await fetch(config.FOUNDRY_CHAT_COMPLETIONS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": config.FOUNDRY_API_KEY! },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.FOUNDRY_MODEL,
        temperature: 0.2,
        max_tokens: evidence.audience === "broadcast" ? 180 : 220,
        messages: [
          { role: "system", content: "You are MatchPulse AI, a cautious football match analyst. Write a concise, engaging recap grounded ONLY in the supplied JSON. This is synthetic simulated data, not a real Premier League match. Never invent events, players, tactics, causes, or statistics. Distinguish measured fields from interpretations. If evidence is limited, say so. Do not present synthetic values as real-world facts. Return only the recap, no heading or markdown." },
          { role: "user", content: `Audience style: ${evidence.audience}. Use the following synthetic match evidence only:\n${JSON.stringify(evidence)}` },
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Foundry request failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`);
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }> };
    const content = payload.choices?.[0]?.message?.content;
    const narrative = typeof content === "string" ? content.trim() : Array.isArray(content) ? content.map(part => part.text ?? "").join("\n").trim() : "";
    if (!narrative || narrative.length > 2500) throw new Error("Foundry returned an empty or oversized recap");
    return { narrative, narrativeSource: "microsoft-foundry" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Foundry error";
    console.warn("Foundry narrative unavailable; using deterministic fallback:", message);
    return { narrative: fallback, narrativeSource: "template", narrativeNotice: "Foundry could not generate a recap this time; a deterministic fallback is shown." };
  } finally {
    clearTimeout(timeout);
  }
}
