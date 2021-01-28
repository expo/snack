import classnames from 'classnames';
import * as React from 'react';

import Analytics from '../../utils/Analytics';
import { getClassNames, ButtonCommonProps } from './Button';

type Props = ButtonCommonProps & {
  href?: string;
  target?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  className?: string;
};

export default function ButtonLink({
  variant,
  icon,
  large,
  disabled,
  loading,
  className,
  ...rest
}: Props) {
  const onClick = () => {
    Analytics.getInstance().logEvent('CLICKED_LINK', { target: rest.href }, 'previewQueue');
  };

  return (
    <a
      className={classnames(getClassNames({ variant, icon, large, disabled, loading }), className)}
      onClick={onClick}
      style={icon ? { backgroundImage: `url(${icon})` } : {}}
      {...rest}
    />
  );
}
