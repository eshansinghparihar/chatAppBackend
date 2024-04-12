import createHttpError from "http-errors";
import { createUser, signUser, updateUser } from "../services/auth.service.js";
import { generateToken, verifyToken } from "../services/token.service.js";
import { findUser } from "../services/user.service.js";
import axios from "axios";
import { UserModel } from "../models/index.js";
import nodemailer from "nodemailer";

const { DEFAULT_PICTURE, DEFAULT_STATUS, DEFAULT_PASSWORD } = process.env;

export const register = async (req, res, next) => {
  if (req.body.googleAccessToken) {
    const { googleAccessToken } = req.body;
    console.log(googleAccessToken.googleAccessToken);

    axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${googleAccessToken.googleAccessToken}`,
        },
      })
      .then(async (response) => {
        const name = response.data.given_name;
        const email = response.data.email;
        const picture = response.data.picture;

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
          console.log("here");
          return res.status(400).json({ message: "User already exist!" });
        }

        const newUser = await createUser({
          googleSignIn: true,
          name,
          email,
          picture: picture || DEFAULT_PICTURE,
          status: DEFAULT_STATUS,
          password: DEFAULT_PASSWORD,
        });

        const access_token = await generateToken(
          { userId: newUser._id },
          "1d",
          process.env.ACCESS_TOKEN_SECRET
        );
        const refresh_token = await generateToken(
          { userId: newUser._id },
          "30d",
          process.env.REFRESH_TOKEN_SECRET
        );

        res.cookie("refreshtoken", refresh_token, {
          httpOnly: true,
          path: "/api/v1/auth/refreshtoken",
          maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        });

        res.json({
          message: "register success.",
          user: {
            googleSignIn: newUser.googleSignIn,
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            picture: newUser.picture,
            status: newUser.status,
            token: access_token,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({ message: "Invalid access token!" });
      });
  } else {
    try {
      const { name, email, picture, status, password } = req.body;
      const newUser = await createUser({
        name,
        email,
        picture,
        status,
        password,
      });
      const access_token = await generateToken(
        { userId: newUser._id },
        "1d",
        process.env.ACCESS_TOKEN_SECRET
      );
      const refresh_token = await generateToken(
        { userId: newUser._id },
        "30d",
        process.env.REFRESH_TOKEN_SECRET
      );

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/v1/auth/refreshtoken",
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
      });

      res.json({
        message: "register success.",
        user: {
          googleSignIn: newUser.googleSignIn,
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          picture: newUser.picture,
          status: newUser.status,
          token: access_token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
};

export const update = async (req, res, next) => {
  try {
    const user = await updateUser(req.body);
    console.log(user);
    const access_token = await generateToken(
      { userId: user._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    const refresh_token = await generateToken(
      { userId: user._id },
      "30d",
      process.env.REFRESH_TOKEN_SECRET
    );

    res.cookie("refreshtoken", refresh_token, {
      httpOnly: true,
      path: "/api/v1/auth/refreshtoken",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    });
    res.json({
      message: "update success.",
      user: {
        googleSignIn: user.googleSignIn,
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        status: user.status,
        token: access_token,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  if (req.body.googleAccessToken) {
    // gogole-auth
    const { googleAccessToken } = req.body;

    axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${googleAccessToken.googleAccessToken}`,
        },
      })
      .then(async (response) => {
        const email = response.data.email;
        const existingUser = await UserModel.findOne({ email });

        if (!existingUser)
          return res.status(404).json({ message: "User don't exist!" });

        const access_token = await generateToken(
          { userId: existingUser._id },
          "1d",
          process.env.ACCESS_TOKEN_SECRET
        );
        const refresh_token = await generateToken(
          { userId: existingUser._id },
          "30d",
          process.env.REFRESH_TOKEN_SECRET
        );

        res.cookie("refreshtoken", refresh_token, {
          httpOnly: true,
          path: "/api/v1/auth/refreshtoken",
          maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        });

        res.json({
          message: "login success.",
          user: {
            googleSignIn: existingUser.googleSignIn,
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            picture: existingUser.picture,
            status: existingUser.status,
            token: access_token,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({ message: "Invalid access token!" });
      });
  } else {
    try {
      const { email, password } = req.body;
      const user = await signUser(email, password);
      const access_token = await generateToken(
        { userId: user._id },
        "1d",
        process.env.ACCESS_TOKEN_SECRET
      );
      const refresh_token = await generateToken(
        { userId: user._id },
        "30d",
        process.env.REFRESH_TOKEN_SECRET
      );

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/v1/auth/refreshtoken",
        maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
      });

      res.json({
        message: "register success.",
        user: {
          googleSignIn: user.googleSignIn,
          _id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          status: user.status,
          token: access_token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("refreshtoken", { path: "/api/v1/auth/refreshtoken" });
    res.json({
      message: "logged out !",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refreshtoken;
    if (!refresh_token) throw createHttpError.Unauthorized("Please login.");
    const check = await verifyToken(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await findUser(check.userId);
    const access_token = await generateToken(
      { userId: user._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        status: user.status,
        token: access_token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { message } = req.body;
    const { sender } = req.body;

    // Send mail to the given user's email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    //subject. message, email, from?
    let mailOptions = null;
    let otp = null;
    
    if (sender) {
      mailOptions = {
        from: `Apispocc Team-7 ${process.env.GMAIL_USER}`,
        to: email,
        subject: "A new message notification",
        html: `<!DOCTYPE html>
              <html lang="en" >
              <head>
              <meta charset="UTF-8">
              </head>
              <body>
                <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                  <div style="margin:50px auto;width:70%;padding:20px 0; text-align: center;">
                    <div style="border-bottom:1px solid #eee">
                      <a href="" style="font-size:1.8em;color: #00466A;text-decoration:none;font-weight:600">Greetings of the day!</a>
                    </div>
                    <p style="font-size:1.4em">You have receieved following message from ${sender}:</p>
                    <h2 style="margin: 0 auto;width: max-content;padding: 0 10px;color: #000;border-radius: 4px;">"${message}"</h2>
                    <p style="font-size:1.2em;">Thank you!</p>
                    <hr style="border:none;border-top:1px solid #eee" />
                  </div>
                </div>
              </body>
              </html>`,
      };
    } else {
      //Generate a random OTP(4-digit)
      otp = Math.floor(Math.random() * 9000 + 1000);

      mailOptions = {
        from: `Apispocc Team-7 ${process.env.GMAIL_USER}`,
        to: email,
        subject: "Reset your password",
        html: `<!DOCTYPE html>
                <html lang="en" >
                <head>
                <meta charset="UTF-8">
                </head>
                <body>
                  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                    <div style="margin:50px auto;width:70%;padding:20px 0; text-align: center;">
                      <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.8em;color: #00466A;text-decoration:none;font-weight:600">Greetings of the day!</a>
                      </div>
                      <p style="font-size:1.4em">Use the following OTP to complete your Password Recovery Procedure</p>
                      <h2 style="background: #00466A;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                      <p style="font-size:1.2em;">Thank you!</p>
                      <hr style="border:none;border-top:1px solid #eee" />
                    </div>
                  </div>
                </body>
                </html>`,
      };
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: "Error sending email",
        });
      }

      console.log("Email sent: " + info.response);
      return res.status(200).json({
        success: true,
        message: "Email sent successfully",
        email: email,
        ...(otp ? { otp: otp } : {}), // Include 'otp' if it's present
        ...(sender && message ? { sender: sender, message: message } : {}), // Include 'sender' and 'message' if they are present
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
