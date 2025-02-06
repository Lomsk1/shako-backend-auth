import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appErrors";

export const restrictTo = (...roles: any[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have the permission to access this action", 403)
      );
    }
    next();
  };
};