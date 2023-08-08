import customProtocolCheck from 'custom-protocol-check';

export function openExpoOrbitWithExperienceURL(experienceURL: string, onFail?: () => void) {
  const url = experienceURL?.replace('exp://', 'expo-orbit://');

  if (!url) {
    return;
  }

  customProtocolCheck(url, onFail);
}
