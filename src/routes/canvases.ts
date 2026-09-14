import { Router } from "express";
import {
  getAllCanvases,
  getCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
} from "../controllers/canvasController";
import {
  validateCreateCanvas,
  validateUpdateCanvas,
} from "../middleware/validate";

const router = Router();

// ─── Canvas Routes ─────────────────────────────────────────────────────────────
//
//  GET    /api/canvases         → list all canvases (summary)
//  POST   /api/canvases         → create new canvas
//  GET    /api/canvases/:id     → get single canvas with all elements
//  PUT    /api/canvases/:id     → update canvas (full replace of elements)
//  DELETE /api/canvases/:id     → delete canvas
//

router.get("/", getAllCanvases);
router.post("/", validateCreateCanvas, createCanvas);

router.get("/:id", getCanvas);
router.put("/:id", validateUpdateCanvas, updateCanvas);
router.delete("/:id", deleteCanvas);

export default router;
