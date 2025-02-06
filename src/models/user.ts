import mongoose, { Document, Model, Query } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// An interface that describes the properties
// that are required to create a new User
interface UserAttrs {
  email: string;
  password: string;
  passwordConfirm: string;
  active: boolean;
  passwordChangedAt: Date;
  passwordResetToken: string;
  passwordResetExpires: Date;
}

// An interface that describes the properties
// that a User Model has
interface UserModel extends Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties
// that a User Document has
export interface UserDoc extends Document {
  email: string;
  password: string;
  passwordConfirm: string;
  active: boolean;

  passwordChangedAt: Date;
  passwordResetToken: string;
  passwordResetExpires: Date;

  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): Promise<boolean>;
  createPasswordResetToken(): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please, enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please, provide your Password"],
      validate: {
        validator: function (el: string): boolean {
          const userAttrs = this as UserAttrs;

          return el === userAttrs.password;
        },
        message: "Passwords do not match",
      },
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  //   Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //   Delete passwordConfirm field

  (this as any).passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// For QUERY
userSchema.pre(/^find/, function (next) {
  const query = this as Query<UserDoc, UserDoc>;

  query.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      String(this.passwordChangedAt.getTime() / 1000)
    );
    return JWTTimestamp < changedTimestamp;
  }

  //   False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// userSchema.statics.build = (attrs: UserAttrs) => {
//   return new User(attrs);
// };

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export default User;
