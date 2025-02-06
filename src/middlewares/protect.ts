import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appErrors";
import User from "../models/user";
import { catchAsync } from "../utils/catchAsync";

interface UserPayload {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // 1) Getting token and check of it's there
    let token: string;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not authorized! Please, login", 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    // 3) check if user still exist
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError("Valid time has expired", 401));
    }

    // 4) Check if user changed password after the  JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("Password has changed currently! Please, login again", 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = decoded;
    next();
  }
);
