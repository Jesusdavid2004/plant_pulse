import type { Locale } from '../../shared/constants';

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  locale: Locale;
  emailNotifications: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  locale: Locale;
  emailNotifications: boolean;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    emailNotifications: user.emailNotifications,
  };
}
