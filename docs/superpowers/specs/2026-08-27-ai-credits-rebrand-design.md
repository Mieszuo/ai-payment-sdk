# Design Doc: Rebrand do „AI Credits" / `@ai-credits/*`

**Data:** 2026-08-27
**Status:** Zatwierdzona specyfikacja techniczna (decyzja użytkownika: pełny rebrand, scope `@ai-credits/*`)
**Autorzy:** Twórca Projektu & Antigravity
**Runtime:** Bun

---

## 1. Cel

Nazwa `@platform/*` jest generyczna, niebrandowalna i ryzykowna przy publikacji na npm. Produkt — „AI Payment Platform & Managed Actions Engine" — zmienia identyfikatory na brand **„AI Credits"** ze scope **`@ai-credits/*`**. Zmiana odbywa się **przed pierwszą publikacją** pakietów (wszystkie nazwy `@ai-credits/*` są dziś wolne w rejestrze npm — zweryfikowane 404).

## 2. Zakres zmiany

### 2.1. Pakiety (package.json `name`)
| Obecnie | Po zmianie |
|---|---|
| `@platform/shared` | `@ai-credits/shared` |
| `@platform/core` | `@ai-credits/core` |
| `@platform/server` | `@ai-credits/server` |
| `@platform/sdk` | `@ai-credits/sdk` |
| `@platform/react` | `@ai-credits/react` |
| root `"ai-payment-platform"` | `"ai-credits"` |

Aplikacje (`dashboard`, `docs`, `landing`, `demo-app`) **nie zmieniają nazw** — są prywatne (`"private": true`), niepublikowane.

### 2.2. Importy
Wszystkie wystąpienia `@platform/X` → `@ai-credits/X` w: `packages/*`, `apps/*`, `scripts/*`, `tests/*`, `docs/DEPLOYMENT.md` (69 plików).

### 2.3. Copy i identyfikatory produktu
- `packages/server/src/server.ts`: health JSON `service: "AI Credits Gateway & Managed Actions Engine"`; banner startowy `[Server] AI Credits Gateway running at http://localhost:<port>`.
- `packages/shared/src/urls.ts`: aliasy produkcyjne → `https://ai-credits-landing.vercel.app`, `ai-credits-dashboard.vercel.app`, `ai-credits-docs.vercel.app`, `ai-credits-demo.vercel.app` (dev: `localhost:5176/5174/5175/5173` bez zmian).
- Landing/docs/dashboard: frazy „AI Payment Platform" jako brand → „AI Credits"; tekst opisowy (payment, pay-as-you-go, credits) zostaje tam, gdzie ma sens.
- `docker-compose.yml`: `container_name: ai-payment-supabase-db` → `ai-credits-db`; komentarze z nazwą produktu.
- `.env.example`: zmienne bez zmian (to kontrakt); aktualizacja tylko komentarzy opisowych jeśli zawierają starą nazwę.

### 2.4. Poza zakresem (bez zmian)
- Katalog na dysku (`C:\Users\ziark\Projekty\ai-payment-sdk`) i pełna historia git — rename katalogu byłby inwazyjny, nie daje wartości przed publikacją.
- `docs/superpowers/plans/*` i `docs/superpowers/specs/*` — historyczne artefakty planowania; nie fałszujemy historii (mogą zawierać `@platform/*`).
- Zmienne środowiskowe (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PORT`, `REDIS_URL`, `RESEND_API_KEY`, `RESEND_FROM`).
- Trasy API (`/v1/*`), migracje SQL (`001`–`005`), klucze demo (`pk_live_demo123`, `sk_live_demo_secret_456`), `bun.lock` (regenerowany przez `bun install`).

## 3. Weryfikacja (definicja gotowe)

1. `bun install` — bun.lock odświeżony, workspace'y rozwiązują `@ai-credits/*`.
2. `bun test` — 263 pass / 9 skip / 0 fail (bez zmian w zachowaniu).
3. `bun run typecheck` — exit 0.
4. Smoke: `bun run server` (in-memory) → `GET /` zwraca 200 z `service: "AI Credits Gateway & Managed Actions Engine"`.
5. Grep: zero wystąpień `@platform/` poza `docs/superpowers/*`.

## 4. Rezerwacja scope na npm (osobny krok, wymaga użytkownika)

- Zakładamy org `ai-credits` na npmjs.com (darmowe) lub publikujemy placeholder pod scope.
- Komendy gotowe w planie; wykonanie wymaga `npm login` użytkownika (brak credencji w środowisku).

## 5. Ryzyka

- **Niedokładny find/replace** — ryzyko pominięcia pliku → łapie to krok 2.5 (grep) i typecheck (niespójny import nie skompiluje się).
- **Nazwa zajęta przed publikacją** — minimalne w oknie 24 h; łagodzone rezerwacją scope (krok 4).
- **Stare aliasy Vercel** — nowe aliasy wymagają redeployu appek; kod jest gotowy wcześniej, deploy osobno.
