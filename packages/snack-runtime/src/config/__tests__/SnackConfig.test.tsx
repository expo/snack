import { renderHook } from '@testing-library/react-hooks';
import { render } from '@testing-library/react-native';
import { useContext } from 'react';
import { Text } from 'react-native';

import { SnackConfig, SnackRuntimeContext, SnackRuntimeProvider } from '../SnackConfig';

describe(SnackRuntimeProvider, () => {
  // Default mock config
  const config: SnackConfig = {
    modules: { expo: 'test' },
  };

  it('provides the config context', () => {
    const { result } = renderHook(useContext, {
      initialProps: SnackRuntimeContext,
      wrapper: ({ children }) => (
        <SnackRuntimeProvider config={config}>{children}</SnackRuntimeProvider>
      ),
    });

    expect(result.current).toBe(config);
  });

  it('renders the provided children', () => {
    const { getByTestId } = render(
      <SnackRuntimeProvider config={config}>
        <Text testID="child">Hello</Text>
      </SnackRuntimeProvider>
    );

    expect(getByTestId('child')).toBeDefined();
  });

  // Once `Modules.initialize` has been called, the SystemJS singleton is initialized and cannot be changed through config
  it('warns when config is changed dynamically', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { rerender } = render(<SnackRuntimeProvider config={config} />);
    expect(warn).not.toHaveBeenCalled();

    const newConfig = { ...config, modules: { expo: 'test2' } };
    rerender(<SnackRuntimeProvider config={newConfig} />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Snack Runtime config cannot be changed after initial render')
    );
  });
});
