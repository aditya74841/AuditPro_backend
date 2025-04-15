import { body } from "express-validator";
import { mongoIdRequestBodyValidator } from "./common/mongodb.validators.js";

const createTypeValidator = () => {
  return [body("name").trim().notEmpty().withMessage("Type Name is Required")];
};

export { createTypeValidator };
