#!/bin/bash

if [ "$(docker ps | grep dev-mongo)" != "" ]
then
    echo "container dev-mongo exists. starting it..."
    docker start dev-mongo
else
    echo "container dev-mongo does not exists. calling docker run ..."
    docker run -p 28001:27017 --name dev-mongo -d mongo
fi
