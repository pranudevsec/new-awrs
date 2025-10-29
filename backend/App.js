const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const dbMiddleware = require("./src/middlewares/dbMiddleware");
const config = require("./src/config/config");

const app = express();

app.use(cors());
  
app.use(morgan("combined"));
app.use(helmet());

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
  console.log(`Server is running on http://localhost:${port}`);
});
