import { Platform } from 'react-native';

import MpesaSmsModule from './src/MpesaSmsModule';
import type { MpesaRawMessage, ReadMpesaMessagesOptions } from './src/MpesaSms.types';

export type {
  MpesaRawMessage,
  MpesaSmsModuleEvents,
  ReadMpesaMessagesOptions,
} from './src/MpesaSms.types';

/** Whether the current platform can read the SMS inbox (Android only). */
export const isMpesaSmsAvailable = Platform.OS === 'android' && MpesaSmsModule != null;

/**
 * Reads M-Pesa messages from the device SMS inbox.
 *
 * Requires the `android.permission.READ_SMS` runtime permission to have been granted
 * before calling (see `PermissionsAndroid`). Only supported on Android.
 */
export async function readMpesaMessagesAsync(
  options: ReadMpesaMessagesOptions = {},
): Promise<MpesaRawMessage[]> {
  if (MpesaSmsModule == null) {
    throw new Error('Reading M-Pesa SMS is only supported on Android.');
  }
  return MpesaSmsModule.readMessagesAsync(options);
}
