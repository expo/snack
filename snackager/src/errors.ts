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
