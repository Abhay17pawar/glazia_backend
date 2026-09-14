import { body, ValidationChain } from "express-validator";

// ─── Canvas validation rules ──────────────────────────────────────────────────

export const validateCreateCanvas: ValidationChain[] = [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name must be 100 characters or fewer"),

  body("width")
    .optional()
    .isInt({ min: 100 })
    .withMessage("Width must be an integer ≥ 100"),

  body("height")
    .optional()
    .isInt({ min: 100 })
    .withMessage("Height must be an integer ≥ 100"),

  body("elements")
    .optional()
    .isArray()
    .withMessage("Elements must be an array"),

  body("elements.*.type")
    .optional()
    .isIn(["rect", "circle", "text"])
    .withMessage("Element type must be rect, circle, or text"),

  body("elements.*.id")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Element id is required"),
];

export const validateUpdateCanvas = validateCreateCanvas;
