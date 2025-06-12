#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if required environment variables are set
check_required_vars() {
    local missing_vars=()
    
    # Production requirements
    if [ "$VALID_ENV" = "production" ] || [ "$VALID_ENV" = "staging" ]; then
        for var in "SUPABASE_URL" "SUPABASE_ANON_KEY" "EMAILJS_SERVICE_ID" "EMAILJS_TEMPLATE_ID" "EMAILJS_USER_ID"; do
            if [ -z "${!var}" ]; then
                missing_vars+=("$var")
            fi
        done
    else
        # Development requirements
        for var in "SUPABASE_URL" "SUPABASE_ANON_KEY"; do
            if [ -z "${!var}" ]; then
                missing_vars+=("$var")
            fi
        done
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_status "$RED" "Error: Missing required environment variables for $VALID_ENV environment: ${missing_vars[*]}"
        exit 1
    fi
}

# Function to escape special characters in environment variables
escape_var() {
    echo "$1" | sed 's/[\/&]/\\&/g'
}

# Function to validate URLs
validate_url() {
    local url=$1
    local name=$2
    if [[ ! "$url" =~ ^https?:// ]]; then
        print_status "$RED" "Error: $name must start with http:// or https://"
        exit 1
    fi
}

# Set default environment if not set
VALID_ENV=${VALID_ENV:-development}
print_status "$GREEN" "Building for environment: $VALID_ENV"

# Validate Supabase URL if provided
if [ ! -z "$SUPABASE_URL" ]; then
    validate_url "$SUPABASE_URL" "SUPABASE_URL"
fi

# Check required variables
check_required_vars

# Make a backup of env.js
cp js/env.js js/env.js.bak

# Get escaped values
SUPABASE_URL_ESCAPED=$(escape_var "$SUPABASE_URL")
SUPABASE_ANON_KEY_ESCAPED=$(escape_var "$SUPABASE_ANON_KEY")
EMAILJS_SERVICE_ID_ESCAPED=$(escape_var "${EMAILJS_SERVICE_ID:-}")
EMAILJS_TEMPLATE_ID_ESCAPED=$(escape_var "${EMAILJS_TEMPLATE_ID:-}")
EMAILJS_USER_ID_ESCAPED=$(escape_var "${EMAILJS_USER_ID:-}")
SANDBOX_EMAIL_ESCAPED=$(escape_var "${SANDBOX_EMAIL:-test@example.com}")
VALID_ENV_ESCAPED=$(escape_var "$VALID_ENV")

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|__VALID_ENV__|$VALID_ENV_ESCAPED|g" js/env.js
    sed -i '' "s|__SUPABASE_URL__|$SUPABASE_URL_ESCAPED|g" js/env.js
    sed -i '' "s|__SUPABASE_ANON_KEY__|$SUPABASE_ANON_KEY_ESCAPED|g" js/env.js
    sed -i '' "s|__EMAILJS_SERVICE_ID__|$EMAILJS_SERVICE_ID_ESCAPED|g" js/env.js
    sed -i '' "s|__EMAILJS_TEMPLATE_ID__|$EMAILJS_TEMPLATE_ID_ESCAPED|g" js/env.js
    sed -i '' "s|__EMAILJS_USER_ID__|$EMAILJS_USER_ID_ESCAPED|g" js/env.js
    sed -i '' "s|__SANDBOX_EMAIL__|$SANDBOX_EMAIL_ESCAPED|g" js/env.js
else
    # Linux
    sed -i "s|__VALID_ENV__|$VALID_ENV_ESCAPED|g" js/env.js
    sed -i "s|__SUPABASE_URL__|$SUPABASE_URL_ESCAPED|g" js/env.js
    sed -i "s|__SUPABASE_ANON_KEY__|$SUPABASE_ANON_KEY_ESCAPED|g" js/env.js
    sed -i "s|__EMAILJS_SERVICE_ID__|$EMAILJS_SERVICE_ID_ESCAPED|g" js/env.js
    sed -i "s|__EMAILJS_TEMPLATE_ID__|$EMAILJS_TEMPLATE_ID_ESCAPED|g" js/env.js
    sed -i "s|__EMAILJS_USER_ID__|$EMAILJS_USER_ID_ESCAPED|g" js/env.js
    sed -i "s|__SANDBOX_EMAIL__|$SANDBOX_EMAIL_ESCAPED|g" js/env.js
fi

# Verify the replacements
print_status "$YELLOW" "Verifying environment variable replacements..."
if grep -q "__.*__" js/env.js; then
    print_status "$RED" "Error: Some environment variables were not replaced properly"
    cat js/env.js
    # Restore backup
    mv js/env.js.bak js/env.js
    exit 1
else
    print_status "$GREEN" "Environment variables successfully replaced"
    rm js/env.js.bak
fi

# Run esbuild
print_status "$YELLOW" "Running esbuild..."
node build.js

# Verify build success
if [ $? -eq 0 ]; then
    print_status "$GREEN" "Build completed successfully"
else
    print_status "$RED" "Build failed"
    exit 1
fi

# Function to replace placeholders in env.js
replace_env_vars() {
    local env_file="js/env.js"
    local temp_file="js/env.js.tmp"

    # Read the current env.js file
    cat "$env_file" > "$temp_file"

    # Replace environment variables
    sed -i '' "s|__VALID_ENV__|${VALID_ENV:-development}|g" "$temp_file"
    sed -i '' "s|__SUPABASE_URL__|${SUPABASE_URL}|g" "$temp_file"
    sed -i '' "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" "$temp_file"
    sed -i '' "s|__EMAILJS_SERVICE_ID__|${EMAILJS_SERVICE_ID:-}|g" "$temp_file"
    sed -i '' "s|__EMAILJS_TEMPLATE_ID__|${EMAILJS_TEMPLATE_ID:-}|g" "$temp_file"
    sed -i '' "s|__EMAILJS_USER_ID__|${EMAILJS_USER_ID:-}|g" "$temp_file"
    sed -i '' "s|__SANDBOX_EMAIL__|${SANDBOX_EMAIL:-test@example.com}|g" "$temp_file"

    # Move the temp file back
    mv "$temp_file" "$env_file"
}

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
    exit 1
fi

# Replace environment variables in env.js
echo "Replacing environment variables in env.js..."
replace_env_vars

echo "Build completed successfully" 