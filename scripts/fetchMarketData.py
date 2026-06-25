from __future__ import annotations

import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen


KST = timezone(timedelta(hours=9))
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "public" / "data" / "market-data.json"

ASSETS = {
    "kospi": {
        "symbol": "KS11",
        "name": "코스피",
        "unit": "index",
        "code": "1001",
        "fdr_symbol": "KS11",
        "yahoo_symbol": "^KS11",
        "kind": "index",
    },
    "samsung": {
        "symbol": "005930",
        "name": "삼성전자",
        "unit": "krw",
        "code": "005930",
        "fdr_symbol": "005930",
        "yahoo_symbol": "005930.KS",
        "kind": "stock",
    },
    "skhynix": {
        "symbol": "000660",
        "name": "SK하이닉스",
        "unit": "krw",
        "code": "000660",
        "fdr_symbol": "000660",
        "yahoo_symbol": "000660.KS",
        "kind": "stock",
    },
}


def get_status(disparity: float) -> str:
    if disparity <= 105:
        return "과열해소"
    if disparity < 120:
        return "정상"
    if disparity < 130:
        return "경계"
    return "과열"


def calculate_indicators(rows: list[dict[str, Any]], window_size: int = 50) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        if index < window_size - 1:
            output.append({**row, "ma50": None, "disparity": None, "status": None})
            continue

        window = rows[index - window_size + 1 : index + 1]
        ma50 = sum(item["close"] for item in window) / window_size
        disparity = round((row["close"] / ma50) * 100, 2)
        output.append(
            {
                **row,
                "ma50": round(ma50, 2),
                "disparity": disparity,
                "status": get_status(disparity),
            }
        )

    return output[-1260:]


def normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, dict[str, Any]] = {}
    for row in rows:
        date = str(row["date"])[:10]
        close = row["close"]
        if close is None:
            continue
        close_number = float(close)
        if not math.isfinite(close_number):
            continue
        seen[date] = {"date": date, "close": round(close_number, 2)}

    return [seen[date] for date in sorted(seen)]


def get_date_range() -> tuple[str, str]:
    end = datetime.now(KST).date()
    start = end - timedelta(days=365 * 5 + 120)
    return start.strftime("%Y%m%d"), end.strftime("%Y%m%d")


def fetch_with_pykrx(asset: dict[str, str], start: str, end: str) -> list[dict[str, Any]]:
    from pykrx import stock

    if asset["kind"] == "index":
        df = stock.get_index_ohlcv_by_date(start, end, asset["code"])
    else:
        df = stock.get_market_ohlcv_by_date(start, end, asset["code"])

    if df.empty:
        raise RuntimeError(f"pykrx returned no rows for {asset['name']}")

    close_column = "종가"
    rows = [
        {"date": index.strftime("%Y-%m-%d"), "close": row[close_column]}
        for index, row in df.iterrows()
    ]
    return normalize_rows(rows)


def fetch_with_fdr(asset: dict[str, str], start: str, end: str) -> list[dict[str, Any]]:
    import FinanceDataReader as fdr

    start_dash = f"{start[:4]}-{start[4:6]}-{start[6:8]}"
    end_dash = f"{end[:4]}-{end[4:6]}-{end[6:8]}"
    df = fdr.DataReader(asset["fdr_symbol"], start_dash, end_dash)

    if df.empty:
        raise RuntimeError(f"FinanceDataReader returned no rows for {asset['name']}")

    rows = [
        {"date": index.strftime("%Y-%m-%d"), "close": row["Close"]}
        for index, row in df.iterrows()
    ]
    return normalize_rows(rows)


def fetch_with_yahoo(asset: dict[str, str], start: str, end: str) -> list[dict[str, Any]]:
    start_dt = datetime.strptime(start, "%Y%m%d").replace(tzinfo=timezone.utc)
    end_dt = datetime.strptime(end, "%Y%m%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    period1 = int(start_dt.timestamp())
    period2 = int(end_dt.timestamp())
    symbol = quote(asset["yahoo_symbol"], safe="")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?period1={period1}&period2={period2}&interval=1d&events=history&includeAdjustedClose=false"
    )
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 korea-market-ma50-disparity-tracker"})

    with urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    result = (payload.get("chart", {}).get("result") or [None])[0]
    if not result:
        raise RuntimeError(f"Yahoo Finance returned no result for {asset['name']}")

    timestamps = result.get("timestamp") or []
    closes = (((result.get("indicators") or {}).get("quote") or [{}])[0]).get("close") or []
    rows = []
    for timestamp, close in zip(timestamps, closes):
        if close is None:
            continue
        date = datetime.fromtimestamp(timestamp, tz=timezone.utc).date().isoformat()
        rows.append({"date": date, "close": close})

    return normalize_rows(rows)


def fetch_asset(asset: dict[str, str], start: str, end: str) -> tuple[list[dict[str, Any]], str]:
    errors: list[str] = []
    for source, fetcher in (
        ("pykrx", fetch_with_pykrx),
        ("FinanceDataReader", fetch_with_fdr),
        ("Yahoo Finance fallback", fetch_with_yahoo),
    ):
        try:
            rows = fetcher(asset, start, end)
            if len(rows) < 50:
                raise RuntimeError(f"{source} returned too few rows")
            return calculate_indicators(rows), source
        except Exception as exc:
            errors.append(f"{source}: {exc}")

    raise RuntimeError(f"All data sources failed for {asset['name']}: {' | '.join(errors)}")


def to_utc_iso_from_kst(date: str, time_text: str) -> str:
    hour, minute = [int(part) for part in time_text.split(":")]
    local = datetime.fromisoformat(f"{date}T{hour:02d}:{minute:02d}:00").replace(tzinfo=KST)
    return local.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def get_scheduled_generated_at(latest_data_date: str) -> str:
    now = datetime.now(KST)
    current_date = now.date().isoformat()
    current_minutes = now.hour * 60 + now.minute

    if latest_data_date != current_date:
        return to_utc_iso_from_kst(latest_data_date, "20:10")
    if current_minutes >= 20 * 60 + 10:
        return to_utc_iso_from_kst(latest_data_date, "20:10")
    if current_minutes >= 15 * 60 + 40:
        return to_utc_iso_from_kst(latest_data_date, "15:40")
    return to_utc_iso_from_kst(latest_data_date, "12:00")


def format_kst_from_iso(value: str) -> str:
    date = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(KST)
    return date.strftime("%Y.%m.%d %H:%M KST")


def main() -> None:
    start, end = get_date_range()
    assets: dict[str, Any] = {}
    latest_dates: list[str] = []
    sources: set[str] = set()

    for key, asset in ASSETS.items():
        records, source = fetch_asset(asset, start, end)
        latest = next((item for item in reversed(records) if item["ma50"] is not None), None)
        if latest is None:
            raise RuntimeError(f"No MA50-ready records for {asset['name']}")

        latest_dates.append(latest["date"])
        sources.add(source)
        assets[key] = {
            "symbol": asset["symbol"],
            "name": asset["name"],
            "unit": asset["unit"],
            "source": source,
            "updatedAtKst": "",
            "data": records,
            "records": records,
            "lastDate": latest["date"],
            "lastClose": latest["close"],
            "date": latest["date"],
            "close": latest["close"],
            "ma50": latest["ma50"],
            "disparity": latest["disparity"],
            "status": latest["status"],
        }

    latest_data_date = max(latest_dates)
    generated_at = get_scheduled_generated_at(latest_data_date)
    updated_at_kst = format_kst_from_iso(generated_at)

    for asset in assets.values():
        asset["updatedAtKst"] = updated_at_kst

    market_data = {
        "generatedAt": generated_at,
        "source": ", ".join(sorted(sources)),
        "assets": assets,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(market_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
