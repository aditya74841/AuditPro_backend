import { Router } from "express";
import { UserRolesEnum } from "../constants.js";
import {
  verifyJWT,
  verifyPermission,
} from "../middlewares/auth.middlewares.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userAssignRoleValidator,
  userForgotPasswordValidator,
  userResetForgottenPasswordValidator,
  userRegisterStaffValidator,
} from "../validators/auth/user.validators.js";
import { validate } from "../validators/validate.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js";
import {
  assignRole,
  changeCurrentPassword,
  changePassword,
  forgotPasswordRequest,
  getCurrentUser,
  getUser,
  getUserBasedOnCompany,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  registerUserStaff,
  resendEmailVerification,
  resetForgottenPassword,
  updateUser,
  updateUserAvatar,
  verifyEmail,
} from "../controllers/user.controller.js";

const router = Router();



router.route("/register").post(registerUser);



router.route("/login").post(userLoginValidator(), validate, loginUser);


router.route("/refresh-token").post(refreshAccessToken);



router.route("/verify-email/:verificationToken").get(verifyEmail);


router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);


  
router
  .route("/reset-password/:resetToken")
  .post(
    userResetForgottenPasswordValidator(),
    validate,
    resetForgottenPassword
  );


  
router.route("/logout").get(verifyJWT, logoutUser);



router.route("/current-user").get(verifyJWT, getCurrentUser);



router.route("/get-user").get(verifyJWT, getUser);



router
  .route("/get-user-based-on-company")
  .post(verifyJWT, getUserBasedOnCompany);


  
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword
  );


  
router
  .route("/change-password-directly/:userId")
  .post(verifyJWT, changePassword);

router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);


router.route("/register-user-staff").post(verifyJWT, registerUserStaff);

router
  .route("/avatar")
  .patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
  );

router
  .route("/update-user/:userId")
  .patch(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    mongoIdPathVariableValidator("userId"),
    userAssignRoleValidator(),
    validate,
    updateUser
  );


router
  .route("/assign-role/:userId")
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    mongoIdPathVariableValidator("userId"),
    userAssignRoleValidator(),
    validate,
    assignRole
  );

export default router;
