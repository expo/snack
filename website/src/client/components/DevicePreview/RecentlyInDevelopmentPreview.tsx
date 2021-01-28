import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import { c, s } from '../ThemeProvider';

type Props = {
  theme: ThemeName;
  name: string;
  experienceURL: string;
};

export default withThemeName(function RecentlyInDevelopmentPreview(props: Props) {
  const { theme, name, experienceURL } = props;

  return (
    <div className={css(styles.container)}>
      <div className={css(styles.imageContainer)}>
        <img
          className={css(styles.image)}
          src={
            theme === 'dark'
              ? require('../../assets/snack-icon-dark.svg')
              : require('../../assets/snack-icon-color.svg')
          }
        />
      </div>
      <div className={css(styles.content)}>
        <h4 className={css(styles.title)}>{name}</h4>
        <p className={css(styles.subtitle)}>{experienceURL}</p>
      </div>
    </div>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 56,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 2px 0 8px',
    boxShadow: s('small'),
    borderRadius: 4,
    color: c('text'),
    border: `1px solid ${c('border')}`,
    textDecoration: 'none',
    backgroundColor: c('content'),
    margin: '0 10px 10px 10px',
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c('content'),
    marginRight: 8,
    borderWidth: 1,
    borderColor: c('border'),
    borderRadius: 3,
    borderStyle: 'solid',
    height: 40,
    width: 40,
  },
  image: {
    display: 'block',
    width: 30,
    height: 30,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    fontSize: 12,
    fontWeiht: 'bold',
    margin: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    opacity: 0.5,
  },
});
