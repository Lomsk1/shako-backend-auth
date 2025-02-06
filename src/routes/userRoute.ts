import express from "express";
import { protect } from "../middlewares/protect";
import { getMe } from "../middlewares/user";
import {
  deleteMe,
  getUser,
  getUsersByEmail,
  updateMe,
} from "../controllers/userController";
import {
  googleAuth,
  googleAuthCallback,
  login,
  logout,
  signUp,
} from "../controllers/authController";

const userRouter = express.Router();

userRouter.post("/signup", signUp);
userRouter.post("/login", login);

/* Google */
userRouter.get("/google", googleAuth);
userRouter.get("/google/callback", googleAuthCallback);

userRouter.use(protect);

userRouter.get("/me", getMe, getUser);

userRouter.patch("/updateMe", updateMe);

userRouter.get("/byEmail/:email", getUsersByEmail);

userRouter.post("/logout", logout);
userRouter.delete("/deleteMe", deleteMe);

export default userRouter;
