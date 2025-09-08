#!/bin/bash

# XFGAPI SDK Generation Script
# Generates client SDKs for multiple languages from OpenAPI specification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OPENAPI_SPEC="openapi/fuego-openapi.yaml"
OUTPUT_DIR="clients"
OPENAPI_GENERATOR_VERSION="6.6.0"

echo -e "${BLUE}🚀 XFGAPI SDK Generation${NC}"
echo "================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    exit 1
fi

# Check if OpenAPI spec exists
if [ ! -f "$OPENAPI_SPEC" ]; then
    echo -e "${RED}❌ OpenAPI specification not found: $OPENAPI_SPEC${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to generate SDK
generate_sdk() {
    local language=$1
    local generator=$2
    local output_path="$OUTPUT_DIR/$language"
    
    echo -e "${YELLOW}📦 Generating $language SDK...${NC}"
    
    # Remove existing SDK if it exists
    if [ -d "$output_path" ]; then
        rm -rf "$output_path"
    fi
    
    # Generate SDK using Docker
    docker run --rm \
        -v "$(pwd):/local" \
        openapitools/openapi-generator-cli:v$OPENAPI_GENERATOR_VERSION generate \
        --input-spec "/local/$OPENAPI_SPEC" \
        --generator-name "$generator" \
        --output "/local/$output_path" \
        --additional-properties=packageName=xfgapi,packageVersion=1.0.0,projectName=XFGAPI \
        --additional-properties=infoEmail=support@usexfg.org,infoUrl=https://usexfg.org \
        --additional-properties=licenseName=MIT,licenseUrl=https://opensource.org/licenses/MIT \
        --additional-properties=hideGenerationTimestamp=true \
        --additional-properties=supportsES6=true \
        --additional-properties=withInterfaces=true \
        --additional-properties=useSingleRequestParameter=false \
        --additional-properties=legacyDiscriminatorBehavior=false \
        --additional-properties=disallowAdditionalPropertiesIfNotPresent=false
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $language SDK generated successfully${NC}"
    else
        echo -e "${RED}❌ Failed to generate $language SDK${NC}"
        return 1
    fi
}

# Generate SDKs for different languages
echo -e "${BLUE}🔧 Generating SDKs...${NC}"

# JavaScript/TypeScript
generate_sdk "javascript" "javascript" || exit 1
generate_sdk "typescript" "typescript-fetch" || exit 1

# Python
generate_sdk "python" "python" || exit 1

# Java
generate_sdk "java" "java" || exit 1

# C#
generate_sdk "csharp" "csharp" || exit 1

# Go
generate_sdk "go" "go" || exit 1

# PHP
generate_sdk "php" "php" || exit 1

# Ruby
generate_sdk "ruby" "ruby" || exit 1

# Swift
generate_sdk "swift" "swift5" || exit 1

# Kotlin
generate_sdk "kotlin" "kotlin" || exit 1

echo -e "${GREEN}🎉 All SDKs generated successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Generated SDKs:${NC}"
ls -la "$OUTPUT_DIR"/

echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Review generated SDKs in the clients/ directory"
echo "2. Test SDKs with your API endpoints"
echo "3. Update documentation and examples"
echo "4. Publish SDKs to respective package managers"
