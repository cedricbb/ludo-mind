export class ConflictError extends Error {
  readonly code: string
  constructor(code = 'EMAIL_CONFLICT', message = 'Conflict error') {
    super(message)
    this.code = code
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

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND'
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}
