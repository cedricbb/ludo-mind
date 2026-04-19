export const mockSupabaseAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
  getSession: jest.fn(),
}

export const mockSupabaseFrom = jest.fn()

export const supabase = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
}
