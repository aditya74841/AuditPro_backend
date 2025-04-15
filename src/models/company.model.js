import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: [true, "Company Must be unique"],
      default: "",
    },
    logo: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://via.placeholder.com/200x200.png`,
        localPath: "",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

companySchema.plugin(mongooseAggregatePaginate);

export const Company = mongoose.model("Company", companySchema);
