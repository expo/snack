import * as React from 'react';

import { FormValidationContext } from './Form';
import { $Subtract } from '../../types';

type InjectedProps = {
  disabled: boolean | undefined;
};

export default function withStatus<P extends InjectedProps>(
  Comp: React.ComponentType<P>,
): React.ComponentType<$Subtract<P, InjectedProps>> {
  function withStatusFn(props: any) {
    return (
      <FormValidationContext.Consumer>
        {(value: { valid: boolean } | undefined = { valid: true }) => (
          <Comp disabled={!value.valid} {...props} />
        )}
      </FormValidationContext.Consumer>
    );
  }

  withStatusFn.displayName = `withStatus(${Comp.displayName ?? Comp.name})`;

  return withStatusFn;
}
