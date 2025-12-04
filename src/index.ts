import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import patientRoutes from "./routes/patientRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const DEBUG = process.env.DEBUG === "true" || process.env.DEBUG === "1";

if (DEBUG) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("Headers:", req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("Body:", JSON.stringify(req.body, null, 2));
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

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", patientRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (DEBUG) {
    console.log("DEBUG mode enabled");
  }
});
