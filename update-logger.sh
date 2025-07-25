#!/bin/bash

# Update all logger imports to use the new logger
find js -type f -name "*.js" ! -name "logger-new.js" -exec sed -i '' "s/from '.\/logger.js'/from '.\/logger-new.js'/g" {} +

# Rename the new logger file to replace the old one
mv js/logger-new.js js/logger.js 