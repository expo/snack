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
  '50.0.0': {
    url: 'https://appetize.io',
    main: {
      android: 'vesv2fdfihxqdf2mf4t4gm2ogu',
      ios: 'pervthlacse7rmjfnafyrnhdoy',
    },
    embed: {
      android: 'hgzdls2srwti2a6s4saomqojwa',
      ios: '6bdvj26c3efkcdaoghibydqq6i',
    },
  },
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
