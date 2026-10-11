import { Text, View } from 'react-native';
import { Icon, s, Screen } from '../ui';
export default function About() {
  return <Screen back title="About parkd"><Text style={s.eyebrow}>LESS SEARCHING. MORE LIVING.</Text><Text style={s.title}>Your spot.\nYour business.</Text><Text style={s.body}>A small, quiet place to remember where you parked.</Text>
    <View style={s.divider} />
    {[['smartphone', 'Saved on your device', 'Your spot, photo, and notes are stored locally. No account, ads, or analytics.'], ['map-pin', 'Location only when you ask', 'parkd requests your location when you save a spot. It does not track you in the background.'], ['navigation', 'Directions in your Maps app', 'Opening Maps shares your saved coordinates with Apple Maps or Google Maps. Maps may require internet.'], ['camera', 'A photo goes a long way', 'GPS can be weak indoors. A photo, floor, and zone help you find the exact space.']] .map(([icon, title, body]) => <View key={title} style={{ gap: 9, marginBottom: 27 }}><Icon name={icon as 'smartphone' | 'map-pin' | 'navigation' | 'camera'} /><Text style={s.fieldLabel}>{title}</Text><Text style={s.body}>{body}</Text></View>)}
    <Text style={s.mutedCenter}>parkd · version 0.1.1\nClearing app data or uninstalling removes your saved spot.</Text>
  </Screen>;
}
