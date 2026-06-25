# 한국시장 50일 이격도 트래커

코스피, 삼성전자, SK하이닉스의 현재가, 50일 이동평균, 50일 이격도를 한 화면에서 확인하는 정적 웹 대시보드입니다.

이격도 공식은 `현재가 ÷ 50일 이동평균 × 100`이며, 구간은 아래 기준으로 표시합니다.

- 105 이하: 과열해소
- 105 초과 ~ 120 미만: 정상
- 120 이상 ~ 130 미만: 경계
- 130 이상: 과열

## 로컬 실행

```bash
npm install
npm run dev
```

데이터를 직접 갱신하려면 아래 명령을 실행합니다.

```bash
npm run fetch:data
```

빌드 확인:

```bash
npm run build
```

## GitHub Pages 배포

GitHub 사용자명이 `samnaldo`라면 저장소 이름을 `samnaldo.github.io`로 만들었을 때 사이트 주소는 아래처럼 됩니다.

```text
https://samnaldo.github.io/
```

Vite의 `base` 값은 GitHub Actions 환경의 `GITHUB_REPOSITORY` 값을 기준으로 자동 설정됩니다. 저장소 이름이 `samnaldo.github.io`처럼 `.github.io`로 끝나는 사용자 페이지 저장소이면 `/`를 사용하고, 일반 프로젝트 저장소이면 `/저장소이름/`을 사용합니다.

배포는 `.github/workflows/deploy-pages.yml` 워크플로가 처리합니다. GitHub 저장소의 `Settings → Pages`에서 배포 소스를 `GitHub Actions`로 설정하면 됩니다.

정적 빌드 결과물은 `dist/`에 생성됩니다.

## 데이터 갱신 방식

브라우저에서 외부 금융 API를 직접 호출하지 않고, GitHub Actions가 Python 스크립트로 데이터를 받아 `public/data/market-data.json` 파일을 갱신합니다.

데이터는 가입이나 API 키 없이 사용할 수 있는 공개 데이터 수집 방식을 사용합니다. 우선순위는 `pykrx → FinanceDataReader → Yahoo Finance fallback`입니다.

종가는 일봉 `close` 기준이며, 현재가, `regularMarketPrice`, `adjClose`를 종가처럼 사용하지 않습니다. 50일 이동평균도 같은 일봉 종가 기준으로 계산합니다.

워크플로는 평일 한국시간 12:00, 15:40, 20:10에 실행되도록 설정되어 있습니다. GitHub Actions cron은 UTC 기준이므로 `.github/workflows/update-market-data.yml`에 `03:00 UTC = 12:00 KST`, `06:40 UTC = 15:40 KST`, `11:10 UTC = 20:10 KST` 주석을 함께 적었습니다. 휴장일에는 보통 새 거래일 데이터가 없어 파일 변경이 발생하지 않습니다.

데이터 제공처 반영 지연으로 인해 20:10 갱신 직후에는 실제 확정 종가와 일부 차이가 있을 수 있습니다.

Actions가 실패하더라도 기존 `market-data.json` 파일은 저장소에 남아 있으므로 사이트는 마지막으로 성공한 데이터로 계속 표시됩니다.

## 심볼

- 코스피: `KS11`
- 삼성전자: `005930`
- SK하이닉스: `000660`

## 면책 문구

본 프로젝트는 투자 권유가 아니라 정보 제공용입니다. 데이터 제공원의 지연, 누락, 오류가 있을 수 있으며 투자 판단의 책임은 본인에게 있습니다.
