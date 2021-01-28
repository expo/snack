import * as React from 'react';

import { $Subtract } from '../../types';
import { FormValidationContext } from './Form';

type InjectedProps = {
  disabled: boolean | undefined;
};

export default function withStatus<P extends InjectedProps>(
  Comp: React.ComponentType<P>
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
