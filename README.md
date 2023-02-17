# Snack

This is a fork of expo [snack](https://github.com/expo/snack)

# Why ?

Snack has many packages, some are published to NPM and some are not, such as `snackager`.

`snackager` is not published in NPM to be patched so we need to manager our own version of it.

We need to mark our app & packages as external like so https://github.com/expo/snack/pull/354/files

That's the only change we need.


```
yarn install
yarn build
cd snackager
yarn develop
```