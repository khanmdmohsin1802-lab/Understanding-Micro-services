import { z } from "zod";
import eventFields from "./validationEventField.js";

const getEventByIdSchema = z.object({
  params: z.object({
    eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Event ID format"),
  }),
});

const createEventSchema = z.object({
  body: z.object(eventFields).strict(),
});

const updateEventSchema = z.object({
  body: z.object(eventFields).partial().strict(),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max().default(10),
  }),
});

export {
  getEventByIdSchema,
  createEventSchema,
  updateEventSchema,
  paginationSchema,
};
