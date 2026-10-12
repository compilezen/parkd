import { registerWebModule, NativeModule } from 'expo';

// ParkdLiveUpdatesModule is not available on the web platform.
class ParkdLiveUpdatesModule extends NativeModule<{}> {}

export default registerWebModule(ParkdLiveUpdatesModule, 'ParkdLiveUpdatesModule');
