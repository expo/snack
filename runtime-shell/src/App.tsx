import { reloadAsync } from 'expo-updates';
import { SnackRuntime } from 'snack-runtime';

// TODO: Configure the aliased modules through context

export default function Snack() {
  return <SnackRuntime onSnackReload={reloadAsync} />;
}
