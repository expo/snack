ARG node_version

# --- Scoper - Remove unused workspaces for website
FROM node:${node_version}-alpine as scoper
WORKDIR /app

# Copy repository
COPY . .
# Prune repository and remove unused workspaces
RUN apk --no-cache add jq && \
  yarn global add turbo@$(jq --raw-output '.devDependencies.turbo' package.json) && \
  turbo prune --docker --scope=@expo/web-snack


# --- Base - Prepare all environment variables for development/production
FROM node:${node_version}-alpine as base

# Prepare environment variables
ARG API_SERVER_URL
ENV API_SERVER_URL ${API_SERVER_URL}
ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}
ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}
ARG IMPORT_SERVER_URL
ENV IMPORT_SERVER_URL ${IMPORT_SERVER_URL}
ARG LEGACY_SERVER_URL
ENV LEGACY_SERVER_URL ${LEGACY_SERVER_URL}
ARG LEGACY_SNACK_SERVER_URL
ENV LEGACY_SNACK_SERVER_URL ${LEGACY_SNACK_SERVER_URL}
ARG RUDDERSTACK_DATA_PLANE_URL
ENV RUDDERSTACK_DATA_PLANE_URL ${RUDDERSTACK_DATA_PLANE_URL}
ARG RUDDERSTACK_WRITE_KEY
ENV RUDDERSTACK_WRITE_KEY ${RUDDERSTACK_WRITE_KEY}
ARG SERVER_URL
ENV SERVER_URL ${SERVER_URL}
ARG SNACK_AMPLITUDE_KEY
ENV SNACK_AMPLITUDE_KEY ${SNACK_AMPLITUDE_KEY}
ARG SNACK_SERVER_URL
ENV SNACK_SERVER_URL ${SNACK_SERVER_URL}
ARG SNACK_WEBPLAYER_CDN
ENV SNACK_WEBPLAYER_CDN ${SNACK_WEBPLAYER_CDN}
ARG SNACK_WEBPLAYER_URL
ENV SNACK_WEBPLAYER_URL ${SNACK_WEBPLAYER_URL}
ARG SNACKPUB_URL
ENV SNACKPUB_URL ${SNACKPUB_URL}

# --- Development - Prepare website for development
FROM base as development
WORKDIR /app

# Copy "package.json"-only repository
COPY --from=scoper /app/out/json .
COPY --from=scoper /app/out/yarn.lock .
# Install dependencies
RUN yarn install --frozen-lockfile

# Copy "scoped" repository
COPY --from=scoper /app/out/full .
# Build website dependencies
RUN yarn turbo build --filter "{./website}^..."

# Setup website for development
WORKDIR /app/website
CMD ["yarn", "tsnd", "--inspect=9211", "src/server/index.tsx"]


# --- Deploy - Prepare website for production
FROM base as deploy
WORKDIR /app

# Prepare environment variables
ENV NODE_ENV "production"

# Copy built repository
COPY --from=development /app .
# Ensure website is build, has dependencies, and remove unnecessary dependencies from workspaces
RUN yarn turbo build --filter "{./website}..." && \
  yarn install --frozen-lockfile --production


# --- Production - Run website in production
FROM base
WORKDIR /app

# Prepare environment variables
ENV NODE_ENV "production"

# Copy deployment-ready repository
COPY --from=deploy /app .

# Setup website for production
WORKDIR /app/website
CMD ["node", "."]
