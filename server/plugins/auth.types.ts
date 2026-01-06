export enum Auth {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface AuthTypes {
  [Auth.USER]: { userId: string, username: string, role: 'user' }
  [Auth.ADMIN]: { userId: string, username: string, role: 'admin' }
}

export type AuthRole = 'user' | 'admin'
export type AuthPayload<K extends Auth> = AuthTypes[K]
