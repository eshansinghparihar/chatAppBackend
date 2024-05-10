import express from "express";
import trimRequest from "trim-request";
import { searchUsers, doesUserExist } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.route("/").get(trimRequest.all, authMiddleware, searchUsers);
router.route("/doesExist").get(trimRequest.all, doesUserExist);
export default router;
