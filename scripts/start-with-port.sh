#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Use PORT_PROD if set, otherwise default to 3000
PORT=${PORT_PROD:-3000}

echo "Starting production server on port $PORT..."
next start -p $PORT
