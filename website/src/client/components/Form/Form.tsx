import * as React from 'react';

type Props = {
  onSubmit: () => void;
  children: React.ReactNode;
};

type State = {
  isValid: boolean;
};

type Register = (options: { validate: () => Error | null; focus: () => void }) => number;

type Unregister = (key: number) => void;

type Update = () => void;

export type FormValidation = {
  register: Register;
  unregister: Unregister;
  update: Update;
  valid: boolean;
};

export const FormValidationContext = React.createContext<FormValidation | undefined>(undefined);

export default class Form extends React.Component<Props, State> {
  state = {
    isValid: false,
  };

  componentDidMount() {
    this._update();
  }

  _key = 0;
  _inputs: { key: number; validate: () => Error | null; focus: () => void }[] = [];

  _register: Register = ({ validate, focus }) => {
    const key = this._key++;

    this._inputs.push({
      key,
      validate,
      focus,
    });

    return key;
  };

  _unregister: Unregister = (key: number) => {
    this._inputs = this._inputs.filter((it) => it.key !== key);
  };

  _update: Update = () =>
    this.setState({
      isValid: this._inputs.every((it) => !it.validate()),
    });

  _handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    for (const input of this._inputs) {
      if (input.validate()) {
        input.focus();
        return;
      }
    }

    this.props.onSubmit();
  };

  render() {
    return (
      <FormValidationContext.Provider
        value={{
          register: this._register,
          unregister: this._unregister,
          update: this._update,
          valid: this.state.isValid,
        }}
      >
        <form onSubmit={this._handleSubmit}>{this.props.children}</form>
      </FormValidationContext.Provider>
    );
  }
}
