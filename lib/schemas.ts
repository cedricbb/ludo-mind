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

// --- Game Session Entities ---

export const PlayerSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  display_name: z.string().min(1).max(50),
  order_index: z.number().int().min(0),
})
export type Player = z.infer<typeof PlayerSchema>

export const RoundResultSchema = z.object({
  player_id: z.string().uuid(),
  score: z.number(),
})
export type RoundResult = z.infer<typeof RoundResultSchema>

export const RoundSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  round_number: z.number().int().positive(),
  results: z.array(RoundResultSchema),
  created_at: z.string().datetime(),
})
export type Round = z.infer<typeof RoundSchema>

export const FinalScoreSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  player_id: z.string().uuid(),
  display_name: z.string(),
  total: z.number(),
  rank: z.number().int().positive(),
})
export type FinalScore = z.infer<typeof FinalScoreSchema>

export const GameSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  game_id: z.string().uuid(),
  status: z.enum(['active', 'finished']),
  players: z.array(PlayerSchema),
  rounds: z.array(RoundSchema),
  final_scores: z.array(FinalScoreSchema).nullable(),
  created_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
})
export type GameSession = z.infer<typeof GameSessionSchema>

export const RoundListItemSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  round_number: z.number().int().positive(),
  created_at: z.string().datetime(),
})
export type RoundListItem = z.infer<typeof RoundListItemSchema>

export const GameSessionListItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  game_id: z.string().uuid(),
  status: z.enum(['active', 'finished']),
  players: z.array(PlayerSchema),
  rounds: z.array(RoundListItemSchema),
  final_scores: z.array(FinalScoreSchema).nullable(),
  created_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
})
export type GameSessionListItem = z.infer<typeof GameSessionListItemSchema>

export const CreateSessionRequestSchema = z.object({
  game_id: z.string().uuid(),
  players: z.array(z.object({ display_name: z.string().min(1).max(50) })).min(1).max(10),
})
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>

export const AddRoundRequestSchema = z.object({
  round_results: z.array(RoundResultSchema).min(1),
})
export type AddRoundRequest = z.infer<typeof AddRoundRequestSchema>

export const CreateSessionResponseSchema = z.object({ session: GameSessionSchema })
export const GetSessionResponseSchema = z.object({ session: GameSessionSchema })
export const GetHistoryResponseSchema = z.object({ sessions: z.array(GameSessionListItemSchema) })
export const AddRoundResponseSchema = z.object({ round: RoundSchema })
export const EndSessionResponseSchema = z.object({ session: GameSessionSchema })

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>
export type GetSessionResponse = z.infer<typeof GetSessionResponseSchema>
export type GetHistoryResponse = z.infer<typeof GetHistoryResponseSchema>
export type AddRoundResponse = z.infer<typeof AddRoundResponseSchema>
export type EndSessionResponse = z.infer<typeof EndSessionResponseSchema>
