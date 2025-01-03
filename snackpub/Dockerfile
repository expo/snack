ARG node_version

# --- Scoper - Remove unused workspaces for Snackager
FROM node:${node_version}-alpine as scoper
WORKDIR /app

# Copy repository
COPY . .
# Prune repository and remove unused workspaces
RUN apk --no-cache add jq && \
  yarn global add turbo@$(jq --raw-output '.devDependencies.turbo' package.json) && \
  turbo prune --docker --scope=snackpub


# --- Development - Prepare SnackPub for development
FROM node:${node_version}-alpine as development
WORKDIR /app

# Copy "package.json"-only repository
COPY --from=scoper /app/out/json .
COPY --from=scoper /app/out/yarn.lock .
# Install (system) dependencies
RUN apk --no-cache --upgrade add bash busybox g++ make python3 && \
  yarn install --frozen-lockfile --ignore-scripts

# Copy "scoped" repository
COPY --from=scoper /app/out/full .
# Build SnackPub dependencies
RUN yarn turbo build --filter "{./snackpub}^..."

# Setup SnackPub for development
WORKDIR /app/snackpub
CMD ["yarn", "start"]


# --- Deploy - Prepare SnackPub for production
FROM node:${node_version}-alpine as deploy
WORKDIR /app

# Istall system dependencies
RUN apk --no-cache --upgrade add \
  bash \
  busybox \
  g++ \
  make \
  python3

# Prepare environment variables
ENV NODE_ENV "production"

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

# Copy built repository
COPY --from=development /app .
# Ensure SnackPub is build, has dependencies, and remove unnecessary dependencies from workspaces
RUN yarn turbo build --filter "{./snackpub}..." && \
  yarn install --frozen-lockfile --production  --ignore-scripts


# --- Production - Run SnackPub in production
FROM node:${node_version}-alpine
WORKDIR /app

# Prepare environment variables
ENV NODE_ENV "production"

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

# Copy deployment-ready repository
COPY --from=deploy /app .

# Setup SnackPub for production
WORKDIR /app/snackpub
CMD ["node", "."]
