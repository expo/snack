// Bridge between React Native and the native iOS source code editor in Expo Go's dev menu.
// This module allows Expo Go to display and edit Snack source files.

import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';

import * as Files from './Files';

const SnackEditorBridge = NativeModules.SnackEditorBridge;

// Log module availability on load
if (Platform.OS === 'ios') {
  console.log('[NativeEditor] SnackEditorBridge available:', SnackEditorBridge != null);
  if (SnackEditorBridge) {
    console.log('[NativeEditor] SnackEditorBridge methods:', Object.keys(SnackEditorBridge));
  }
}

type FileUpdateEvent = {
  path: string;
  contents: string;
};

/**
 * Sends all current Snack files to the native side for display in the source code editor.
 * This should be called after receiving a CODE message to update the native editor.
 */
export const provideFilesToNative = (): void => {
  if (Platform.OS !== 'ios') {
    return;
  }

  console.log('[NativeEditor] provideFilesToNative called');
  console.log('[NativeEditor] SnackEditorBridge:', SnackEditorBridge);
  console.log('[NativeEditor] setSnackFiles:', SnackEditorBridge?.setSnackFiles);

  if (!SnackEditorBridge?.setSnackFiles) {
    console.log('[NativeEditor] SnackEditorBridge.setSnackFiles not available');
    return;
  }

  const files = Files.getAllFiles();
  const fileCount = Object.keys(files).length;
  console.log(`[NativeEditor] Providing ${fileCount} files to native editor`);
  SnackEditorBridge.setSnackFiles(files);
};

/**
 * Sets up a listener for file update requests from the native editor.
 * When a user edits a file in Expo Go's source code editor and taps "Done",
 * this listener receives the updated content.
 *
 * @param onFileUpdate Callback invoked when a file is updated from native
 * @returns Subscription that should be removed when no longer needed, or null if not on iOS
 */
export const setupNativeEditorListener = (
  onFileUpdate: (path: string, contents: string) => void,
): EmitterSubscription | null => {
  if (Platform.OS === 'ios' && SnackEditorBridge) {
    const emitter = new NativeEventEmitter(SnackEditorBridge);
    return emitter.addListener('onFileUpdateRequest', (event: FileUpdateEvent) => {
      onFileUpdate(event.path, event.contents);
    });
  }
  return null;
};

/**
 * Checks if the native Snack editor bridge is available.
 * This is true when running in Expo Go on iOS.
 */
export const isNativeEditorAvailable = (): boolean => {
  return Platform.OS === 'ios' && SnackEditorBridge != null;
};
