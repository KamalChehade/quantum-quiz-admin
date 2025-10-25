const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const sequelize = require("../config/db"); // Import sequelize instance

const db = {};

// Dynamically import all models from the current directory (excluding index.js)
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js")) // ignore non-JS files too
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model; // Add the model to the db object
  });

// Set up associations between models (for example, User belongsTo Role)
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Apply associations if defined in the model
  }
});

 
// Attach sequelize instance and class to db for reference
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
