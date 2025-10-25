const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const authenticateToken = require("./middlewares/authMiddleware");
const { errorHandler, routeNotFound } = require("./middlewares/errorHandler");
const configureCors = require("./config/corsConfig");
 
const helmet = require("helmet");
 
dotenv.config();
const app = express();

app.use(configureCors());
app.use(express.json());
// app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(authenticateToken);
app.use("/qa-api", require("./routes"));

 
app.use(routeNotFound);
app.use(errorHandler);

module.exports = app;
