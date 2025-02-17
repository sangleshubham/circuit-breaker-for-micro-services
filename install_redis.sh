#!/usr/bin/env bash

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Detected Linux system. Installing Redis with apt-get..."
  sudo apt-get update
  sudo apt-get install -y redis-server
  sudo systemctl start redis-server
  echo "Comment prestart script to skip this step next time"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Detected macOS. Installing Redis with Homebrew..."
  brew update
  brew install redis

  # Optionally run Redis as a background service
  brew services start redis
  echo "Comment prestart script to skip this step next time"
else
  echo "Unsupported OS: $OSTYPE, Please install redis manually and comment this file exection in package.json \nLook for "prestart""
  exit 1
fi
echo "Redis installation and startup complete."
