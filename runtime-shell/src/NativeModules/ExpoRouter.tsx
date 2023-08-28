import { ExpoRoot } from 'expo-router';
import Head from 'expo-router/head';
import { ComponentProps } from 'react';
import { SnackConfig } from 'snack-runtime';

/** Extract the expected Expo Router entry prop types from SnackConfig */
type ExpoRouterAppProps = ComponentProps<
  NonNullable<NonNullable<SnackConfig['experimental']>['expoRouterEntry']>
>;

/**
 * Used as alternative `expo-router/entry`, that works with Snack.
 * Instead of registering the root component through API, this returns a component to render.
 */
export function ExpoRouterApp({ ctx }: ExpoRouterAppProps) {
  return (
    // @ts-expect-error Property 'context' is missing in type '{ children: Element; }' but required in type '{ children?: ReactNode; context: any; }'.ts(2741)
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}
