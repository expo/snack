ARG node_version

FROM node:${node_version}-alpine as dev

# Workspace files
WORKDIR /server
COPY package.json yarn.lock .prettierrc ./

# Workspace packages
WORKDIR /server/packages
COPY packages/snack-content ./snack-content
COPY packages/snack-sdk ./snack-sdk

# website
WORKDIR /server/website
COPY website/jest ./jest
COPY website/src ./src
COPY website/typings ./typings
COPY website/package.json website/resources.json website/favicon.ico ./
COPY website/.env-cmdrc.json ./
COPY website/.eslintignore website/.eslintrc.js ./
COPY website/babel.config.js website/tsconfig.json website/webpack.config.js ./

# Install dependencies
RUN yarn --frozen-lockfile --production=false

# Build snack-content
WORKDIR /server/packages/snack-content
RUN yarn build

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

ARG LEGACY_SERVER_URL
ENV LEGACY_SERVER_URL ${LEGACY_SERVER_URL}

ARG SERVER_URL
ENV SERVER_URL ${SERVER_URL}

ARG API_SERVER_URL
ENV API_SERVER_URL ${API_SERVER_URL}

ARG IMPORT_SERVER_URL
ENV IMPORT_SERVER_URL ${IMPORT_SERVER_URL}

ARG LEGACY_SNACK_SERVER_URL
ENV LEGACY_SNACK_SERVER_URL ${LEGACY_SNACK_SERVER_URL}

ARG SNACK_SERVER_URL
ENV SNACK_SERVER_URL ${SNACK_SERVER_URL}

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

ARG RUDDERSTACK_DATA_PLANE_URL
ENV RUDDERSTACK_DATA_PLANE_URL ${RUDDERSTACK_DATA_PLANE_URL}

ARG RUDDERSTACK_WRITE_KEY
ENV RUDDERSTACK_WRITE_KEY ${RUDDERSTACK_WRITE_KEY}

ARG SNACK_WEBPLAYER_URL
ENV SNACK_WEBPLAYER_URL ${SNACK_WEBPLAYER_URL}

ARG SNACK_WEBPLAYER_CDN
ENV SNACK_WEBPLAYER_CDN ${SNACK_WEBPLAYER_CDN}

ARG SNACK_AMPLITUDE_KEY
ENV SNACK_AMPLITUDE_KEY ${SNACK_AMPLITUDE_KEY}

# Build
RUN yarn tsc --noEmit

# Lint
RUN yarn lint --max-warnings 0

# Test
RUN yarn test --maxWorkers 1

# Build the JS
RUN yarn build

# Remove devDependencies
RUN yarn --frozen-lockfile --production

CMD ["node", "."]
