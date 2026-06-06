# Accounting App

An offline-first ledger, inventory, and sales-tracking app for micro-merchants — kirana stores, cloth shops, and pan parlours — built with **React Native, Expo, and TypeScript**.

The app is designed for shopkeepers who have never used a business app before: older users, basic smartphone literacy, no patience for jargon. Every screen is built around that constraint first.

## What it does

- **Record a sale in 3 taps or fewer** — the home screen surfaces the items a shop sells most often, ranked by recency and frequency, so the most common sale is always one tap away.
- **Track stock automatically** — every sale updates inventory in real time; low-stock items are flagged before they run out.
- **Manage customer credit (udhaar)** — log money given and received per customer, see running balances, and remind customers to pay.
- **See sales at a glance** — daily/weekly revenue, profit margins, and top sellers, without needing to read a spreadsheet.

## Engineering highlights

- **Accessibility as a hard constraint, not a checklist.** 48×48dp minimum tap targets, 14sp+ text that scales with the OS font-size setting, 4.5:1 minimum contrast, icon+label pairing everywhere (no icon-only buttons), and full screen-reader semantics on every interactive element.
- **Offline-first.** All reads and writes hit a local SQLite database (via Drizzle ORM) — the app works fully without a network connection.
- **Layered architecture.** Clean separation between UI, state, and data: screens read from signal-based controllers, controllers call repositories, repositories call typed DAOs. Each layer is independently testable.
- **Tested where it matters.** Domain logic — pricing, margins, low-stock thresholds, ledger balances — is covered by unit tests that encode *why* the rule exists, not just what it returns.

## Tech stack

| Layer | Choice |
|---|---|
| App framework | Expo (React Native) + TypeScript |
| Routing | Expo Router (file-based navigation) |
| State management | `@preact/signals-react` |
| Local database | SQLite (`expo-sqlite`) + Drizzle ORM |
| Testing | Jest + React Native Testing Library |

## Getting started

```bash
npm install
npx expo start
```

From there you can open the app in a development build, an Android emulator, an iOS simulator, or Expo Go.

## Status

Actively in development — core data layer, domain models, and app infrastructure are in place; feature screens are being built out next.
