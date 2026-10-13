export interface MpesaRawMessage {
  /** The SMS provider row id. */
  id: string;
  /** The sender address, for example "MPESA". */
  address: string;
  /** The full message text. */
  body: string;
  /** Received time in epoch milliseconds. */
  date: number;
}

export interface ReadMpesaMessagesOptions {
  /** Only return messages received at or after this epoch (ms). */
  since?: number;
  /** Maximum number of messages to return. Defaults to 500. */
  limit?: number;
  /** Case-insensitive substring matched against the sender address. Defaults to "mpesa". */
  senderContains?: string;
}

export type MpesaSmsModuleEvents = Record<string, never>;
