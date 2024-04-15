import express from "express";
import trimRequest from "trim-request";
import {
  login,
  logout,
  refreshToken,
  register,
  update,
  sendEmail
} from "../controllers/auth.controller.js";
const router = express.Router();

router.route("/register").post(trimRequest.all, register);
router.route("/update").patch(trimRequest.all, update);
router.route("/login").post(trimRequest.all, login);
router.route("/logout").post(trimRequest.all, logout);
router.route("/refreshtoken").post(trimRequest.all, refreshToken);
router.route("/sendEmail").post(trimRequest.all, sendEmail);

export default router;
