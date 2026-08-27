import { createAI } from "@platform/sdk";

const ai = createAI({
  project: "pk_live_demo123",
  mock: true // Local demo mode
});

const btn = document.getElementById("optimizeBtn") as HTMLButtonElement;
const input = document.getElementById("cvInput") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLPreElement;

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.innerText = "Optymalizuję...";
  try {
    const res = await ai.action("optimize-resume", {
      inputs: { cvText: input.value || "Standard CV text" }
    });
    output.innerText = JSON.stringify(res.output, null, 2);
  } catch (err: any) {
    output.innerText = `Błąd: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerText = "Optymalizuj CV (15 ⚡)";
  }
});
