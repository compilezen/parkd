import { t, getLocale, hasMessage } from '../i18n/engine';
import { AndroidParkingTools } from '../android-parking-tools';
import { useLanguage } from '../i18n/provider';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useParking } from '../store';
import { supportsParkingUpdates } from '../live-updates';
import { newSpot, describeSpot, returnSteps } from '../parking';
import { Text, Button, colors, Icon, Notice, ParkingArt, Photo, s, Screen, SmallLink } from '../ui';

export default function Home() {
  useLanguage();
  const { spot, loading, loadError, reload, persist, liveStatus, showParkingUpdate } = useParking();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  async function saveLocation() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location access is off. You can still save a photo or parking details below.');
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('GPS is taking a while. Try again, or save a photo and parking details.')), 12000); }),
      ]);
      try { await persist(newSpot(location.coords)); }
      catch { throw new Error('Your spot could not be saved on this device. Please try again.'); }
    } catch (e) { setError(e instanceof Error && hasMessage(e.message) ? e.message : 'Could not get your location. You can save parking details instead.'); }
    finally { if (timer) clearTimeout(timer); saving.current = false; setBusy(false); }
  }
  async function startReturn() {
    if (!spot || busy) return;
    setBusy(true); setError('');
    try { await persist({ ...spot, returning: true, returnStep: spot.returnStep ?? 0 }); router.push('/find'); }
    catch { setError('Could not start your return. Your saved spot is still here. Try again.'); }
    finally { setBusy(false); }
  }
  if (loading) return <Screen><ActivityIndicator color={colors.primary} accessibilityLabel={t("Loading your spot")} /></Screen>;
  if (loadError) return <Screen><Text style={s.title}>{t("Let’s recover your spot.")}</Text><Notice>{loadError}</Notice><Button onPress={() => void reload()}>{t("Try again")}</Button></Screen>;
  return <Screen footer={spot ? <><Button busy={busy} icon="arrow-up-right" onPress={() => void startReturn()}>{t("Find my car")}</Button><SmallLink onPress={() => router.push('/details')}>{t("Edit parking details")}</SmallLink></> : <><Button busy={busy} icon="arrow-right" onPress={() => void saveLocation()}>{busy ? t("Saving your spot…") : t("Save my spot")}</Button><SmallLink onPress={() => { if (!busy) router.push('/details'); }}>{t("Save without GPS")}</SmallLink></>}>
    <Text style={s.eyebrow}>{spot ? t("PARKED & REMEMBERED") : t("A LITTLE LESS TO REMEMBER")}</Text>
    <Text style={s.title}>{spot ? t("Your car is here.") : t("Park it.\nForget about it.")}</Text>
    <Text style={s.body}>{spot ? t("Enjoy your time. We’ve kept your spot.") : t("Save your spot now. Find it easily later.")}</Text>
    {spot?.photo ? <Photo uri={spot.photo} onPress={() => router.push('/photo')} /> : spot ? <View style={[s.card, { flex: 0, marginVertical: 24 }]}><Icon name="navigation" /><Text style={s.fieldLabel}>{returnSteps(spot).length ? t("Your way back is saved") : t("GPS pin saved")}</Text><Text style={s.body}>{spot.entrance || describeSpot(spot)}</Text>{!!spot.space && <Text style={s.body}>{t('Space {value}', { value: spot.space })}</Text>}</View> : <ParkingArt />}
    {spot ? <>
      {(spot.floor || spot.zone) && <View style={s.row}>{spot.floor && <View style={s.card}><Icon name="layers" /><Text style={s.label}>{t("Floor")}</Text><Text style={s.value}>{spot.floor}</Text></View>}{spot.zone && <View style={s.card}><Icon name="map-pin" /><Text style={s.label}>{t("Zone / space")}</Text><Text style={s.value}>{spot.zone}</Text></View>}</View>}
      {!!spot.note && <View style={{ marginTop: 18 }}><Text style={s.body}>{spot.note}</Text></View>}
      {spot.accuracy !== undefined && spot.accuracy > 50 && <Notice>{t("GPS is approximate here. Add a photo, floor, or zone to help you find the exact space.")}</Notice>}
      {!spot.photo && !spot.floor && !spot.zone && <SmallLink onPress={() => router.push('/details')}>{t("+ Add a photo, floor, or zone")}</SmallLink>}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 22 }}><Icon name="clock" size={14} color={colors.muted} /><Text style={s.mutedCenter}>{t('Saved {date} at {time}', { date: new Date(spot.savedAt).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' }), time: new Date(spot.savedAt).toLocaleTimeString(getLocale(), { hour: 'numeric', minute: '2-digit' }) })}</Text></View>
    </> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 }}><View style={[s.iconButton, { backgroundColor: colors.surface }]}><Icon name="camera" size={21} /></View><View style={{ flex: 1 }}><Text style={[s.fieldLabel, { marginBottom: 4 }]}>{t("In a garage?")}</Text><Text style={s.body}>{t("Add a photo or floor after saving.")}</Text></View></View>}
    {spot && supportsParkingUpdates() && <>
      {liveStatus === 'active' && <Text style={s.mutedCenter}>{t("Parking update is on your phone.")}</Text>}
      {(liveStatus === 'off' || liveStatus === 'hidden') && <SmallLink onPress={() => void showParkingUpdate()}>{t("Show parking update")}</SmallLink>}
      {liveStatus === 'denied' && <><Notice>{t("Parking updates are disabled. Your spot is still saved here.")}</Notice><SmallLink onPress={() => void Linking.openSettings()}>{t("Parking update settings")}</SmallLink></>}
      {liveStatus === 'error' && <><Notice>{t("Your spot is saved, but the parking update could not refresh.")}</Notice><SmallLink onPress={() => void showParkingUpdate()}>{t("Retry parking update")}</SmallLink></>}
    </>}
    <AndroidParkingTools />
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
