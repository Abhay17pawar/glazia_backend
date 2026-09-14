import mongoose, { Document, Schema } from "mongoose";

// ─── Element Sub-schema ───────────────────────────────────────────────────────

export interface ICanvasElement {
  id: string;
  type: "rect" | "circle" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  zIndex: number;
}

const ElementSchema = new Schema<ICanvasElement>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["rect", "circle", "text"], required: true },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    rotation: { type: Number, default: 0 },
    fill: { type: String, default: "#6366f1" },
    stroke: { type: String, default: "transparent" },
    strokeWidth: { type: Number, default: 1, min: 0 },
    opacity: { type: Number, default: 1, min: 0, max: 1 },
    text: { type: String },
    fontSize: { type: Number, min: 1 },
    fontFamily: { type: String },
    zIndex: { type: Number, default: 0 },
  },
  { _id: false } // use our own `id` field, not MongoDB's _id
);

// ─── Canvas Schema ────────────────────────────────────────────────────────────

export interface ICanvas extends Document {
  name: string;
  width: number;
  height: number;
  elements: ICanvasElement[];
}

const CanvasSchema = new Schema<ICanvas>(
  {
    name: {
      type: String,
      required: [true, "Canvas name is required"],
      trim: true,
      maxlength: [100, "Canvas name must be 100 characters or fewer"],
      default: "Untitled Canvas",
    },
    width: {
      type: Number,
      required: true,
      min: [100, "Width must be at least 100px"],
      default: 1200,
    },
    height: {
      type: Number,
      required: true,
      min: [100, "Height must be at least 100px"],
      default: 700,
    },
    elements: {
      type: [ElementSchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// ─── Index for faster list queries ───────────────────────────────────────────

CanvasSchema.index({ updatedAt: -1 });

// ─── Virtual: element count (for list endpoint) ───────────────────────────────

CanvasSchema.virtual("elementCount").get(function () {
  return this.elements.length;
});

const Canvas = mongoose.model<ICanvas>("Canvas", CanvasSchema);
export default Canvas;
