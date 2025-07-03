import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: [true, "Company Must be unique"],
      default: "",
    },
    // logo: {
    //   type: {
    //     url: String,
    //     localPath: String,
    //   },
    //   default: {
    //     url: `https://via.placeholder.com/200x200.png`,
    //     localPath: "",
    //   },
    // },

    logo: {
      url: {
        type: String,
        required: true,
        default: "https://via.placeholder.com/200x200.png",
      },
      public_id: {
        type: String,
        default: "", // This will be helpful for deletion from Cloudinary
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
)

companySchema.plugin(mongooseAggregatePaginate)

export const Company = mongoose.model("Company", companySchema)
