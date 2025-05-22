import { Router } from "express"

import { UserRolesEnum } from "../constants.js"
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares.js"

import { validate } from "../validators/validate.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js"

import {
  createStore,
  updateStore,
  getStore,
  getStoreById,
  deleteStore,
  updateStoreLogo,
  getStoreBasedOnCompany,
  getStoreName,
} from "../controllers/store.controller.js"

const router = Router()
router.use(verifyJWT)

router
  .route("/get-store-based-on-company")
  .post(verifyJWT, getStoreBasedOnCompany)

router.route("/getStoreName").get(verifyJWT, getStoreName)

router
  .route("/")
  .post(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), createStore)
  .get(verifyJWT, getStore)

router
  .route("/:storeId")
  .patch(verifyJWT, verifyPermission([UserRolesEnum.ADMIN]), updateStore)
  .get(verifyJWT, getStoreById)
  .delete(verifyJWT, deleteStore)
router
  .route("/update-store-logo/:storeId")
  .patch(
    verifyJWT,
    upload.single("logo"),
    verifyPermission([UserRolesEnum.ADMIN]),
    updateStoreLogo
  )

export default router
