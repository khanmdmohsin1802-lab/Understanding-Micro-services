import { z } from "zod";

const eventFields = {
  title: z.string().min(3, "Title must have atleast 3 characters"),
  type: z.enum(["movie", "concert", "comedy_show", "tech_conference"]),
  description: z
    .string()
    .min(10, "Description must have atleast 10 characters"),
  metadata: z.object({}).optional(),
  showtimes: z
    .array(
      z.object({
        startTime: z.string().datetime(),
        availableSeats: z.number().nonnegative().int(),
        price: z.number().positive(),
      }),
    )
    .nonempty(),
};

export default eventFields;
