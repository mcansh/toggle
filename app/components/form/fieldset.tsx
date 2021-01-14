import * as React from 'react';

interface Props {
  disabled: boolean;
}

const Fieldset: React.FC<Props> = ({ children, disabled }) => (
  <fieldset disabled={disabled} className="grid gap-6">
    {children}
  </fieldset>
);

export { Fieldset };
