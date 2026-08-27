# Design Doc: AI Payment Platform & Managed Actions Engine

**Data:** 2026-08-27  
**Status:** Zatwierdzony projekt do planowania implementacji  
**Autor:** Antigravity & Twórca Projektu  
**Runtime:** Bun  

---

## 1. Wstęp i Cel Projektu (Executive Summary)

Tradycyjny model udostępniania aplikacji AI cierpi na dychotomię:
1. **Model BYOK (Bring Your Own Key):** Użytkownik musi założyć konto na platformie OpenAI/Google, wygenerować klucz API i podpiąć kartę. Dla 95% użytkowników nietechnicznych jest to bariera nie do przejścia.
2. **Model Sponsorowany przez Dewelopera:** Twórca aplikacji podpina swój prywatny klucz API. Wirusowy ruch lub automatyczne boty mogą w kilka godzin wygenerować rachunek na tysiące dolarów, rujnując twórcę.

### Misja Produktu:
> **„Build AI features without API keys, backend infrastructure, or paying for your users' usage.”**

Platforma łączy dwa fundamentalne filary:
1. 💳 **Universal AI Wallet (User-Funded AI):** Użytkownicy końcowi doładowują wspólny portfel kredytów (działający w każdej aplikacji w ekosystemie), finansując własne zużycie modeli AI.
2. 🔒 **Backendless Managed Actions:** Deweloper wdraża zaawansowaną logikę AI (ukryte prompty systemowe, rygorystyczne schematy wejść/wyjść, sztywne ceny w kredytach i limity) bezpośrednio ze statycznej strony (np. GitHub Pages, Vercel), bez konieczności stawiania własnego serwera backendowego.

---

## 2. Trójpoziomowy Model Integracji (3-Tier Architecture)

Platforma wspiera trzy klasy użycia:

```
                    ┌────────────────────────────────────────────┐
                    │               TWOJA PLATFORMA              │
                    ├────────────────────────────────────────────┤
                    │ Level 1: Public Client AI                  │
                    │ ai.chat() — jawne prompty z przeglądarki   │
                    ├────────────────────────────────────────────┤
                    │ Level 2: Managed Actions ⭐ (CORE PRODUCT)  │
                    │ ai.action() — prompt i model na serwerze   │
                    ├────────────────────────────────────────────┤
                    │ Level 3: Server / BYO Backend              │
                    │ gateway.action.execute() — dla serwerów    │
                    └────────────────────────────────────────────┘
```

* **Level 1 (Public Client AI):** Proste wywołania z przeglądarki (`ai.chat()`). Zero backendu, prompt jawny w kodzie klienta. Idealne do otwartych prototypów i projektów open-source.
* **Level 2 (Managed Actions – Core):** Deweloper rejestruje akcję w platformie (np. `optimize-resume`). Systemowy prompt, model, cena w kredytach i schemat wejść Zod są bezpieczne po stronie Twojego Gatewaya. Klient wysyła tylko parametry dynamiczne (`inputs`).
* **Level 3 (Server / BYO Backend):** Dla projektów z własnym backendem (Node/Python), które chcą autoryzować zapytania w imieniu użytkownika z poziomu swojego serwera.

---

## 3. Architektura Monorepo i Struktura Pakietów

Projekt wykorzystuje **Bun Workspaces** z rygorystycznymi granicami architektonicznymi (Architektura Heksagonalna):

```
ai-payment-platform/
├── packages/
│   ├── shared/               # Czyste kontrakty TS i schematy Zod (zero zależności frameworkowych)
│   │   ├── schemas/          # ActionDefinition, InputSchema, OutputSchema, UserSession
│   │   ├── ledger/           # Typy wpisów księgowych (TOPUP, BONUS, ACTION_DEBIT)
│   │   └── errors/           # Standardowe kody błędów (INSUFFICIENT_CREDITS, RATE_LIMITED)
│   │
│   ├── core/                 # Czysta domena biznesowa (Logika bez I/O)
│   │   ├── ledger/           # Reguły księgi, kalkulatory salda, weryfikacja idempotencji
│   │   ├── actions/          # Renderowanie promptów z szablonu, dopasowywanie modeli
│   │   └── security/         # Ograniczanie Prompt Injection, rate limiter in-memory/interface
│   │
│   ├── server/               # Bun HTTP Gateway (Hono)
│   │   ├── api/              # Trasy: /v1/actions/:name/execute, /v1/auth, /v1/wallet, /v1/stripe
│   │   ├── adapters/         # StripeAdapter, OpenAiAdapter, GeminiAdapter, SupabaseAdapter
│   │   └── config/           # Rejestr projektów i akcji
│   │
│   ├── sdk/                  # Główna biblioteka kliencka JS/TS + Shadow DOM Widget
│   │   ├── client/           # createAI(), ai.action(), ai.actionStream(), ai.chat()
│   │   └── ui/               # Web Component w Shadow DOM (Logowanie, Doładowania, Portfel)
│   │
│   └── react/                # Opcjonalne hooki dla ekosystemu React / Next.js
│       └── hooks/            # useAction(), useActionStream(), useWallet()
│
├── apps/
│   └── demo/                 # Aplikacja demonstracyjna na Vite (np. AI Resume Optimizer)
└── tests/                    # Testy integracyjne, replay webhooków Stripe, testy E2E
```

---

## 4. Silnik Bilingowy i Niezmienna Księga (Universal Wallet & Ledger)

Wszystkie operacje finansowe i tokenowe opierają się na wzorcu **Append-Only Double-Entry Ledger**. Stan salda nigdy nie jest modyfikowany bez pozostawienia niezmiennego śladu audytowego.

### 4.1. Schemat Relacyjny Bazy Danych (Supabase / Postgres)

```sql
-- 1. Projekty deweloperów
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE, -- np. pk_live_...
    allowed_domains TEXT[] NOT NULL DEFAULT '{}', -- Walidacja CORS / Origin
    developer_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Portfele użytkowników (stan zagregowany dla szybkiego odczytu)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_balance_credits INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT positive_balance CHECK (current_balance_credits >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Niezmienna Księga Transakcji (Append-Only Ledger)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL UNIQUE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('TOPUP', 'BONUS', 'ACTION_DEBIT', 'CHAT_DEBIT', 'REFUND')),
    amount_credits INTEGER NOT NULL, -- Dodatnie (+550) lub ujemne (-15)
    project_id UUID REFERENCES projects(id),
    action_name TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_wallet ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_idempotency ON ledger_entries(idempotency_key);
```

### 4.2. Atomowa Blokada Wiersza (Zapobieganie Wyścigom)

Pobranie środków przed wykonaniem akcji realizowane jest w transakcji SQL z blokadą `FOR UPDATE`:
1. Blokujemy portfel: `SELECT current_balance_credits FROM wallets WHERE id = $1 FOR UPDATE`.
2. Jeśli `current_balance_credits < requiredCredits` $\rightarrow$ natychmiastowy ROLLBACK i błąd HTTP 402 `INSUFFICIENT_CREDITS`.
3. Dodajemy wpis do `ledger_entries` z unikalnym `idempotency_key`.
4. Wykonujemy `UPDATE wallets SET current_balance_credits = current_balance_credits - requiredCredits`.
5. COMMIT.

### 4.3. Ekonomia Pakietów Stripe

Aby wyeliminować zjadanie marży przez stałą opłatę Stripe (\$0.30), pakiety doładowań są zdefiniowane następująco:
* **Starter:** \$3.00 $\rightarrow$ 300 ⚡ (1 kredyt = 1.0¢)
* **Popular:** \$5.00 $\rightarrow$ 550 ⚡ (10% bonusu gratis)
* **Power:** \$10.00 $\rightarrow$ 1,200 ⚡ (20% bonusu gratis)

### 4.4. Welcome Bonus (Darmowy Start)
* Nowe konto zweryfikowane przez Google OAuth otrzymuje jednorazowy bonus **+20 darmowych kredytów** (`entry_type = 'BONUS'`).
* Identyfikator Google (`sub`) jest unikalny, co zapobiega wielokrotnemu pobieraniu darmowych kredytów na te same dane.

---

## 5. Silnik Zarządzanych Akcji (Managed Actions Engine)

### 5.1. Definicja Kontraktu Akcji

```typescript
export interface ActionDefinition<TInput = any, TOutput = any> {
  name: string;
  projectId: string;
  model: string;                      // np. "google/gemini-1.5-flash"
  fallbackModel?: string;              // np. "openai/gpt-4o-mini"
  priceCredits: number;               // np. 15
  maxOutputTokens: number;            // np. 2000
  temperature?: number;
  outputFormat: 'text' | 'json';      // Wsparcie dla czystego tekstu lub strukturyzowanego JSON
  
  systemPrompt: string;               // 🔒 Ukryte na serwerze
  userPromptTemplate: string;         // Szablon z interpolacją {{variable}}
  
  inputSchema: z.ZodSchema<TInput>;
  outputSchema?: z.ZodSchema<TOutput>;
  
  rateLimit: {
    maxRequests: number;
    windowSeconds: number;
  };
}
```

### 5.2. Cykl Życia Wywołania Akcji

1. **Weryfikacja Pochodzenia (CORS):** Serwer sprawdza nagłówek `Origin` zapytania z listą `allowed_domains` powiązaną z kluczem publicznym `pk_live_...`.
2. **Walidacja Wejść (Zod):** Serwer waliduje zmienne `inputs`. Przekroczenie limitów znaków lub nieznane pola są odrzucane przed dotknięciem LLM.
3. **Idempotencja:** Jeśli zapytanie z danym `idempotency_key` zostało już przetworzone, Gateway zwraca zapamiętaną odpowiedź bez powtórnego obciążania portfela.
4. **Rezerwacja Salda:** Atomowe zablokowanie i potrącenie kredytów w Ledgerze.
5. **Budowa Promptu i Sanitizacja:** Dane wejściowe są opakowywane w tagi XML (np. `<user_input>...</user_input>`), uniemożliwiając wstrzyknięcie fałszywych instrukcji systemowych.
6. **Wywołanie LLM ze Wsparciem AbortSignal:**
   * W razie rozłączenia klienta (`signal.aborted`), Gateway natychmiast wysyła sygnał anulowania do OpenAI/Gemini i koryguje obciążenie.
   * W razie awarii (kod 500/503 od modelu głównego), system bezbłędnie wykonuje zapytanie na `fallbackModel`.
7. **Zwrot Odpowiedzi:** W postaci zwalidowanego JSON-a lub strumienia Server-Sent Events (SSE).

---

## 6. Klienckie SDK i UI Widżet (Shadow DOM)

### 6.1. Izolacja i Lekkość
* Widżet montowany jest w `document.body` z wykorzystaniem **Shadow DOM** (`mode: 'open'`). Style strony dewelopera (Bootstrap, Tailwind, normalize.css) nie mają wpływu na wygląd widżetu.
* Całkowita waga paczki: `<20 KB` (czysty TypeScript / Web Components bez zewnętrznych ciężkich bibliotek UI).

### 6.2. Maszyna Stanów Widżetu (State Machine)
* **Stan 1 (Auth):** Wyświetlany, gdy brak aktywnej sesji. Duży przycisk *„Kontynuuj z Google”* (pop-up) + dyskretny link *„Użyj kodu e-mail OTP”*. Informacja o +20 darmowych kredytach na start.
* **Stan 2 (Top-Up):** Aktywowany, gdy `saldo < koszt_akcji`. Wybór pakietu \$3 / \$5 / \$10 z natychmiastowym przekierowaniem do Stripe Checkout.
* **Stan 3 (Potwierdzenie):** Krótki komunikat o koszcie (np. *„Ta akcja kosztuje ⚡ 15 kredytów”*) z możliwością zaznaczenia *„Nie pytaj ponownie w tej aplikacji”*.
* **Stan 4 (Portfel / Badge):** Dyskretny pływający komponent lub drawer pokazujący aktualne saldo (`⚡ 340`) oraz historię operacji. Na urządzeniach mobilnych (`<640px`) przyjmuje postać wysuwanej od dołu szuflady (**Bottom Sheet**).

### 6.3. Ciche Logowanie Między Domenami (Cross-Domain Silent SSO)
* **Strategia odporna na blokady ciasteczek 3rd-party (Safari ITP / Chrome Privacy Sandbox):**
  1. Sprawdzenie lokalnego tokena sesji w `localStorage`.
  2. Jeśli brak: próba cichego odczytu sesji przez ukryty `<iframe>` do `auth.platform.com`.
  3. W przypadku zablokowania ciasteczek w iframe: elegancki fallback w modalu do 1-kliknięcia (pop-up z `window.opener.postMessage()`).

### 6.4. API Klienckie i Tryby Pracy

```typescript
// Inicjalizacja z trybem mockowania dla środowiska lokalnego
const ai = createAI({
  project: "pk_live_abc123",
  mock: process.env.NODE_ENV === "development", // 0 kosztów podczas stylowania UI
  theme: "auto",                               // 'auto' | 'dark' | 'light'
  headless: false                              // true wyłącza wstrzykiwanie Shadow DOM
});

// Wywołanie akcji
const { data, creditsUsed } = await ai.action("optimize-resume", {
  inputs: { cvText, jobTitle },
  signal: abortController.signal
});
```

### 6.5. Dedykowane Hooki dla React (`@platform/sdk/react`)

```tsx
import { useAction, useWallet } from "@platform/sdk/react";

function CvOptimizer() {
  const { balance } = useWallet();
  const { execute, data, isPending } = useAction("optimize-resume");

  return (
    <div>
      <p>Twoje saldo: {balance} ⚡</p>
      <button onClick={() => execute({ cvText, jobTitle })} disabled={isPending}>
        {isPending ? "Generowanie..." : "Optymalizuj CV (15 ⚡)"}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

---

## 7. Plan Weryfikacji i Zapobiegania Regresji (Testing Strategy)

1. **Testy Jednostkowe Logiki Biznesowej (Core):**
   * Testy kalkulatora kredytów i formuł walutowych (100% pokrycia).
   * Testy mechanizmu blokad i obliczeń salda w pamięci na sztucznych adapterach (wykonywane w <50 ms w Bun).
2. **Testy Kontraktów API (Shared Zod Schemas):**
   * Weryfikacja zgodności typów między klientem a Gatewayem. Błąd kompilacji TS w razie niezgodności schematów.
3. **Testy Integracyjne Bilingu (Stripe & Ledger):**
   * Replay webhooków Stripe (symulacja potrójnego nadejścia tego samego zdarzenia i test idempotencji).
   * Testy równoległych transakcji (`FOR UPDATE`) w Postgres – weryfikacja, że 10 równoległych zapytań nie doprowadzi do ujemnego salda.
4. **Testy E2E (Aplikacja Demonstracyjna):**
   * Scenariusz pełnego cyklu: Uruchomienie aplikacji demo $\rightarrow$ logowanie $\rightarrow$ odbiór 20 kredytów bonusowych $\rightarrow$ wywołanie akcji $\rightarrow$ odjęcie 15 kredytów $\rightarrow$ doładowanie \$3 $\rightarrow$ weryfikacja nowego salda.
