export class ConflictError extends Error {
  readonly code = 'EMAIL_CONFLICT'
  constructor(message = 'Email already in use') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class AuthError extends Error {
  readonly code = 'INVALID_CREDENTIALS'
  constructor(message = 'Invalid credentials') {
    super(message)
    this.name = 'AuthError'
  }
}

export class NetworkError extends Error {
  readonly code = 'NETWORK_ERROR'
  constructor(message = 'Network unavailable') {
    super(message)
    this.name = 'NetworkError'
  }
}
