import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AuditQuestion } from "../../models/audit/auditquestions.model.js"
import { getMongoosePaginationOptions } from "../../utils/helpers.js"
// import { Cafe } from "../../models/cafe/cafe.model.js";

const createAuditQuestionName = asyncHandler(async (req, res) => {
  const { name, storeId } = req.body
  // console.log("checking", name);
  if (!name) {
    throw new ApiError(404, "Name is required")
  }


  if (!storeId) {
    if (!req.user.storeId) {
      throw new ApiError(404, "Store id is required")
    }
  }

  const question = await AuditQuestion.create({
    name,
    store: req.user.storeId || storeId,
    createdBy: req.user._id,
  })

  if (!question) {
    throw new ApiError(
      500,
      "Something went Wrong while creating a new AuditQuestion"
    )
  }

  return res
    .status(201)
    .json(new ApiResponse(201, question, "Audit Question created successfully"))
})

const getAuditQuestion = asyncHandler(async (req, res) => {
  // console.log("The Audit Question");
  // const questions = await AuditQuestion.find({ store: req.user.storeId });
  const { page = 1, limit = 10 } = req.query
  const auditAggregate = AuditQuestion.aggregate([
    { $match: { store: req.user.storeId } },
  ])

  const audits = await AuditQuestion.aggregatePaginate(
    auditAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalAuditQuestions",
        docs: "auditQuestions",
      },
    })
  )

  return res
    .status(200)
    .json(new ApiResponse(200, audits, "Audit Question Fetched successfullyy"))
})

const getAuditQuestionById = asyncHandler(async (req, res) => {
  const { auditQuestionId } = req.params
  // Find and delete the audit question by its ID
  const auditQuestion = await AuditQuestion.findById(auditQuestionId)
  if (!auditQuestion) {
    throw new ApiError(404, "No Question found")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, auditQuestion, "Audit Question Fetched successfully")
    )
})

const updateAuditQustionName = asyncHandler(async (req, res) => {
  const { name, isPublished } = req.body
  if (!name) {
    throw new ApiError(404, "Name is required")
  }
  const { auditQuestionId } = req.params
  const auditQuestion = await AuditQuestion.findByIdAndUpdate(
    auditQuestionId,
    { $set: { name: name, isPublished: isPublished } },
    { new: true }
  )

  if (!auditQuestion) {
    throw new ApiError(
      500,
      "Something went Wrong while Updatin a new AuditQuestion"
    )
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, auditQuestion, "Audit Question Updated successfully")
    )
})

const deleteAuditQustionName = asyncHandler(async (req, res) => {
  const { auditQuestionId } = req.params

  // Find and delete the audit question by its ID
  const auditQuestion = await AuditQuestion.findByIdAndDelete(auditQuestionId)

  if (!auditQuestion) {
    throw new ApiError(404, "Audit question not found")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, auditQuestion, "Audit Question deleted successfully")
    )
})

const createOptions = asyncHandler(async (req, res) => {
  const {
    question,
    responseType,
    responseOption,
    isVideo,
    isPhoto,
    isFile,
    message,
    score,
  } = req.body

  const { auditQuestionId } = req.params

  const option = {
    question: question,
    responseType: responseType,
    responseOption: responseOption,
    isFile: isFile,
    isVideo: isVideo,
    isPhoto: isPhoto,
    message: message,
    score: score,
  }

  const auditQuestion = await AuditQuestion.findByIdAndUpdate(
    auditQuestionId,
    { $push: { options: option } }, // Assuming 'options' is the array field in your schema
    { new: true, useFindAndModify: false }
  )

  if (!auditQuestion) {
    throw new ApiError(500, "Something went Wrong while creating a new Option")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, auditQuestion, "Audit Option created successfully")
    )
})

const startAudting = asyncHandler(async (req, res) => {
  const { auditQuestionId } = req.params
  const { index = 0 } = req.query

  // console.log(index);
  const auditQuestion = await AuditQuestion.findById(auditQuestionId)

  if (!auditQuestion) {
    throw new ApiError(404, "Audit Question Not Found With this Id")
  }
  if (auditQuestion.options.length < index) {
    throw new ApiError(404, "Auditing Complete No Questions remaining")
  }
  const auditOption = auditQuestion.options[Number(index)]

  if (!auditOption) {
    throw new ApiError(404, "Audit Option Not Found")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { index: Number(index), data: auditOption },
        "Option Fetch Successful"
      )
    )
})

// This Controller will return the question  Options

const getAuditResponse = asyncHandler(async (req, res) => {
  const { auditQuestionId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!auditQuestionId) {
    throw new ApiError(404, "Audit question ID not found")
  }

  const auditQuestion = await AuditQuestion.findById(auditQuestionId)
  if (!auditQuestion) {
    throw new ApiError(404, "No Audit Found with this id")
  }

  const optionsAggregate = AuditQuestion.aggregate([
    { $match: { _id: auditQuestion._id } },
    { $unwind: "$options" },
    // {
    //   $group: {
    //     _id: "$_id",
    //     options: { $push: "$options" },
    //   },
    // },
  ])

  const paginatedOptions = await AuditQuestion.aggregatePaginate(
    optionsAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalOptions",
        docs: "options",
      },
    })
  )

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        paginatedOptions,
        "Audit Option updated successfully"
      )
    )
})

const updateOptions = asyncHandler(async (req, res) => {
  const {
    question,
    responseType,
    responseOption,
    isFile,
    message,
    score,
    isPhoto,
    isVideo,
  } = req.body

  const { auditQuestionId, optionId } = req.params

  const auditQuestion = await AuditQuestion.findById(auditQuestionId)

  if (!auditQuestion) {
    throw new ApiError(404, "Audit question not found")
  }

  const option = auditQuestion.options.id(optionId)

  //   console.log("The Option: " + option);

  if (!option) {
    throw new ApiError(404, "Option not found")
  }

  // Update the option fields
  option.question = question
  option.responseType = responseType
  option.responseOption = responseOption
  option.isFile = isFile
  option.message = message
  option.score = score
  option.isVideo = isVideo
  option.isPhoto = isPhoto

  // Save the updated document
  const updatedOption = await auditQuestion.save()

  if (!updatedOption) {
    throw new ApiError(500, "Something went Wrong while Updating Option")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, updatedOption, "Audit Option updated successfully")
    )
})

const deleteOptions = asyncHandler(async (req, res) => {
  const { auditQuestionId, optionId } = req.params

  const auditQuestion = await AuditQuestion.findById(auditQuestionId)

  if (!auditQuestion) {
    throw new ApiError(404, "Audit question not found")
  }

  const option = auditQuestion.options.id(optionId)

  //   console.log("The Option: " + option);

  if (!option) {
    throw new ApiError(404, "Option not found")
  }

  auditQuestion.options.pull(optionId)

  // Save the updated document
  const updatedAuditQuestion = await auditQuestion.save()

  if (!updatedAuditQuestion) {
    throw new ApiError(500, "Something went wrong while deleting the option")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedAuditQuestion,
        "Audit Option deleted successfully"
      )
    )
})

//  For ADMIN AND USED FOR REPORT
const getAuditQuestionsbasedonCafe = asyncHandler(async (req, res) => {
  const audit = await AuditQuestion.find({ store: req.user.storeId })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        audit || [],
        "Audit Fetched Successfully successfully"
      )
    )
})

const assignAuditToStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.body
  // if (!staffId) {
  //   throw new ApiError(404, "Staff Id is required");
  // }
  const { auditQuestionId } = req.params
  const assignQuestion = await AuditQuestion.findByIdAndUpdate(
    auditQuestionId,
    { $set: { isAssigned: staffId ? true : false, assignedTo: staffId } },
    { new: true }
  )

  if (!assignQuestion) {
    throw new ApiError(
      500,
      "Something went Wrong while Assigning  a new AuditQuestion"
    )
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        assignQuestion,
        "Audit Question Assigned successfully"
      )
    )
})

const getQuestionBasedonStaff = asyncHandler(async (req, res) => {
  const audit = await AuditQuestion.find({
    store: req.user.storeId,
    assignedTo: req.user._id,
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        audit || [],
        "Audit Fetched Successfully successfully"
      )
    )
})

export {
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
}
