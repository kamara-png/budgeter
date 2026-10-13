import { NativeModule, requireOptionalNativeModule } from 'expo';

import type {
  MpesaRawMessage,
  MpesaSmsModuleEvents,
  ReadMpesaMessagesOptions,
} from './MpesaSms.types';

declare class MpesaSmsModule extends NativeModule<MpesaSmsModuleEvents> {
  readMessagesAsync(options: ReadMpesaMessagesOptions | null): Promise<MpesaRawMessage[]>;
}

// Returns `null` on platforms where the native module is not present (iOS, web).
export default requireOptionalNativeModule<MpesaSmsModule>('MpesaSms');
