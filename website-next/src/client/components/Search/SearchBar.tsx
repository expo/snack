import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { SDKVersion } from '../../types';
import { c } from '../ThemeProvider';
import './algolia.css';

type Props = {
  sdkVersion: SDKVersion;
};

class SearchBar extends React.Component<Props> {
  // @ts-ignore variable is never read
  private docsearch: any;

  state = {
    isFocused: false,
  };

  componentDidMount() {
    this.initDocSearch();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.sdkVersion !== this.props.sdkVersion) {
      this.initDocSearch();
    }
  }

  private initDocSearch() {
    const docsearch = require('docsearch.js');
    this.docsearch = docsearch({
      apiKey: '2955d7b41a0accbe5b6aa2db32f3b8ac',
      indexName: 'expo',
      inputSelector: '#algolia-search-box',
      enhancedSearchInput: false,
      algoliaOptions: {
        // include pages without version (guides/get-started) OR exact version (api-reference)
        facetFilters: [[`version:v${this.props.sdkVersion}`]],
      },
      handleSelected: (
        input: any,
        _event: any,
        suggestion: any,
        _datasetNumber: any,
        context: any
      ) => {
        // Prevents the default behavior on click and rather opens the suggestion
        // in a new tab.
        if (context.selectionMethod === 'click') {
          input.setVal('');
          const windowReference = window.open(suggestion.url, '_blank');
          windowReference?.focus();
        }
      },
    });
  }

  render() {
    return (
      <div key={`search${this.props.sdkVersion}`} className={css(styles.container)}>
        <input
          className={css(styles.input)}
          onFocus={() => this.setState({ isFocused: true })}
          onBlur={() => this.setState({ isFocused: false })}
          id="algolia-search-box"
          type="text"
          placeholder="Search API"
          autoComplete="off"
          spellCheck="false"
          dir="auto"
        />
        <div className={css(styles.icon)}>
          <svg width="20" height="20" fill="none">
            <circle cx="8.75" cy="8.333" r="5.417" strokeWidth="1.667" />
            <path d="M12.5 12.917l4.167 4.166" strokeWidth="1.667" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    position: 'relative',
    alignItems: 'flex-end',
    marginRight: 12,
    '@media (max-width: 800px)': {
      display: 'none',
    },
  },
  input: {
    appearance: 'none',
    boxSizing: 'border-box',
    maxWidth: 300,
    width: '20vw',
    fontSize: 16,
    padding: '0 16px 0 40px',
    borderRadius: 4,
    height: 40,
    outline: 0,
    backgroundColor: c('content'),
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: c('border'),
    ':focus': {
      borderColor: c('selected'),
    },
  },
  icon: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    opacity: 0.6,
    stroke: c('text'),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;
