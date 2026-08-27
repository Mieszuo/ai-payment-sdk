import { createAI } from "@platform/sdk";

// Initialize AI Client
// By default, points to local gateway if available, with smooth fallback
const ai = createAI({
  project: "pk_live_demo123",
  baseUrl: "http://localhost:3000",
  mock: false // Will connect to local gateway on :3000
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

// Mock local balance if running without full backend session
let localBalance = 20;

async function updateBalance() {
  try {
    const w = await ai.getWallet();
    walletCredits.innerText = String(w.availableCredits);
    localBalance = w.availableCredits;
  } catch {
    // If not authenticated yet, display local wallet balance
    walletCredits.innerText = String(localBalance);
  }
}

updateBalance();

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.innerText = "AI analizuje profil...";
  resultContainer.style.display = "none";
  errorContainer.style.display = "none";

  try {
    if (localBalance < 15) {
      throw new Error("Niewystarczająca liczba kredytów: dostępne " + localBalance + ", wymagane 15 kredytów");
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
  } catch (err: any) {
    errorContainer.style.display = "block";
    errorMessage.innerText = err.message || "Wystąpił błąd podczas optymalizacji CV.";
  } finally {
    btn.disabled = false;
    btn.innerText = "Optymalizuj CV (15 kredytów)";
  }
});

function handleTopup() {
  localBalance += 550;
  walletCredits.innerText = String(localBalance);
  errorContainer.style.display = "none";
  alert("Doładowano portfel o 550 kredytów (Pakiet Popular $5.00). Nowe saldo: " + localBalance + " kredytów");
}

topupModalBtn?.addEventListener("click", handleTopup);
quickTopupBtn?.addEventListener("click", handleTopup);
