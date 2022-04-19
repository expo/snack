ARG node_version

# Set up dev image
FROM node:${node_version}-alpine as dev
WORKDIR /server

# Set up monorepo
COPY . ./
# Install dependencies
RUN yarn install --frozen-lockfile
# Build monorepo
RUN yarn build

# Start website
WORKDIR /server/website
CMD ["yarn", "start"]

# Set up builder image (for production)
FROM dev as builder
WORKDIR /server

# Set up the webpack/next.js build variables
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

# Build production files
RUN yarn build
RUN yarn --cwd ./website build

# Set up production image
FROM node:${node_version}-alpine
WORKDIR /server
# - root monorepo files
COPY --from=builder /server/package.json ./
COPY --from=builder /server/yarn.lock ./
# - used packages files
COPY --from=builder /server/packages/snack-content/build ./packages/snack-content/build
COPY --from=builder /server/packages/snack-content/package.json ./packages/snack-content/package.json
COPY --from=builder /server/packages/snack-sdk/build ./packages/snack-sdk/build
COPY --from=builder /server/packages/snack-sdk/package.json ./packages/snack-sdk/package.json
# - website files
COPY --from=builder /server/website/build ./website/build
COPY --from=builder /server/website/dist ./website/dist
COPY --from=builder /server/website/package.json ./website/package.json
COPY --from=builder /server/website/favicon.ico ./website/favicon.ico
COPY --from=builder /server/website/resources.json ./website/resources.json

# Reinstall production-only dependencies
RUN yarn install --frozen-lockfile --production

WORKDIR /server/website
CMD ["node", "."]
