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
  const { companyId } = req.params;

  if (!companyId) {
    throw new ApiError(404, "Company ID is required");
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new ApiError(404, "No company found");
  }

  // Delete logo from local storage if exists
  if (company.logo?.localPath) {
    try {
      removeLocalFile(company.logo.localPath);
    } catch (err) {
      console.error("Failed to delete local logo:", err.message);
    }
  }

  // Delete logo from Cloudinary if exists
  if (company.logo?.public_id) {
    try {
      await deleteFromCloudinary(company.logo.public_id);
    } catch (err) {
      console.error("Failed to delete logo from Cloudinary:", err.message);
    }
  }

  const deletedCompany = await company.deleteOne();

  if (!deletedCompany) {
    throw new ApiError(500, "Something went wrong while deleting company");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedCompany, "Company deleted successfully"));
});

// const updateCompanyLogo = asyncHandler(async (req, res) => {
//   // Check if user has uploaded an avatar
//   const { companyId } = req.params

//   if (!req.file?.filename) {
//     throw new ApiError(400, "Logo image is required")
//   }

//   // get avatar file system url and local path
//   const logoUrl = getStaticFilePath(req, req.file?.filename)
//   const logoLocalPath = getLocalPath(req.file?.filename)

//   const company = await Company.findById(companyId)

//   let updatedLogo = await Company.findByIdAndUpdate(
//     companyId,

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
//   removeLocalFile(company.logo.localPath)

//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedLogo, "Logo updated successfully"))
// })



const updateCompanyLogo = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "Logo image is required");
  }

  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found");

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "audit-companies", // optional folder
    resource_type: "image",
  });

  // Remove old logo from Cloudinary (if it exists)
  if (company.logo?.public_id) {
    await cloudinary.uploader.destroy(company.logo.public_id);
  }

  // Update company with new logo data
  const updatedCompany = await Company.findByIdAndUpdate(
    companyId,
    {
      $set: {
        logo: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      },
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, updatedCompany, "Logo updated successfully")
  );
});

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
