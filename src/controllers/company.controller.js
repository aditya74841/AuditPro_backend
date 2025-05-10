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

import { Company } from "../models/company.model.js"

const createCompany = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) {
    throw new ApiError(404, "Company Name is required")
  }

  const company = await Company.create({
    name,

    createdBy: req.user._id,
  })

  if (!company) {
    throw new ApiError(500, "Something went Wrong while creating a new Company")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, company, "Company created successfully"))
})

const updateCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params
  const { name } = req.body

  if (!name) {
    throw new ApiError(404, "Company Name is required")
  }

  const company = await Company.findByIdAndUpdate(
    companyId,
    {
      $set: {
        name,
        createdBy: req.user._id,
      },
    },
    { new: true }
  )

  if (!company) {
    throw new ApiError(500, "Something went Wrong while updating Company")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, company, "Company updated successfully"))
})

const getCompany = asyncHandler(async (req, res) => {
  const { page = 1, limit = 5 } = req.query
  const companyAggregate = Company.aggregate([{ $match: {} }])

  const companies = await Company.aggregatePaginate(
    companyAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalCompanies",
        docs: "companies",
      },
    })
  )

  //   const company = await Company.find();
  //   if (company.length == 0) {
  //     throw new ApiError(500, "No company found");
  //   }

  return res
    .status(201)
    .json(new ApiResponse(201, companies, "Company Fetched Successfully"))
})

const getCompanyById = asyncHandler(async (req, res) => {
  const { companyId } = req.params
  if (!companyId) {
    throw new ApiError(404, "Company Id is required")
  }

  const company = await Company.findById(companyId)
  if (!company) {
    throw new ApiError(500, "No company found")
  }

  return res
    .status(201)
    .json(new ApiResponse(201, company, "Company Fetched By Id Successfully"))
})

const deleteCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params

  if (!companyId) {
    throw new ApiError(404, "Company Id is required")
  }

  const company = await Company.findById(companyId)
  if (!company) {
    throw new ApiError(404, "No company found")
  }

  // If company has a logo, delete it from local storage
  if (company.logo && company.logo.localPath) {
    removeLocalFile(company.logo.localPath)
  }

  const deletedCompany = await company.deleteOne()

  if (!deletedCompany) {
    throw new ApiError(500, "Something went wrong while deleting company")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedCompany, "Company deleted successfully"))
})

const updateCompanyLogo = asyncHandler(async (req, res) => {
  // Check if user has uploaded an avatar
  const { companyId } = req.params

  if (!req.file?.filename) {
    throw new ApiError(400, "Logo image is required")
  }

  // get avatar file system url and local path
  const logoUrl = getStaticFilePath(req, req.file?.filename)
  const logoLocalPath = getLocalPath(req.file?.filename)

  const company = await Company.findById(companyId)

  let updatedLogo = await Company.findByIdAndUpdate(
    companyId,

    {
      $set: {
        // set the newly uploaded avatar
        logo: {
          url: logoUrl,
          localPath: logoLocalPath,
        },
      },
    },
    { new: true }
  )

  // remove the old avatar
  removeLocalFile(company.logo.localPath)

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLogo, "Logo updated successfully"))
})

const getCompaniesForUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  let companies;

  if (user && user.companyId) {
    const userCompany = await Company.findById(user.companyId).select("_id name");

    if (userCompany) {
      companies = [{ value: userCompany._id, label: userCompany.name }];
    } else {
      companies = [];
    }
  } else {
    const allCompanies = await Company.find({}).select("_id name");
    companies = allCompanies.map(company => ({
      value: company._id,
      label: company.name
    }));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, companies, "Companies fetched successfully"));
});



export {
  createCompany,
  updateCompany,
  getCompany,
  getCompanyById,
  deleteCompany,
  updateCompanyLogo,
  getCompaniesForUser,
}
