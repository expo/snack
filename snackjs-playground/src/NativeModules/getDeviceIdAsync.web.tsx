import * as Random from 'expo-random';

let fallbackStore: string | null = null;

function getStoredId() {
  try {
    return localStorage.getItem('SnackDeviceId');
  } catch {
    return fallbackStore;
  }
}

function setStoredId(id: string) {
  try {
    localStorage.setItem('SnackDeviceId', id);
  } catch {
    fallbackStore = id;
  } finally {
    return id;
  }
}

export default async function getDeviceIdAsync() {
  const value = getStoredId();
  if (value) {
    return value;
  }

  const byteArray = await Random.getRandomBytesAsync(16);
  const hexString = [...new Uint8Array(byteArray.buffer)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

  return setStoredId(hexString);
}
