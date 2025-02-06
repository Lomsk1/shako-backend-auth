import { NextFunction, Request, Response } from "express";

export const getMe = (req: Request, _res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};
