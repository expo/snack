ARG node_version

FROM mhart/alpine-node:${node_version} as dev

RUN apk --no-cache add git openssh-client

# Workspace files
WORKDIR /app
COPY package.json yarn.lock .eslintrc.base.js .prettierrc ./

# Workspace packages
WORKDIR /app/packages
COPY packages/snack-content ./snack-content
COPY packages/snack-sdk ./snack-sdk

# snackager
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

# Build snack-content
WORKDIR /app/packages/snack-content
RUN yarn build

# Build snack-sdk
WORKDIR /app/packages/snack-sdk
RUN yarn build

# Snackager
WORKDIR /app/snackager

CMD ["yarn", "start"]

FROM dev as builder

ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

# Build
RUN yarn build

# Minimize image
RUN yarn install --frozen-lockfile --offline --production
FROM mhart/alpine-node:${node_version}
RUN apk --no-cache add git openssh-client
COPY --from=builder /app/snackager/package.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/snackager/build/snackager/src build
COPY --from=builder /app/snackager/build/packages/snack-content/src node_modules/snack-content
COPY --from=builder /app/snackager/build/packages/snack-sdk/src node_modules/snack-sdk

# Start
CMD ["node", "--max-old-space-size=8192", "--async-stack-traces", "."]
