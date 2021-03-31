#!/usr/bin/env bash

set -xe

package="$1"
tag="$2"

if [[ -z "$tag" ]]
then
  tag="$(env LC_CTYPE=C tr -dc 'a-zA-Z0-9' </dev/urandom | fold -w 32 | head -n 1)"
  echo "no tag specified, building docker image with tag $tag"
  gcloud docker -- build -t "gcr.io/exponentjs/snackager:$tag" .
fi

docker run -t -w="/app" "gcr.io/exponentjs/snackager:$tag" yarn bundle "$package"
