import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ParkingProvider } from '../store';
import { colors } from '../ui';

export default function Layout() {
  return <ParkingProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }} /></ParkingProvider>;
}
