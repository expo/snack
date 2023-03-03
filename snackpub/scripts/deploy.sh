#!/bin/bash
set -eo pipefail

usage() {
  echo "Usage: $0 -e <environment>"
  exit 1
}

while getopts "e:" option; do
  case $option in
    e)
      environment=$OPTARG
      if [ "$environment" != 'staging' ] && [ "$environment" != 'production' ]; then
        echo "Invalid environment: $environment"
        exit 1
      fi
      ;;
    *)
      usage
      ;;
   esac
done

if [ -z "$environment" ]; then
  usage
elif [ "$environment" = 'staging' ]; then
  service_name='staging-snackpub'
  vpc_connector='production-general'
  env_vars_file='secrets/staging/snackpub.env.yaml'
elif [ "$environment" = 'production' ]; then
  service_name='production-snackpub'
  vpc_connector='production-general'
  env_vars_file='secrets/production/snackpub.env.yaml'
fi

printf "\nDeploying to Google Cloud Platform...\n"

gcloud run deploy "$service_name" \
  --image=gcr.io/exponentjs/snackpub:latest \
  --port=3013 \
  --allow-unauthenticated \
  --ingress=internal-and-cloud-load-balancing \
  --timeout=1800 \
  --concurrency=1000 \
  --max-instances=10 \
  --vpc-connector="$vpc_connector" \
  --env-vars-file="$env_vars_file"

gcloud beta run services update "$service_name" --session-affinity

printf "\nCloud Run $service_name has been deployed"
