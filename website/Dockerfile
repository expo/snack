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

# Set up production image
FROM node:${node_version}-alpine
WORKDIR /server

# - root monorepo files 
COPY --from=dev /server/package.json ./
COPY --from=dev /server/yarn.lock ./
# - used packages files
COPY --from=dev /server/packages/snack-content/build ./packages/snack-content/build
COPY --from=dev /server/packages/snack-content/src ./packages/snack-content/src
COPY --from=dev /server/packages/snack-content/package.json ./packages/snack-content/package.json
COPY --from=dev /server/packages/snack-sdk/build ./packages/snack-sdk/build
COPY --from=dev /server/packages/snack-sdk/src ./packages/snack-sdk/src
COPY --from=dev /server/packages/snack-sdk/package.json ./packages/snack-sdk/package.json
# - website files
COPY --from=dev /server/website/src ./website/src
COPY --from=dev /server/website/typings ./website/typings
COPY --from=dev /server/website/package.json ./website/package.json
COPY --from=dev /server/website/favicon.ico ./website/favicon.ico
COPY --from=dev /server/website/resources.json ./website/resources.json
COPY --from=dev /server/website/.env-cmdrc.json ./website/.env-cmdrc.json
COPY --from=dev /server/website/babel.config.js ./website/babel.config.js 
COPY --from=dev /server/website/tsconfig.json ./website/tsconfig.json 
COPY --from=dev /server/website/webpack.config.js ./website/webpack.config.js

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

# Reinstall dependencies to link the monorepo
RUN yarn install --frozen-lockfile --production=false

WORKDIR /server/website
# Build website
RUN yarn build
# Reinstall only production dependencies
RUN yarn install --frozen-lockfile --production
# Finalize production image
RUN yarn cache clean

CMD ["node", "."]
