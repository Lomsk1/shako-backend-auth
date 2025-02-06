import dotenv from "dotenv";
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import userRouter from "./routes/userRoute";
import { errorController } from "./controllers/error/errorController";
import session from "express-session";
import "./config/passport";

dotenv.config();

const app = express();

app.use(cors());
app.options("*", cors());

app.use(express.json());

app.use(helmet());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);

/* Routes */
app.use("/auth", userRouter);

app.use(compression());

app.use(errorController);

export default app;
