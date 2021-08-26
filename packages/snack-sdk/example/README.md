This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features

- Edit snacks
- Edit name, description, sdk-version
- Save Snacks
- Download Snacks (as zip)
- Debounced updates
- Web-preview
- Preview on Expo Go client
- Server-side & client-side rendering [(using Next.js)](https://nextjs.org/docs)
- Web-workers

## Getting Started

First, build the snack-sdk:

```bash
# in packages/snack-sdk
yarn build
```

And then run the development server:

```bash
# in packages/snack-sdk/example
yarn dev
```

Open [http://localhost:3099](http://localhost:3099) with your browser to see the snack-sdk Example app.

## Note on failing HTTP requests due to CORS

Certain requests such as save are only allowed from trusted domains.
These requests fail when run on the localhost domain.

