import { z } from "zod";
import { laboratorySchema } from "./lab";

export const userSchema = z.object({
  userId: z.number().int(),
  username: z.string(),
  email: z.string().email().nullable(),
  password: z.string(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  designation: z.string(),
  status: z.string(),
  laboratory: laboratorySchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  otp: z.string().nullable(),
  labId: z.number().int(),
  phoneNumber: z.string(),
  filteredSuppliers: z.string().optional().nullable(),
});

export type UserSchema = z.infer<typeof userSchema>;
