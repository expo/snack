#!/usr/bin/env bash

echo "Starting Server..."
yarn start | bunyan -o simple > /dev/null 2>&1 &
pid=$!
sleep 5
echo "Spinning out http requests..."
while read -r line; do
  url="http://localhost:3001/git?repo=$line"
  id=$(curl $url 2> /dev/null)
  echo "$line: $id"
done < repos.txt
echo "Done!"
kill $pid
