const ExpressError = require("../utils/expressError");

const validateRequest = (schema, property = "body") => {
  // Basic guard to ensure a Joi-like schema is provided when creating the middleware
  if (!schema || typeof schema.validate !== "function") {
    throw new ExpressError(
      "validateRequest requires a Joi schema: call validateRequest(schema) when registering middleware.",
      500
    );
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors });
    }
    req[property] = value;
    next();
  };
};

module.exports = validateRequest;
