import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useParking } from '../store';
import { newSpot } from '../parking';
import { Button, colors, Icon, Notice, ParkingArt, Photo, s, Screen, SmallLink } from '../ui';

export default function Home() {
  const { spot, loading, loadError, reload, persist } = useParking();
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
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not get your location. You can save parking details instead.'); }
    finally { if (timer) clearTimeout(timer); saving.current = false; setBusy(false); }
  }
  if (loading) return <Screen><ActivityIndicator color={colors.teal} accessibilityLabel="Loading your spot" /></Screen>;
  if (loadError) return <Screen><Text style={s.title}>Let’s recover your spot.</Text><Notice>{loadError}</Notice><Button onPress={() => void reload()}>Try again</Button></Screen>;
  return <Screen footer={spot ? <><Button icon="arrow-up-right" onPress={() => router.push('/find')}>Find my car</Button><SmallLink onPress={() => router.push('/details')}>Edit parking details</SmallLink></> : <><Button busy={busy} icon="arrow-right" onPress={() => void saveLocation()}>{busy ? 'Saving your spot…' : 'Save my spot'}</Button><SmallLink onPress={() => { if (!busy) router.push('/details'); }}>Save without GPS</SmallLink></>}>
    <Text style={s.eyebrow}>{spot ? 'PARKED & REMEMBERED' : 'A LITTLE LESS TO REMEMBER'}</Text>
    <Text style={s.title}>{spot ? 'Your car is here.' : 'Park it.\nForget about it.'}</Text>
    <Text style={s.body}>{spot ? 'Enjoy your time. We’ve kept your spot.' : 'Save your spot now. Find it easily later.'}</Text>
    {spot?.photo ? <Photo uri={spot.photo} onPress={() => router.push('/photo')} /> : <ParkingArt saved={!!spot} />}
    {spot ? <>
      {(spot.floor || spot.zone) && <View style={s.row}>{spot.floor && <View style={s.card}><Icon name="layers" /><Text style={s.label}>Floor</Text><Text style={s.value}>{spot.floor}</Text></View>}{spot.zone && <View style={s.card}><Icon name="map-pin" /><Text style={s.label}>Zone / space</Text><Text style={s.value}>{spot.zone}</Text></View>}</View>}
      {!!spot.note && <View style={{ marginTop: 18 }}><Text style={s.body}>{spot.note}</Text></View>}
      {spot.accuracy !== undefined && spot.accuracy > 50 && <Notice>GPS is approximate here. Add a photo, floor, or zone to help you find the exact space.</Notice>}
      {!spot.photo && !spot.floor && !spot.zone && <SmallLink onPress={() => router.push('/details')}>+ Add a photo, floor, or zone</SmallLink>}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 22 }}><Icon name="clock" size={14} color={colors.muted} /><Text style={s.mutedCenter}>Saved {new Date(spot.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(spot.savedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text></View>
    </> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 }}><View style={[s.iconButton, { backgroundColor: colors.sage }]}><Icon name="camera" size={21} /></View><View style={{ flex: 1 }}><Text style={[s.fieldLabel, { marginBottom: 4 }]}>In a garage?</Text><Text style={s.body}>Add a photo or floor after saving.</Text></View></View>}
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
