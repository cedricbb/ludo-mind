import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string(),
  avatar_url: z.string().url().nullable(),
  plan: z.enum(['free', 'premium']),
  created_at: z.string().datetime(),
})

export const SessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: UserSchema,
})

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const RegisterResponseSchema = z.object({
  user: UserSchema,
})

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const LoginResponseSchema = z.object({
  session: SessionSchema,
})

export const UpdateProfileSchema = z.object({
  display_name: z
    .string()
    .transform(s => s.trim())
    .pipe(z.string().min(1).max(50))
    .optional(),
  avatar_url: z.string().url().nullable().optional(),
})

export type User = z.infer<typeof UserSchema>
export type Session = z.infer<typeof SessionSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
