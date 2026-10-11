import { useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useParking } from '../store';
import { describeSpot, mapsUrl } from '../parking';
import { Button, colors, Icon, Notice, ParkingArt, Photo, s, Screen, SmallLink } from '../ui';

export default function Find() {
  const { spot, loading, loadError, persist } = useParking();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading || loadError) return <Screen back title="Find your car"><Notice>{loadError || 'Loading your spot…'}</Notice></Screen>;
  if (!spot) return <Redirect href="/" />;
  const url = mapsUrl(spot, Platform.OS);
  async function openMaps() {
    if (!url) return;
    try { await Linking.openURL(url); }
    catch { setError('Could not open Maps. Your coordinates and parking details are shown here.'); }
  }
  async function finish() {
    if (busy) return;
    setBusy(true);
    try { await persist(null); router.dismissTo('/'); }
    catch { setError('Could not clear your spot. Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen back title="Find your car" footer={confirm ? <><Text style={[s.fieldLabel, { textAlign: 'center', marginBottom: 6 }]}>Clear this parking spot and photo?</Text><Button busy={busy} onPress={() => void finish()}>Yes, I’m back</Button><SmallLink onPress={() => setConfirm(false)}>Keep my spot</SmallLink></> : <>{url && <Button icon="arrow-up-right" onPress={() => void openMaps()}>Open in Maps</Button>}<Button secondary icon="check" onPress={() => setConfirm(true)}>I’m back at my car</Button></>}>
    <Text style={s.eyebrow}>RIGHT WHERE YOU LEFT IT</Text><Text style={s.title}>Let’s get you back.</Text><Text style={s.body}>{describeSpot(spot)}</Text>
    {spot.photo ? <Photo uri={spot.photo} onPress={() => router.push('/photo')} /> : <ParkingArt saved />}
    <View style={{ gap: 14 }}>
      {url ? <View style={[s.card, { flex: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }]}><Icon name="navigation" /><View style={{ flex: 1 }}><Text style={s.fieldLabel}>Location saved</Text><Text selectable style={[s.body, { fontSize: 13 }]}>{spot.latitude?.toFixed(5)}, {spot.longitude?.toFixed(5)}</Text>{spot.accuracy !== undefined && <Text style={s.label}>GPS accuracy: about {Math.round(spot.accuracy)} m</Text>}</View></View> : <Notice>No GPS pin for this spot. Use your photo and parking details to find your car.</Notice>}
      {!!spot.note && <View style={[s.card, { flex: 0 }]}><Text style={s.label}>Your note</Text><Text style={[s.body, { color: colors.ink }]}>{spot.note}</Text></View>}
      <Text style={s.mutedCenter}>{url ? 'Maps helps you get back to the area.\nUse your photo and floor details inside a garage.' : 'Photos and notes stay available offline.'}</Text>
    </View>
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
