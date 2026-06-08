import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["movie", "concert", "comedy_show", "tech_conference"],
      required: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    showtimes: [
      {
        startTime: { type: Date, required: true },
        availableSeats: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

eventSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Supports: filter by type only + filter by type AND date range
// e.g. find({ type: "concert", "showtimes.startTime": { $gte: new Date() } })
eventSchema.index({ isDeleted: 1, type: 1, "showtimes.startTime": 1 });

const Event = mongoose.model("events", eventSchema);

export default Event;
