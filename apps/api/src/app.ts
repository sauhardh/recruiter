import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// Serve uploaded resume files publicly
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api", router);
app.use(router);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
