import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import session from "express-session";
import cors from "cors";
import createHttpError from "http-errors";
import routes from "./routes/index.js";
import { UserModel } from "../src/models/index.js";
import passport from "passport";
import { Strategy } from "passport-google-oauth2";
import { refreshToken, register } from "../src/controllers/auth.controller.js";
import { generateToken } from "./services/token.service.js";
const OAuth2Strategy = Strategy;

//dotEnv config
dotenv.config();

const clientid = process.env.GOOGLE_CLIENTID;

const clientsecret = process.env.GOOGLE_CLIENTSECRET;

//create express app
const app = express();

//morgan
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//helmet
app.use(helmet());

//parse json request url
app.use(express.json());

//parse json request body
app.use(express.urlencoded({ extended: true }));

//sanitize request data
app.use(mongoSanitize());

//enable cookie parser
app.use(cookieParser());

//gzip compression
app.use(compression());

//file upload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//cors
app.use(cors());

//api v1 routes
app.use("/api/v1", routes);

app.use(async (req, res, next) => {
  next(createHttpError.NotFound("This route does not exist."));
});

//error handling
app.use(async (err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

export default app;
