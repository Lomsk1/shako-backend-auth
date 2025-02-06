import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/appErrors";
import User from "../models/user";

const filterObj = (obj: Object, ...allowedFields: any[]) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      user,
    });
  }
);

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data

    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError("Please, update information without password", 400)
      );
    }

    // 2) Filtered out unwanted fields that are not allowed too be updated
    const filteredBody: any = filterObj(
      req.body,
      "firstName",
      "lastName",
      "email",
      "role"
    );

    // 3) Update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      user: updateUser,
    });
  }
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const getUsersByEmail = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.params;

    const emails = email.split(" ").filter(Boolean); // Split the slug into individual slugs

    const regexConditions = emails.map((s) => new RegExp(s, "i")); // Create regex patterns for each slug
    const query = { email: { $in: regexConditions } };

    const data = await User.find(query);

    res.status(200).json({
      status: "success",
      result: data.length,
      data,
    });
  }
);
