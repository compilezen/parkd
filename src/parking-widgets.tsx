import { t, isRTL } from './i18n/engine';
import { createWidget, createLiveActivity, type WidgetEnvironment } from 'expo-widgets';
import { VStack, HStack, Text, Image } from '@expo/ui/swift-ui';
import { font, foregroundStyle, lineLimit, padding, widgetURL, activityBackgroundTint } from '@expo/ui/swift-ui/modifiers';
import { parkingUpdate, type LiveUpdateStatus, type SyncOptions } from './live-update-model';
import { describeSpot, type ParkingSpot } from './parking';

type Props = { saved: boolean; title: string; summary: string; clue: string; compact: string; returning: boolean; emptyTitle: string; emptyBody: string; rtl: boolean };
function ParkingWidget(props: Props, environment: WidgetEnvironment) {
  'widget';
  const ink = environment.colorScheme === 'dark' ? '#FFFFFF' : '#202331';
  return <VStack alignment={props.rtl ? "trailing" : "leading"} spacing={8} modifiers={[widgetURL(props.saved ? 'parkd://find' : 'parkd://')]}>
    <HStack spacing={6}><Image systemName="car.fill" modifiers={[foregroundStyle('#4162F6')]} /><Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(ink)]}>parkd.</Text></HStack>
    <Text modifiers={[font({ size: environment.widgetFamily === 'systemSmall' ? 19 : 23, weight: 'bold' }), foregroundStyle(ink), lineLimit(2)]}>{props.saved ? props.summary : props.emptyTitle}</Text>
    <Text modifiers={[font({ size: 13 }), foregroundStyle(ink), lineLimit(environment.widgetFamily === 'systemSmall' ? 2 : 3)]}>{props.saved ? props.clue : props.emptyBody}</Text>
  </VStack>;
}
function ParkingActivity(props: Props) {
  'widget';
  return {
    banner: <VStack alignment={props.rtl ? "trailing" : "leading"} spacing={6} modifiers={[padding({ all: 16 }), activityBackgroundTint('#FAFAFC')]}>
      <HStack spacing={8}><Image systemName="car.fill" modifiers={[foregroundStyle('#4162F6')]} /><Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle('#4162F6')]}>{props.title}</Text></HStack>
      <Text modifiers={[font({ size: 23, weight: 'bold' }), foregroundStyle('#202331'), lineLimit(2)]}>{props.summary}</Text>
      <Text modifiers={[font({ size: 14 }), foregroundStyle('#202331'), lineLimit(2)]}>{props.clue}</Text>
    </VStack>,
    compactLeading: <Image systemName="car.fill" modifiers={[foregroundStyle('#4162F6')]} />,
    compactTrailing: <Text modifiers={[font({ size: 13, weight: 'bold' })]}>{props.compact}</Text>,
    minimal: <Image systemName="car.fill" />,
    expandedCenter: <Text modifiers={[font({ size: 18, weight: 'bold' }), lineLimit(2)]}>{props.summary}</Text>,
    expandedBottom: <Text modifiers={[font({ size: 14 }), lineLimit(2)]}>{props.clue}</Text>,
  };
}
const widget = createWidget<Props>('ParkdParkingWidget', ParkingWidget);
const activity = createLiveActivity<Props>('ParkdParkingActivity', ParkingActivity);

export async function writeIosUpdate(spot: ParkingSpot | null, options: SyncOptions): Promise<LiveUpdateStatus> {
  const update = spot ? parkingUpdate(spot) : null;
  const props: Props = {
    saved: !!spot, title: update?.title ?? 'parkd', summary: spot ? describeSpot(spot).slice(0, 160) : '',
    clue: update ? (update.returning ? update.body.split('\n')[0] : spot?.entrance ? t('Return via {landmark}', { landmark: spot.entrance }) : t('Tap for your way back.')).slice(0, 200) : '',
    compact: update?.compact ?? '', returning: !!update?.returning,
    emptyTitle: t('One less thing to remember.'), emptyBody: t('Open parkd to save your spot.'), rtl: isRTL(),
  };
  // The persistent widget still updates if ActivityKit is disabled or expires.
  widget.updateSnapshot(props);
  const instances = activity.getInstances();
  if (!spot) { for (const instance of instances) await instance.end('immediate'); return 'off'; }
  if (instances.length) {
    await instances[0].update(props);
    for (const duplicate of instances.slice(1)) await duplicate.end('immediate');
    return 'active';
  }
  // Reopening the app must not restore an activity the user dismissed.
  if (!options.startIfMissing && !options.force) return 'hidden';
  try { activity.start(props, 'parkd://find'); return 'active'; }
  catch { return 'denied'; }
}
