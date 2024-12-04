ARG node_version

# --- Scoper - Remove unused workspaces for Snackager
FROM node:${node_version}-alpine as scoper
WORKDIR /app

# Copy repository
COPY . .
# Prune repository and remove unused workspaces
RUN apk --no-cache add jq && \
  yarn global add turbo@$(jq --raw-output '.devDependencies.turbo' package.json) && \
  turbo prune --docker --scope=snack-modules-packager


# --- Base - Prepare all environment variables for development/production
FROM node:${node_version}-alpine as base

# Enable Webpack 4 with newer Node versions
ENV NODE_OPTIONS --openssl-legacy-provider

# Prepare environment variables
ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}


# --- Development - Prepare Snackager for development
FROM base as development
WORKDIR /app

# Copy "package.json"-only repository
COPY --from=scoper /app/out/json .
COPY --from=scoper /app/out/yarn.lock .
# Install dependencies
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy "scoped" repository
COPY --from=scoper /app/out/full .
# Build Snackager dependencies
RUN yarn turbo build --filter "{./snackager}^..."

# Setup Snackager for development
WORKDIR /app/snackager
CMD ["yarn", "start"]


# --- Deploy - Prepare Snackager for production
FROM base as deploy
WORKDIR /app

# Install system dependencies
RUN apk --no-cache add git openssh-client

# Copy built repository
COPY --from=development /app .
# Ensure Snackager is build, has dependencies, and remove unnecessary dependencies from workspaces
RUN yarn turbo build --filter "{./snackager}..." && \
  yarn install --frozen-lockfile --production --ignore-scripts


# --- Production - Run Snackager in production
FROM base
WORKDIR /app

# Install system dependencies
RUN apk --no-cache add git openssh-client

# Copy deployment-ready repository
COPY --from=deploy /app .

# Setup Snackager for production
WORKDIR /app/snackager
CMD ["node", "--max-old-space-size=8192", "--async-stack-traces", "."]
