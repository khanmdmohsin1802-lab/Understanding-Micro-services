import Event from "../models/event.js";

const findAllEvent = async (skip, limit) => {
  return await Event.find().skip(skip).limit(limit);
};

const createEvent = async (eventData) => {
  return await Event.create(eventData);
};

export { findAllEvent, createEvent };
