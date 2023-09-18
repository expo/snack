import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import usePreferences from './Preferences/usePreferences';
import Popover from './shared/Popover';

type Props = {
  name: string;
  description: string;
  onOpenFullEditor?: () => void;
};

export default function EmbeddedEditorTitle({ name, description, onOpenFullEditor }: Props) {
  const [preferences] = usePreferences();
  const { theme } = preferences;
  return (
    <div className={css(styles.header)}>
      <h1 className={css(styles.title)}>{name}</h1>
      <div className={css(styles.iconContainer)}>
        <Popover content={<p className={css(styles.description)}>{description}</p>}>
          <button
            className={css(styles.icon, theme === 'light' ? styles.infoLight : styles.infoDark)}
          />
        </Popover>
        <button
          className={css(
            styles.icon,
            theme === 'light' ? styles.externalLight : styles.externalDark,
          )}
          onClick={onOpenFullEditor}
        />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    margin: '.25em .75em',
    backgroundColor: 'inherit',
  },

  title: {
    lineHeight: 1,
    fontSize: '1.2em',
    fontWeight: 500,
    margin: 0,
  },

  iconContainer: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0 .25em',
    backgroundColor: 'inherit',
  },

  icon: {
    height: 16,
    width: 16,
    margin: 8,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundColor: 'transparent',
    border: 0,
    outline: 0,
    opacity: 0.3,
    transition: '.2s',

    ':hover': {
      opacity: 0.8,
    },
  },

  description: {
    margin: 16,
  },

  infoLight: {
    backgroundImage: `url(${require('../assets/info-icon.png')})`,
  },

  infoDark: {
    backgroundImage: `url(${require('../assets/info-icon-light.png')})`,
  },

  externalLight: {
    backgroundImage: `url(${require('../assets/open-link-icon.png')})`,
  },

  externalDark: {
    backgroundImage: `url(${require('../assets/open-link-icon-light.png')})`,
  },
});
