import { body } from "express-validator";
import { mongoIdRequestBodyValidator } from "./common/mongodb.validators.js";

const createCategoryValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Type Name is Required"),
    ...mongoIdRequestBodyValidator("type"),
  ];
};

export { createCategoryValidator };
