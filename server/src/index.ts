import { app } from "./app";
import { config } from "./config/env";

const server = app.listen(config.PORT, () => {
  console.log(`MatchPulse API listening on http://localhost:${config.PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}; shutting down MatchPulse API`);
  server.close(() => {
    process.exit(0);
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
