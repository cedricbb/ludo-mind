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

export const GameSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  min_players: z.number().int().positive(),
  max_players: z.number().int().positive(),
  cover_url: z.string().url().nullable(),
  category: z.string(),
  scoring_family: z.enum(['standard', 'positional', 'elimination', 'cooperative']),
  rules_indexed: z.boolean(),
  created_at: z.string().datetime(),
})
export type Game = z.infer<typeof GameSchema>

export const UserGameSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  game_id: z.string().uuid(),
  added_at: z.string().datetime(),
  last_played_at: z.string().datetime().nullable(),
  play_count: z.number().int().min(0),
  game: GameSchema,
})
export type UserGame = z.infer<typeof UserGameSchema>

export const SearchGamesResponseSchema = z.object({ games: z.array(GameSchema) })
export const GetLibraryResponseSchema = z.object({ games: z.array(UserGameSchema) })
export const AddGameRequestSchema = z.object({ game_id: z.string().uuid() })
export const AddGameResponseSchema = z.object({ user_game: UserGameSchema })
export const DeleteGameResponseSchema = z.object({ success: z.literal(true) })
