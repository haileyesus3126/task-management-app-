const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  "https://task-management-app-nine-coral.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      const error = new Error(`CORS blocked: ${origin}`);
      error.status = 403;

      return callback(error);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.options(/.*/, cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,

    max:
      process.env.NODE_ENV === "production"
        ? 100
        : 1000,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests, please try again later.",
    },
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(
  "/uploads",
  express.static("uploads")
);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Task Management API is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);

  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose invalid ObjectId / CastError
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;

    const messages = Object.values(
      err.errors
    ).map((item) => item.message);

    message = messages.join(", ");
  }

  // Duplicate MongoDB unique field
  if (err.code === 11000) {
    statusCode = 400;

    const field = Object.keys(
      err.keyValue || {}
    )[0];

    message = field
      ? `${field} already exists`
      : "Duplicate value";
  }

  // Multer file-size error
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message =
      "File is too large. Maximum size is 5 MB.";
  }

  // Hide internal details in production
  if (
    process.env.NODE_ENV === "production" &&
    statusCode === 500
  ) {
    message = "Internal Server Error";
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

module.exports = app;