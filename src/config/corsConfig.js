const cors = require("cors");
const ExpressError = require("../utils/expressError");

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174","http://localhost:5175" , "https://itmedservices.com"];

    // Allow requests with no origin (like curl, Postman, or same-origin server calls)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new ExpressError("Not allowed by CORS", 403)); // Use your custom error
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const configureCors = () => cors(corsOptions);

module.exports = configureCors;