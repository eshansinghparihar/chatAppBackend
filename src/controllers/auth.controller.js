import createHttpError from "http-errors";
import { createUser, signUser, updateUser } from "../services/auth.service.js";
import { generateToken, verifyToken } from "../services/token.service.js";
import { findUser } from "../services/user.service.js";
import axios from "axios";
import { UserModel } from "../models/index.js";

const { DEFAULT_PICTURE, DEFAULT_STATUS } = process.env;

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
          password: "DEFAULT@123",
        });

        console.log(newUser);

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
    console.log(googleAccessToken.googleAccessToken);
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
