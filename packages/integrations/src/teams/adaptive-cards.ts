export interface IssueDetails {
  id: string;
  title: string;
  status: string;
  priority: string;
  url?: string;
}

export class AdaptiveCards {
  static createIssueCard(issue: IssueDetails): object {
    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: `Issue ${issue.id}`, size: 'Large', weight: 'Bolder' },
            { type: 'TextBlock', text: issue.title, wrap: true },
            { type: 'FactSet', facts: [
              { title: 'Status:', value: issue.status },
              { title: 'Priority:', value: issue.priority }
            ]}
          ],
          actions: issue.url ? [{ type: 'Action.OpenUrl', title: 'View Issue', url: issue.url }] : []
        }
      }]
    };
  }
}
