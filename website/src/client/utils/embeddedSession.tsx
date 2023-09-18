import { getReloadURL } from './reloadURL';
import { SDKVersion, SnackDependencies, SnackFiles, Platform } from '../types';

type SnackEmbeddedSession = {
  name: string;
  description: string;
  files: SnackFiles;
  dependencies: SnackDependencies;
  sdkVersion: SDKVersion;
  platform: Platform;
};

declare global {
  interface Window {
    __snack_embedded_session?: SnackEmbeddedSession;
  }
}

export function openEmbeddedSessionFullScreen(session: SnackEmbeddedSession) {
  const url = getReloadURL(
    {
      name: session.name,
      description: session.description,
      platform: session.platform,
      hideQueryParams: 'true',
      preview: undefined, // Use default preview setting
      theme: undefined, // Use default theme setting
      supportedPlatforms: undefined,
    },
    { noEmbedded: true },
  );

  // Open full-screen
  try {
    const fullWindow = window.open(url);
    if (fullWindow) {
      fullWindow.__snack_embedded_session = {
        name: session.name,
        description: session.description,
        files: session.files,
        dependencies: session.dependencies,
        sdkVersion: session.sdkVersion,
        platform: session.platform,
      };
    } else {
      throw new Error('No window');
    }
  } catch (e) {
    throw new Error(`Failed to pass snack content to full window ${e.message}.`);
  }
}
