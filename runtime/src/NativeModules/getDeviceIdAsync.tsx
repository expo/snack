import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytesAsync } from 'expo-crypto';

export default async function getDeviceIdAsync() {
  const value = await AsyncStorage.getItem('SnackDeviceId');
  if (value) return value;
  const byteArray = await getRandomBytesAsync(16);
  const hexString = [...new Uint8Array(byteArray.buffer)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
  await AsyncStorage.setItem('SnackDeviceId', hexString);
  return hexString;
}
