import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const storeSchema = new Schema(
  {
    name: {
      type: String,
      unique: [true, "Store Must be unique"],
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
storeSchema.plugin(mongooseAggregatePaginate);

export const Store = mongoose.model("Store", storeSchema);
