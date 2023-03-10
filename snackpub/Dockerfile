ARG node_version

# Set up dev image
FROM node:${node_version}-alpine AS dev
WORKDIR /app

RUN apk add --no-cache --upgrade \
    bash \
    busybox \
    g++ \
    make \
    python3

# Set up monorepo
COPY . ./
# Install dependencies
RUN yarn install --frozen-lockfile
# Build monorepo
RUN yarn build

# Start snackpub
WORKDIR /app/snackpub
CMD ["yarn", "start"]

# Prepare builder for production image without any other sub-packages
FROM node:${node_version}-alpine AS builder
WORKDIR /app

RUN apk add --no-cache --upgrade \
    bash \
    busybox \
    g++ \
    make \
    python3

# - root monorepo files
COPY --from=dev /app/package.json ./
COPY --from=dev /app/yarn.lock ./
# - snackpub files
COPY --from=dev /app/snackpub/src ./snackpub/src
COPY --from=dev /app/snackpub/package.json ./snackpub/package.json
COPY --from=dev /app/snackpub/.env-cmdrc.json ./snackpub/.env-cmdrc.json
COPY --from=dev /app/snackpub/tsconfig.json ./snackpub/tsconfig.json

# Set up envs
ENV NODE_ENV "production"

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

# Reinstall dependencies to link the monorepo
RUN yarn install --frozen-lockfile --production=false

WORKDIR /app/snackpub
# Build snackpub
RUN yarn build
# Reinstall only production dependencies
RUN yarn install --frozen-lockfile --production
# Finalize production image
RUN yarn cache clean

# Build minimized production image
FROM node:${node_version}-alpine
WORKDIR /app

# Set up envs
ENV NODE_ENV "production"

ARG DEPLOY_ENVIRONMENT
ENV DEPLOY_ENVIRONMENT ${DEPLOY_ENVIRONMENT}

COPY --from=builder /app/snackpub/build ./snackpub/build
COPY --from=builder /app/snackpub/package.json ./snackpub/package.json
COPY --from=builder /app/snackpub/node_modules ./snackpub/node_modules
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/snackpub

CMD ["node", "."]
