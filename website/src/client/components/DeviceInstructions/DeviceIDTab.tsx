import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';
import Banner from '../shared/Banner';
import Button from '../shared/Button';
import TextInput from '../shared/TextInput';

type Props = {
  deviceId: string | undefined;
  setDeviceId: (deviceId: string) => void;
};

type State = {
  deviceId: string;
  status: 'loading' | 'success' | 'error' | null;
};

export default class DeviceIDTab extends React.Component<Props, State> {
  private _isMounted = false;

  state = {
    deviceId: this.props.deviceId ?? '',
    status: null,
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      deviceId: e.target.value,
    });

  _handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    this.setState({ status: 'loading' });

    try {
      await this.props.setDeviceId(this.state.deviceId);

      this.setState({ status: 'success' });
    } catch (e) {
      this.setState({ status: 'error' });
    } finally {
      setTimeout(() => {
        if (this._isMounted) {
          this.setState({ status: null });
        }
      }, 3000);
    }
  };

  render() {
    const { props, state } = this;
    return (
      <>
        <form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.title)}>Your Device ID</h4>
          <TextInput
            autoFocus
            value={state.deviceId}
            type="text"
            onChange={this._handleChange}
            placeholder="XXXX-XXXX"
          />
          <Button
            large
            variant="primary"
            type="submit"
            loading={state.status === 'loading'}
            disabled={state.status !== 'loading' && props.deviceId === state.deviceId}>
            Save
          </Button>
        </form>
        <p>You can find the Device ID at the bottom of the "Projects" tab in Expo Go.</p>
        <div className={css(styles.deviceIdExample)}>
          <p>
            Device ID: <strong>XXXX-XXXX</strong>
          </p>
          <p>Client version: 2.24.3</p>
          <p>Supported SDKs: 43, 44, 45</p>
        </div>
        <Banner type="success" visible={state.status === 'success'}>
          Check the "Recently in development" section in the "Projects" tab of Expo Go to find this
          Snack!
        </Banner>
        <Banner type="error" visible={state.status === 'error'}>
          An error occurred! Please try another method or try after sometime.
        </Banner>
      </>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px',
  },
  deviceIdExample: {
    fontSize: 13,
    color: c('soft'),
    padding: 8,
    lineHeight: '11px',
    borderRadius: 3,
    border: `1px solid ${c('border')}`,
  },
});
