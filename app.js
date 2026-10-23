
require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");

const rootDir = require("./utils/path");

const storeRouter = require("./routes/storeRouter");
const { hostRouter } = require("./routes/hostRouter");
const bookingRouter = require("./routes/bookingRouter");
const authRouter = require("./routes/authRouter");

const requireLogin = require("./middleware/auth");
const errorController = require("./controllers/error");

// Environment configuration
const DB_PATH = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Fail early when required configuration is missing.
if (!DB_PATH) {
  throw new Error("MONGODB_URI is missing from your .env file.");
}

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from your .env file.");
}

const app = express();

app.set("view engine", "ejs");

// Required when deployed behind a trusted reverse proxy using HTTPS.
if (isProduction) {
  app.set("trust proxy", 1);
}

// MongoDB-backed session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

store.on("error", (error) => {
  console.error("MongoDB session store error:", error);
});

// Static files and request parsing
app.use(express.static(path.join(rootDir, "public")));

app.use(
  "/uploads",
  express.static(path.join(rootDir, "uploads"))
);

app.use(express.urlencoded({ extended: true }));

// Session middleware must run before routes.
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Application routes
app.use(authRouter);
app.use(storeRouter);
app.use(bookingRouter);

// Protect host routes using the existing authentication middleware.
app.use("/host", requireLogin);
app.use("/host", hostRouter);

// Application-level error handling
app.use(errorController.error);

// Final fallback error handler
app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("ERROR:", err);
  console.error("MESSAGE:", err.message);
  console.error("STACK:", err.stack);
  console.error("=================================");

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).send("Something went wrong.");
});

// Connect to MongoDB before starting the server.
mongoose
  .connect(DB_PATH)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error while connecting to MongoDB:", error);
    process.exitCode = 1;
  });
