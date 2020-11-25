export default class Blob {
  static instances: Blob[] = [];

  config: any;

  constructor(config: any) {
    this.config = config;
    Blob.instances.push(this);
  }
}

// @ts-ignore
global.Blob = Blob;

beforeEach(() => {
  Blob.instances = [];
});
