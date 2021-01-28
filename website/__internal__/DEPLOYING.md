# Deploying

The website is deployed using Github Actions and Kubernetes. We build a Docker image with `deploy/build_image.sh`. The image contains the built site, ready to run. Before we run it, though, we use the image to export the static assets that Next.js created, and then upload those static assets to S3.

The generated static assets are served from CloudFront, which reads from the S3 bucket. The key thing is that, because the generated assets aren't served from Node, whether someone has loaded the older version of a site before a deploy or a newer version after a deploy, when their browser makes a request to fetch JS for the page, CloudFront is able to serve both the old and new JS assets.

To deploy the server, we push the Docker image to our registry in Google Cloud and then update our Kubernetes deployment to use the new image. Kubernetes then gracefully starts new containers and drains traffic from the old ones.
