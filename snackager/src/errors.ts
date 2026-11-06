export class PackageNotFoundError extends Error {
  static {
    this.prototype.name = 'PackageNotFoundError';
  }
}

export class UnbundleablePackageError extends Error {
  static {
    this.prototype.name = 'UnbundleablePackageError';
  }
}

export class UnsupportedVersionPackageError extends Error {
  static {
    this.prototype.name = 'UnsupportedVersionPackageError';
  }
}
