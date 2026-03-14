import express from "express";

import { authMiddleware } from "./middleware/auth";
import assetsRouter from "./routes/assets";
import jobsRouter from "./routes/jobs";
import projectsRouter from "./routes/projects";

const app = express();
const port = Number(process.env.API_PORT ?? 8787);

app.use(express.json());
app.use(authMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "studio-edits-api",
  });
});

app.use("/api/projects", projectsRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/jobs", jobsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `No route for ${req.method} ${req.path}`,
  });
});

app.listen(port, () => {
  console.log(`API scaffold running on http://localhost:${port}`);
});
