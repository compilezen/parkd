import { t, isRTL } from '../i18n/engine';
import { useLanguage } from '../i18n/provider';
import { useState } from 'react';
import { Image, Keyboard, Platform, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useParking } from '../store';
import { newSpot } from '../parking';
import { Text, Button, colors, Notice, s, Screen, SmallLink } from '../ui';

export default function Details() {
  useLanguage();
  const { spot, loading, loadError } = useParking();
  if (loading || loadError) return <Screen back title={t("Parking details")}><Notice>{loadError || t("Loading your spot…")}</Notice></Screen>;
  return <DetailsEditor key={spot?.savedAt ?? 'new'} />;
}

function DetailsEditor() {
  useLanguage();
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
    if (draft.latitude === undefined && !draft.floor.trim() && !draft.zone.trim() && !draft.note.trim() && !draft.photo && !draft.entrance?.trim() && !draft.lift?.trim() && !draft.space?.trim()) {
      setError('Add a photo, floor, zone, or note so you can find your car later.'); return;
    }
    Keyboard.dismiss();
    setBusy(true); setError('');
    try { await persist({ ...draft, floor: draft.floor.trim(), zone: draft.zone.trim(), note: draft.note.trim(), entrance: draft.entrance?.trim(), lift: draft.lift?.trim(), space: draft.space?.trim() }); router.dismissTo('/'); }
    catch { setError('Your changes could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  if (loading || loadError) return <Screen back title={t("Parking details")}><Notice>{loadError || t("Loading your spot…")}</Notice></Screen>;
  return <Screen form back title={t("Parking details")} footer={<Button busy={busy} icon="check" onPress={() => void save()}>{t("Save details")}</Button>}>
    <Text style={s.title}>{t("Remember the way back.")}</Text><Text style={[s.body, { marginBottom: 24 }]}>{t("Save a landmark, your floor, and your space. We’ll turn them into simple steps.")}</Text>
    <Text style={s.fieldLabel}>{t("Entrance / landmark")}</Text><TextInput accessibilityLabel={t("Entrance or landmark")} placeholder={t("e.g. Bershka")} placeholderTextColor={colors.muted} style={[s.input, { textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} value={draft.entrance ?? ''} onChangeText={entrance => setDraft(current => ({ ...current, entrance }))} maxLength={80} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} editable={!busy} />
    <Text style={s.fieldLabel}>{t("Lift / stairs")}</Text><TextInput accessibilityLabel={t("Lift or stairs")} placeholder={t("e.g. Blue lift beside Bershka")} placeholderTextColor={colors.muted} style={[s.input, { textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} value={draft.lift ?? ''} onChangeText={lift => setDraft(current => ({ ...current, lift }))} maxLength={100} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} editable={!busy} />
    <View style={s.row}>
      <View style={{ flex: 1 }}><Text style={s.fieldLabel}>{t("Floor")}</Text><TextInput accessibilityLabel={t("Floor")} placeholder={t("e.g. B2")} placeholderTextColor={colors.muted} style={[s.input, { textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} value={draft.floor} onChangeText={floor => { setError(''); setDraft(current => ({ ...current, floor })); }} maxLength={20} autoCapitalize="characters" editable={!busy} /></View>
      <View style={{ flex: 1 }}><Text style={s.fieldLabel}>{t("Zone")}</Text><TextInput accessibilityLabel={t("Zone or space")} placeholder={t("e.g. X")} placeholderTextColor={colors.muted} style={[s.input, { textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} value={draft.zone} onChangeText={zone => { setError(''); setDraft(current => ({ ...current, zone })); }} maxLength={30} autoCapitalize="characters" editable={!busy} /></View>
    </View>
    <Text style={s.fieldLabel}>{t("Parking space")}</Text><TextInput accessibilityLabel={t("Parking space")} placeholder={t("e.g. 142")} placeholderTextColor={colors.muted} style={[s.input, { textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} value={draft.space ?? ''} onChangeText={space => setDraft(current => ({ ...current, space }))} maxLength={30} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} editable={!busy} />
    <Text style={s.fieldLabel}>{t("Note")}</Text><TextInput accessibilityLabel={t("Parking note")} placeholder={t("Near the blue lift…")} placeholderTextColor={colors.muted} style={[s.input, { minHeight: 104, textAlignVertical: 'top', textAlign: isRTL() ? 'right' : 'left', writingDirection: isRTL() ? 'rtl' : 'ltr' }]} multiline returnKeyType="done" submitBehavior="blurAndSubmit" blurOnSubmit onSubmitEditing={Keyboard.dismiss} value={draft.note} onChangeText={note => { setError(''); setDraft(current => ({ ...current, note })); }} maxLength={500} editable={!busy} />
    {draft.photo && <Image accessibilityLabel={t("Selected parking photo")} source={{ uri: draft.photo }} style={{ width: '100%', height: 190, borderRadius: 20, marginBottom: 14 }} />}
    <View style={s.row}><View style={{ flex: 1 }}><Button secondary disabled={busy} icon="camera" onPress={() => void choosePhoto(true)}>{t("Take photo")}</Button></View><View style={{ flex: 1 }}><Button secondary disabled={busy} icon="image" onPress={() => void choosePhoto(false)}>{t("Choose")}</Button></View></View>
    {draft.photo && <SmallLink onPress={() => { if (!busy) setDraft(current => ({ ...current, photo: undefined })); }}>{t("Remove photo")}</SmallLink>}
    <View style={[s.divider, { marginTop: 24 }]} />
    {!!error && <Notice>{error}</Notice>}
    <Text style={s.mutedCenter}>{t("Only on this device. No account needed.")}</Text>
  </Screen>;
}
