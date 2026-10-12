import { NativeModule, requireNativeModule } from 'expo';

declare class ParkdLiveUpdatesModule extends NativeModule<{}> {}

export default requireNativeModule<ParkdLiveUpdatesModule>('ParkdLiveUpdates');
