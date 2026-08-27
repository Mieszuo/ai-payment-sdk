import { createAI } from "@ai-credits/sdk";

// Initialize AI Client
const ai = createAI({
  project: "pk_live_demo123",
  baseUrl: "http://localhost:3000",
  mock: false
});

// UI Elements
const btn = document.getElementById("optimizeBtn") as HTMLButtonElement;
const input = document.getElementById("cvInput") as HTMLTextAreaElement;
const walletCredits = document.getElementById("walletCredits") as HTMLElement;
const resultContainer = document.getElementById("resultContainer") as HTMLElement;
const ratingBadge = document.getElementById("ratingBadge") as HTMLElement;
const optimizedSummary = document.getElementById("optimizedSummary") as HTMLElement;
const strengthsList = document.getElementById("strengthsList") as HTMLElement;
const recommendationsList = document.getElementById("recommendationsList") as HTMLElement;
const errorContainer = document.getElementById("errorContainer") as HTMLElement;
const errorMessage = document.getElementById("errorMessage") as HTMLElement;
const topupModalBtn = document.getElementById("topupModalBtn") as HTMLButtonElement;
const quickTopupBtn = document.getElementById("quickTopupBtn") as HTMLButtonElement;
const paymentWidget = document.getElementById("paymentWidget") as any;

// Local wallet balance
let localBalance = 20;

async function updateBalance() {
  try {
    const w = await ai.getWallet();
    walletCredits.innerText = String(w.availableCredits);
    localBalance = w.availableCredits;
    paymentWidget?.setBalance(localBalance);
  } catch {
    walletCredits.innerText = String(localBalance);
    paymentWidget?.setBalance(localBalance);
  }
}

updateBalance();

// Handle credit purchase inside the widget modal
paymentWidget?.addEventListener("credit-purchased", (e: any) => {
  localBalance = e.detail.newBalance;
  walletCredits.innerText = String(localBalance);
  errorContainer.style.display = "none";
});

// Open modal on click
topupModalBtn?.addEventListener("click", () => {
  paymentWidget?.setBalance(localBalance);
  paymentWidget?.open();
});

quickTopupBtn?.addEventListener("click", () => {
  paymentWidget?.setBalance(localBalance);
  paymentWidget?.open();
});

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.innerText = "AI analizuje profil...";
  resultContainer.style.display = "none";
  errorContainer.style.display = "none";

  try {
    if (localBalance < 15) {
      paymentWidget?.setBalance(localBalance);
      paymentWidget?.open();
      throw new Error("Niewystarczająca liczba kredytów: dostępne " + localBalance + ", wymagane 15 kredytów. Wybierz pakiet doładowania w oknie.");
    }

    // Call Managed Action: optimize-resume
    const res = await ai.action("optimize-resume", {
      inputs: { cvText: input.value || "Standard CV text" }
    });

    const data = res.output as any;

    // Render structured results
    ratingBadge.innerText = `Ocena profilu: ${data.rating ?? 9.4} / 10`;
    optimizedSummary.innerText = data.optimizedSummary ?? "Wysoko wykwalifikowany inżynier z bogatym doświadczeniem w budowie systemów skalowalnych.";

    strengthsList.innerHTML = (data.strengths ?? [
      "Wyraźne podkreślenie wymiernych rezultatów biznesowych",
      "Doświadczenie w architekturze wysokiej dostępności"
    ]).map((s: string) => `<li>+ ${s}</li>`).join("");

    recommendationsList.innerHTML = (data.recommendations ?? [
      "Warto dodać konkretne metryki dotyczące redukcji opóźnień",
      "Rozwiń opis doświadczenia z chmurą"
    ]).map((r: string) => `<li>* ${r}</li>`).join("");

    resultContainer.style.display = "block";

    // Deduct local balance
    localBalance = Math.max(0, localBalance - 15);
    walletCredits.innerText = String(localBalance);
    paymentWidget?.setBalance(localBalance);
  } catch (err: any) {
    errorContainer.style.display = "block";
    errorMessage.innerText = err.message || "Wystąpił błąd podczas optymalizacji CV.";
  } finally {
    btn.disabled = false;
    btn.innerText = "Optymalizuj CV (15 kredytów)";
  }
});
