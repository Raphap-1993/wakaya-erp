import { z } from "zod";

import { ROLE_VALUES } from "@/lib/rbac";

const roleEnum = z.enum(ROLE_VALUES);

export const backofficeUserCreateSchema = z.object({
  email: z.string().trim().email("invalid_email"),
  name: z.string().trim().min(1, "invalid_name"),
  password: z.string().trim().min(8, "invalid_password"),
  roles: z.array(roleEnum).min(1, "invalid_roles"),
  active: z.boolean().optional().default(true),
});

export const backofficeUserUpdateSchema = z.object({
  email: z.string().trim().email("invalid_email"),
  name: z.string().trim().min(1, "invalid_name"),
  password: z.string().trim().min(8, "invalid_password").optional(),
  roles: z.array(roleEnum).min(1, "invalid_roles"),
  active: z.boolean(),
});
