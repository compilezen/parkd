import { t, number } from '../i18n/engine';
import { useLanguage } from '../i18n/provider';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { currentReturnStep } from '../live-update-model';
import { useParking } from '../store';
import { describeSpot, mapsUrl, openParkingPin, returnSteps } from '../parking';
import { Text, Button, colors, Icon, Notice, Photo, s, Screen, SmallLink } from '../ui';

export default function Find() {
  useLanguage();
  const { spot, loading, loadError, persist } = useParking();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const opening = useRef(false);
  const beginning = useRef(false);
  const [mapsBusy, setMapsBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!loading && !loadError && spot && !spot.returning && !beginning.current) {
      beginning.current = true;
      void persist({ ...spot, returning: true, returnStep: spot.returnStep ?? 0 })
        .catch(() => setError('Your return progress could not be saved. Your parking clues are still available.'))
        .finally(() => { beginning.current = false; });
    }
  }, [loading, loadError, spot, persist]);
  if (loading || loadError) return <Screen back title={t("Find your car")}><Notice>{loadError || t("Loading your spot…")}</Notice></Screen>;
  if (!spot) return <Redirect href="/" />;
  const url = mapsUrl(spot, Platform.OS);
  async function openMaps() {
    if (!spot || !url || opening.current) return;
    opening.current = true; setMapsBusy(true); setError('');
    try { await openParkingPin(spot, Platform.OS, url => Linking.openURL(url)); }
    catch { setError('Could not open Maps. Your coordinates and parking details are shown here.'); }
    finally { opening.current = false; setMapsBusy(false); }
  }
  async function nextStep(index: number) {
    if (!spot || busy) return;
    setBusy(true); setError('');
    try { await persist({ ...spot, returning: true, returnStep: index + 1 }); }
    catch { setError('Could not save this step. Try again.'); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (busy) return;
    setBusy(true);
    try { await persist(null); router.dismissTo('/'); }
    catch { setError('Could not clear your spot. Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen back title={t("Find your car")} footer={confirm ? <><Text style={[s.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>{t("Clear this parking spot and photo?")}</Text><Button busy={busy} onPress={() => void finish()}>{t("Yes, I’m back")}</Button><SmallLink onPress={() => setConfirm(false)}>{t("Keep my spot")}</SmallLink></> : <>{url && <Button busy={mapsBusy} icon="arrow-up-right" onPress={() => void openMaps()}>{t("Open in Maps")}</Button>}<Button secondary icon="check" onPress={() => setConfirm(true)}>{t("I’m back at my car")}</Button></>}>
    <Text style={s.eyebrow}>{t("ONE STEP AT A TIME")}</Text><Text style={s.title}>{t("Your way back.")}</Text><Text style={s.body}>{describeSpot(spot)}</Text>
    <View style={{ gap: 14, marginTop: 24, marginBottom: 18 }}>
      {returnSteps(spot).map((step, index) => <View key={index} style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 14, borderWidth: index === currentReturnStep(spot) ? 2 : 1, borderColor: index === currentReturnStep(spot) ? colors.primary : colors.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{number(index + 1)}</Text></View><Text style={[s.eyebrow, { marginBottom: 0 }]}>{t('STEP {number}', { number: index + 1 })}</Text></View>
        <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -.6 }}>{step.title}</Text>
        <Text style={[s.body, { color: colors.ink }]}>{step.detail}</Text>
        {index === currentReturnStep(spot) && index < returnSteps(spot).length - 1 && <SmallLink onPress={() => { if (!busy) void nextStep(index); }}>{t("I’m here · Next step")}</SmallLink>}
      </View>)}
    </View>
    <SmallLink onPress={() => router.push('/details')}>{t("Edit your way back")}</SmallLink>
    {spot.photo && <Photo uri={spot.photo} onPress={() => router.push('/photo')} />}
    <View style={{ gap: 14 }}>
      {url ? <View style={[s.card, { flex: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }]}><Icon name="navigation" /><View style={{ flex: 1 }}><Text style={s.fieldLabel}>{t("Location saved")}</Text><Text selectable style={[s.body, { fontSize: 13 }]}>{spot.latitude?.toFixed(5)}, {spot.longitude?.toFixed(5)}</Text>{spot.accuracy !== undefined && <Text style={s.label}>{t('GPS accuracy: about {meters} m', { meters: Math.round(spot.accuracy) })}</Text>}</View></View> : <Notice>{t("No GPS needed for your saved steps. Follow the landmarks you recorded.")}</Notice>}
      <Text style={s.mutedCenter}>{url ? t("Maps helps you get back to the area.\nUse your photo and floor details inside a garage.") : t("Photos and notes stay available offline.")}</Text>
    </View>
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
