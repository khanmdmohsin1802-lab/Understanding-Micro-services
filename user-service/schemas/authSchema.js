import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email({ message: "Invalid Email" }),
    password: z
      .string()
      .min(6, { message: "Password must atleast 6 character long" })
      .regex(/[A-Z]/, {
        message: "Password must have atleaset one upper case letter",
      })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain one speacial character",
      }),
    role: z.enum(["customer", "admin", "venue_manager"]).optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is Required" }),
  })
  .strict();

export { registerSchema, loginSchema };
