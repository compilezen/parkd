import { Image, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useParking } from '../store';
import { Notice, Screen } from '../ui';
export default function ParkingPhoto() {
  const { spot, loading, loadError } = useParking();
  if (loading || loadError) return <Screen back title="Parking photo"><Notice>{loadError || 'Loading your photo…'}</Notice></Screen>;
  if (!spot?.photo) return <Redirect href="/" />;
  return <Screen back title="Parking photo"><View style={{ flex: 1, minHeight: 460 }}><Image source={{ uri: spot.photo }} resizeMode="contain" style={{ flex: 1, width: '100%' }} accessibilityLabel="Your full parking photo" /></View></Screen>;
}
