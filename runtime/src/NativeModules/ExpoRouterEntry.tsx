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
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}
