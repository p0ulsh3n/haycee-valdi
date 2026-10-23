import { CancelablePromise } from 'valdi_core/src/CancelablePromise';
import { HTTPClient } from 'valdi_http/src/HTTPClient';
import { HTTPResponse } from 'valdi_http/src/HTTPTypes';
import {
  ConversationMessage,
  ConversationMessagesResponse,
  MessagingApiConfiguration,
  MessagingConversationResponse,
} from './MessagingTypes';

const MAX_GET_ATTEMPTS = 3;

export class MessagingApiError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message);
  }
}

/** REST adapter for the documented messaging endpoints; requires app-provided API/auth config. */
export class MessagingApi {
  private readonly client: HTTPClient;
  private disposed = false;
  private readonly activeRequests = new Set<CancelablePromise<HTTPResponse>>();

  constructor(private readonly configuration: MessagingApiConfiguration) {
    if (!configuration.baseUrl.trim()) throw new MessagingApiError('Messaging API base URL is not configured.');
    this.client = new HTTPClient(configuration.baseUrl);
  }

  fetchConversations = async (): Promise<MessagingConversationResponse> => {
    return this.getJson<MessagingConversationResponse>('/messaging/conversations');
  };

  fetchMessages = async (conversationId: string): Promise<ConversationMessagesResponse> => {
    return this.getJson<ConversationMessagesResponse>(
      `/messaging/conversations/${encodeURIComponent(conversationId)}/messages?limit=50`,
    );
  };

  sendMessage = async (message: ConversationMessage): Promise<void> => {
    if (this.disposed) throw new MessagingApiError('Messaging API request cancelled.');
    const body = new TextEncoder().encode(JSON.stringify(message));
    const request = this.client.post(
      `/messaging/conversations/${encodeURIComponent(message.conversationId)}/messages`,
      body,
      this.headers(),
    );
    this.activeRequests.add(request);
    try {
      const response = await request;
      this.assertSuccess(response);
    } finally {
      this.activeRequests.delete(request);
    }
  };

  dispose(): void {
    this.disposed = true;
    this.activeRequests.forEach((request) => request.cancel?.());
    this.activeRequests.clear();
  }

  private getJson = async <T>(path: string): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_GET_ATTEMPTS; attempt++) {
      if (this.disposed) throw new MessagingApiError('Messaging API request cancelled.');
      try {
        const request = this.client.get(path, this.headers());
        this.activeRequests.add(request);
        let response: HTTPResponse;
        try {
          response = await request;
        } finally {
          this.activeRequests.delete(request);
        }
        this.assertSuccess(response);
        if (!response.body) throw new MessagingApiError('The messaging API returned an empty response.');
        return JSON.parse(new TextDecoder().decode(response.body)) as T;
      } catch (error) {
        lastError = error;
        if (this.disposed || (error instanceof MessagingApiError && (error.statusCode ?? 0) < 500) || attempt === MAX_GET_ATTEMPTS) {
          throw error;
        }
        await this.delay(attempt * 400);
      }
    }
    throw lastError;
  };

  private headers = (): Record<string, string> => {
    const token = this.configuration.getAccessToken();
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  private assertSuccess(response: HTTPResponse): void {
    if (response.statusCode >= 200 && response.statusCode < 300) return;
    throw new MessagingApiError(`Messaging API request failed (${response.statusCode}).`, response.statusCode);
  }

  private delay = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));
}
