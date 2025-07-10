import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AuditResponse } from "../../models/audit/auditresponse.model.js"
import { getLocalPath, getStaticFilePath } from "../../utils/helpers.js"
import { AuditQuestion } from "../../models/audit/auditquestions.model.js"
import cloudinary from "../../utils/cloudniary.js"
import mongoose from "mongoose"

// const submitResponse = asyncHandler(async (req, res) => {
//   const { questions, auditresponse, score, message, auditQuestionId } = req.body

//   // Handle files
//   const files =
//     req.files && req.files.files
//       ? req.files.files.map((file) => ({
//           file: {
//             url: getStaticFilePath(req, file.filename),
//             localPath: getLocalPath(file.filename),
//           },
//         }))
//       : []

//   // Handle photos
//   const photos =
//     req.files && req.files.photos
//       ? req.files.photos.map((photo) => ({
//           photo: {
//             url: getStaticFilePath(req, photo.filename),
//             localPath: getLocalPath(photo.filename),
//           },
//         }))
//       : []

//   // Handle video
//   const video =
//     req.files && req.files.video
//       ? {
//           url: getStaticFilePath(req, req.files.video[0].filename),
//           localPath: getLocalPath(req.files.video[0].filename),
//         }
//       : {
//           url: null,
//           localPath: null,
//         }

//   const auditResponse = await AuditResponse.create({
//     questions,
//     auditresponse,
//     files,
//     photos,
//     video,
//     score,
//     message,
//     auditQuestionId: auditQuestionId,
//     store: req.user.storeId,
//     createdBy: req.user._id,
//   })

//   if (!auditResponse) {
//     throw new ApiError(
//       500,
//       "Something went wrong while creating a new AuditResponse."
//     )
//   }

//   return res
//     .status(201)
//     .json(
//       new ApiResponse(
//         201,
//         auditResponse,
//         "Audit response submitted successfully"
//       )
//     )
// })

// const getResponse = asyncHandler(async (req, res) => {
//   let allResponse = null
//   // const {  cafe=null } = req.body;

//   // if (!cafe) {
//   //   throw new ApiError(404, "Select Cafe");
//   // }

//   // let filter = { store: cafe };

//   // if (date) {
//   //   const startDate = new Date(date);
//   //   const endDate = new Date(startDate);
//   //   endDate.setDate(endDate.getDate() + 1); // Setting end date to next day for inclusive range

//   //   filter.createdAt = { $gte: startDate, $lt: endDate };
//   // }

//   // allResponse = await AuditResponse.find(filter);
//   allResponse = await AuditResponse.find()
//   console.log("The all response is")

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, allResponse, "Audit Response fetched successfully")
//     )
// })

const submitResponse = asyncHandler(async (req, res) => {
  // console.log("Checking the submit response controller");

  const {
    questions,
    auditresponse,
    score,
    store,
    message,
    optionId,
    auditQuestionId,
  } = req.body

  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized")
  }

  const files = []
  const photos = []
  let video = { url: null, public_id: null }

  // console.log(req.files.files)

  // ✅ Upload files
  if (req.files?.files?.length > 0) {
    for (const file of req.files.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "audit/audit-files",
        resource_type: "auto",
      })

      files.push({
        file: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      })
    }
  }

  // ✅ Upload photos
  if (req.files?.photos?.length > 0) {
    for (const photo of req.files.photos) {
      const result = await cloudinary.uploader.upload(photo.path, {
        folder: "audit/audit-photos",
        resource_type: "image",
      })

      photos.push({
        photo: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      })
    }
  }

  // ✅ Upload video
  if (req.files?.video?.length > 0) {
    const videoFile = req.files.video[0]

    const result = await cloudinary.uploader.upload(videoFile.path, {
      folder: "audit/audit-videos",
      resource_type: "video",
    })

    video = {
      url: result.secure_url,
      public_id: result.public_id,
    }
  }

  // ✅ Convert store to ObjectId if valid
  let storeObjectId = undefined
  if (store && mongoose.Types.ObjectId.isValid(store)) {
    storeObjectId = new mongoose.Types.ObjectId(store)
  }

  // ✅ Save to DB
  const auditResponse = await AuditResponse.create({
    questions,
    optionId,
    auditresponse,
    files,
    photos,
    video,
    score,
    message,
    auditQuestionId,
    store: storeObjectId, // will be undefined if not valid
    createdBy: req.user._id,
  })

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        auditResponse,
        "Audit response submitted successfully"
      )
    )
})

const getResponse = asyncHandler(async (req, res) => {
  if (!req.user.companyId) {
    throw new ApiError(404, "You are not allowed")
  }

  let auditQuestion = await AuditQuestion.find({ company: req.user.companyId })

  if (!auditQuestion.length) {
    throw new ApiError(404, "No question found")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, auditQuestion, "Audit Question fetched successfully")
    )
})

const getResponseById = asyncHandler(async (req, res) => {
  const auditQuestionIds = req.params.responseId

  if (!auditQuestionIds) {
    throw new ApiError(404, "Audit Question Id is required")
  }

  const response = await AuditQuestion.findById(auditQuestionIds)

  if (!response) {
    throw new ApiError(404, "No Audit Responses found with the given criteria")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Audit Responses fetched successfully")
    )
})

const getResponseByAuditId = asyncHandler(async (req, res) => {
  // console.log("Checking")
  const auditId = req.params.auditId
  const { date } = req.query


  if (!mongoose.Types.ObjectId.isValid(auditId)) {
    throw new ApiError(400, "Invalid Audit ID")
  }

  // Get start and end of the day (either today or from query)
  const targetDate = date ? new Date(date) : new Date()

  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const responses = await AuditResponse.find({
    auditQuestionId: auditId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).populate("auditQuestionId store createdBy") // Optional: populate fields

  // if (!responses.length) {
  //   throw new ApiError(
  //     404,
  //     "No audit responses found for the given audit and date"
  //   )
  // }

  return res
    .status(200)
    .json(
      new ApiResponse(200, responses, "Audit responses fetched successfully")
    )
})
export { submitResponse, getResponse, getResponseById, getResponseByAuditId }
