import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, View } from 'react-native';
import { t } from './i18n/engine';
import { useLanguage } from './i18n/provider';
import { useParking } from './store';
import { androidDisplayCapability, openAndroidDisplaySettings, requestAndroidWidget, supportsAndroidWidgets } from './live-updates';
import { SmallLink, Text, s } from './ui';
export function AndroidParkingTools() {
  useLanguage();
  const { liveStatus, spot } = useParking();
  const [capability, setCapability] = useState<'old' | 'disabled' | 'supported' | null>(null);
  useEffect(() => {
    if (!supportsAndroidWidgets()) return;
    let mounted = true;
    const refresh = () => { void androidDisplayCapability().then(result => { if (mounted) setCapability(result); }).catch(() => {}); };
    refresh(); const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { mounted = false; subscription.remove(); };
  }, [liveStatus]);
  if (!supportsAndroidWidgets()) return null;
  async function addWidget() {
    try { if (await requestAndroidWidget()) return; } catch {}
    Alert.alert(t('Home Screen widget'), t('Keep your spot on your Home Screen. Long-press an empty area, choose Widgets, then parkd.'), [{ text: t('Close') }]);
  }
  return <View style={{ marginTop: 12, gap: 4 }}>
    <SmallLink onPress={() => void addWidget()}>{t('Home Screen widget')}</SmallLink>
    {spot && capability && <Text style={s.mutedCenter}>{t(capability === 'old' ? 'Older Android: use the parking card or Home Screen widget.' : capability === 'disabled' ? 'Live Update promotion is off. You can enable it in your phone settings.' : 'Your phone controls the prominent display. Start Find my car to request it.')}</Text>}
    {spot && capability === 'disabled' && <SmallLink onPress={() => void openAndroidDisplaySettings().catch(() => Linking.openSettings()).catch(() => {})}>{t('Open Live Update settings')}</SmallLink>}
  </View>;
}
