const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const { connectCloudinary } = require("./config/cloudinary");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const errorHandler = require("./middleware/errorHandler");

dotenv.config();

// ============================================
// GLOBAL ERROR HANDLERS (MUST BE FIRST)
// ============================================
process.on("uncaughtException", (err) => {
  console.error("🔴 UNCAUGHT EXCEPTION:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("🔴 UNHANDLED REJECTION:", err);
  if (err instanceof Error) {
    console.error("Stack:", err.stack);
  }
});

// Validate required environment variables
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missingEnvVars = requiredEnvVars.filter((varName) => {
  const val = process.env[varName];
  return !val || val.trim() === "";
});
if (missingEnvVars.length > 0) {
  console.error(
    `❌ Critical Error: Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

// Log startup diagnostics
console.log("\n📋 STARTUP DIAGNOSTICS:");
console.log(`✅ Environment variables loaded`);
console.log(`✅ Gemini API Key Present: ${!!process.env.GEMINI_API_KEY}`);
console.log(`✅ Node Environment: ${process.env.NODE_ENV || "development"}`);
console.log("");

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Cloudinary
    connectCloudinary();

    const app = express();

    // Middleware
    app.use(helmet());
    app.use(mongoSanitize());
    app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      }),
    );

    app.use(express.json({ limit: "10kb" }));
    app.use(express.urlencoded({ extended: true }));

    // Health Check
    app.get("/api/health", (req, res) => {
      res.json({
        success: true,
        message: "AI Interview Coach API is running 🚀",
      });
    });

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/resume", resumeRoutes);
    app.use("/api/interviews", interviewRoutes);
    app.use("/api/analytics", analyticsRoutes);

    // 404 Handler
    app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found.",
      });
    });

    // Global Error Handler
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("✅ Route registration success");
      console.log("✅ Database connection success");
      console.log("\n✨ AI Interview Coach Backend is READY\n");
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📌 SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("📌 SIGINT received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
