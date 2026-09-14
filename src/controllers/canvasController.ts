import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Canvas, { ICanvas, ICanvasElement } from "../models/Canvas";
import { sendSuccess, sendError } from "../middleware/errorHandler";
import { isUsingMemoryStore } from "../config/db";

// ─── In-Memory Store Fallback ──────────────────────────────────────────────────

interface MemoryCanvas {
  _id: string;
  name: string;
  width: number;
  height: number;
  elements: ICanvasElement[];
  createdAt: string;
  updatedAt: string;
}

const memoryStore = new Map<string, MemoryCanvas>();

// Seed sample initial canvas into memory store
const seedId = new mongoose.Types.ObjectId().toString();
memoryStore.set(seedId, {
  _id: seedId,
  name: "Sample Design Canvas",
  width: 1200,
  height: 700,
  elements: [
    {
      id: "rect-1",
      type: "rect",
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      rotation: 0,
      fill: "#6366f1",
      stroke: "#4f46e5",
      strokeWidth: 2,
      opacity: 1,
      zIndex: 1,
    },
    {
      id: "circle-1",
      type: "circle",
      x: 350,
      y: 150,
      width: 120,
      height: 120,
      rotation: 0,
      fill: "#ec4899",
      stroke: "#db2777",
      strokeWidth: 2,
      opacity: 1,
      zIndex: 2,
    },
    {
      id: "text-1",
      type: "text",
      x: 100,
      y: 260,
      width: 300,
      height: 60,
      rotation: 0,
      fill: "#1e293b",
      stroke: "transparent",
      strokeWidth: 0,
      opacity: 1,
      text: "Welcome to Mini Design Canvas!",
      fontSize: 22,
      fontFamily: "Inter, sans-serif",
      zIndex: 3,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function checkValidation(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, "Validation failed", 400, errors.array());
    return false;
  }
  return true;
}

function resolveId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// ─── GET /api/canvases ────────────────────────────────────────────────────────

export async function getAllCanvases(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (isUsingMemoryStore) {
      const list = Array.from(memoryStore.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((c) => ({
          _id: c._id,
          name: c.name,
          width: c.width,
          height: c.height,
          elementCount: c.elements.length,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      sendSuccess(res, list);
      return;
    }

    const canvases = await Canvas.find()
      .select("name width height elements createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean<(ICanvas & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date })[]>();

    const result = canvases.map((c) => ({
      _id: c._id,
      name: c.name,
      width: c.width,
      height: c.height,
      elementCount: c.elements?.length ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/canvases/:id ────────────────────────────────────────────────────

export async function getCanvas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = resolveId(req.params.id);

    if (!isValidObjectId(id)) {
      sendError(res, "Invalid canvas ID", 400);
      return;
    }

    if (isUsingMemoryStore) {
      const canvas = memoryStore.get(id);
      if (!canvas) {
        sendError(res, "Canvas not found", 404);
        return;
      }
      sendSuccess(res, canvas);
      return;
    }

    const canvas = await Canvas.findById(id).lean();

    if (!canvas) {
      sendError(res, "Canvas not found", 404);
      return;
    }

    sendSuccess(res, canvas);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/canvases ───────────────────────────────────────────────────────

export async function createCanvas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkValidation(req, res)) return;

    const { name, width, height, elements } = req.body;

    if (isUsingMemoryStore) {
      const newId = new mongoose.Types.ObjectId().toString();
      const now = new Date().toISOString();
      const newCanvas: MemoryCanvas = {
        _id: newId,
        name: name ?? "Untitled Canvas",
        width: width ?? 1200,
        height: height ?? 700,
        elements: elements ?? [],
        createdAt: now,
        updatedAt: now,
      };
      memoryStore.set(newId, newCanvas);
      sendSuccess(res, newCanvas, 201, "Canvas created");
      return;
    }

    const canvas = await Canvas.create({
      name: name ?? "Untitled Canvas",
      width: width ?? 1200,
      height: height ?? 700,
      elements: elements ?? [],
    });

    sendSuccess(res, canvas.toObject(), 201, "Canvas created");
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/canvases/:id ────────────────────────────────────────────────────

export async function updateCanvas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkValidation(req, res)) return;

    const id = resolveId(req.params.id);

    if (!isValidObjectId(id)) {
      sendError(res, "Invalid canvas ID", 400);
      return;
    }

    const { name, width, height, elements } = req.body;

    if (isUsingMemoryStore) {
      const existing = memoryStore.get(id);
      if (!existing) {
        sendError(res, "Canvas not found", 404);
        return;
      }

      const updated: MemoryCanvas = {
        ...existing,
        ...(name !== undefined && { name }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(elements !== undefined && { elements }),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.set(id, updated);
      sendSuccess(res, updated, 200, "Canvas updated");
      return;
    }

    const updateFields: Partial<ICanvas> = {};
    if (name !== undefined) updateFields.name = name;
    if (width !== undefined) updateFields.width = width;
    if (height !== undefined) updateFields.height = height;
    if (elements !== undefined) updateFields.elements = elements;

    const canvas = await Canvas.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!canvas) {
      sendError(res, "Canvas not found", 404);
      return;
    }

    sendSuccess(res, canvas, 200, "Canvas updated");
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/canvases/:id ─────────────────────────────────────────────────

export async function deleteCanvas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = resolveId(req.params.id);

    if (!isValidObjectId(id)) {
      sendError(res, "Invalid canvas ID", 400);
      return;
    }

    if (isUsingMemoryStore) {
      if (!memoryStore.has(id)) {
        sendError(res, "Canvas not found", 404);
        return;
      }
      memoryStore.delete(id);
      sendSuccess(res, { id }, 200, "Canvas deleted");
      return;
    }

    const canvas = await Canvas.findByIdAndDelete(id);

    if (!canvas) {
      sendError(res, "Canvas not found", 404);
      return;
    }

    sendSuccess(res, { id }, 200, "Canvas deleted");
  } catch (err) {
    next(err);
  }
}
