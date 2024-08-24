const express = require("express");
const routes = express.Router();

const usersController = require("./controller/userMaster/userController");
const userController = require("./controller/userMaster/userController");

routes.post("/admin/register", usersController.createUser);

routes.post("/customer/register", usersController.createUser);

routes.get("/verify-email", usersController.verifyEmail);

routes.post("/login", userController.login);

module.exports = routes;
