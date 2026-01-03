interface TeamsMessage {
  title: string;
  text: string;
  themeColor?: string;
}

export class TeamsWebhook {
  constructor(private webhookUrl: string) {}

  async send(message: TeamsMessage, retries = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: message.themeColor || '0076D7',
            summary: message.title,
            sections: [{ activityTitle: message.title, text: message.text }]
          })
        });
        if (response.ok) return true;
      } catch {
        if (i === retries - 1) throw new Error('Failed to send Teams message');
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    return false;
  }
}
