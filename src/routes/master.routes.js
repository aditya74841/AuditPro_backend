import { Router } from "express"

import { UserRolesEnum } from "../constants.js"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"

import { validate } from "../validators/validate.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js"
import {
  getResponse,
  getResponseByAuditId,
  getResponseById,
  submitResponse,
} from "../controllers/audit/auditresponse.controller.js"
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
  toggleIsPublished,
} from "../controllers/audit/auditquestion.controller.js"

const router = Router()
router.use(verifyJWT)

// router
//   .route("/create-audit-question-name")
//   .post(verifyJWT, createAuditQuestionName);

router
  .route("/create-audit-question-name")
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    createAuditQuestionName
  )
router
  .route("/update-audit-question-name/:auditQuestionId")
  .patch(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    updateAuditQustionName
  )
router
  .route("/delete-audit-question-name/:auditQuestionId")
  .delete(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    deleteAuditQustionName
  )

router.route("/get-audit-question").get(verifyJWT, getAuditQuestion)
router
  .route("/get-audit-question-by-store")
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    getAuditQuestionsbasedonCafe
  )
router
  .route("/get-audit-question-name-by-id/:auditQuestionId")
  .get(verifyJWT, getAuditQuestionById)
router
  .route("/create-audit-option/:auditQuestionId")
  .post(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), createOptions)
router
  .route("/assign-audit-to-staff/:auditQuestionId")
  .post(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), assignAuditToStaff)
router.route("/get-audit-to-staff").get(verifyJWT, getQuestionBasedonStaff)

router
  .route("/get-audit-option/:auditQuestionId")
  .get(verifyJWT, getAuditResponse)

  
router
.route("/toggle-audit-isPublished/:auditQuestionId")
.get(verifyJWT, toggleIsPublished)
router.route("/start-auditing/:auditQuestionId").get(verifyJWT, startAudting)

router
  .route("/update-audit-option/:auditQuestionId/:optionId")
  .patch(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), updateOptions)

router
  .route("/delete-audit-option/:auditQuestionId/:optionId")
  .delete(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), deleteOptions)

// Audit Response Routes
router.route("/audit-response").post(
  verifyJWT,
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "photos", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  submitResponse
)
router.route("/get-audit-response").get(verifyJWT, getResponse)

router.route("/audit-response/:responseId").get(verifyJWT, getResponseById)
router.route("/audit-response-by-date/:auditId").get(verifyJWT, getResponseByAuditId)

export default router
