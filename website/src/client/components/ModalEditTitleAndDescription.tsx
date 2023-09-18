import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import Form from './Form/Form';
import withStatus from './Form/withStatus';
import withValidation from './Form/withValidation';
import { c } from './ThemeProvider';
import Button from './shared/Button';
import ModalDialog from './shared/ModalDialog';
import TextArea from './shared/TextArea';
import TextInput from './shared/TextInput';
import * as defaults from '../configs/defaults';

type Props = {
  visible: boolean;
  title: string;
  action: string;
  onSubmit: (details: { name: string; description: string }) => void;
  onDismiss: () => void;
  description: string | undefined;
  name: string;
  isWorking?: boolean;
};

type State = {
  name: string;
  description: string;
  visible: boolean;
};

// @ts-ignore
const FormButton = withStatus(Button);
// @ts-ignore
const ValidatedInput = withValidation(TextInput);

export default class ModalEditTitleAndDescription extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.visible !== props.visible) {
      if (props.visible) {
        return {
          name: props.name || '',
          description: props.description ?? '',
          visible: props.visible,
        };
      } else {
        return { visible: props.visible };
      }
    }

    return null;
  }

  state = {
    name: this.props.name || '',
    description: this.props.description ?? '',
    visible: this.props.visible,
  };

  _handleSubmit = () => {
    this.props.onSubmit({
      name: this.state.name,
      description: this.state.description,
    });
  };

  _validateName = (name: string) =>
    name
      ? /^[a-z_\-\d\s]+$/i.test(name)
        ? null
        : new Error('Name can only contain letters, numbers, space, hyphen (-) and underscore (_).')
      : new Error('Name cannot be empty.');

  render() {
    const { visible, title, onDismiss, isWorking, action } = this.props;

    return (
      <ModalDialog visible={visible} title={title} onDismiss={onDismiss}>
        <Form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.subtitle)}>Project name</h4>
          <ValidatedInput
            // @ts-ignore
            autoFocus
            value={this.state.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              this.setState({ name: e.target.value })
            }
            placeholder="Unnamed Snack"
            validate={this._validateName}
          />
          <h4 className={css(styles.subtitle)}>Description</h4>
          <TextArea
            value={this.state.description}
            onChange={(e) => this.setState({ description: e.target.value })}
            minRows={4}
            placeholder={defaults.DEFAULT_DESCRIPTION}
          />
          <div className={css(styles.buttons)}>
            <FormButton
              // @ts-ignore
              type="submit"
              large
              variant="primary"
              loading={isWorking}>
              {action}
            </FormButton>
          </div>
        </Form>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },
  buttons: {
    margin: '20px 0 0 0',
  },
  caption: {
    marginTop: 24,
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer',
    color: c('primary'),
    textDecoration: 'underline',
  },
});
