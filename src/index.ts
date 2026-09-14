import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import https from "https";
import connectDB from "./config/db";
import canvasRoutes from "./routes/canvases";
import { errorHandler, notFound } from "./middleware/errorHandler";

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin === CLIENT_URL ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost:") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    keepAlivePing: "active",
  });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Mini Design Canvas API is running 🚀",
    health: "/health",
    canvases: "/api/canvases",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/canvases", canvasRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Self-Pinging Keep-Alive Cron Job (Prevents Render Sleep) ─────────────────

function startKeepAliveCron() {
  // Check for explicit KEEP_ALIVE_URL, Render auto-set RENDER_EXTERNAL_URL, or BACKEND_URL
  const rawUrl =
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL;

  // Interval in ms (Default: 2 minutes = 120,000ms)
  const PING_INTERVAL = parseInt(process.env.PING_INTERVAL_MS || "120000", 10);

  if (!rawUrl) {
    console.log("ℹ️ Keep-Alive Self-Ping: Set KEEP_ALIVE_URL or RENDER_EXTERNAL_URL in production to auto-ping backend.");
    return;
  }

  const targetUrl = rawUrl.endsWith("/health")
    ? rawUrl
    : `${rawUrl.replace(/\/$/, "")}/health`;

  console.log(`⏱️ Keep-Alive Cron active: Pinging ${targetUrl} every ${PING_INTERVAL / 1000}s`);

  setInterval(() => {
    try {
      const client = targetUrl.startsWith("https") ? https : http;
      client
        .get(targetUrl, (res) => {
          console.log(`[Keep-Alive Ping] ${new Date().toISOString()} → HTTP ${res.statusCode}`);
        })
        .on("error", (err) => {
          console.warn(`[Keep-Alive Ping Failed] ${err.message}`);
        });
    } catch (err) {
      console.warn("[Keep-Alive Cron Error]", err);
    }
  }, PING_INTERVAL);
}

// ─── Start server ─────────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 CORS allowed origin: ${CLIENT_URL}`);
      console.log(`📡 API: http://localhost:${PORT}/api/canvases`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);

      startKeepAliveCron();
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
