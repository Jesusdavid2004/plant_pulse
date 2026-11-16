import type { UserPreferencesChange, UserRepository } from '../../domain/auth/repositories';
import { toPublicUser, type PublicUser } from '../../domain/auth/types';
import { InvalidUnsubscribeTokenError, UnauthorizedError } from '../../domain/errors';
import type {
  Mailer,
  ReminderComposer,
  UnsubscribeTokenService,
} from '../../domain/notifications/ports';
import { buildUnsubscribeUrl } from './unsubscribeUrl';

export interface UpdatePreferencesInput {
  userId: string;
  changes: UserPreferencesChange;
}

export class UpdateNotificationPreferencesUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdatePreferencesInput): Promise<PublicUser> {
    if (!(await this.users.findById(input.userId))) throw new UnauthorizedError();
    return toPublicUser(await this.users.updatePreferences(input.userId, input.changes));
  }
}

export class UnsubscribeFromRemindersUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: UnsubscribeTokenService,
  ) {}

  async execute(input: { token: string }): Promise<void> {
    const verified = this.tokens.verify(input.token);
    if (!verified || !(await this.users.findById(verified.userId))) {
      throw new InvalidUnsubscribeTokenError();
    }
    await this.users.updatePreferences(verified.userId, { emailNotifications: false });
  }
}

export class SendTestEmailUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly mailer: Mailer,
    private readonly composer: ReminderComposer,
    private readonly tokens: UnsubscribeTokenService,
    private readonly appUrl: string,
  ) {}

  async execute(input: { userId: string }): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UnauthorizedError();

    const recipient = { id: user.id, email: user.email, name: user.name, locale: user.locale };
    const content = this.composer.composeTest({
      recipient,
      appUrl: this.appUrl,
      unsubscribeUrl: buildUnsubscribeUrl(this.appUrl, user.locale, this.tokens.sign(user.id)),
    });
    await this.mailer.send({ to: user.email, ...content });
  }
}
