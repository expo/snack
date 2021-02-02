ARG node_version

FROM mhart/alpine-node:${node_version} as dev

# Workspace files
WORKDIR /server
COPY package.json yarn.lock .eslintrc.base.js .prettierrc ./

# snack-sdk
WORKDIR /server/packages/snack-sdk
COPY packages/snack-sdk/src ./src
COPY packages/snack-sdk/package.json packages/snack-sdk/tsconfig.json ./

# website
WORKDIR /server/website
COPY website/jest ./jest
COPY website/src ./src
COPY website/typings ./typings
COPY website/package.json website/resources.json website/favicon.ico ./
COPY website/.eslintignore website/.eslintrc.js ./
COPY website/babel.config.js website/tsconfig.json website/webpack.config.js ./

# Install dependencies
RUN yarn --frozen-lockfile --production=false

# Build snack-sdk
WORKDIR /server/packages/snack-sdk
RUN yarn build

# Website
WORKDIR /server/website

CMD ["yarn", "start"]

FROM dev

# set up the webpack/next.js build variables
ENV NODE_ENV "production"

ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

ARG SERVER_URL
ENV SERVER_URL ${SERVER_URL}

ARG API_SERVER_URL
ENV API_SERVER_URL ${API_SERVER_URL}

ARG IMPORT_SERVER_URL
ENV IMPORT_SERVER_URL ${IMPORT_SERVER_URL}

ARG SNACK_SERVER_URL
ENV SNACK_SERVER_URL ${SNACK_SERVER_URL}

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

ARG SNACK_WEBPLAYER_URL
ENV SNACK_WEBPLAYER_URL ${SNACK_WEBPLAYER_URL}

ARG SNACK_WEBPLAYER_CDN
ENV SNACK_WEBPLAYER_CDN ${SNACK_WEBPLAYER_CDN}

ARG SNACK_SEGMENT_KEY
ENV SNACK_SEGMENT_KEY ${SNACK_SEGMENT_KEY}

ARG SNACK_AMPLITUDE_KEY
ENV SNACK_AMPLITUDE_KEY ${SNACK_AMPLITUDE_KEY}

# Build
RUN yarn tsc --noEmit

# Lint
RUN yarn lint --max-warnings 0

# Test
RUN yarn test --maxWorkers 1

# build the js
RUN yarn build

CMD ["node", "."]
