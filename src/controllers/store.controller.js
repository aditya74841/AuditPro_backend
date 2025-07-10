import crypto from "crypto"
import jwt from "jsonwebtoken"
import { UserLoginType, UserRolesEnum } from "../constants.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {
  getLocalPath,
  getMongoosePaginationOptions,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers.js"
import cloudinary, { deleteFromCloudinary } from "../utils/cloudniary.js"
import { Store } from "../models/store.model.js"
import mongoose from "mongoose"

const createStore = asyncHandler(async (req, res) => {
  const { name, company } = req.body
  if (!name) {
    throw new ApiError(404, "Store Name is required")
  }
  if (!company) {
    throw new ApiError(404, "Company is required")
  }

  const store = await Store.create({
    name,
    company,
    createdBy: req.user._id,
  })

  if (!store) {
    throw new ApiError(500, "Something went Wrong while creating a new store")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, store, "Store created successfully"))
})

const updateStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  const { name, company } = req.body

  // console.log("The StoreId is ", storeId)
  // console.log("The name and Company is ", name, company)

  if (!name) {
    throw new ApiError(404, "Store Name is required")
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    {
      $set: {
        name,
        company,
        createdBy: req.user._id,
      },
    },
    { new: true }
  )

  if (!store) {
    throw new ApiError(500, "Something went Wrong while updating  store")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, store, "Store updated successfully"))
})

const getStore = asyncHandler(async (req, res) => {
  // const store = await Store.find();
  // if (store.length == 0) {
  //   throw new ApiError(500, "No store found");
  // }

  const { page = 1, limit = 10 } = req.query
  const storeAggregate = Store.aggregate([{ $match: {} }])

  // console.log("The Store Aggregate is ", storeAggregate);

  const stores = await Store.aggregatePaginate(
    storeAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalStores",
        docs: "stores",
      },
    })
  )

  return res
    .status(200)
    .json(new ApiResponse(200, stores, "Stores Fetched Successfully"))
})

const getStoreBasedOnCompany = asyncHandler(async (req, res) => {
  const { companyId = req.user.companyId } = req.body
  const { page = 1, limit = 10 } = req.query

  if (!companyId) {
    throw new ApiError(409, "Please select the company", [])
  }

  // Get the total count of all stores
  const totalStoreCount = await Store.countDocuments({ company: companyId });

  const storeAggregate = Store.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(companyId),
      },
    },
    {
      $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: "$company" },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    {
      $unwind: {
        path: "$createdBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        logo: 1,
        company: "$company._id", // show company name
        companyName: "$company.name",
        createdBy: "$createdBy.name", // show user name
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ])

  const paginatedOptions = await Store.aggregatePaginate(
    storeAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalStores",
        docs: "stores",
      },
    })
  )

  // Add the total store count to the response
  const responseData = {
    ...paginatedOptions,
    allStoreCount: totalStoreCount,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Stores fetched successfully"))
})

// const getStore = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;

//   // Create an empty aggregation pipeline
//   const storeAggregate = Store.aggregate([{ $match: {} }]);

//   console.log("The Store Aggregate pipeline: ", storeAggregate);

//   try {
//     // Perform pagination using aggregatePaginate
//     const stores = await Store.aggregatePaginate(
//       storeAggregate,
//       getMongoosePaginationOptions({
//         page,
//         limit,
//         customLabels: {
//           totalDocs: "totalStores",
//           docs: "stores",
//         },
//       })
//     );

//     // Return the paginated results
//     return res
//       .status(200)
//       .json(new ApiResponse(200, stores, "Stores Fetched Successfully"));
//   } catch (error) {
//     // Log and handle any errors
//     console.error("Error during pagination:", error);
//     throw new ApiError(500, "Failed to fetch stores");
//   }
// });
const getStoreById = asyncHandler(async (req, res) => {
  const { storeId } = req.params
  if (!storeId) {
    throw new ApiError(404, "Store Id is required")
  }

  const store = await Store.findById(storeId)
  if (!store) {
    throw new ApiError(500, "No store found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, store, "Store Fetched By Id Successfully"))
})
const deleteStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params

  if (!storeId) {
    throw new ApiError(404, "Store ID is required")
  }

  const store = await Store.findById(storeId)
  if (!store) {
    throw new ApiError(404, "No store found")
  }

  // Delete logo from Cloudinary if exists
  if (store.logo?.public_id) {
    try {
      await deleteFromCloudinary(store.logo.public_id)
    } catch (cloudErr) {
      console.error("Cloudinary deletion error:", cloudErr.message)
      // Optionally: you can throw an error or just log and proceed
    }
  }

  const deletedStore = await store.deleteOne()
  if (!deletedStore) {
    throw new ApiError(500, "Something went wrong while deleting store")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedStore, "Store deleted successfully"))
})

// const updateStoreLogo = asyncHandler(async (req, res) => {
//   // Check if user has uploaded an avatar
//   const { storeId } = req.params
//   // console.log("checking the logo Url ")

//   if (!req.file?.filename) {
//     throw new ApiError(400, "Logo image is required")
//   }

//   // get avatar file system url and local path
//   const logoUrl = getStaticFilePath(req, req.file?.filename)
//   const logoLocalPath = getLocalPath(req.file?.filename)

//   const store = await Store.findById(storeId)

//   let updatedLogo = await Store.findByIdAndUpdate(
//     storeId,

//     {
//       $set: {
//         // set the newly uploaded avatar
//         logo: {
//           url: logoUrl,
//           localPath: logoLocalPath,
//         },
//       },
//     },
//     { new: true }
//   )

//   // remove the old avatar
//   removeLocalFile(store.logo.localPath)

//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedLogo, "Logo updated successfully"))
// })

const updateStoreLogo = asyncHandler(async (req, res) => {
  const { storeId } = req.params

  if (!req.file) {
    throw new ApiError(400, "Logo image is required")
  }

  const store = await Store.findById(storeId)
  if (!store) {
    throw new ApiError(404, "Store not found")
  }

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "audit-store-logos", // optional Cloudinary folder
    resource_type: "image",
  })

  // Delete old logo from Cloudinary if it exists
  if (store.logo?.public_id) {
    await cloudinary.uploader.destroy(store.logo.public_id)
  }

  // Update store with new logo info
  const updatedStore = await Store.findByIdAndUpdate(
    storeId,
    {
      $set: {
        logo: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      },
    },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updatedStore, "Logo updated successfully"))
})

const getStoreName = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId

  if (!companyId) {
    throw new ApiError(409, "Please select the company", [])
  }

  const stores = await Store.find({ company: companyId }).select("_id name")

  const formattedStores = stores.map((store) => ({
    value: store._id,
    label: store.name,
  }))

  return res
    .status(200)
    .json(new ApiResponse(200, formattedStores, "Stores fetched successfully"))
})

export {
  createStore,
  updateStore,
  getStore,
  getStoreById,
  deleteStore,
  updateStoreLogo,
  getStoreBasedOnCompany,
  getStoreName,
}
