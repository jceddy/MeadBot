#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo $DIR
echo Updating Meadbot
#git -C $DIR fetch && git -C $DIR reset --hard origin/main
echo Running Meadbot
cd "$DIR" && /usr/bin/node --trace-warnings src/index.js
