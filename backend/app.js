const express = require("express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const errorMiddleware = require("./middleware/error");
const userRoutes = require("./routes/userRoute");

const app = express();

// Trust proxy for accurate client IP detection
app.set('trust proxy', 1);
// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(express.json());  // Parse incoming JSON requests
app.use(cookieParser());  // Parse cookies
app.use(limiter);  // Apply rate limiting middleware

// Routes
app.use("/api/v1", userRoutes);  // Mount user routes

// Error middleware
app.use(errorMiddleware);

module.exports = app;  // Export for use in server.js
