const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const routes = require("./routes");
const sequelize = require("./config/db");

require("dotenv").config();

const app = express();
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use("/", routes);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected");
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, (err) => {
      if (err) console.log(err);
      else console.log(`Server is running on port: ${process.env.PORT}`);
    });
    console.log("Models synchronized");
  })
  .catch((err) => console.error("Error:", err));
