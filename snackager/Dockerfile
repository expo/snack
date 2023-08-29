ARG node_version

FROM node:${node_version}-alpine as dev

RUN apk --no-cache add git openssh-client

# Workspace files
WORKDIR /app
COPY package.json yarn.lock .prettierrc turbo.json node_modules/.cache/turbo ./

# Workspace packages
WORKDIR /app
COPY packages ./packages

# Snackager
WORKDIR /app/snackager
COPY snackager/jest ./jest
COPY snackager/src ./src
COPY snackager/structure-tests ./structure-tests
COPY snackager/package.json ./
COPY snackager/.env-cmdrc.js ./
COPY snackager/tsconfig*.json ./
COPY snackager/.eslint* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Build Snackager
WORKDIR /app
RUN yarn turbo build -- --filter "./snackager"

# Snackager
WORKDIR /app/snackager

CMD ["yarn", "start"]

FROM dev as builder

ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

# Build Snackager
RUN yarn turbo build -- --filter "./snackager"

# Minimize node_modules
RUN yarn install --frozen-lockfile --offline --production

# Build minimized production image
FROM node:${node_version}-alpine

ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

RUN apk --no-cache add git openssh-client
RUN npm install --global npm@^6

# Prepare Snackager
COPY --from=builder /app/snackager/package.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/snackager/build build
# Prepare Snackager dependencies
COPY --from=builder /app/packages/snack-content node_modules/snack-content
COPY --from=builder /app/packages/snack-require-context node_modules/snack-require-context
COPY --from=builder /app/packages/snack-sdk node_modules/snack-sdk

# Start
CMD ["node", "--max-old-space-size=8192", "--async-stack-traces", "."]
