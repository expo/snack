import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import ReactDOM from 'react-dom';

type Props = {
  visible: boolean;
  children?: React.ReactNode;
  onDismiss?: () => void;
};

type State = {
  rendered: boolean;
  initial: boolean;
};

export default class Modal extends React.PureComponent<Props, State> {
  static getDerivedStateFromProps(props: Props) {
    return props.visible ? { rendered: true, initial: false } : null;
  }

  state = {
    rendered: this.props.visible,
    initial: !this.props.visible,
  };

  componentDidMount() {
    document.body.appendChild(this._container);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.visible !== prevProps.visible) {
      clearTimeout(this._timer);

      if (!this.props.visible) {
        this._timer = setTimeout(() => this.setState({ rendered: false }), 300);
      }
    }
  }

  componentWillUnmount() {
    document.body.removeChild(this._container);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  _container = document.createElement('div');
  _content = React.createRef<HTMLDivElement>();
  _timer: any;

  _handleDismiss = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      this._content.current &&
      this._content.current !== e.target &&
      this._content.current.contains(e.target as Node)
    ) {
      return;
    }

    this.props.onDismiss?.();
  };

  _handleKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 27 && this.props.visible) {
      // Esc was pressed
      e.preventDefault();
      this.props.onDismiss?.();
    }
  };

  render() {
    return ReactDOM.createPortal(
      <div
        className={css(
          styles.modal,
          !this.state.initial && styles.initial,
          this.props.visible ? styles.visible : styles.hidden
        )}
        onMouseDown={this._handleDismiss}
      >
        <div ref={this._content} className={css(styles.content)}>
          {this.state.rendered ? this.props.children : null}
        </div>
      </div>,
      this._container
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    zIndex: 999,
    transitionProperty: 'opacity',
    transitionDuration: '200ms',
    '-webkit-font-smoothing': 'antialiased',
  },
  initial: {
    backgroundColor: 'rgba(24, 29, 37, 0.8)',
  },
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
});
