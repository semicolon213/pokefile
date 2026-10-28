# E2E

Playwright(ADR-007)로 실행한다. `npm test`(Vitest)는 이 폴더를 실행하지 않는다.

```bash
npx playwright install chromium   # 최초 1회
npm run test:e2e                  # 빌드 → vite preview(:4173/pokefile/) → 테스트
```

- 테스트 파일: `tests/e2e/<feature>/*.spec.ts`
- 라우팅은 HashRouter(ADR-005)이므로 `page.goto('#/pokemon/25')`처럼 해시 주소를 사용한다.
