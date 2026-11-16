import type { Locale } from '../../shared/constants';

export interface ReminderMessages {
  subjectSingle: (plantName: string) => string;
  subjectMultiple: (count: number) => string;
  greeting: (name: string | null) => string;
  intro: string;
  sick: string;
  needs: { WATER: string; SUN: string; FERTILIZE: string; GENERIC: string };
  button: string;
  footer: string;
  unsubscribe: string;
  testSubject: string;
  testBody: string;
}

export const REMINDER_MESSAGES: Record<Locale, ReminderMessages> = {
  en: {
    subjectSingle: (plantName) => `${plantName} misses you`,
    subjectMultiple: (count) => `${count} of your plants need some care`,
    greeting: (name) => (name ? `Hi ${name},` : 'Hi,'),
    intro: 'Your plants have been waiting a while. A little care goes a long way:',
    sick: 'does not look well. Check on it soon.',
    needs: {
      WATER: 'is thirsty and needs water.',
      SUN: 'is craving some sunlight.',
      FERTILIZE: 'is hungry for fertilizer.',
      GENERIC: 'could use some attention.',
    },
    button: 'Visit your plants',
    footer: 'You receive this email because reminders are enabled in your PlantPulse account.',
    unsubscribe: 'Unsubscribe from reminders',
    testSubject: 'PlantPulse reminders are working',
    testBody:
      'This is a test email. When one of your plants is neglected you will get a reminder here.',
  },
  es: {
    subjectSingle: (plantName) => `${plantName} te extraña`,
    subjectMultiple: (count) => `${count} de tus plantas necesitan cuidado`,
    greeting: (name) => (name ? `Hola ${name},` : 'Hola,'),
    intro: 'Tus plantas llevan un tiempo esperándote. Un poco de cuidado hace mucha diferencia:',
    sick: 'no se ve bien. Revísala pronto.',
    needs: {
      WATER: 'tiene sed y necesita agua.',
      SUN: 'está pidiendo un poco de sol.',
      FERTILIZE: 'tiene hambre de abono.',
      GENERIC: 'necesita algo de atención.',
    },
    button: 'Visitar mis plantas',
    footer:
      'Recibes este correo porque los recordatorios están activados en tu cuenta de PlantPulse.',
    unsubscribe: 'Dejar de recibir recordatorios',
    testSubject: 'Los recordatorios de PlantPulse funcionan',
    testBody:
      'Este es un correo de prueba. Cuando una de tus plantas esté descuidada recibirás un recordatorio aquí.',
  },
};
