import { StyleSheet, css } from 'aphrodite';
import { request } from 'graphql-request';
import debounce from 'lodash/debounce';
import nullthrows from 'nullthrows';
import * as React from 'react';
import { AutoSizer, List, InfiniteLoader } from 'react-virtualized';

import Analytics from '../../utils/Analytics';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import { c } from '../ThemeProvider';
import ProgressIndicator from '../shared/ProgressIndicator';
import SearchPlaceholder from './SearchPlaceholder';

const gql = String.raw;

const ENDPOINT = `${nullthrows(process.env.API_SERVER_URL)}/--/graphql`;

const SEARCH_SNACKS = gql`
  query($query: String!, $offset: Int!, $limit: Int!) {
    search(type: SNACKS, query: $query, offset: $offset, limit: $limit) {
      __typename
      ... on SnackSearchResult {
        id
        snack {
          slug
          name
          description
        }
      }
    }
  }
`;

type Snack = {
  slug: string;
  name: string;
  description: string;
};

type Props = {
  query: string;
  theme: ThemeName;
};

type Data = {
  id: string;
  snack: Snack;
}[];

type State = {
  status:
    | {
        type: 'loading';
        data: Data;
      }
    | {
        type: 'success';
        data: Data;
      }
    | {
        type: 'failure';
        error: Error;
      };
};

const PAGE_SIZE = 30;

class SearchResults extends React.Component<Props, State> {
  state: State = {
    status: { type: 'success', data: [] },
  };

  componentDidMount() {
    Analytics.getInstance().startTimer('launchedSearch');
    Analytics.getInstance().logEvent('SEARCH_OPENED');

    if (this.props.query) {
      this._fetchResultsNotDebounced(this.props.query);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.query !== prevProps.query) {
      this._fetchResults(this.props.query);
    }
  }

  _handleClick = () =>
    Analytics.getInstance().logEvent(
      'SEARCH_RESULT_CHOSEN',
      { searchTerm: this.props.query },
      'launchedSearch'
    );

  _fetchResultsNotDebounced = async (query: string, previous: Data = []) => {
    Analytics.getInstance().logEvent('SEARCH_REQUESTED', { searchTerm: query });

    this.setState({
      status: {
        type: 'loading',
        data: previous,
      },
    });

    try {
      // @ts-ignore
      const results: { search: Data } = await request(ENDPOINT, SEARCH_SNACKS, {
        query: this.props.query,
        offset: previous.length,
        limit: PAGE_SIZE,
      });

      this.setState({
        status: {
          type: 'success',
          data: [...previous, ...results.search],
        },
      });
    } catch (error) {
      console.error('Error fetching search results', error);

      this.setState({
        status: { type: 'failure', error },
      });
    }
  };

  _fetchResults = debounce(this._fetchResultsNotDebounced, 1000);

  _fetchMore = () => {
    const { status } = this.state;

    return this._fetchResultsNotDebounced(
      this.props.query,
      status.type === 'success' ? status.data : []
    );
  };

  _renderRow = ({
    data: { snack },
    style,
    key,
  }: {
    data: {
      snack: Snack;
    };
    style: object;
    key: string;
  }) => (
    <div key={key} style={style}>
      <a
        target="_blank"
        href={`/${snack.slug}`}
        onClick={this._handleClick}
        className={css(styles.item)}>
        <img
          className={css(styles.icon)}
          src={
            this.props.theme === 'dark'
              ? require('../../assets/snack-icon-dark.svg')
              : require('../../assets/snack-icon-color.svg')
          }
        />
        <div className={css(styles.content)}>
          <h4 className={css(styles.title)}>{snack.name}</h4>
          <p className={css(styles.description)}>{snack.description}</p>
        </div>
      </a>
    </div>
  );

  render() {
    const { status } = this.state;

    if (!this.props.query) {
      return <SearchPlaceholder label="Results will appear here." />;
    }

    if (status.type === 'failure') {
      return <SearchPlaceholder label="An error ocurred. Try again after some time." />;
    }

    if (status.type === 'loading' && !status.data?.length) {
      return (
        <div className={css(styles.loadingContainer)}>
          <ProgressIndicator />
          <SearchPlaceholder label="Searching…" />
        </div>
      );
    }

    if (status.type === 'success' && !status.data?.length) {
      return <SearchPlaceholder label="No results found." />;
    }

    return (
      <div className={css(status.type === 'loading' ? styles.loadingContainer : styles.container)}>
        {status.type === 'loading' ? <ProgressIndicator /> : null}
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isRowLoaded={({ index }) => index < status.data.length}
              loadMoreRows={this._fetchMore}
              rowCount={status.data.length + 1}>
              {({ onRowsRendered, registerChild }) => (
                <List
                  ref={registerChild}
                  onRowsRendered={onRowsRendered}
                  height={height}
                  width={width}
                  rowCount={status.data.length}
                  rowHeight={72}
                  rowRenderer={({ index, style, key }) =>
                    this._renderRow({ data: status.data[index], style, key })
                  }
                />
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default withThemeName(SearchResults);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    display: 'flex',
    flex: 1,
  },

  icon: {
    display: 'block',
    height: 36,
    width: 36,
    marginTop: 4,
  },

  item: {
    height: 72,
    display: 'flex',
    padding: '16px 24px',
    cursor: 'pointer',
    color: 'inherit',
    textDecoration: 'none',
    borderBottom: `1px solid ${c('border')}`,
    ':hover': {
      backgroundColor: c('hover'),
    },
  },

  content: {
    marginLeft: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  description: {
    fontSize: 14,
    margin: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
});
