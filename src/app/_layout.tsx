import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ParkingProvider } from '../store';
import { colors } from '../ui';

export default function Layout() {
  return <KeyboardProvider><ParkingProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }} /></ParkingProvider></KeyboardProvider>;
}
