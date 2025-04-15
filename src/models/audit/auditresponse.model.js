import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const auditResponseSchema = new Schema(
  {
    questions: {
      type: String,
      default: "",
    },
    auditresponse: {
      type: String,
      default: "",
    },
    files: {
      type: [
        {
          file: {
            type: {
              url: String,
              localPath: String,
            },
            default: {
              url: null,
              localPath: null,
            },
          },
        },
      ],
      default: [],
    },
    photos: {
      type: [
        {
          photo: {
            type: {
              url: String,
              localPath: String,
            },
            default: {
              url: null,
              localPath: null,
            },
          },
        },
      ],
      default: [],
    },

    video: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: null,
        localPath: null,
      },
    },

    score: {
      type: Number,
      default: null,
    },
    message: {
      type: String,
      default: "",
    },
    auditQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "AuditQuestion",
      default: null,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
auditResponseSchema.plugin(mongooseAggregatePaginate);

export const AuditResponse = mongoose.model(
  "AuditResponse",
  auditResponseSchema
);
