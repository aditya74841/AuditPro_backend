import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const auditQuestionsSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    options: {
      type: [
        {
          question: {
            type: String,
            default: "",
          },
          score: {
            type: Number,
            default: 0,
          },
          responseType: {
            type: String,
            default: "",
          },
          responseOption: {
            type: [
              {
                message: {
                  type: String,
                  default: "",
                },
              },
            ],
            default: [],
          },
          isVideo: {
            type: Boolean,
            default: false,
          },
          isPhoto: {
            type: Boolean,
            default: false,
          },
          isFile: {
            type: Boolean,
            default: false,
          },
          message: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      required: [true, "Company is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

auditQuestionsSchema.plugin(mongooseAggregatePaginate);

export const AuditQuestion = mongoose.model(
  "AuditQuestion",
  auditQuestionsSchema
);
