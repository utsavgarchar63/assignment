require("dotenv").config();
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(process.env.DB_NAME, "root", process.env.PASS, {
  host: process.env.HOST,
  dialect: "mysql",
});

module.exports = sequelize;
