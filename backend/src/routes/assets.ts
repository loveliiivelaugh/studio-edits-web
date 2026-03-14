import { Router } from "express";

import type { AuthenticatedRequest } from "../middleware/auth";

const assetsRouter = Router();

assetsRouter.get("/", (req, res) => {
  res.json({
    data: [],
    filters: {
      projectId: req.query.projectId ?? null,
      type: req.query.type ?? null,
    },
    message: "Asset listing placeholder",
  });
});

assetsRouter.post("/", (req: AuthenticatedRequest, res) => {
  res.status(201).json({
    data: {
      id: "asset_stub_001",
      projectId: req.body?.projectId ?? null,
      kind: req.body?.kind ?? "video",
      uploadedBy: req.user?.id ?? null,
    },
    message: "Asset upload placeholder",
  });
});

assetsRouter.get("/:assetId", (req, res) => {
  res.json({
    data: {
      id: req.params.assetId,
      status: "ready",
      url: "https://example.invalid/assets/placeholder",
    },
    message: "Asset details placeholder",
  });
});

export default assetsRouter;
