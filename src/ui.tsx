import { t, isRTL, languages, type Language } from './i18n/engine';
import { useLanguage } from './i18n/provider';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, type TextProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

function ToolbarButton(props: ComponentProps<NonNullable<ComponentProps<typeof KeyboardToolbar>['button']>>) {
  useLanguage();
  const { accessibilityLabel, accessibilityHint, children, onPress, disabled, style, testID } = props;
  return <Pressable accessibilityRole="button" accessibilityLabel={t(accessibilityLabel)} accessibilityHint={t(accessibilityHint)} disabled={disabled} onPress={onPress} testID={testID} style={[{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, style]}>{children}</Pressable>;
}
export function Text(props: TextProps) {
  useLanguage();
  return <NativeText {...props} style={[{ fontFamily: Platform.OS === 'web' ? 'system-ui, sans-serif' : undefined, writingDirection: isRTL() ? 'rtl' : 'ltr', textAlign: isRTL() ? 'right' : 'left' }, props.style]} />;
}
export const colors = { background: '#FAFAFC', ink: '#202331', primary: '#4162F6', muted: '#737582', line: '#DDE1EF', surface: '#EEF0FF', white: '#FFFFFF' };
export type IconName = ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 22, color = colors.primary }: { name: IconName; size?: number; color?: string }) {
  useLanguage();
  return <Feather name={name} size={size} color={color} />;
}
export function Screen({ children, title, back = false, footer, form = false }: { children: ReactNode; title?: string; back?: boolean; footer?: ReactNode; form?: boolean }) {
  const { language, changeLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [languageError, setLanguageError] = useState('');
  async function chooseLanguage(next: Language) {
    if (languageBusy) return;
    setLanguageBusy(true); setLanguageError('');
    try { await changeLanguage(next); setLanguageOpen(false); }
    catch { setLanguageError('Could not save your language. Try again.'); }
    finally { setLanguageBusy(false); }
  }
  return <SafeAreaView style={s.safe}>
    <View style={[s.shell, { direction: isRTL() ? 'rtl' : 'ltr' }]}>
      <View style={s.header}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel={t("Go back")} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.iconButton}><Icon name={isRTL() ? "arrow-right" : "arrow-left"} /></Pressable>
          : <View style={[s.brand, { direction: "ltr" }]}><Image source={require("../assets/brand-mark.png")} style={{ width: 36, height: 36 }} accessibilityLabel={t("parkd car pin")} /><Image source={require("../assets/wordmark.png")} resizeMode="contain" style={{ width: 108, height: 52 }} accessibilityLabel="parkd" /></View>}
        {title ? <Text style={s.headerTitle}>{title}</Text> : <View style={{ flexDirection: 'row', gap: 2 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Language')} style={s.iconButton} onPress={() => setLanguageOpen(true)}><Icon name="globe" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('About parkd')} style={s.iconButton} onPress={() => router.push('/about')}><Icon name="more-horizontal" /></Pressable>
        </View>}
        {back && <View style={{ width: 44 }} />}
      </View>
      {form && Platform.OS !== 'web' ? <>
        <KeyboardAwareScrollView bottomOffset={72} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}{footer && <View style={{ marginTop: 20, marginBottom: 24 }}>{footer}</View>}</KeyboardAwareScrollView>
        <KeyboardToolbar button={ToolbarButton} doneText={t('Done')} />
      </> : <>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        {footer && <View style={s.footer}>{footer}</View>}
      </>}
    </View>
    <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => { if (!languageBusy) setLanguageOpen(false); }}>
      <View style={{ flex: 1, backgroundColor: '#20233166', justifyContent: 'center', padding: 20 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: colors.background, borderRadius: 28, padding: 24, gap: 8, maxWidth: 440, width: '100%', alignSelf: 'center', direction: isRTL() ? 'rtl' : 'ltr' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text accessibilityRole="header" style={[s.headerTitle, { flex: 1, fontSize: 22 }]}>{t('Choose your language')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('Close')} disabled={languageBusy} style={s.iconButton} onPress={() => setLanguageOpen(false)}><Icon name="x" /></Pressable></View>
          {languages.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{ checked: language === item.id, disabled: languageBusy }} disabled={languageBusy} onPress={() => void chooseLanguage(item.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, minHeight: 54, borderRadius: 16, backgroundColor: language === item.id ? colors.surface : colors.white }}><Text style={[s.fieldLabel, { fontSize: 18 }]}>{item.name}</Text>{language === item.id && <Icon name="check" />}</Pressable>)}
          <Text style={[s.body, { fontSize: 12, marginTop: 8 }]}>{t('Works offline. Your notes stay as you wrote them.')}</Text>
          {!!languageError && <Notice>{languageError}</Notice>}
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}
export function Button({ children, onPress, icon, secondary = false, busy = false, disabled = false }: { children: string; onPress: () => void; icon?: IconName; secondary?: boolean; busy?: boolean; disabled?: boolean }) {
  useLanguage();
  return <Pressable accessibilityRole="button" accessibilityLabel={children} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, (busy || disabled) && { opacity: .65 }, pressed && { opacity: .8 }]}>
    {busy ? <ActivityIndicator color={secondary ? colors.primary : colors.white} /> : <><Text style={[s.buttonText, secondary && { color: colors.primary }]}>{children}</Text>{icon && <Icon name={icon} color={secondary ? colors.primary : colors.white} size={20} />}</>}
  </Pressable>;
}
export function SmallLink({ children, onPress }: { children: string; onPress: () => void }) {
  useLanguage();
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.smallLink}><Text style={s.linkText}>{children}</Text></Pressable>;
}
export function Notice({ children }: { children: string }) {
  useLanguage();
  return <View accessibilityLiveRegion="polite" style={s.notice}><Icon name="info" size={18} /><Text style={[s.body, { flex: 1, color: colors.ink }]}>{t(children)}</Text></View>;
}
export function ParkingArt({ saved = false }: { saved?: boolean }) {
  useLanguage();
  return <View style={s.art} accessibilityLabel={saved ? t("Parking location saved") : t("Parking illustration")}>
    <View style={s.artCircle}><View style={s.innerCircle}><Image source={require("../assets/brand-mark.png")} style={{ width: 132, height: 132 }} /></View></View>
    <View style={s.artLabel}><View style={s.dot} /><Text style={s.artLabelText}>{saved ? t("A little peace of mind.") : t("One tap. One less thing to remember.")}</Text></View>
  </View>;
}
export function Photo({ uri, onPress }: { uri: string; onPress?: () => void }) {
  useLanguage();
  return <Pressable accessibilityRole="button" accessibilityLabel={t("View parking photo")} onPress={onPress} style={s.photoWrap}><Image source={{ uri }} style={s.photo} resizeMode="cover" /><View style={s.photoBadge}><Icon name="maximize-2" color="white" size={17} /><Text style={{ color: 'white', fontSize: 12 }}>{t("Parking photo")}</Text></View></Pressable>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: colors.background }, shell: { flex: 1, minHeight: 0, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMark: { backgroundColor: colors.primary, width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 28, letterSpacing: -1.5, fontWeight: '800', color: colors.ink }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  content: { paddingHorizontal: 26, paddingTop: 8, paddingBottom: 24, flexGrow: 1 }, footer: { padding: 24, paddingTop: 14, gap: 10, backgroundColor: colors.background },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.1, color: colors.primary, marginBottom: 14 },
  title: { fontSize: 39, lineHeight: 45, letterSpacing: -1.5, fontWeight: '700', color: colors.ink, marginBottom: 13 },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  button: { minHeight: 60, paddingVertical: 16, paddingHorizontal: 22, backgroundColor: colors.primary, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#DDE1EF', paddingHorizontal: 12, gap: 8 }, buttonText: { fontSize: 16, fontWeight: '600', color: 'white', flexShrink: 1, textAlign: 'center' },
  smallLink: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }, linkText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginVertical: 12 },
  art: { minHeight: 275, backgroundColor: '#EEF0FF', borderRadius: 28, marginVertical: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artCircle: { width: 215, height: 215, borderRadius: 110, backgroundColor: '#E1E6FF', alignItems: 'center', justifyContent: 'center' },
  innerCircle: { width: 158, height: 158, borderRadius: 85, borderWidth: 1, borderColor: '#CDD5FF', alignItems: 'center', justifyContent: 'center' },
  pin: { width: 92, height: 106, backgroundColor: colors.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  artLabel: { position: 'absolute', bottom: 22, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: '#FAFAFC' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, artLabelText: { color: colors.primary, fontSize: 11, fontWeight: '500' },
  photoWrap: { marginTop: 22, marginBottom: 18, borderRadius: 24, overflow: 'hidden' }, photo: { width: '100%', height: 270 },
  photoBadge: { position: 'absolute', bottom: 14, left: 14, padding: 10, borderRadius: 10, backgroundColor: '#202331BB', flexDirection: 'row', gap: 8, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 }, card: { flex: 1, backgroundColor: '#EEF0FF', borderRadius: 19, padding: 18, gap: 8 },
  label: { color: colors.muted, fontSize: 12 }, value: { color: colors.ink, fontSize: 25, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 20 },
  input: { minHeight: 56, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: 'white', padding: 16, fontSize: 17, color: colors.ink, marginTop: 8, marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.ink }, mutedCenter: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
