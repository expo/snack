import type { SDKVersion } from 'snack-sdk';

type AppetizeConfig = {
  /** Appetize endpoint to use */
  url: string;
  /** Appetize main queue instances */
  main: Record<'android' | 'ios', string>;
  /** Appetize secondary quere instances */
  secondary: Record<'android' | 'ios', string>;
};

const appetize: Record<SDKVersion, AppetizeConfig> = {
  '49.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'xc1w6f1krd589zhp22a0mgftyw',
      ios: '8bnmakzrptf1hv9dq7v7bnteem',
    },
    secondary: {
      android: 'af5yxyj38991wyb09c5p7n1790',
      ios: 'tq08t4qj50qjtmgg716hn6jut4',
    },
  },
  '48.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'xc1w6f1krd589zhp22a0mgftyw',
      ios: '8bnmakzrptf1hv9dq7v7bnteem',
    },
    secondary: {
      android: 'af5yxyj38991wyb09c5p7n1790',
      ios: 'tq08t4qj50qjtmgg716hn6jut4',
    },
  },
  '47.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'xc1w6f1krd589zhp22a0mgftyw',
      ios: '8bnmakzrptf1hv9dq7v7bnteem',
    },
    secondary: {
      android: 'af5yxyj38991wyb09c5p7n1790',
      ios: 'tq08t4qj50qjtmgg716hn6jut4',
    },
  },
};

export default {
  appetize,
  links: {
    itunes: 'https://itunes.apple.com/app/apple-store/id982107779?pt=17102800&amp;ct=www&amp;mt=8',
    playstore: 'https://play.google.com/store/apps/details?id=host.exp.exponent',
    authorDocs: 'https://github.com/expo/snack/blob/main/docs/embedding-snacks.md',
  },
  preview: {
    minWidth: 700,
    embeddedMinWidth: 600,
  },
};
