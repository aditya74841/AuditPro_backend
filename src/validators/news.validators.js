import { body } from "express-validator";
import { mongoIdRequestBodyValidator } from "./common/mongodb.validators.js";

const createNewsValidator = () => {
  return [
    body("heading").trim().notEmpty().withMessage("Heading Name is Required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is Required"),
    body("link").optional().trim().notEmpty().withMessage("Link is Required"),

    body("linkTitle")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Link Title is Required"),

    ...mongoIdRequestBodyValidator("type"),
    ...mongoIdRequestBodyValidator("category"),
  ];
};

export { createNewsValidator };
