import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

const projectsRouter = Router();

projectsRouter.get("/", (_req, res) => {
  res.json({
    data: [],
    message: "Project listing placeholder",
  });
});

projectsRouter.post("/", (req: AuthenticatedRequest, res) => {
  res.status(201).json({
    data: {
      id: "proj_stub_001",
      name: req.body?.name ?? "Untitled project",
      createdBy: req.user?.id ?? null,
      status: "draft",
    },
    message: "Project creation placeholder",
  });
});

projectsRouter.get("/:projectId", (req, res) => {
  res.json({
    data: {
      id: req.params.projectId,
      name: "Placeholder project",
      status: "draft",
    },
    message: "Project details placeholder",
  });
});

export default projectsRouter;
