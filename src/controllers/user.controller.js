import crypto from "crypto"
import jwt from "jsonwebtoken"
import { UserLoginType, UserRolesEnum } from "../constants.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {
  getLocalPath,
  getMongoosePaginationOptions,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers.js"

import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
  sendPlainTextEmail,
} from "../utils/mail.js"
import { Store } from "../models/store.model.js"
import mongoose from "mongoose"
import cloudinary from "../utils/cloudniary.js"

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access token"
    )
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phoneNumber = null } = req.body

  // console.log("Checking console on registerUser Controller");

  const existedUser = await User.findOne({
    $or: [{ phoneNumber }, { email }],
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or PhoneNumer already exists", [])
  }

  // const isStore = await Store.findOne({ name: storeName });
  // if (isStore) {
  //   throw new ApiError(404, "Store is already Exists try New name");
  // }

  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,

    isEmailVerified: false,
    role: role || UserRolesEnum.SUPERADMIN,
  })

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken()

  user.emailVerificationToken = hashedToken
  user.emailVerificationExpiry = tokenExpiry

  await user.save({ validateBeforeSave: false })

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.name,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "Users registered successfully and verification email has been sent on your email."
      )
    )
})

const registerUserStaff = asyncHandler(async (req, res) => {
  const {
    name,
    email = null,
    password = null,
    companyId,
    phoneNumber = null,
  } = req.body
  let randomPassword

  // console.log(name, email, password, companyId, phoneNumber)
  // console.log("checking Line 1")
  // Generate random password if password is null
  if (!password) {
    randomPassword = generateRandomPassword()
  }
  if (!companyId) {
    const user = await User.findById(req.user._id)

    if (!user.companyId) {
      throw new ApiError(409, "Company Id is Required", [])
    }
    companyId = user.companyId
  }
  // console.log("checking Line 2")

  // console.log("randomPassword", randomPassword);
  const existedUser = await User.findOne({
    $or: [{ phoneNumber }, { email }],
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or PhoneNumber already exists", [])
  }

  // Check if store exists
  // const isStore = await Store.findOne({ name: storeName });
  // if (isStore) {
  //   throw new ApiError(
  //     404,
  //     "Store already exists. Please use a different name."
  //   );
  // }

  // Create user
  // console.log("checking Line 3")

  const user = await User.create({
    name,
    email,
    password: password || randomPassword, // Assign the generated password here
    phoneNumber,
    companyId,
    isEmailVerified: true,
  })

  // Generate and assign email verification token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken()
  user.emailVerificationToken = hashedToken
  user.emailVerificationExpiry = tokenExpiry
  await user.save({ validateBeforeSave: false })

  // Send verification email
  // if (user.email) {
  //   await sendPlainTextEmail({
  //     email: user.email,

  //     username: user.name || "user",
  //     temporaryPassword: randomPassword,

  //     subject: "Your Temporary Password",
  //     // mailgenContent: `Hello ${user.name},\n\nYour temporary password is: ${randomPassword}\n\nPlease use this password to login and change it after your first login.\n\nThank you,\nThe Admin Team`,
  //   })
  // }

  // Find created user and send response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully. Password  has been sent to your email."
      )
    )
})

// Function to generate random password
function generateRandomPassword() {
  const length = 8
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

const loginUser = asyncHandler(async (req, res) => {
  const { phoneNumber, email, password } = req.body

  // console.log(phoneNumber, email, password);

  if (!phoneNumber && !email) {
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or: [{ phoneNumber }, { email }],
  })

  if (!user) {
    throw new ApiError(404, "User does not exists")
  }

  if (user.loginType !== UserLoginType.EMAIL_PASSWORD) {
    // If user is registered with some other method, we will ask him/her to use the same method as registered.
    // This shows that if user is registered with methods other than email password, he/she will not be able to login with password. Which makes password field redundant for the SSO
    throw new ApiError(
      400,
      "You have previously registered using " +
        user.loginType?.toLowerCase() +
        ". Please use the " +
        user.loginType?.toLowerCase() +
        " login option to access your account."
    )
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  )
  const options = {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    secure: true,
    // secure: false,
    // httpOnly: true,
  }

  // console.log("The Access Token is ",accessToken)
  // console.log("The Refresh Token is ",refreshToken)

  res.status(200)
  res.cookie("accessToken", accessToken, options)
  res.cookie("refreshToken", refreshToken, options)
  res.json(
    new ApiResponse(
      200,
      { user: loggedInUser, accessToken, refreshToken }, // send access and refresh token in response if client decides to save them by themselves
      "User logged in successfully"
    )
  )
})

const getUserBasedOnCompany = asyncHandler(async (req, res) => {
  const { companyId = req.user.companyId } = req.body
  const { page = 1, limit = 10 } = req.query

  if (!companyId) {
    throw new ApiError(409, "Please Select the Company", [])
  }
  const totalUserCount = await User.countDocuments({ companyId: companyId })

  const companyAggregate = User.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
  ])

  // console.log(companyAggregate);
  const paginatedOptions = await User.aggregatePaginate(
    companyAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalUsers",
        docs: "users",
      },
    })
  )

  if (paginatedOptions.users.length === 0) {
    throw new ApiError(404, "No users found for the specified company", [])
  }

  const responseData = {
    ...paginatedOptions,
    allUserCount: totalUserCount,
  }

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Users fetched successfully"))
})

const getUser = asyncHandler(async (req, res) => {
  const userAggregate = User.aggregate([{ $match: {} }])
  const { page = 1, limit = 10 } = req.query

  // console.log(companyAggregate);
  const paginatedOptions = await User.aggregatePaginate(
    userAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalUsers",
        docs: "users",
      },
    })
  )

  return res
    .status(200)
    .json(new ApiResponse(200, paginatedOptions, "Users fetched successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  )
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing")
  }

  // generate a hash from the token that we are receiving
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

  // While registering the user, same time when we are sending the verification mail
  // we have saved a hashed value of the original email verification token in the db
  // We will try to find user with the hashed token generated by received token
  // If we find the user another check is if token expiry of that token is greater than current time if not that means it is expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  })

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired")
  }

  // If we found the user that means the token is valid
  // Now we can remove the associated email token and expiry date as we no  longer need them
  user.emailVerificationToken = undefined
  user.emailVerificationExpiry = undefined
  // Tun the email verified flag to `true`
  user.isEmailVerified = true

  // const store = await Store.create({
  //   name: user.storeName,
  //   createdBy: user._id,
  // });

  // if (!store) {
  //   throw new ApiError(500, "Something went wrong when creating new store");
  // }

  // user.storeId = store._id;

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"))
})

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id)

  if (!user) {
    throw new ApiError(404, "User does not exists", [])
  }

  // if email is already verified throw an error
  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified!")
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken() // generate email verification creds

  user.emailVerificationToken = hashedToken
  user.emailVerificationExpiry = tokenExpiry
  await user.save({ validateBeforeSave: false })

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.phoneNumber,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  })
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    // check if incoming refresh token is same as the refresh token attached in the user document
    // This shows that the refresh token is used or not
    // Once it is used, we are replacing it with new refresh token below
    if (incomingRefreshToken !== user?.refreshToken) {
      // If token is valid but is used already
      throw new ApiError(401, "Refresh token is expired or used")
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Get email from the client and check if user exists
  const user = await User.findOne({ email })

  if (!user) {
    throw new ApiError(404, "User does not exists", [])
  }
  if (!user.isEmailVerified) {
    throw new ApiError(404, "Please Verify Your email First", [])
  }

  if (user.loginType !== "EMAIL_PASSWORD") {
    throw new ApiError(
      404,
      "Your Are Login with different method So you are Not Allowed",
      []
    )
  }

  // Generate a temporary token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken() // generate password reset creds

  const randomPassword = generateRandomPassword()

  // save the hashed version a of the token and expiry in the DB
  user.forgotPasswordToken = hashedToken
  user.forgotPasswordExpiry = tokenExpiry
  user.password = randomPassword

  await user.save({ validateBeforeSave: false })

  // Send mail with the password reset link. It should be the link of the frontend url with token
  // await sendEmail({
  //   email: user?.email,
  //   subject: "Password reset request",
  //   mailgenContent: forgotPasswordMailgenContent(
  //     user.phoneNumber,
  //     // * Ideally take the url from the .env file which should be teh url of the frontend
  //     `${req.protocol}://${req.get(
  //       "host"
  //     )}/api/v1/users/reset-password/${unHashedToken}`
  //   ),
  // });

  await sendPlainTextEmail({
    email: user.email,
    subject: "Your Temporary Password",
    mailgenContent: `Hello ${user.name || "user"},\n\nYour temporary password is: ${randomPassword}\n\nPlease use this password to login and change it after your first login.\n\nThank you,\nThe Admin Team`,
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Temporary Password is send to your mail please reset after login"
      )
    )
})

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params
  const { newPassword } = req.body

  // Create a hash of the incoming reset token

  let hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  // See if user with hash similar to resetToken exists
  // If yes then check if token expiry is greater than current date

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  })

  // If either of the one is false that means the token is invalid or expired
  if (!user) {
    throw new ApiError(489, "Token is invalid or expired")
  }

  // if everything is ok and token id valid
  // reset the forgot password token and expiry
  user.forgotPasswordToken = undefined
  user.forgotPasswordExpiry = undefined

  // Set the provided password as the new password
  user.password = newPassword
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"))
})

const assignRole = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { role } = req.body
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User does not exist")
  }
  user.role = role
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role changed for the user"))
})

const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { name, email, phoneNumber } = req.body
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User does not exist")
  }
  user.name = name
  user.email = email
  user.phoneNumber = phoneNumber
  // user.password = user.password
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role changed for the user"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar image is required")
  }

  const user = await User.findById(req.user._id)
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  // Upload new avatar to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "audit-user-avatars",
    resource_type: "image",
  })

  // Delete previous avatar from Cloudinary if it exists
  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id)
  }

  // Optionally remove local file after upload
  removeLocalFile(req.file.path)

  // Update user with new avatar
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: {
          url: result.secure_url,
          public_id: result.public_id,
          localPath: "", // no longer needed, just set empty or remove this field
        },
      },
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)

  // check the old password
  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password")
  }

  // assign new password in plain text
  // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified
  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// TODO: GOOGLE LOGIN IMPLEMENT LATER
const handleSocialLogin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id)

  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
    .status(301)
    .cookie("accessToken", accessToken, options) // set the access token in the cookie
    .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
    .redirect(
      // redirect user to the frontend with access and refresh token in case user is not using cookies
      `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    )
})

// TODO: Need To make an which directly change the password NEED TO HASH

const changePassword = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { password } = req.body

  if (!password) {
    throw new ApiError(404, "Password is Required")
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        password: password,
      },
    },
    { new: true }
  )
  if (!user) {
    throw new ApiError(500, "Something went wrong when updating password")
  }
  return res
    .status(201)
    .json(new ApiResponse(201, user, "Password updated successfullyy"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  assignRole,
  getCurrentUser,
  updateUserAvatar,
  changeCurrentPassword,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgottenPassword,
  changePassword,
  registerUserStaff,
  handleSocialLogin,
  getUserBasedOnCompany,
  getUser,
  updateUser,
}
