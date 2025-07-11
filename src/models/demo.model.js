import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const demoRequestSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    companySize: {
      type: String,
      required: true,
      enum: ['1-10', '11-50', '51-200', '200+'],
    },
    auditNeeds: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'demo-scheduled', 'demo-completed', 'converted', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    demoScheduledAt: {
      type: Date,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social-media', 'email-campaign', 'other'],
      default: 'website',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)
demoRequestSchema.index({ email: 1 })
demoRequestSchema.index({ companyName: 1 })
demoRequestSchema.index({ status: 1 })
demoRequestSchema.index({ createdAt: -1 })
demoRequestSchema.index({ isDeleted: 1 })

// Virtual for full company info
demoRequestSchema.virtual('companyInfo').get(function() {
  return {
    name: this.companyName,
    size: this.companySize,
    contact: {
      name: this.name,
      email: this.email
    }
  }
})

// Pre-save middleware to set follow-up date
demoRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set follow-up date to 3 days from now for new requests
    this.followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  }
  next()
})

demoRequestSchema.plugin(mongooseAggregatePaginate)

export const DemoRequest = mongoose.model("DemoRequest", demoRequestSchema)
