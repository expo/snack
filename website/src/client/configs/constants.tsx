import type { SDKVersion } from 'snack-sdk';

type AppetizeQueue = 'main' | 'embed';
type AppetizePlatform = 'android' | 'ios';
type AppetizeConstants = Record<
  AppetizeQueue,
  Record<AppetizePlatform, Pick<AppetizeSdkConfig, 'publicKey' | 'device'>>
>;

const appetize: Record<SDKVersion, AppetizeConstants> = {
  '55.0.0': {
    main: {
      android: {
        publicKey: 'b_xruwx7dl5fqkoxxvpclq5fadki',
        device: 'pixel9pro',
      },
      ios: {
        publicKey: 'b_ajqa3zzgege6ekdknjk7olwere',
        device: 'iphone16pro',
      },
    },
    embed: {
      android: {
        publicKey: 'b_2kbba42dzbt24ocqb6wismikvq',
        device: 'pixel8',
      },
      ios: {
        publicKey: 'b_7rz6fiv2dm33kjhaab6enspwpq',
        device: 'iphone16pro',
      },
    },
  },
  '54.0.0': {
    main: {
      android: {
        publicKey: 'b_clf3yzcnyyg5af25nlkyh7d7ty',
        device: 'pixel9pro',
      },
      ios: {
        publicKey: 'b_gyvl6mdc7q6bjerdqpo7zm5hii',
        device: 'iphone16pro',
      },
    },
    embed: {
      android: {
        publicKey: 'b_f2dwltn2itrgkytn774d6xytsi',
        device: 'pixel8',
      },
      ios: {
        publicKey: 'b_z7jpltbm47xjfqycvoo2gs43ay',
        device: 'iphone16pro',
      },
    },
  },
  '53.0.0': {
    main: {
      android: {
        publicKey: 'b_kyqueia5m6h2xx4cestlaanu3y',
        device: 'pixel8',
      },
      ios: {
        publicKey: 'b_2nnx3oodhzs5x2sluivpazhmn4',
        device: 'iphone16pro',
      },
    },
    embed: {
      android: {
        publicKey: 'b_izv57gk6we75b3xmb3ghavye2a',
        device: 'pixel7',
      },
      ios: {
        publicKey: 'b_ypet6quf7ns7lnnz7d56uhmima',
        device: 'iphone16pro',
      },
    },
  },
  '52.0.0': {
    main: {
      android: {
        publicKey: 'b_vfyableb3rimkjc4gfht7aqrn4',
        device: 'pixel8',
      },
      ios: {
        publicKey: 'b_7qxvlrj6u755p2rtbrmmkguvvq',
        device: 'iphone16pro',
      },
    },
    embed: {
      android: {
        publicKey: 'b_nx73hicerliek7kengc5hcw64m',
        device: 'pixel4',
      },
      ios: {
        publicKey: 'b_wydrpvnmdtlnfiflokxhfxu6bu',
        device: 'iphone12',
      },
    },
  },
  '51.0.0': {
    main: {
      android: {
        publicKey: '6q5hgbmupyc6c5mhznjd37goga',
        device: 'pixel7',
      },
      ios: {
        publicKey: '7kfu7r2ugwm7c4risjyigiuhve',
        device: 'iphone15pro',
      },
    },
    embed: {
      android: {
        publicKey: 'kw54dyib72daha4mbwmpt6v76e',
        device: 'pixel4',
      },
      ios: {
        publicKey: '7g5tkw7ipmiyowgisnhlqqbtru',
        device: 'iphone12',
      },
    },
  },
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
