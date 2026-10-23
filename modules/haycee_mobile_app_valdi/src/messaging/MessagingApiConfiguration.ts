import { MessagingApiConfiguration } from './MessagingTypes';

let activeConfiguration: MessagingApiConfiguration | undefined;

/** Called by the app's authenticated bootstrap when the real Haycee API is available. */
export const configureMessagingApi = (configuration: MessagingApiConfiguration): void => {
  activeConfiguration = configuration;
};

/** Returns undefined until the app has supplied its API host and auth providers. */
export const getMessagingApiConfiguration = (): MessagingApiConfiguration | undefined => activeConfiguration;

export const clearMessagingApiConfiguration = (): void => {
  activeConfiguration = undefined;
};
