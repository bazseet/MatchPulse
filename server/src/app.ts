import cors from "cors";
import express, { type ErrorRequestHandler } from "express";

import { config } from "./config/env";
import { healthRouter } from "./routes/health";
import { matchesRouter } from "./routes/matches";

export const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.use("/api", healthRouter);
app.use("/api", matchesRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  console.error("Unhandled API error", error instanceof Error ? error.message : "unknown error");
  response.status(500).json({
    error: "Internal server error",
  });
};

app.use(errorHandler);
