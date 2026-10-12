import { t } from '../i18n/engine';
import { useLanguage } from '../i18n/provider';
import { View } from 'react-native';
import { Text, Icon, s, Screen } from '../ui';
export default function About() {
  useLanguage();
  return <Screen back title={t("About parkd")}><Text style={s.eyebrow}>{t("LESS SEARCHING. MORE LIVING.")}</Text><Text style={s.title}>{t("Your spot.\nYour business.")}</Text><Text style={s.body}>{t("A small, quiet place to remember where you parked.")}</Text>
    <View style={s.divider} />
    {[['smartphone', t("Saved on your device"), t("Your spot, photo, and notes are stored locally. No account, ads, or analytics.")], ['map-pin', t("Location only when you ask"), t("parkd requests your location when you save a spot. It does not track you in the background.")], ['navigation', t("Your pin in Maps"), t("Opening Maps shares your saved coordinates with your Maps app or Google Maps in a browser. Maps may require internet.")], ['camera', t("A photo goes a long way"), t("GPS can be weak indoors. Your saved return steps, floor, space, and photo remain available offline.")]] .map(([icon, title, body]) => <View key={title} style={{ gap: 9, marginBottom: 27 }}><Icon name={icon as 'smartphone' | 'map-pin' | 'navigation' | 'camera'} /><Text style={s.fieldLabel}>{title}</Text><Text style={s.body}>{body}</Text></View>)}
    <Text style={s.mutedCenter}>{t('parkd · version {version}\nClearing app data or uninstalling removes your saved spot.', { version: '0.4.0' })}</Text>
  </Screen>;
}
