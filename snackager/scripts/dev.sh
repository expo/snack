#!/usr/bin/env bash

set -eo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

port_forward_redis() {
  # Port-forward Redis in a subshell and prefix its output to be more discernible
  $DIR/port-forward-redis --environment "$REDIS_ENVIRONMENT" \
    > >(sed "s/^/${yellow}[Redis]${reset} /") \
    2> >(sed "s/^/${yellow}[Redis]${reset} /" >&2)
}

echo
echo "${yellow}Starting the Redis port tunnel and waiting for it to become available${reset}"

port_forward_redis

echo
echo "${yellow}Starting the Snackager server${reset}"


env-cmd -e development tsnd --require tsconfig-paths/register --inspect=9212 --quiet src/index.ts | node_modules/.bin/bunyan --output simple
