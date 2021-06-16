import * as React from 'react';

import { getSnackWebsiteURL } from '../../../client/utils/getWebsiteURL';
import { getLoginHref } from '../../auth/login';
import withAuth, { AuthProps } from '../../auth/withAuth';
import type { SDKVersion, SaveOptions } from '../../types';
import { isIntentionallyNamed } from '../../utils/projectNames';
import ModalEditTitleAndDescription from '../ModalEditTitleAndDescription';
import ModalPublishOverwriteError from './ModalPublishOverwriteError';
import ModalPublishToProfile from './ModalPublishToProfile';
import ModalPublishUnknownError from './ModalPublishUnknownError';
import ModalPublishing from './ModalPublishing';
import ModalSuccessfulPublish from './ModalSuccessfulPublish';

export type PublishModals =
  | 'publish-prompt-save'
  | 'publish-edit-name'
  | 'publish-success'
  | 'publish-working'
  | 'publish-unknown-error'
  | 'publish-overwrite-experience-error'
  | null;

type Metadata = { name: string; description: string };

type Props = AuthProps & {
  name: string;
  description: string;
  onSubmitMetadata: (details: Metadata) => void;
  onPublishAsync: (options?: SaveOptions) => Promise<void>;
  currentModal: string | null;
  onShowModal: (name: PublishModals) => void;
  onHideModal: () => void;
  id: undefined | string;
  sdkVersion: SDKVersion;
  children: (options: {
    onPublishAsync: (options?: SaveOptions) => Promise<void>;
    isPublishing: boolean;
  }) => React.ReactNode;
};

type State = {
  isPublishInProgress: boolean;
  isPublishing: boolean;
  hasShownEditNameDialog: boolean;
};

class PublishManager extends React.Component<Props, State> {
  state = {
    isPublishInProgress: false,
    isPublishing: false,
    hasShownEditNameDialog: false,
  };

  _publishWithOptionsAsync = async (options: SaveOptions) => {
    this.setState({ isPublishing: true });

    try {
      await this.props.onPublishAsync(options);
    } catch (e) {
      if (/Experience .+ already exists/.test(e.message)) {
        this.props.onShowModal('publish-overwrite-experience-error');
      } else {
        this.props.onShowModal('publish-unknown-error');
      }

      throw e;
    } finally {
      this.setState({ isPublishing: false });
    }
  };

  _handleSaveToProfile = async () => {
    const isLoggedIn = Boolean(this.props.viewer);

    if (isLoggedIn) {
      // Show a spinner so we dismiss the auth modal
      this.props.onShowModal('publish-working');

      this._handlePublishAsync();
    } else {
      window.location.href = getLoginHref({
        saveToAccount: true,
      });
    }
  };

  _handleSubmitMetadata = async (details: Metadata) => {
    // Save the new name and description, then publish the snack
    this.props.onSubmitMetadata(details);
    await this._handlePublishAsync();
  };

  _handlePublishAsync = async (options: SaveOptions = {}) => {
    // When the publish flow starts, we set this so we know if we need to show the modals
    this.setState({ isPublishInProgress: true });

    if (
      // Ask for name if name is empty
      !this.props.name ||
      // Or if the name was a generated name and we haven't asked for a name previously
      (!isIntentionallyNamed(this.props.name) && !this.state.hasShownEditNameDialog)
    ) {
      this.props.onShowModal('publish-edit-name');
      this.setState({ hasShownEditNameDialog: true });
    } else {
      await this._publishWithOptionsAsync(options);
      this.props.onShowModal(this.props.viewer ? 'publish-success' : 'publish-prompt-save');
    }
  };

  _handlePublishAbort = () => {
    this.props.onHideModal();

    // When publish flow ends, we don't need to show any modals
    this.setState({ isPublishInProgress: false });
  };

  render() {
    const { id, viewer, name, description, currentModal, children } = this.props;
    const { isPublishInProgress } = this.state;

    return (
      <>
        {children({
          onPublishAsync: this._handlePublishAsync,
          isPublishing: this.state.isPublishing,
        })}
        <ModalEditTitleAndDescription
          visible={isPublishInProgress && currentModal === 'publish-edit-name'}
          title="Save your Snack"
          action={this.state.isPublishing ? 'Saving…' : 'Save'}
          isWorking={this.state.isPublishing}
          name={name}
          description={description}
          onSubmit={this._handleSubmitMetadata}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishToProfile
          visible={isPublishInProgress && currentModal === 'publish-prompt-save'}
          snackUrl={id ? `${getSnackWebsiteURL()}/${id}` : undefined}
          onPublish={this._handleSaveToProfile}
          isPublishing={this.state.isPublishing}
          onDismiss={this._handlePublishAbort}
        />
        <ModalSuccessfulPublish
          visible={isPublishInProgress && currentModal === 'publish-success'}
          viewer={viewer}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishUnknownError
          visible={isPublishInProgress && currentModal === 'publish-unknown-error'}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishing
          visible={isPublishInProgress && currentModal === 'publish-working'}
          onDismiss={this._handlePublishAbort}
        />
        <ModalPublishOverwriteError
          visible={isPublishInProgress && currentModal === 'publish-overwrite-experience-error'}
          slug={name}
          username={viewer?.username}
          onEditName={() => this.props.onShowModal('publish-edit-name')}
          onDismiss={this._handlePublishAbort}
        />
      </>
    );
  }
}

export default withAuth(PublishManager);
