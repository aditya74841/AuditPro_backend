import { ApiError } from "../../utils/ApiError.js"
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AuditQuestion } from "../../models/audit/auditquestions.model.js"
import { getMongoosePaginationOptions } from "../../utils/helpers.js"
// import { Cafe } from "../../models/cafe/cafe.model.js";

const createAuditQuestionName = asyncHandler(async (req, res) => {
  const { name, storeId } = req.body
  // console.log("checking", name);
  if (!name && !companyId) {
    throw new ApiError(404, "Name and Company is required")
  }
  if (!req.user.companyId) {
    throw new ApiError(404, "You are not allowed")
  }
  if (!storeId) {
    if (!req.user.storeId) {
      throw new ApiError(404, "Store id is required")
    }
  }

  const question = await AuditQuestion.create({
    name,
    store: req.user.storeId || storeId,
    company: req.user.companyId,
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

// const getAuditQuestion = asyncHandler(async (req, res) => {

//   const { page = 1, limit = 10 } = req.query
//   const auditAggregate = AuditQuestion.aggregate([
//     { $match: { company: req.user.companyId } },
//   ])

//   const audits = await AuditQuestion.aggregatePaginate(
//     auditAggregate,
//     getMongoosePaginationOptions({
//       page,
//       limit,
//       customLabels: {
//         totalDocs: "totalAuditQuestions",
//         docs: "auditQuestions",
//       },
//     })
//   )

//   return res
//     .status(200)
//     .json(new ApiResponse(200, audits, "Audit Question Fetched successfullyy"))
// })

const getAuditQuestion = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query

  const auditAggregate = AuditQuestion.aggregate([
    {
      $match: { company: req.user.companyId },
    },
    {
      $lookup: {
        from: "stores",
        localField: "store",
        foreignField: "_id",
        as: "storeDetails",
      },
    },
    {
      $unwind: {
        path: "$storeDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "_id",
        as: "companyDetails",
      },
    },
    {
      $unwind: {
        path: "$companyDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedUserDetails",
      },
    },
    {
      $unwind: {
        path: "$assignedUserDetails",
        preserveNullAndEmptyArrays: true, // Will be null if not assigned
      },
    },
    {
      $addFields: {
        storeName: "$storeDetails.name",
        companyName: "$companyDetails.name",
        creatorName: "$userDetails.name",
        assignedToName: "$assignedUserDetails.name", // <- will be null if not assigned
      },
    },
    {
      $project: {
        storeDetails: 0,
        companyDetails: 0,
        userDetails: 0,
        assignedUserDetails: 0,
      },
    },
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
    .json(new ApiResponse(200, audits, "Audit Question Fetched successfully"))
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


const toggleIsPublished = asyncHandler(async (req, res) => {
  const { auditQuestionId } = req.params;

  // Find the audit question by ID
  const auditQuestion = await AuditQuestion.findById(auditQuestionId);

  if (!auditQuestion) {
    throw new ApiError(404, "No Question found");
  }

  // Toggle the isPublished value
  auditQuestion.isPublished = !auditQuestion.isPublished;

  // Save the updated document
  await auditQuestion.save();

  return res.status(200).json(
    new ApiResponse(200, auditQuestion, "isPublished status toggled successfully")
  );
});
const updateAuditQustionName = asyncHandler(async (req, res) => {
  const { name, storeId, isPublished } = req.body
  if (!name) {
    throw new ApiError(404, "Name  is required")
  }

  const { auditQuestionId } = req.params
  const auditQuestion = await AuditQuestion.findByIdAndUpdate(
    auditQuestionId,
    { $set: { name: name, isPublished: isPublished, store: storeId } },
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

  if (!auditQuestionId) {
    throw new ApiError(404, "Audit question Id id required")
  }

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


  // console.log("The response options is ",responseOption )

  // Convert comma-separated string to array of { message }
  let parsedOptions = []
  if (typeof responseOption === "string" && responseOption.trim()) {
    parsedOptions = responseOption
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((msg) => ({ message: msg }))
  }

  const option = {
    question,
    responseType,
    responseOption: parsedOptions,
    isFile,
    isVideo,
    isPhoto,
    message,
    score,
  }

  const auditQuestion = await AuditQuestion.findByIdAndUpdate(
    auditQuestionId,
    { $push: { options: option } },
    { new: true, useFindAndModify: false }
  )

  if (!auditQuestion) {
    throw new ApiError(500, "Something went wrong while creating a new Option")
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
    {
      $group: {
        _id: "$_id",
        options: { $push: "$options" },
      },
    },
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


  let parsedOptions = []
  if (typeof responseOption === "string" && responseOption.trim()) {
    parsedOptions = responseOption
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((msg) => ({ message: msg }))
  }

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
  option.responseOption = parsedOptions
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
  toggleIsPublished
}
