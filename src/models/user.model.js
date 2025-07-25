import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  AvailableSocialLogins,
  AvailableUserRoles,
  USER_TEMPORARY_TOKEN_EXPIRY,
  UserLoginType,
  UserRolesEnum,
} from "../constants.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      default: "",
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      minlength: 10,
      maxlength: 10,
      match: [/^\d{10}$/, "Please fill a valid phone number (10 digits)"],
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.USER,
      required: true,
    },
    loginType: {
      type: String,
      enum: AvailableSocialLogins,
      default: UserLoginType.EMAIL_PASSWORD,
    },
    storeName: {
      type: String,
      default: "",
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    avatar: {
      type: {
        url: String,
        localPath: String,
        public_id: String, // for cloudinary deletion
      },
      default: {
        url: `https://via.placeholder.com/200x200.png`,
        localPath: "",
        public_id: "",
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateTemporaryToken = function () {
  // This token should be client facing
  // for example: for email verification unHashedToken should go into the user's mail
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  // This should stay in the DB to compare at the time of verification
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  // This is the expiry time for the token (20 minutes)
  const tokenExpiry = Date.now() + USER_TEMPORARY_TOKEN_EXPIRY;

  return { unHashedToken, hashedToken, tokenExpiry };
};

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);
