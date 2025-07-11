import { Router } from "express"

import { verifyJWT } from "../middlewares/auth.middlewares.js"
import {
    createDemoRequest,
    getAllDemoRequests,
    getDemoRequestById,
    updateDemoRequest,
    deleteDemoRequest,
    getDemoRequestStats
  } from "../controllers/demoRequest.controller.js"
const router = Router()

// Public routes
router.route("/create").post(createDemoRequest)

// Protected routes (require authentication)
router.route("/").get(verifyJWT, getAllDemoRequests)
router.route("/stats").get(verifyJWT, getDemoRequestStats)
router.route("/:id").get(verifyJWT, getDemoRequestById)
router.route("/:id").patch(verifyJWT, updateDemoRequest)
router.route("/:id").delete(verifyJWT, deleteDemoRequest)

export default router
