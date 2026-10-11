/**
 * Notification boundary for future WhatsApp Business API, SMS and email
 * providers. In the MVP no provider is configured, so `send` never claims a
 * message was delivered: it returns `{ sent: false, reason: "not_configured" }`
 * and the bureau contacts customers manually by phone or WhatsApp.
 */
export type NotificationChannel = "whatsapp" | "sms" | "email";

export type NotificationMessage = {
  channel: NotificationChannel;
  to: string;
  template: string;
  /** Never include medical details here. */
  variables: Record<string, string>;
};

export type NotificationResult =
  | { sent: true; providerMessageId: string }
  | { sent: false; reason: "not_configured" | "provider_error"; detail?: string };

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: NotificationMessage): Promise<NotificationResult>;
}

const providers = new Map<NotificationChannel, NotificationProvider>();

export function registerProvider(provider: NotificationProvider): void {
  providers.set(provider.channel, provider);
}

export async function sendNotification(message: NotificationMessage): Promise<NotificationResult> {
  const provider = providers.get(message.channel);
  if (!provider) return { sent: false, reason: "not_configured" };
  try {
    return await provider.send(message);
  } catch (error) {
    return { sent: false, reason: "provider_error", detail: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function isChannelConfigured(channel: NotificationChannel): boolean {
  return providers.has(channel);
}
