import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import Feather from '@expo/vector-icons/Feather';
import { type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export const colors = { background: '#FAFAFC', ink: '#202331', primary: '#4162F6', muted: '#737582', line: '#DDE1EF', surface: '#EEF0FF', white: '#FFFFFF' };
export type IconName = ComponentProps<typeof Feather>['name'];
export function Icon({ name, size = 22, color = colors.primary }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}
export function Screen({ children, title, back = false, footer, form = false }: { children: ReactNode; title?: string; back?: boolean; footer?: ReactNode; form?: boolean }) {
  return <SafeAreaView style={s.safe}>
    <View style={s.shell}>
      <View style={s.header}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.iconButton}><Icon name="arrow-left" /></Pressable>
          : <View style={s.brand}><View style={s.brandMark}><Icon name="map-pin" color={colors.white} size={19} /></View><Text style={s.wordmark}>parkd<Text style={{ color: colors.primary }}>.</Text></Text></View>}
        {title ? <Text style={s.headerTitle}>{title}</Text> : <Pressable accessibilityRole="button" accessibilityLabel="About parkd" style={s.iconButton} onPress={() => router.push('/about')}><Icon name="more-horizontal" /></Pressable>}
        {back && <View style={{ width: 44 }} />}
      </View>
      {form && Platform.OS !== 'web' ? <>
        <KeyboardAwareScrollView bottomOffset={72} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}{footer && <View style={{ marginTop: 20, marginBottom: 24 }}>{footer}</View>}</KeyboardAwareScrollView>
        <KeyboardToolbar />
      </> : <>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        {footer && <View style={s.footer}>{footer}</View>}
      </>}
    </View>
  </SafeAreaView>;
}
export function Button({ children, onPress, icon, secondary = false, busy = false, disabled = false }: { children: string; onPress: () => void; icon?: IconName; secondary?: boolean; busy?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={children} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, (busy || disabled) && { opacity: .65 }, pressed && { opacity: .8 }]}>
    {busy ? <ActivityIndicator color={secondary ? colors.primary : colors.white} /> : <><Text style={[s.buttonText, secondary && { color: colors.primary }]}>{children}</Text>{icon && <Icon name={icon} color={secondary ? colors.primary : colors.white} size={20} />}</>}
  </Pressable>;
}
export function SmallLink({ children, onPress }: { children: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.smallLink}><Text style={s.linkText}>{children}</Text></Pressable>;
}
export function Notice({ children }: { children: string }) {
  return <View accessibilityLiveRegion="polite" style={s.notice}><Icon name="info" size={18} /><Text style={[s.body, { flex: 1, color: colors.ink }]}>{children}</Text></View>;
}
export function ParkingArt({ saved = false }: { saved?: boolean }) {
  return <View style={s.art} accessibilityLabel={saved ? 'Parking location saved' : 'Parking illustration'}>
    <View style={s.artCircle}><View style={s.innerCircle}><View style={s.pin}><Icon name={saved ? 'check' : 'map-pin'} size={40} color="white" /></View></View></View>
    <View style={s.artLabel}><View style={s.dot} /><Text style={s.artLabelText}>{saved ? 'A little peace of mind.' : 'One tap. One less thing to remember.'}</Text></View>
  </View>;
}
export function Photo({ uri, onPress }: { uri: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="View parking photo" onPress={onPress} style={s.photoWrap}><Image source={{ uri }} style={s.photo} resizeMode="cover" /><View style={s.photoBadge}><Icon name="maximize-2" color="white" size={17} /><Text style={{ color: 'white', fontSize: 12 }}>Parking photo</Text></View></Pressable>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: colors.background }, shell: { flex: 1, minHeight: 0, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
