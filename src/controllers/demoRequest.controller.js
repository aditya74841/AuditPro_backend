import { DemoRequest } from "../models/demo.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Create a new demo request
const createDemoRequest = asyncHandler(async (req, res) => {
    const { name, email, companyName, companySize, auditNeeds, source } = req.body
  
    // Validate required fields
    if (!name || !email || !companyName || !companySize) {
      throw new ApiError(400, "Name, Email, Company Name, and Company Size are required")
    }
  
    // Check if demo request already exists for this email
    const existingRequest = await DemoRequest.findOne({ 
      email: email.toLowerCase(),
      isDeleted: false 
    })
  
    if (existingRequest) {
      throw new ApiError(409, "Demo request already exists for this email address")
    }
  
    // Create demo request
    const demoRequest = await DemoRequest.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      companyName: companyName.trim(),
      companySize,
      auditNeeds: auditNeeds?.trim() || "",
      source: source || "website"
    })
  
    if (!demoRequest) {
      throw new ApiError(500, "Something went wrong while creating the demo request")
    }
  
    return res
      .status(201)
      .json(new ApiResponse(201, demoRequest, "Demo request submitted successfully"))
  })
  
  // Get all demo requests with pagination and filters
  const getAllDemoRequests = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      companySize, 
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
  
    // Build match conditions
    const matchConditions = { isDeleted: false }
  
    if (status) {
      matchConditions.status = status
    }
  
    if (companySize) {
      matchConditions.companySize = companySize
    }
  
    if (priority) {
      matchConditions.priority = priority
    }
  
    if (search) {
      matchConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ]
    }
  
    // Build sort object
    const sortObj = {}
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1
  
    // Aggregation pipeline
    const pipeline = [
      { $match: matchConditions },
      { $sort: sortObj },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignedUser'
        }
      },
      {
        $addFields: {
          assignedUser: { $arrayElemAt: ['$assignedUser', 0] }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          companyName: 1,
          companySize: 1,
          auditNeeds: 1,
          status: 1,
          priority: 1,
          source: 1,
          demoScheduledAt: 1,
          followUpDate: 1,
          createdAt: 1,
          updatedAt: 1,
          'assignedUser.name': 1,
          'assignedUser.email': 1
        }
      }
    ]
  
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  
    const result = await DemoRequest.aggregatePaginate(
      DemoRequest.aggregate(pipeline),
      options
    )
  
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Demo requests fetched successfully"))
  })
  
  // Get single demo request by ID
  const getDemoRequestById = asyncHandler(async (req, res) => {
    const { id } = req.params
  
    const demoRequest = await DemoRequest.findOne({
      _id: id,
      isDeleted: false
    }).populate('assignedTo', 'name email')
  
    if (!demoRequest) {
      throw new ApiError(404, "Demo request not found")
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, demoRequest, "Demo request fetched successfully"))
  })
  
  // Update demo request status and other fields
  const updateDemoRequest = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { 
      status, 
      priority, 
      assignedTo, 
      notes, 
      demoScheduledAt, 
      followUpDate 
    } = req.body
  
    const demoRequest = await DemoRequest.findOne({
      _id: id,
      isDeleted: false
    })
  
    if (!demoRequest) {
      throw new ApiError(404, "Demo request not found")
    }
  
    // Update fields if provided
    if (status) demoRequest.status = status
    if (priority) demoRequest.priority = priority
    if (assignedTo) demoRequest.assignedTo = assignedTo
    if (notes) demoRequest.notes = notes
    if (demoScheduledAt) demoRequest.demoScheduledAt = new Date(demoScheduledAt)
    if (followUpDate) demoRequest.followUpDate = new Date(followUpDate)
  
    const updatedDemoRequest = await demoRequest.save()
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedDemoRequest, "Demo request updated successfully"))
  })
  
  // Delete demo request (soft delete)
  const deleteDemoRequest = asyncHandler(async (req, res) => {
    const { id } = req.params
  
    const demoRequest = await DemoRequest.findOne({
      _id: id,
      isDeleted: false
    })
  
    if (!demoRequest) {
      throw new ApiError(404, "Demo request not found")
    }
  
    demoRequest.isDeleted = true
    await demoRequest.save()
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Demo request deleted successfully"))
  })
  
  // Get demo request statistics
  const getDemoRequestStats = asyncHandler(async (req, res) => {
    const stats = await DemoRequest.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          convertedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          },
          demoScheduledRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'demo-scheduled'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedRequests', '$totalRequests'] },
              100
            ]
          }
        }
      }
    ])
  
    const companyStats = await DemoRequest.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$companySize',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  
    const result = {
      overview: stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        convertedRequests: 0,
        demoScheduledRequests: 0,
        conversionRate: 0
      },
      companyStats
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Demo request statistics fetched successfully"))
  })
  
  export {
    createDemoRequest,
    getAllDemoRequests,
    getDemoRequestById,
    updateDemoRequest,
    deleteDemoRequest,
    getDemoRequestStats
  }