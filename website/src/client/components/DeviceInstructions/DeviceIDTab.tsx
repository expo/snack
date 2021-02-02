import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import Banner from '../shared/Banner';
import Button from '../shared/Button';
import LargeInput from '../shared/LargeInput';

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
    return (
      <>
        <form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.title)}>Your Device ID</h4>
          <LargeInput
            autoFocus
            value={this.state.deviceId}
            type="text"
            onChange={this._handleChange}
            placeholder="XXXX-XXXX"
          />
          <Button
            large
            variant="primary"
            type="submit"
            loading={this.state.status === 'loading'}
            disabled={
              this.state.status !== 'loading' && this.props.deviceId === this.state.deviceId
            }>
            Save
          </Button>
        </form>
        <p>You can find the Device ID at the bottom of the "Projects" tab in the Expo app.</p>
        <img
          className={css(styles.screenshot)}
          src={require('../../assets/device-id-screenshot.png')}
        />
        <Banner type="success" visible={this.state.status === 'success'}>
          Check the "Recently in development" section in the "Projects" tab of the Expo app to find
          this Snack!
        </Banner>
        <Banner type="error" visible={this.state.status === 'error'}>
          An error occurred! Please try another method or try after sometime.
        </Banner>
      </>
    );
  }
}

const styles = StyleSheet.create({
  screenshot: {
    height: 136,
    display: 'block',
    margin: '16px auto',
    borderRadius: 3,
    border: '1px solid rgba(0, 0, 0, .08)',
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px',
  },
});
