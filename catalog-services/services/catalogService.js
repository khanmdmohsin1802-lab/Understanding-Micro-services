import {
  findAllEvent,
  createEvent,
} from "../repositories/catalogRepository.js";

const getAllEvents = async () => {
  return await findAllEvent();
};

const CreateNewEvents = async (eventData) => {
  return await createEvent(eventData);
};

export { getAllEvents, CreateNewEvents };
