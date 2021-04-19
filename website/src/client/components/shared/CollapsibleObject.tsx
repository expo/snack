import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

type Props = {
  object: any;
  label?: string;
};

type State = {
  isExpanded: boolean;
};

export default class CollapsibleObject extends React.Component<Props, State> {
  state = {
    isExpanded: false,
  };

  _handleClick = () => this.setState((state) => ({ isExpanded: !state.isExpanded }));

  _renderValue = (value: any) => (
    <span
      className={css(
        typeof value === 'object' && value !== null
          ? null
          : typeof value === 'string'
          ? styles.string
          : styles.value
      )}>
      {typeof value === 'object' && value !== null
        ? Array.isArray(value)
          ? value.length
            ? '[…]'
            : '[]'
          : Object.keys(value).length
          ? '{…}'
          : '{}'
        : typeof value === 'string'
        ? `"${value}"`
        : String(value)}
    </span>
  );

  render() {
    const keys = Object.keys(this.props.object);

    return (
      <div className={css(styles.container)}>
        <div onClick={this._handleClick}>
          <span className={css(styles.triangle)}>{this.state.isExpanded ? '▼' : '►'}</span>
          {this.props.label ? <span className={css(styles.label)}>{this.props.label}:</span> : null}
          {Array.isArray(this.props.object) ? (
            <span className={css(styles.preview)}>
              [
              {this.props.object.map((value, i, self) => (
                <span key={i} className={css(styles.pair)}>
                  {this._renderValue(value)}
                  {i !== self.length - 1 ? ',' : null}
                </span>
              ))}
              ]
            </span>
          ) : (
            <span className={css(styles.preview)}>
              {'{'}
              {keys.map((key, i) => {
                const value = this.props.object[key];
                return (
                  <span key={key} className={css(styles.pair)}>
                    <span className={css(styles.key)}>{key}:</span>
                    {this._renderValue(value)}
                    {i !== keys.length - 1 ? ',' : null}
                  </span>
                );
              })}
              {'}'}
            </span>
          )}
        </div>
        <div className={css(styles.expanded)}>
          {this.state.isExpanded
            ? (Array.isArray(this.props.object) ? [...keys, 'length'] : keys).map((key) => {
                const item = this.props.object[key];
                return typeof item === 'object' && item !== null && Object.keys(item).length ? (
                  <CollapsibleObject key={key} label={key} object={item} />
                ) : (
                  <div key={key} className={css(styles.item)}>
                    <span className={css(styles.label, styles.key)}>{key}:</span>
                    {this._renderValue(item)}
                  </div>
                );
              })
            : null}
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    cursor: 'default',
  },
  pair: {
    margin: '0 4px',
    verticalAlign: 'middle',
  },
  preview: {
    margin: '0 4px',
    verticalAlign: 1,
    wordBreak: 'break-word',
    whiteSpace: 'normal',
  },
  triangle: {
    display: 'inline-block',
    verticalAlign: 'middle',
    width: 8,
    fontSize: 9,
    opacity: 0.7,
  },
  label: {
    marginLeft: 6,
    opacity: 0.7,
  },
  key: {
    marginRight: 4,
    opacity: 0.7,
  },
  value: {
    color: '#a27cca',
  },
  string: {
    color: '#87b121',
  },
  expanded: {
    marginLeft: 14,
  },
  item: {
    marginLeft: 8,
  },
});
