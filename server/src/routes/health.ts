import { Router } from "express";

import { config } from "../config/env";
import { healthResponseSchema } from "../schemas/health";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  const payload = healthResponseSchema.parse({
    status: "ok",
    service: "matchpulse-api",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  response.status(200).json(payload);
});
