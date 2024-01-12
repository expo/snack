import type { SDKVersion } from 'snack-sdk';

type AppetizeConfig = {
  /** Appetize endpoint to use */
  url: string;
  /** Appetize main queue instances */
  main: Record<'android' | 'ios', string>;
  /** Appetize embed queue instances */
  embed: Record<'android' | 'ios', string>;
};

const appetize: Record<SDKVersion, AppetizeConfig> = {
  '49.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'akgy6sx2wxqpi7tylwniocatnu',
      ios: '7zohmhvo3upsnznntigdxjt5pa',
    },
    embed: {
      android: 'b2ch4fyexf6migif2avgiq7zqe',
      ios: 'j64d66porsz3yaltg7foslosr4',
    },
  },
  '48.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'dprul2v3lnp2p2okkylszo6tc4',
      ios: '4piegq2iwqmc2alvrlqvenp3dy',
    },
    embed: {
      android: '5aemtcdrvz6kq7togroc2fvtdu',
      ios: 'gq7nkndjvprkhmcuktyp6bgc7y',
    },
  },
  '47.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'wop4o4fzxdbgbekmpz2wmqt6hy',
      ios: '3hwm6iozkskvxlgssxkvsp2bou',
    },
    embed: {
      android: 'wzgngzxmpcdzo76mrnjtfdm7la',
      ios: 'r3tfsdh7v7v5vjvjm3dgfahxry',
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
