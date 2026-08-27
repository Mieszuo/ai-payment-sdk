# Design Doc: AI Payment Platform & Managed Actions Engine (v2)

**Data:** 2026-08-27  
**Status:** Zatwierdzona specyfikacja techniczna do planowania implementacji  
**Autorzy:** Twórca Projektu & Antigravity  
**Runtime:** Bun  

---

## 1. Cel Projektu i Misja (Executive Summary)

Tradycyjny model udostępniania aplikacji AI cierpi na dychotomię:
1. **Model BYOK (Bring Your Own Key):** Użytkownik musi założyć konto na platformie OpenAI/Google, wygenerować klucz API i podpiąć kartę. Dla 95% użytkowników nietechnicznych jest to bariera nie do przejścia.
2. **Model Sponsorowany przez Dewelopera:** Twórca aplikacji podpina swój prywatny klucz API. Wirusowy ruch lub automatyczne boty mogą w kilka godzin wygenerować rachunek na tysiące dolarów, rujnując twórcę.

### Misja Produktu:
> **„Build AI features without API keys, backend infrastructure, or paying for your users' usage.”**

Platforma łączy dwa fundamentalne filary:
1. 💳 **Universal AI Wallet (User-Funded AI):** Użytkownicy końcowi doładowują wspólny portfel kredytów (działający w każdej aplikacji w ekosystemie), finansując własne zużycie modeli AI.
2. 🔒 **Backendless Managed Actions:** Deweloper wdraża zaawansowaną logikę AI (ukryte prompty systemowe, wersjonowane szablony, rygorystyczne schematy wejść/wyjść, sztywne ceny w kredytach i limity) bezpośrednio ze statycznej strony (np. GitHub Pages, Vercel), bez konieczności stawiania własnego serwera backendowego.

---

## 2. Trójpoziomowy Model Integracji (3-Tier Architecture)

```
                    ┌────────────────────────────────────────────┐
                    │               TWOJA PLATFORMA              │
                    ├────────────────────────────────────────────┤
                    │ Level 1: Public Client AI                  │
                    │ ai.chat() — jawne prompty z przeglądarki   │
                    ├────────────────────────────────────────────┤
                    │ Level 2: Managed Actions ⭐ (CORE PRODUCT)  │
                    │ ai.action() — prompt, model i wersja na GW │
                    ├────────────────────────────────────────────┤
                    │ Level 3: Server / BYO Backend              │
                    │ gateway.action.execute() — dla backendów   │
                    └────────────────────────────────────────────┘
```

* **Level 1 (Public Client AI):** Proste wywołania z przeglądarki (`ai.chat()`). Zero backendu, prompt jawny w kodzie klienta. Do otwartych prototypów i open-source.
* **Level 2 (Managed Actions – Core):** Deweloper rejestruje akcję w platformie (np. `optimize-resume@v1`). Systemowy prompt, model, cena w kredytach i schemat wejść Zod są zabezpieczone w Gatewayu. Klient wysyła tylko parametry dynamiczne (`inputs`).
* **Level 3 (Server / BYO Backend):** Dla projektów z własnym backendem (Node/Python), które wykonują akcje po stronie serwera z przekazaniem sesji użytkownika.

---

## 3. Model Bezpieczeństwa i Autoryzacji (Zero-Trust)

### 3.1. `pk_live_...` to Identyfikator, a NIE Sekret
* Klucz publiczny projektu (`pk_live_...`) służy **wyłącznie do identyfikacji projektu i powiązania z dozwolonymi domenami (CORS)**.
* `pk_live_...` **NIE JEST poświadczeniem uwierzytelniającym** i nie daje prawa do wykonania żadnej akcji płatnej z konta użytkownika.

### 3.2. Wymóg Autoryzacji Sesji Użytkownika (Session Auth Barrier)
Każde wywołanie `ai.action()` na poziomie Gatewaya przechodzi przez rygorystyczny łańcuch:

```text
Request (pk_live_xxx + Bearer UserSessionJWT + inputs)
        ↓
1. Project Resolution (odczyt projektu z bazy/cache)
        ↓
2. Origin & CORS Validation (zgodność z allowed_domains dla przeglądarek)
        ↓
3. User Session Verification (walidacja podpisu JWT, ważności sesji i tożsamości usera)
        ↓
4. Action & Version Resolution (sprawdzenie uprawnień projektu do wywołania akcji)
        ↓
5. Distributed Rate Limiting (per user, project, action, IP)
        ↓
6. Action Execution Pipeline (rezerwacja środków -> wykonanie -> rozliczenie)
```

### 3.3. Autoryzacja Między Domenami (PKCE Flow zamiast Ukrytych Iframe)
* Zamiast zawodnego mechanizmu ukrytych `<iframe>` (blokowanego przez Safari ITP i Chrome third-party cookie restrictions), stosujemy standardowy **OAuth 2.0 / OIDC Authorization Code Flow z PKCE**:
  1. Aplikacja dewelopera otwiera małe okno pop-up do `auth.twojadomena.com/authorize` z wygenerowanym lokalnie `code_challenge`.
  2. Użytkownik loguje się przez Google OAuth lub Email OTP.
  3. Serwer auth przekierowuje pop-up z krótkotrwałym `code` (ważnym np. 60 sekund).
  4. Pop-up przekazuje `code` do okna głównego przez `window.opener.postMessage()`, po czym natychmiast się zamyka.
  5. SDK wymienia `code` wraz z `code_verifier` na podpisany token sesji (`UserSessionJWT`).

---

## 4. Architektura Monorepo i Podział Odpowiedzialności

Monorepo na bazie **Bun Workspaces** z wyraźnym podziałem odpowiedzialności:

```
ai-payment-platform/
├── packages/
│   ├── shared/               # Czyste kontrakty TS i schematy Zod (Zero zależności zewnętrznych)
│   │   ├── schemas/          # ActionDefinition, ActionVersion, InputSchema, OutputSchema
│   │   ├── ledger/           # Typy księgowe (AccountType, TransactionType, EntryType)
│   │   └── errors/           # Sformalizowane kody błędów (INSUFFICIENT_CREDITS, UNTRUSTED_OUTPUT)
│   │
│   ├── core/                 # Czyste reguły biznesowe (Zero zależności I/O, bazy czy sieci)
│   │   ├── ledger/           # Reguły Double-Entry, bilansowanie transakcji, cykl rezerwacji
│   │   ├── pricing/          # Margin guard, kalkulator kosztu modeli vs cena w kredytach
│   │   ├── actions/          # Interpolacja szablonów, sanitizacja promptu, walidacja wyjść Zod
│   │   └── policies/         # Interfejsy rate limitera, reguły anulowania (AbortPolicy)
│   │
│   ├── server/               # Bun HTTP Gateway (Hono) & Infrastruktura
│   │   ├── api/              # Trasy REST & SSE (/v1/actions/:name/execute, /v1/auth, /v1/stripe)
│   │   ├── services/         # ActionExecutionService, WalletService, SecurityService
│   │   ├── adapters/         # SupabaseAdapter, StripeAdapter, OpenAiAdapter, GeminiAdapter, RedisAdapter
│   │   └── config/           # Projekty, akcje i polityki
│   │
│   ├── sdk/                  # Główna biblioteka kliencka JS/TS + Shadow DOM Widget
│   │   ├── client/           # createAI(), ai.action(), ai.actionStream(), ai.chat()
│   │   └── ui/               # Web Component w Shadow DOM (State machine, Bottom-Sheet)
│   │
│   └── react/                # Opcjonalne hooki dla React / Next.js
│       └── hooks/            # useAction(), useActionStream(), useWallet()
│
├── apps/
│   └── demo/                 # Aplikacja demonstracyjna na Vite (np. AI Resume Optimizer)
└── tests/                    # Testy integracyjne, replay webhooków Stripe, testy obciążeniowe transakcji
```

---

## 5. Finanse: Prawdziwy Double-Entry Ledger i Cykl Rezerwacji

### 5.1. Model Double-Entry Accounting
Każda operacja finansowa w systemie jest transakcją (`ledger_transactions`), która składa się z co najmniej dwóch wpisów (`ledger_entries`), a suma kwot w transakcji **zawsze wynosi dokładnie zero**:

$$\sum \text{amount\_credits} = 0$$

#### Konta w systemie (`accounts`):
* `USER_WALLET:<user_id>` (Pasywa platformy wobec użytkownika)
* `PLATFORM_CLEARING` (Konto rozliczeniowe środków w toku)
* `PLATFORM_REVENUE` (Przychody platformy z marży)
* `PROVIDER_EXPENSE` (Koszty hurtowe LLM: OpenAI, Gemini)
* `DEVELOPER_PAYABLE:<dev_id>` (Należności dla dewelopera projektu)

### 5.2. Schemat Bazy Danych (PostgreSQL / Supabase)

```sql
-- 1. Transakcje finansowe (nagłówek)
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('TOPUP', 'BONUS', 'RESERVATION_HOLD', 'SETTLEMENT', 'RESERVATION_RELEASE', 'REFUND')),
    reference_id UUID, -- np. id z action_runs lub stripe_session_id
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Wpisy księgowe (podwójny zapis)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    account_identifier TEXT NOT NULL, -- np. 'USER_WALLET:usr_123' lub 'PLATFORM_REVENUE'
    amount_credits INTEGER NOT NULL,  -- Może być dodatnia lub ujemna
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_entries_account ON ledger_entries(account_identifier);
CREATE INDEX idx_ledger_entries_tx ON ledger_entries(transaction_id);

-- 3. Zbuforowane saldo portfela z twardym ograniczeniem
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    available_credits INTEGER NOT NULL DEFAULT 0,
    reserved_credits INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT positive_available CHECK (available_credits >= 0),
    CONSTRAINT positive_reserved CHECK (reserved_credits >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.3. Cykl Życia Środków: Reservation $\rightarrow$ Execution $\rightarrow$ Settlement

Nigdy nie pobieramy środków bezpośrednio przed wywołaniem modelu. Stosujemy **wzorzec dwufazowy**:

```
[ AVAILABLE: 100 ] 
       │
       ▼ (Krok 1: Rezerwacja)
[ AVAILABLE: 85, RESERVED: 15 ]
       │
       ├─── [Sukces LLM] ──────────► (Krok 2a: Rozliczenie / Settlement)
       │                              [ AVAILABLE: 85, RESERVED: 0 ]
       │                              Ledger: USER_WALLET (-15), REVENUE/PROVIDER (+15)
       │
       └─── [Awaria / Abort] ──────► (Krok 2b: Zwolnienie / Release)
                                      [ AVAILABLE: 100, RESERVED: 0 ]
                                      Ledger: RESERVATION_RELEASE
```

* **Transakcyjna blokada wiersza:**
  ```sql
  SELECT available_credits, reserved_credits 
  FROM wallets 
  WHERE user_id = $1 
  FOR UPDATE;
  ```
  Jeśli `available_credits < requiredCredits` $\rightarrow$ natychmiastowy błąd `INSUFFICIENT_CREDITS`.

---

## 6. Zarządzane Akcje (Managed Actions) & Tabela `action_runs`

### 6.1. Oddzielenie Stanu Wykonania od Bilingu (`action_runs`)
Wszelkie szczegóły operacyjne wywołania żyją w tabeli `action_runs`, a nie w księdze finansowej:

```sql
CREATE TABLE action_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_name TEXT NOT NULL,
    action_version INTEGER NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('RESERVED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    model TEXT NOT NULL,
    
    reserved_credits INTEGER NOT NULL,
    consumed_credits INTEGER DEFAULT 0,
    
    input_hash TEXT NOT NULL, -- SHA-256 parametrów wejściowych do szybkiego audytu / cache
    provider_request_id TEXT,
    error_code TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

### 6.2. Niezmienne Wersjonowanie Akcji (`action_versions`)
Każda zmiana promptu, modelu lub ceny tworzy **nową wersję**:

```typescript
export interface ActionVersion {
  actionName: string;
  version: number;                    // np. 1, 2, 3...
  projectId: string;
  model: string;                      // np. "google/gemini-1.5-flash"
  fallbackModel?: string;              // np. "openai/gpt-4o-mini"
  priceCredits: number;               // Cena dla użytkownika (np. 15 ⚡)
  maxProviderCostCents: number;       // 🛡️ Margin Guard (np. 5¢)
  maxOutputTokens: number;
  outputFormat: 'text' | 'json';
  
  systemPrompt: string;               // 🔒 Ukryte na serwerze
  userPromptTemplate: string;
  
  inputSchema: z.ZodSchema;
  outputSchema?: z.ZodSchema;
}
```

### 6.3. Rurociąg Niezaufanego Wyjścia (Untrusted Output Pipeline)
Wyjście z modelu językowego jest traktowane jako **niezaufane**:

```
LLM Raw Output 
      ↓
JSON Parse (z usuwaniem ewentualnych znaczników markdown ```json)
      ↓
Zod Validation (przeciwko outputSchema z ActionVersion)
      ↓
(W razie błędu) Opcjonalny jednorazowy szybki repair-call lub błąd UNTRUSTED_OUTPUT
      ↓
Zwrócenie zwalidowanych danych do SDK
```

### 6.4. Polityka Streaming + AbortSignal
* Jeśli klient wyśle sygnał `abort()` zanim model rozpocznie generowanie $\rightarrow$ **100% zwolnienia rezerwacji** (`RESERVATION_RELEASE`).
* W przypadku akcji o stałej cenie (`priceCredits`), przerwanie w trakcie generowania:
  * Gateway przerywa połączenie z OpenAI/Gemini (oszczędność dalszych tokenów).
  * Rozliczenie: pobierana jest opłata ryczałtowa akcji, chyba że serwer nie otrzymał ani jednego poprawnego tokena (wtedy pełny zwrot).

---

## 7. Bezpieczeństwo Promptów, Prywatność i Ochrona przed DoS

### 7.1. Realistyczny Model Obrony przed Prompt Injection
XML/znaczniki nie są murem bezpieczeństwa – są separatorami strukturalnymi. Pełna ochrona obejmuje:
1. **Ograniczenia rozmiaru wejść (Input Constraints):** Sztywne limity długości znaków per pole w Zod (np. max 10k znaków).
2. **Hierarchia Promptu:** Instrukcje systemowe są separowane na poziomie ról API dostawcy (`role: "system"` vs `role: "user"`).
3. **Izolacja Uprawnień:** Akcje w MVP są czysto generatywne (brak niebezpiecznych narzędzi typu `bash` czy modyfikacja bazy danych po stronie modelu).

### 7.2. Ochrona przed Ekonomicznym DoS i Oszustwami Płatniczymi
* **Ryzyko:** Użytkownik kupuje kredyty (\$10), zużywa je na LLM w 5 minut, a następnie zgłasza Chargeback w banku.
* **Mitygacja:**
  * Wymuszony **Stripe 3D Secure (SCA)** oraz włączony **Stripe Radar** (blokada kart pre-paid o wysokim ryzyku).
  * **Velocity limits:** Maksymalnie \$30 doładowań na dobę dla nowego konta.
  * **Idempotencja webhooków:** Każde zdarzenie `checkout.session.completed` jest przetwarzane w transakcji z unikalnym kluczem sesji.

### 7.3. Polityka Prywatności i Danych (GDPR / RODO)
* **Zero PII w logach aplikacyjnych:** Prompty użytkowników i wygenerowane CV **nigdy nie trafiają do konsoli serwera ani standardowych logów HTTP** (logowane są wyłącznie metadane: `user_id`, `action_name`, `tokens`, `duration_ms`).
* **Retencja danych:** Tabela `action_runs` przechowuje treść odpowiedzi z konfigurowalnym czasem retencji (np. TTL = 7 dni dla debugowania), po czym treść jest automatycznie czyszczona (`output = NULL`), a w bazie zostaje jedynie ślad audytowy.

---

## 8. Rozproszony Rate Limiting (Distributed Rate Limiter)

Warstwa `packages/core` definiuje interfejs:

```typescript
export interface RateLimiter {
  consume(key: string, limit: number, windowSeconds: number): Promise<{ success: boolean; remaining: number }>;
}
```

* **Środowisko testowe / deweloperskie:** `InMemoryRateLimiter` (szybkie testy jednostkowe).
* **Środowisko produkcyjne:** `RedisRateLimiter` (skrypt Lua oparty o algorytm Sliding Window Counter).
* **Wymiary limitów:**
  1. Per User: `rl:user:<user_id>` (np. max 60 zapytań/min)
  2. Per Action: `rl:action:<user_id>:<action_name>` (zgodnie z konfiguracją akcji)
  3. Per IP: `rl:ip:<ip_address>` (ochrona przed spamem przed logowaniem)

---

## 9. Klienckie SDK i UI Widżet (Shadow DOM)

### 9.1. Cechy Klienckiego Widżetu
* **Shadow DOM:** Pełna izolacja stylów od aplikacji nadrzędnej (`mode: 'open'`).
* **Lekkość:** Czysty TypeScript i Web Components, waga paczki `<20 KB`.
* **Tryb Headless (`headless: true`):** Wyłącza domyślny UI, udostępniając czyste API reaktywne dla twórców z własnym interfejsem.
* **Responsywność:** Standardowy modal wycentrowany na desktopie, płynnie przechodzący w wysuwaną od dołu szufladę (**Bottom Sheet**) na ekranach `<640px`.

### 9.2. Gotowe Hooki React (`@platform/react`)

```tsx
import { useAction, useWallet } from "@platform/react";

export function ResumeOptimizer() {
  const { balance } = useWallet();
  const { execute, data, isPending, error } = useAction("optimize-resume@v1");

  return (
    <div>
      <span>Portfel: {balance} ⚡</span>
      <button onClick={() => execute({ cvText, jobTitle })} disabled={isPending}>
        {isPending ? "Przetwarzanie..." : "Optymalizuj (15 ⚡)"}
      </button>
      {data && <div>Wynik: {data.improvedText}</div>}
    </div>
  );
}
```

---

## 10. Strategia Testów i Weryfikacji (Zero Regresji)

1. **Testy Jednostkowe Domeny (Core):**
   * Balansowanie transakcji Double-Entry (suma wpisów = 0).
   * Poprawność przejść maszyny stanów rezerwacji (`AVAILABLE -> RESERVED -> SETTLED / RELEASED`).
   * Margin Guard (odrzucenie akcji przy nagłym wzroście kosztu modelu).
2. **Testy Współbieżności Bazy Danych:**
   * Symulacja 20 równoległych zapytań dla usera z saldem na tylko 1 zapytanie. Gwarancja, że dokładnie jedno przejdzie, a 19 zostanie odrzuconych bez błędu ujemnego salda.
3. **Testy Integracyjne Płatności i Webhooków:**
   * Potrójny replay tego samego webhooka Stripe (test unikalności `idempotency_key`).
4. **Testy E2E (Aplikacja Demonstracyjna):**
   * Autoryzacja PKCE $\rightarrow$ odbiór 20 kredytów bonusowych $\rightarrow$ wywołanie akcji $\rightarrow$ odjęcie 15 kredytów $\rightarrow$ walidacja wyniku i salda.
