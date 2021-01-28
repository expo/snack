import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c, s } from '../ThemeProvider';

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
};

type State = {
  visible: boolean;
};

export default class Popover extends React.PureComponent<Props, State> {
  state = {
    visible: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _handleDocumentContextMenu = () => {
    if (this.state.visible) {
      this._hidePopover();
    }
  };

  _handleDocumentClick = (e: MouseEvent) => {
    if (
      this.state.visible &&
      (e.target === this._anchor.current ||
        e.target === this._popover.current ||
        this._popover.current?.contains(e.target as Node))
    ) {
      return;
    }

    this._hidePopover();
  };

  _togglePopover = () => {
    if (!this.state.visible) {
      const popover = this._popover.current?.getBoundingClientRect() ?? {};
      const anchor = this._anchor.current?.getBoundingClientRect() ?? {};

      // @ts-ignore
      const diff = (popover.width - 10) / 2 - anchor.left;

      if (this._popover.current && this._arrow.current) {
        if (diff > 0) {
          this._popover.current.style.left = `${diff + 5}px`;
          this._arrow.current.style.left =
            // @ts-ignore
            `${anchor.left - anchor.width / 2 + 10}px`;
        } else {
          this._popover.current.style.left = '5px';
          this._arrow.current.style.left = '50%';
        }
      }
    }

    this.setState((state) => ({ visible: !state.visible }));
  };

  _hidePopover = () => this.setState({ visible: false });

  _anchor = React.createRef<HTMLElement>();
  _arrow = React.createRef<HTMLSpanElement>();
  _popover = React.createRef<HTMLDivElement>();

  render() {
    const { children, content } = this.props;

    return (
      <div className={css(styles.container)}>
        {React.cloneElement(
          // @ts-ignore
          React.Children.only(children),
          {
            ref: this._anchor,
            onClick: this._togglePopover,
          }
        )}
        <div
          ref={this._popover}
          className={css(styles.popover, this.state.visible ? styles.visible : styles.hidden)}>
          <span ref={this._arrow} className={css(styles.arrow)} />
          {content}
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'inherit',
  },

  popover: {
    position: 'absolute',
    top: '100%',
    margin: 12,
    width: '18em',
    borderRadius: 3,
    zIndex: 99,
    backgroundColor: c('content'),
    border: `1px solid ${c('border')}`,
    color: 'inherit',
    transition: 'transform .2s, opacity .2s',
    boxShadow: `${s('popover')}, 0 0 3px rgba(0, 0, 0, 0.08)`,
  },

  arrow: {
    position: 'absolute',
    height: 16,
    width: 16,
    top: -9,
    transform: 'translateX(-50%) rotate(45deg)',
    backgroundColor: 'inherit',
    borderTopLeftRadius: 4,
    boxShadow: '-.5px -.5px 0 rgba(0, 0, 0, .12)',
    border: 0,
  },

  visible: {
    opacity: 1,
    transform: 'translateX(-50%) translateY(0)',
  },

  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: 'translateX(-50%) translateY(-4px)',
  },
});
