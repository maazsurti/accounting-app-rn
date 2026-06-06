<div align="center">

# 🧾 Accounting App

**Offline-first ledger, inventory, and sales tracking for micro-merchants** — built for shopkeepers who've never used a business app before.

![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Tested_with-Jest-C21325?style=flat-square&logo=jest&logoColor=white)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-8A2BE2?style=flat-square)
![Status](https://img.shields.io/badge/status-in_development-yellow?style=flat-square)

</div>

---

Kirana stores, cloth shops, and pan parlours run on paper ledgers and memory. This app gives them a digital one — without asking them to learn what an app is. Older users, basic smartphone literacy, zero patience for jargon: every screen is designed around that constraint first, not as an afterthought.

## ✨ What it does

- 🛒 **Record a sale in 3 taps or fewer** — the home screen surfaces the items a shop sells most often, ranked by recency and frequency, so the most common sale is always one tap away.
- 📦 **Track stock automatically** — every sale updates inventory in real time; low-stock items are flagged before they run out.
- 🤝 **Manage customer credit (udhaar)** — log money given and received per customer, see running balances, and send reminders when payment is due.
- 📊 **See sales at a glance** — daily/weekly revenue, profit margins, and top sellers, rendered as numbers big enough to read without squinting.

## 🏗️ Engineering highlights

- **♿ Accessibility as a hard constraint, not a checklist** — 48×48dp minimum tap targets, 14sp+ text that scales with the OS font-size setting, 4.5:1 minimum contrast, icon+label pairing everywhere (no icon-only buttons), and full screen-reader semantics on every interactive element.
- **📡 Offline-first** — all reads and writes hit a local SQLite database (via Drizzle ORM); the app works fully without a network connection.
- **🧱 Layered architecture** — clean separation between UI, state, and data: screens read from signal-based controllers, controllers call repositories, repositories call typed DAOs. Each layer is independently testable.
- **✅ Tested where it matters** — domain logic (pricing, margins, low-stock thresholds, ledger balances) is covered by unit tests that encode *why* a rule exists, not just what it returns.

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| 📱 App framework | Expo (React Native) + TypeScript |
| 🧭 Routing | Expo Router (file-based navigation) |
| ⚡ State management | MobX |
| 🗄️ Local database | SQLite (`expo-sqlite`) + Drizzle ORM |
| 🧪 Testing | Jest + React Native Testing Library |

## 🚀 Getting started

```bash
npm install
npx expo start
```

From there you can open the app in a development build, an Android emulator, an iOS simulator, or Expo Go.

## 📍 Status

🚧 Actively in development — core data layer, domain models, and app infrastructure are in place; feature screens are being built out next.
