export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}
