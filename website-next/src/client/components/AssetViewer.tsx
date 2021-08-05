import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { SnackFiles } from '../types';
import { isImage } from '../utils/fileUtilities';
import { c } from './ThemeProvider';

type Props = {
  selectedFile: string;
  files: SnackFiles;
};

type State = {
  layout:
    | {
        height: number;
        width: number;
      }
    | undefined
    | null;
};

export default class AssetViewer extends React.PureComponent<Props, State> {
  state: State = {
    layout: null,
  };

  _handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.target as HTMLImageElement;

    this.setState({
      layout: {
        height: image.naturalHeight,
        width: image.naturalWidth,
      },
    });
  };

  render() {
    const { selectedFile, files } = this.props;
    const ext = selectedFile.includes('.') ? selectedFile.split('.').pop() : null;
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.inner)}>
          {isImage(selectedFile.toLowerCase()) ? (
            <img
              onLoad={this._handleImageLoad}
              className={css(styles.preview)}
              src={files[selectedFile]?.contents as string}
            />
          ) : (
            <svg width="120px" height="168px" viewBox="0 0 120 168">
              <mask id="mask-2" fill="white">
                <rect x="0" y="0" width="119.25" height="168" />
              </mask>
              <g mask="url(#mask-2)" fillRule="nonzero" fill={c('border')}>
                <path d="M2.25,0 L117.75,0 L117.75,0 C118.992641,-2.28269391e-16 120,1.00735931 120,2.25 L120,165.75 L120,165.75 C120,166.992641 118.992641,168 117.75,168 L2.25,168 L2.25,168 C1.00735931,168 1.52179594e-16,166.992641 0,165.75 L0,2.25 L0,2.25 C-1.52179594e-16,1.00735931 1.00735931,2.28269391e-16 2.25,0 Z M75,0 L120,45 L120,0 L75,0 Z" />
                <path
                  d="M77.25,-3 L120.75,-3 C121.992641,-3 123,-1.99264069 123,-0.75 L123,42.75 C123,43.9926407 121.992641,45 120.75,45 L77.25,45 C76.0073593,45 75,43.9926407 75,42.75 L75,-0.75 L75,-0.75 C75,-1.99264069 76.0073593,-3 77.25,-3 L77.25,-3 Z M75,0 L120,45 L120,0 L75,0 Z"
                  fillOpacity="0.2"
                  fill="#000000"
                />
                <text className={css(styles.ext)}>
                  <tspan x="56" y="100">
                    {ext ? `.${ext}` : ''}
                  </tspan>
                </text>
              </g>
            </svg>
          )}
          <a
            className={css(styles.link)}
            href={files[selectedFile]?.contents as string}
            target="_blank"
            title="Open in tab">
            <h4 className={css(styles.name)}>{selectedFile.split('/').pop()}</h4>
          </a>
          <div className={css(styles.layout)}>
            {this.state.layout ? `${this.state.layout.height} x ${this.state.layout.width}` : ' '}
          </div>
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    maxHeight: '100%',
    maxWidth: '100%',
    textAlign: 'center',
  },
  name: {
    marginTop: '2em',
    fontWeight: 500,
  },
  layout: {
    opacity: 0.5,
  },
  preview: {
    maxHeight: '100%',
    maxWidth: '100%',
    height: 'auto',
    width: 'auto',
  },
  ext: {
    fill: c('text'),
    fontFamily: 'var(--font-monospace)',
    textAnchor: 'middle',
    fontSize: 20,
    opacity: 0.8,
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
  },
});
