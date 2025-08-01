const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const dbMiddleware = require("./src/middlewares/dbMiddleware");
const config = require("./src/config/config");

const app = express();

// Cors
app.use(cors());
  
app.use(morgan("combined"));
app.use(helmet());

// Increase the limit for JSON payloads
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Connect Database
app.use(dbMiddleware);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import routes
const AuthRoutes = require("./src/routes/AuthRoutes");
const ParameterRoutes = require("./src/routes/ParameterRoutes");
const ConfigRoutes = require("./src/routes/ConfigRoutes");
const CitationRoutes = require("./src/routes/CitationRoutes");
const AppreciationRoutes = require("./src/routes/AppreciationRoutes");
const UnitRoutes = require("./src/routes/UnitRoutes");
const ApplicationRoutes = require("./src/routes/ApplicationRoutes");
const ClarificationRoutes = require("./src/routes/ClarificationRoutes");
const DashboardRoutes = require("./src/routes/DashboardRoutes");
const ChatbotRoutes = require("./src/routes/ChatbotRoutes");

// Use routes
app.use("/api/auth", AuthRoutes);
app.use("/api/parameter", ParameterRoutes);
app.use("/api/config", ConfigRoutes);
app.use("/api/citation", CitationRoutes);
app.use("/api/appreciation", AppreciationRoutes);
app.use("/api/unit", UnitRoutes);
app.use("/api/applications", ApplicationRoutes);
app.use("/api/clarification", ClarificationRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/chatbot", ChatbotRoutes);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.log(reason);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port =  process.env.PORT || 8385;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
