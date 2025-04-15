import { Router } from "express";

import { UserRolesEnum } from "../constants.js";
import {
  verifyJWT,
  verifyPermission,
} from "../middlewares/auth.middlewares.js";

import { validate } from "../validators/validate.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js";

import {
  createAuditQuestionName,
  createOptions,
  updateOptions,
  deleteOptions,
  getAuditResponse,
  updateAuditQustionName,
  deleteAuditQustionName,
  getAuditQuestion,
  getAuditQuestionById,
  getAuditQuestionsbasedonCafe,
  assignAuditToStaff,
  getQuestionBasedonStaff,
  startAudting,
} from "../controllers/audit/auditquestion.controller.js";
import {
  createCompany,
  updateCompany,
  getCompany,
  getCompanyById,
  deleteCompany,
  updateCompanyLogo,
} from "../controllers/company.controller.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    createCompany
  )
  .get(verifyJWT, getCompany);

router
  .route("/:companyId")
  .patch(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), updateCompany)
  .get(verifyJWT, getCompanyById)
  .delete(verifyJWT, deleteCompany);
router
  .route("/update-company-logo/:companyId")
  .patch(
    verifyJWT,
    upload.single("logo"),
    verifyPermission([UserRolesEnum.ADMIN]),
    updateCompanyLogo
  );

export default router;
