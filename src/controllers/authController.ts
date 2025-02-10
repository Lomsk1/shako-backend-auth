import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import User, { UserDoc } from "../models/user";
import AppError from "../utils/appErrors";
import passport from "passport";

dotenv.config();

const signToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
};

const createSendToken = (
  user: UserDoc,
  statusCode: number,
  res: Response,
  req: Request
) => {
  const token = signToken(user.id, user.email);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000
    ),
    // httpOnly: true,
    sameSite: "none",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",

  //   Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

export const signUp = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
    });

    createSendToken(newUser, 201, res, req);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1) check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please, enter Email and Password", 400));
    }
    // 2) check if user exist && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect Email or Password", 401));
    }

    // 3) if everything is OK, send token to client
    createSendToken(user, 200, res, req);
  }
);

export const logout = (_req: Request, res: Response) => {
  // Clear the JWT cookie by setting it to an expired value
  res.cookie("jwt", "expired", {
    expires: new Date(Date.now() - 1),
    httpOnly: true,
  });

  // Optionally, you can redirect the user to a specific page or send a JSON response
  res.status(200).json({ status: "success" });
};

//////////////////// G O O G L E ///////////////////

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/login" },
    async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ message: "User authentication failed" });
      }

      // Check if user exists or create a new one
      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        existingUser = await User.create({
          email: user.email,
        });
      }

      // Generate token
      const token = signToken(existingUser.id, existingUser.email);

      res.cookie("jwt", token, {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
      });

      res.redirect(`${process.env.FRONT_BASE_URL}/?token=${token}`);
    }
  )(req, res, next);
};
