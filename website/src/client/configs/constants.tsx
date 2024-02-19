import type { SDKVersion } from 'snack-sdk';

type AppetizeQueue = 'main' | 'embed';
type AppetizePlatform = 'android' | 'ios';
type AppetizeConstants = Record<
  AppetizeQueue,
  Record<AppetizePlatform, Pick<AppetizeSdkConfig, 'publicKey' | 'device'>>
>;

const appetize: Record<SDKVersion, AppetizeConstants> = {
  '50.0.0': {
    main: {
      android: {
        publicKey: 'vesv2fdfihxqdf2mf4t4gm2ogu',
        device: 'pixel7',
      },
      ios: {
        publicKey: 'pervthlacse7rmjfnafyrnhdoy',
        device: 'iphone15pro',
      },
    },
    embed: {
      android: {
        publicKey: 'hgzdls2srwti2a6s4saomqojwa',
        device: 'pixel4',
      },
      ios: {
        publicKey: '6bdvj26c3efkcdaoghibydqq6i',
        device: 'iphone12',
      },
    },
  },
  '49.0.0': {
    main: {
      android: {
        publicKey: 'akgy6sx2wxqpi7tylwniocatnu',
        device: 'pixel4',
      },
      ios: {
        publicKey: '7zohmhvo3upsnznntigdxjt5pa',
        device: 'iphone12',
      },
    },
    embed: {
      android: {
        publicKey: 'b2ch4fyexf6migif2avgiq7zqe',
        device: 'pixel4',
      },
      ios: {
        publicKey: 'j64d66porsz3yaltg7foslosr4',
        device: 'iphone12',
      },
    },
  },
  '48.0.0': {
    main: {
      android: {
        publicKey: 'dprul2v3lnp2p2okkylszo6tc4',
        device: 'pixel4',
      },
      ios: {
        publicKey: '4piegq2iwqmc2alvrlqvenp3dy',
        device: 'iphone12',
      },
    },
    embed: {
      android: {
        publicKey: '5aemtcdrvz6kq7togroc2fvtdu',
        device: 'pixel4',
      },
      ios: {
        publicKey: 'gq7nkndjvprkhmcuktyp6bgc7y',
        device: 'iphone12',
      },
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
