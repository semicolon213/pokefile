#!/usr/bin/env bash
set -euo pipefail
# Requires package.json scripts: lint, typecheck, test, build.
# Do not report PASS until all commands run successfully.
# E2E(npm run test:e2e)와 API 계약 검증(npm run verify:api)은 외부 환경에 의존하므로 여기에 포함하지 않는다.
npm run lint
npm run typecheck
npm test
npm run build
