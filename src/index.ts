import "dotenv/config";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";

import logger from "./logger";

// If you created these route files already, keep these imports.
// If not yet, comment them out temporarily to get the server up.
import health from "./routes/health";
import rules from "./routes/rules";
import evaluate from "./routes/evaluate";

import { errorHandler } from "./middleware/error";
import { idempotency } from "./middleware/idempotency";
import { optionalAuth } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.use("/api/health", health);
app.use("/api/rules", rules);
app.use("/api/evaluate", idempotency, optionalAuth, evaluate);

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => logger.info({ port }, "server up"));
