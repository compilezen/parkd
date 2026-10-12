import { useRef, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useParking } from '../store';
import { describeSpot, mapsUrl, openParkingPin, returnSteps } from '../parking';
import { Button, colors, Icon, Notice, Photo, s, Screen, SmallLink } from '../ui';

export default function Find() {
  const { spot, loading, loadError, persist } = useParking();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const opening = useRef(false);
  const [mapsBusy, setMapsBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading || loadError) return <Screen back title="Find your car"><Notice>{loadError || 'Loading your spot…'}</Notice></Screen>;
  if (!spot) return <Redirect href="/" />;
  const url = mapsUrl(spot, Platform.OS);
  async function openMaps() {
    if (!spot || !url || opening.current) return;
    opening.current = true; setMapsBusy(true); setError('');
    try { await openParkingPin(spot, Platform.OS, url => Linking.openURL(url)); }
    catch { setError('Could not open Maps. Your coordinates and parking details are shown here.'); }
    finally { opening.current = false; setMapsBusy(false); }
  }
  async function finish() {
    if (busy) return;
    setBusy(true);
    try { await persist(null); router.dismissTo('/'); }
    catch { setError('Could not clear your spot. Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen back title="Find your car" footer={confirm ? <><Text style={[s.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>Clear this parking spot and photo?</Text><Button busy={busy} onPress={() => void finish()}>Yes, I’m back</Button><SmallLink onPress={() => setConfirm(false)}>Keep my spot</SmallLink></> : <>{url && <Button busy={mapsBusy} icon="arrow-up-right" onPress={() => void openMaps()}>Open in Maps</Button>}<Button secondary icon="check" onPress={() => setConfirm(true)}>I’m back at my car</Button></>}>
    <Text style={s.eyebrow}>ONE STEP AT A TIME</Text><Text style={s.title}>Your way back.</Text><Text style={s.body}>{describeSpot(spot)}</Text>
    <View style={{ gap: 14, marginTop: 24, marginBottom: 18 }}>
      {returnSteps(spot).map((step, index) => <View key={index} style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{index + 1}</Text></View><Text style={[s.eyebrow, { marginBottom: 0 }]}>STEP {index + 1}</Text></View>
        <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -.6 }}>{step.title}</Text>
        <Text style={[s.body, { color: colors.ink }]}>{step.detail}</Text>
      </View>)}
    </View>
    <SmallLink onPress={() => router.push('/details')}>Edit your way back</SmallLink>
    {spot.photo && <Photo uri={spot.photo} onPress={() => router.push('/photo')} />}
    <View style={{ gap: 14 }}>
      {url ? <View style={[s.card, { flex: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }]}><Icon name="navigation" /><View style={{ flex: 1 }}><Text style={s.fieldLabel}>Location saved</Text><Text selectable style={[s.body, { fontSize: 13 }]}>{spot.latitude?.toFixed(5)}, {spot.longitude?.toFixed(5)}</Text>{spot.accuracy !== undefined && <Text style={s.label}>GPS accuracy: about {Math.round(spot.accuracy)} m</Text>}</View></View> : <Notice>No GPS needed for your saved steps. Follow the landmarks you recorded.</Notice>}
      <Text style={s.mutedCenter}>{url ? 'Maps helps you get back to the area.\nUse your photo and floor details inside a garage.' : 'Photos and notes stay available offline.'}</Text>
    </View>
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
