import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

const jobsRouter = Router();

jobsRouter.get("/", (req, res) => {
  res.json({
    data: [],
    filters: {
      projectId: req.query.projectId ?? null,
      status: req.query.status ?? null,
    },
    message: "Job listing placeholder",
  });
});

jobsRouter.post("/", (req: AuthenticatedRequest, res) => {
  res.status(202).json({
    data: {
      id: "job_stub_001",
      projectId: req.body?.projectId ?? null,
      type: req.body?.type ?? "render",
      status: "queued",
      requestedBy: req.user?.id ?? null,
    },
    message: "Job enqueue placeholder",
  });
});

jobsRouter.get("/:jobId", (req, res) => {
  res.json({
    data: {
      id: req.params.jobId,
      status: "processing",
      progress: 0,
    },
    message: "Job details placeholder",
  });
});

export default jobsRouter;
