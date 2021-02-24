import { Box } from 'ink';
import * as React from 'react';

export type Size = {
  width: number;
  height: number;
};

type Props = {
  children: (size: Size) => React.ReactChild;
};

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

// Source: https://github.com/vadimdemedes/ink/issues/263#issuecomment-765106184
export default function FullScreen(props: Props) {
  const [size, setSize] = React.useState<Size | undefined>();

  React.useEffect(() => {
    function onResize() {
      setSize(() => ({
        width: process.stdout.columns,
        height: process.stdout.rows,
      }));
    }
    process.stdout.write(enterAltScreenCommand);
    onResize();
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
      process.stdout.write(leaveAltScreenCommand);
    };
  }, []);

  return <Box {...size}>{size ? props.children(size) : undefined}</Box>;
}
