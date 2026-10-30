require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const transactionsRouter = require("./routes/transactions");
const goalsRouter = require("./routes/goals");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Budget Goal Planner" }));
app.use("/api/transactions", transactionsRouter);
app.use("/api/goals", goalsRouter);

app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();

  res.sendFile(
    path.join(__dirname, "..", "frontend", "index.html"),
    (err) => {
      if (err) next(err);
    }
  );
});

app.use((err, req, res, next) => {
  // Log technical details on the server; never send raw database errors to the browser.
  console.error("Request failed:", err.message || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong while processing the request. Check server logs and database configuration." });
});

app.listen(PORT, () => console.log(`Budget Goal Planner running at http://localhost:${PORT}`));
