ARG node_version

FROM node:${node_version}-alpine as dev

RUN apk --no-cache add git openssh-client

# Workspace files
WORKDIR /app
COPY package.json yarn.lock .prettierrc ./

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
FROM node:${node_version}-alpine
RUN apk --no-cache add git openssh-client
RUN npm install --global npm@^6
COPY --from=builder /app/snackager/package.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/snackager/build build
COPY --from=builder /app/packages/snack-content/build node_modules/snack-content
COPY --from=builder /app/packages/snack-sdk/build node_modules/snack-sdk

# Start
CMD ["node", "--max-old-space-size=8192", "--async-stack-traces", "."]
