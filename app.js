const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const createError = require("http-errors");

const indexRouter = require("./routes/index");

const app = express();

console.log("App file loaded");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

console.log("Routes middleware added");

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log("404 handler hit");
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log("Error handler hit:", err.message);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
