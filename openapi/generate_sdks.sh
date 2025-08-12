#!/usr/bin/env bash
set -euo pipefail

# Generates SDKs from the OpenAPI spec using the openapi-generator Docker image.
# Requirements: Docker installed and running.

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SPEC="${ROOT_DIR}/api/openapi/fuego-openapi.yaml"
OUT_BASE="${ROOT_DIR}/api/clients"
IMAGE="openapitools/openapi-generator-cli"

langs=(
  "go"
  "java"
  "csharp"
  "swift5"
  "kotlin"
  "php"
  "ruby"
)

mkdir -p "${OUT_BASE}"

for lang in "${langs[@]}"; do
  outdir="${OUT_BASE}/${lang}"
  echo "Generating ${lang} SDK -> ${outdir}"
  docker run --rm -u "$(id -u):$(id -g)" \
    -v "${ROOT_DIR}:/local" \
    ${IMAGE} generate \
      -i /local/api/openapi/fuego-openapi.yaml \
      -g "${lang}" \
      -o "/local/api/clients/${lang}" \
      --global-property apis,models,modelDocs=false,apiDocs=false,supportingFiles
  echo "Done ${lang}"
  echo
done

echo "All SDKs generated under ${OUT_BASE}."
