import { File, Paths } from 'expo-file-system';

export async function getCacheFile(name: string) {
  const file = new File(Paths.cache, name);
  return file.exists ? await file.text() : null;
}

export async function setCacheFile(name: string, content: string) {
  const file = new File(Paths.cache, name);
  file.write(content);
}
