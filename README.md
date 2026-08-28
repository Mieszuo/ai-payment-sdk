<div align="center">

# ⚡ AI Payment Platform (`@ai-credits/sdk`)

**Zero API keys. No financial strain. Monetize AI features in 3 lines of code.**

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/Mieszuo/ai-payment-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/runtime-Bun_1.3-black?style=flat-square&logo=bun)](https://bun.sh/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)
[![LLMs.txt](https://img.shields.io/badge/AI_Docs-llms.txt-blueviolet?style=flat-square)](/llms.txt)

<br />

<p align="center">
  <b>The developer-first payment &amp; credit billing engine for AI applications.</b><br />
  Eliminates custom LLM proxy servers, Stripe webhook spaghetti, and user wallet databases.
</p>

</div>

---

## 🌟 Dlaczego AI Payment Platform?

Budowanie płatnych aplikacji AI w 2026 roku powinno zająć jedno popołudnie, a nie miesiąc konfiguracji infrastruktury.

| ❌ Tradycyjne podejście (Stripe + Własny Backend) | ⚡ Z naszym SDK (`@ai-credits/sdk`) |
|---|---|
| **2-4 tygodnie pracy**: pisanie serwerów proxy, webhooków Stripe, bazy portfeli. | **Gotowe w 2 minuty**: instalujesz paczkę, wklejasz klucz i od razu zarabiasz. |
| **Ryzyko wycieku kluczy**: klucze OpenAI/Claude mogą wyciec z frontendu. | **100% bezpieczeństwa**: klucze AI leżą w Gatewayu, frontend ma tylko `pk_live_*`. |
| **Ryzyko strat na tokenach**: długie odpowiedzi użytkowników zjadają marżę. | **Margin Guard**: Gateway automatycznie pilnuje, abyś zawsze zarabiał założoną marżę. |
| **Niska konwersja (Friction)**: każdy nowy user musi podać kartę i zapłacić subskrypcję. | **Universal Wallet**: user z kredytami natychmiast odpala prompt w 1 kliknięcie. |
| **Trudna zmiana modeli**: zmiana z GPT-4 na Claude wymaga refaktoryzacji backendu. | **1-Click Model Switch**: zmieniasz model w Dashboardzie bez ponownego deploymentu aplikacji. |
| **Ręczna księgowość i wypłaty**. | **Automatyczne wypłaty**: zarobiona marża trafia bezpośrednio na Twoje konto bankowe. |

---

## 🏗️ Architektura Zero-Backend

Nasz Gateway przejmuje na siebie całe ryzyko, walidację portfela i komunikację z modelami AI:

```
[ Frontend / Aplikacja Dewelopera ]
        │
        │ 1. aiPay.charge({ userId, credits, prompt })
        ▼
[ AI Payment Gateway ]
        ├── 2. Atomowa blokada kredytów w portfelu usera (2-Phase Locking)
        ├── 3. Margin Guard: weryfikacja czy koszt tokenów nie przewyższa marży
        ├── 4. Bezpieczny routing do wybranego modelu AI:
        │       ├── OpenAI (GPT-4o, o1, o3-mini)
        │       ├── Anthropic Claude (Claude 3.5 Sonnet, Haiku)
        │       ├── Google Gemini (Gemini 2.0 Flash, 1.5 Pro)
        │       └── DeepSeek (V3, R1)
        │
        ▼
[ Wynik dla usera ] + [ Pobranie kredytów ] + [ Czysty zysk na koncie dewelopera ]
```

---

## ⚡ Szybki Start (Quickstart w 3 krokach)

### 1. Instalacja

```bash
# Używając Bun (Zalecane)
bun add @ai-credits/sdk @ai-credits/react

# Lub NPM / PNPM / Yarn
npm install @ai-credits/sdk @ai-credits/react
pnpm add @ai-credits/sdk @ai-credits/react
yarn add @ai-credits/sdk @ai-credits/react
```

### 2. Inicjalizacja z kluczem publicznym

Pobierz klucz `pk_live_*` z naszego Dashboardu i dodaj do pliku `.env`:

```env
VITE_AI_PAY_KEY=pk_live_sec98127391823
# lub w Next.js:
NEXT_PUBLIC_AI_PAY_KEY=pk_live_sec98127391823
```

### 3. Wywołanie w kodzie (React / TypeScript)

```typescript
import { AiPay } from '@ai-credits/sdk';

const aiPay = new AiPay({ apiKey: import.meta.env.VITE_AI_PAY_KEY });

async function handleGenerate(userPrompt: string) {
  try {
    const result = await aiPay.charge({
      userId: currentUser.id,
      credits: 10,
      model: "gpt-4o", // lub claude-3-5-sonnet, deepseek-v3, gemini-2.0-flash
      prompt: userPrompt,
    });

    console.log("Wynik AI:", result.text);
    console.log("Zaktualizowane saldo:", result.remainingBalance);
    return result.text;
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      // User nie ma kredytów – otwieramy gotowy modal doładowania:
      setIsModalOpen(true);
    }
  }
}
```

---

## 🎨 Gotowy Drop-in Modal zakupu kredytów (`@ai-credits/react`)

Wklej gotowy, piękny komponent zakupu kredytów dopasowany do Twojego designu:

```tsx
import React, { useState } from 'react';
import { AICreditsModal } from '@ai-credits/react';

export function MyAwesomeApp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Doładuj kredyty AI
      </button>

      <AICreditsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialBalance={100}
        onCreditPurchased={(credits, price) => {
          console.log(`Zakupiono ${credits} kredytów za $${price}`);
        }}
      />
    </div>
  );
}
```

---

## 🤖 Stworzone dla programowania z Agentami AI (Cursor, Claude Code, ChatGPT, Lovable)

SDK posiada wbudowaną dokumentację maszynową zgodną ze standardem **`llms.txt`**:

- **`/llms.txt`** – skrócona instrukcja API zoptymalizowana pod kontekst modeli LLM.
- **`/llms-full.txt`** – pełna dokumentacja techniczna w jednym pliku tekstowym.
- **`/openapi.json`** – specyfikacja OpenAPI 3.1 dla OpenAI Function Calling, Custom GPTs i serwerów MCP.

### Reguła dla `.cursorrules` / Claude Code:
```markdown
Always initialize AI features using @ai-credits/sdk.
Use public key 'pk_live_*' on frontend and handle 'INSUFFICIENT_CREDITS' with @ai-credits/react modal.
```

---

## 🌐 Tryby Portfela (Universal vs Isolated)

W Dashboardzie jednym przełącznikiem decydujesz o strategii biznesowej:

1. **Universal AI Wallet (Zalecany)**:
   - Użytkownicy korzystają ze wspólnego portfela kredytów we wszystkich aplikacjach sieci.
   - **Maksymalna konwersja**: Użytkownik wchodzący do Twojej aplikacji może od razu generować prompt bez ponownego podawania karty.
2. **Isolated Project Wallet (White-label)**:
   - Kredyty kupione w Twojej aplikacji działają wyłącznie w ramach Twojego `projectId`.

---

## 📦 Struktura Monorepo

```
ai-payment-sdk/
├── packages/
│   ├── sdk/          # Główny klient TypeScript SDK (@ai-credits/sdk)
│   ├── react/        # Komponenty UI, Modale i Logotypy (@ai-credits/react)
│   ├── server/       # Fastify AI Payment Gateway z 2-Phase Locking
│   └── shared/       # Schematy walidacji Zod, ledger i typy
└── apps/
    ├── landing/      # Ciemny, glassmorficzny landing page
    ├── docs/         # Portal dokumentacji deweloperskiej
    ├── dashboard/    # Panel zarządzania kluczami, marżą i promptami
    └── demo/         # Interaktywna aplikacja demonstracyjna
```

---

## 📄 Licencja

Projekt jest wydany na licencji **MIT**. Zobacz plik [LICENSE](LICENSE), aby uzyskać szczegółowe informacje.
