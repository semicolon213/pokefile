#!/usr/bin/env bash
set -euo pipefail
# Requires package.json scripts: lint, typecheck, test, build.
# Do not report PASS until all commands run successfully.
npm run lint
npm run typecheck
npm test -- --run
npm run build
