import * as React from 'react';

// @ts-ignore
// eslint-disable-next-line react/display-name
const IFrame = React.forwardRef((props, ref) => <iframe ref={ref} {...props} />);

export default IFrame;
