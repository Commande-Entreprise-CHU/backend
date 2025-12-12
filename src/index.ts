import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import patientRoutes from "./routes/patientRoutes";
import templateRoutes from "./routes/templateRoutes";
import authRoutes from "./routes/authRoutes";
import auditRoutes from "./routes/auditRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const DEBUG = process.env.DEBUG === "true" || process.env.DEBUG === "1";

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

if (DEBUG) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("Headers:", req.headers);

    // SECURITY: Do not log body if it contains sensitive data in production
    // Only log body in explicit debug mode and ensure no real patient data is used in dev
    if (req.body && Object.keys(req.body).length > 0) {
      // Mask sensitive fields in logs
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = "***";
      // Add other sensitive fields masking here if needed
      console.log("Body:", JSON.stringify(safeBody, null, 2));
    }

    const originalSend = res.send;
    res.send = function (data: any) {
      console.log(`Response Status: ${res.statusCode}`);
      if (typeof data === "string" && data.length > 0) {
        try {
          const parsed = JSON.parse(data);
          console.log("Response Body:", JSON.stringify(parsed, null, 2));
        } catch {
          console.log("Response Body:", data.substring(0, 200));
        }
      }
      return originalSend.call(this, data);
    };

    next();
  });
}

// const allowedOrigins = process.env.CLIENT_URL
//   ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
//   : ["http://localhost:5173"];

// console.log("Allowed Origins for CORS:", allowedOrigins);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// Allow all origins in development, but restrict in production
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api", patientRoutes);
app.use("/api/templates", templateRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (DEBUG) {
    console.log("DEBUG mode enabled");
  }
});
