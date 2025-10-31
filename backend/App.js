const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const os = require("os");
const rateLimit = require("express-rate-limit");
const dbMiddleware = require("./src/middlewares/dbMiddleware");
const config = require("./src/config/config");

const app = express();

app.use(cors());
  
app.use(morgan("combined"));
app.use(helmet());

// If behind a proxy (e.g., Nginx), this lets req.ip reflect the client IP
app.set("trust proxy", true);

// Basic rate limiting for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use(dbMiddleware);

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const AuthRoutes = require("./src/routes/AuthRoutes");
const ParameterRoutes = require("./src/routes/ParameterRoutes");
const ConfigRoutes = require("./src/routes/ConfigRoutes");
const CitationRoutes = require("./src/routes/CitationRoutes");
const AppreciationRoutes = require("./src/routes/AppreciationRoutes");
const UnitRoutes = require("./src/routes/UnitRoutes");
const ApplicationRoutes = require("./src/routes/ApplicationRoutes");
const ClarificationRoutes = require("./src/routes/ClarificationRoutes");
const DashboardRoutes = require("./src/routes/DashboardRoutes");
const MasterRoutes = require("./src/routes/MasterRoutes");

// Add cache control middleware for API routes
app.use("/api", (req, res, next) => {
  // Set cache control headers to prevent caching for all API responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

app.use("/api/auth", AuthRoutes);
app.use("/api/parameter", ParameterRoutes);
app.use("/api/config", ConfigRoutes);
app.use("/api/citation", CitationRoutes);
app.use("/api/appreciation", AppreciationRoutes);
app.use("/api/unit", UnitRoutes);
app.use("/api/applications", ApplicationRoutes);
app.use("/api/clarification", ClarificationRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/master", MasterRoutes);

// Simple endpoint to return the client IP address as seen by the server
app.get("/api/client-ip", (req, res) => {
  // Prefer x-forwarded-for when present
  const xff = req.headers["x-forwarded-for"]; // may be a comma-separated list
  const forwardedIp = Array.isArray(xff) ? xff[0] : (xff || "").toString().split(",")[0].trim();
  const ip = forwardedIp || req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "";
  // Normalize IPv6 localhost/IPv4-mapped addresses
  let normalized = (ip || "").replace("::ffff:", "");

  // If request appears to be from localhost, attempt to resolve LAN IPv4
  const isLocal = normalized === "::1" || normalized === "127.0.0.1" || normalized === "";
  if (isLocal) {
    const nets = os.networkInterfaces();
    let lan = "";
    for (const name of Object.keys(nets)) {
      const addrs = nets[name] || [];
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          // Prefer private ranges
          if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(addr.address)) {
            lan = addr.address;
            break;
          }
          if (!lan) lan = addr.address; // fallback to first external IPv4
        }
      }
      if (lan) break;
    }
    if (lan) normalized = lan;
  }
  res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
  res.json({ ip: normalized });
});

process.on("uncaughtException", (err) => {
  // console.log(err)
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  // console.log(reason)

  process.exit(1);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port =  process.env.PORT || 8386;
app.listen(port, () => {
  // Server started
});
