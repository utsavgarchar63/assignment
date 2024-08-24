const bcrypt = require("bcryptjs");
const User = require("../../model/userMaster/userMasterSchema");
const enums = require("../../json/enums.json");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const messages = require("../../json/messages.json");
const { v4: uuidv4 } = require("uuid");
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = {
  createUser: async (req, res) => {
    try {
      const urlParts = req.url.split("/");
      const role = urlParts[urlParts.length - 2];
      console.log(enums.ROLES.ADMIN, enums.ROLES.CUSTOMER, role);
      const validRoles = [enums.ROLES.ADMIN, enums.ROLES.CUSTOMER];
      const verificationToken = uuidv4();
      if (!validRoles.includes(role)) {
        return res
          .status(enums.HTTP_CODES.BAD_REQUEST)
          .json({ sucess: false, message: messages.INVALID_ROLE });
      }
      const { firstName, lastName, email, password } = req.body;
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(enums.HTTP_CODES.BAD_REQUEST).json({
          success: false,
          message: messages.EMAIL_ALREADY_REGISTERED,
        });
      }
      const verificationUrl = `http://localhost:8000/verify-email?token=${verificationToken}`;

      await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: "Email Verification",
        html: `<h1>Verify your email</h1>
        <button><a href="${verificationUrl}">Verify</a></button>`,
      });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        verificationToken,
      });
      return res.status(enums.HTTP_CODES.OK).json({
        success: true,
        message: `${role} ${messages.USER_CREATED_SUCCESSFULLY}`,
      });
    } catch (error) {
      console.error(error);
      return res.status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        sucess: false,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;
      console.log(token);
      const user = await User.findOne({ where: { verificationToken: token } });
      if (!user) {
        return res
          .status(enums.HTTP_CODES.NOT_FOUND)
          .json({ error: messages.EMAIL_NOT_FOUND });
      }
      user.emailVerified = true;
      user.verificationToken = null;
      await user.save();
      return res.status(enums.HTTP_CODES.OK).json({
        message: messages.EMAIL_VERIFIED_SUCCESSFULLY,
      });
    } catch (error) {
      console.error(error);
      return res.status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        sucess: false,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: messages.INVALID_EMAIL_OR_PASSWORD,
        });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: messages.INVALID_EMAIL_OR_PASSWORD,
        });
      }
      if (user.role !== enums.ROLES.ADMIN) {
        return res.status(enums.HTTP_CODES.UNAUTHORIZED).json({
          success: false,
          message: messages.NOT_ALLOWED_TO_LOGIN,
        });
      }
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res
        .status(enums.HTTP_CODES.OK)
        .json({ success: true, message: messages.LOGIN_SUCCESSFULLY, token });
    } catch (error) {
      console.error(error);
      return res.status(enums.HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
