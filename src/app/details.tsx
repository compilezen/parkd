import { useState } from 'react';
import { Image, Platform, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useParking } from '../store';
import { newSpot } from '../parking';
import { Button, colors, Notice, s, Screen, SmallLink } from '../ui';

export default function Details() {
  const { spot, loading, loadError } = useParking();
  if (loading || loadError) return <Screen back title="Parking details"><Notice>{loadError || 'Loading your spot…'}</Notice></Screen>;
  return <DetailsEditor key={spot?.savedAt ?? 'new'} />;
}

function DetailsEditor() {
  const { spot, persist, loading, loadError } = useParking();
  const [draft, setDraft] = useState(() => spot ?? newSpot());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function choosePhoto(camera: boolean) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setError('Camera access is off. Choose an existing photo instead.'); return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: .8 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize(asset.width >= asset.height ? { width: Math.min(asset.width, 1200) } : { height: Math.min(asset.height, 1200) });
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: .7, base64: true });
      if (!image.base64 || image.base64.length > 1_500_000) throw new Error('Please choose a smaller photo.');
      setDraft(current => ({ ...current, photo: `data:image/jpeg;base64,${image.base64}` }));
    } catch { setError('Could not add that photo. Try another image or continue with your parking details.'); }
    finally { setBusy(false); }
  }
  async function save() {
    if (busy) return;
    if (draft.latitude === undefined && !draft.floor.trim() && !draft.zone.trim() && !draft.note.trim() && !draft.photo) {
      setError('Add a photo, floor, zone, or note so you can find your car later.'); return;
    }
    setBusy(true); setError('');
    try { await persist({ ...draft, floor: draft.floor.trim(), zone: draft.zone.trim(), note: draft.note.trim() }); router.dismissTo('/'); }
    catch { setError('Your changes could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  if (loading || loadError) return <Screen back title="Parking details"><Notice>{loadError || 'Loading your spot…'}</Notice></Screen>;
  return <Screen back title="Parking details" footer={<Button busy={busy} icon="check" onPress={() => void save()}>Save details</Button>}>
    <Text style={s.title}>A few little clues.</Text><Text style={[s.body, { marginBottom: 24 }]}>A photo, a floor, a familiar landmark. Add what helps.</Text>
    {draft.photo && <Image accessibilityLabel="Selected parking photo" source={{ uri: draft.photo }} style={{ width: '100%', height: 190, borderRadius: 20, marginBottom: 14 }} />}
    <View style={s.row}><View style={{ flex: 1 }}><Button secondary disabled={busy} icon="camera" onPress={() => void choosePhoto(true)}>Take photo</Button></View><View style={{ flex: 1 }}><Button secondary disabled={busy} icon="image" onPress={() => void choosePhoto(false)}>Choose</Button></View></View>
    {draft.photo && <SmallLink onPress={() => { if (!busy) setDraft(current => ({ ...current, photo: undefined })); }}>Remove photo</SmallLink>}
    <View style={[s.divider, { marginTop: 24 }]} />
    <View style={s.row}>
      <View style={{ flex: 1 }}><Text style={s.fieldLabel}>Floor</Text><TextInput accessibilityLabel="Floor" placeholder="e.g. B2" placeholderTextColor={colors.muted} style={s.input} value={draft.floor} onChangeText={floor => { setError(''); setDraft(current => ({ ...current, floor })); }} maxLength={20} autoCapitalize="characters" editable={!busy} /></View>
      <View style={{ flex: 1 }}><Text style={s.fieldLabel}>Zone / space</Text><TextInput accessibilityLabel="Zone or space" placeholder="e.g. C14" placeholderTextColor={colors.muted} style={s.input} value={draft.zone} onChangeText={zone => { setError(''); setDraft(current => ({ ...current, zone })); }} maxLength={30} autoCapitalize="characters" editable={!busy} /></View>
    </View>
    <Text style={s.fieldLabel}>Note</Text><TextInput accessibilityLabel="Parking note" placeholder="Near the blue lift…" placeholderTextColor={colors.muted} style={[s.input, { minHeight: 104, textAlignVertical: 'top' }]} multiline value={draft.note} onChangeText={note => { setError(''); setDraft(current => ({ ...current, note })); }} maxLength={500} editable={!busy} />
    {!!error && <Notice>{error}</Notice>}
    <Text style={s.mutedCenter}>Only on this device. No account needed.</Text>
  </Screen>;
}
