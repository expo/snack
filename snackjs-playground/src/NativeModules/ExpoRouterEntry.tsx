import { ExpoRoot } from 'expo-router';
import Head from 'expo-router/head';

type ExpoRouterAppProps = {
  ctx: any;
};

/**
 * Used as alternative `expo-router/entry`, that works with Snack.
 * Instead of registering the root component through API, this returns a component to render.
 */
export function ExpoRouterApp({ ctx }: ExpoRouterAppProps) {
  return (
    // @ts-expect-error Property 'context' is missing in type '{ children: Element; }' but required in type '{ children?: ReactNode; context: any; }'.
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

/**
 * Helper method to detect entry points of Expo Router.
 */
export function isExpoRouterEntry(fileContent = '') {
  return /import.*expo-router\/entry/i.test(fileContent.trim());
}
