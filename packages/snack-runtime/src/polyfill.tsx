// Starting from SDK 46.0.0-beta.6, this is now required.
// Without this, it will fail in production mode with:
// ReferenceError: Can't find variable: regeneratorRuntime
import '@babel/polyfill';
