import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AuditResponse } from "../../models/audit/auditresponse.model.js"
import { getLocalPath, getStaticFilePath } from "../../utils/helpers.js"
import { AuditQuestion } from "../../models/audit/auditquestions.model.js"

const submitResponse = asyncHandler(async (req, res) => {
  const { questions, auditresponse, score, message, auditQuestionId } = req.body

  // Handle files
  const files =
    req.files && req.files.files
      ? req.files.files.map((file) => ({
          file: {
            url: getStaticFilePath(req, file.filename),
            localPath: getLocalPath(file.filename),
          },
        }))
      : []

  // Handle photos
  const photos =
    req.files && req.files.photos
      ? req.files.photos.map((photo) => ({
          photo: {
            url: getStaticFilePath(req, photo.filename),
            localPath: getLocalPath(photo.filename),
          },
        }))
      : []

  // Handle video
  const video =
    req.files && req.files.video
      ? {
          url: getStaticFilePath(req, req.files.video[0].filename),
          localPath: getLocalPath(req.files.video[0].filename),
        }
      : {
          url: null,
          localPath: null,
        }

  const auditResponse = await AuditResponse.create({
    questions,
    auditresponse,
    files,
    photos,
    video,
    score,
    message,
    auditQuestionId: auditQuestionId,
    store: req.user.storeId,
    createdBy: req.user._id,
  })

  if (!auditResponse) {
    throw new ApiError(
      500,
      "Something went wrong while creating a new AuditResponse."
    )
  }

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

const getResponse = asyncHandler(async (req, res) => {
  let allResponse = null

  console.log("the Request User is ", req.user.companyId)
  if (!req.user.companyId) {
    throw new ApiError(404, "You are not allowed")
  }

  let auditQuestion = await AuditQuestion.find({ company: req.user.companyId })

  // console.log("The audit Question is", auditQuestion)

   if (!auditQuestion.length) {
    throw new ApiError(404, "No question found");
  }
  // const {  cafe=null } = req.body;

  // if (!cafe) {
  //   throw new ApiError(404, "Select Cafe");
  // }

  // let filter = { store: cafe };

  // if (date) {
  //   const startDate = new Date(date);
  //   const endDate = new Date(startDate);
  //   endDate.setDate(endDate.getDate() + 1); // Setting end date to next day for inclusive range

  //   filter.createdAt = { $gte: startDate, $lt: endDate };
  // }

  // allResponse = await AuditResponse.find(filter);
  // allResponse = await AuditResponse.find()
  // console.log("The all response is")

  return res
    .status(200)
    .json(
      new ApiResponse(200, auditQuestion, "Audit Question fetched successfully")
    )
})

// const getResponseById = asyncHandler(async (req, res) => {
//   const { responseId } = req.params;

//   let response = null;

//   response = await AuditResponse.findById(responseId);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, response, "Audit Response fetched successfully")
//     );
// });

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

export { submitResponse, getResponse, getResponseById }
