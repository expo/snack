import * as React from 'react';
import type { CaptureOptions } from 'react-native-view-shot';

// Not yet supported
export async function captureRef<T>(
  _viewRef: number | React.Component<any, object, any> | Element | React.RefObject<T>,
  _options?: CaptureOptions | undefined
): Promise<string> {
  return '';
}
