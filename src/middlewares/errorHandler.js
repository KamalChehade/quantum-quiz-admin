const ExpressError = require("../utils/expressError");


const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log the error to the console
  console.error("Error:", message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  if (err instanceof ExpressError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? "" : err.stack,
  });
};
// Route not found handler
const routeNotFound = (req, res, next) => {
  next(new ExpressError(`Not Found - ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, routeNotFound };
