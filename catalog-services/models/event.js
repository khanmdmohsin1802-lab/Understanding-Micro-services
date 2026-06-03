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
  },
  { timestamps: true },
);

const Event = mongoose.model("events", eventSchema);

export default Event;
