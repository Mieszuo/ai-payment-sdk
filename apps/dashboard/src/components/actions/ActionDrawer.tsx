import React, { useState, useMemo } from "react";
import { ActionItem } from "../../types";
import { extractTemplateVariables, calculateMargin, SUPPORTED_MODELS } from "../../lib/parser";
import { X, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, DollarSign } from "lucide-react";

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: Partial<ActionItem>) => Promise<void>;
  initialAction?: ActionItem | null;
}

export const ActionDrawer: React.FC<ActionDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAction
}) => {
  const [actionName, setActionName] = useState(initialAction?.actionName || "");
  const [model, setModel] = useState(initialAction?.model || "gpt-4o-mini");
  const [priceCredits, setPriceCredits] = useState(initialAction?.priceCredits || 15);
  const [maxProviderCostCents, setMaxProviderCostCents] = useState(initialAction?.maxProviderCostCents || 5);
  const [outputFormat, setOutputFormat] = useState<"text" | "json">(initialAction?.outputFormat || "json");
  const [systemPrompt, setSystemPrompt] = useState(initialAction?.systemPrompt || "");
  const [userPromptTemplate, setUserPromptTemplate] = useState(initialAction?.userPromptTemplate || "Input:\n{{input}}");
  const [maxRequests, setMaxRequests] = useState(initialAction?.rateLimit?.maxRequests || 10);
  const [windowSeconds, setWindowSeconds] = useState(initialAction?.rateLimit?.windowSeconds || 60);
  const [schemaText, setSchemaText] = useState(
    initialAction?.outputSchema ? JSON.stringify(initialAction.outputSchema, null, 2) : '{\n  "type": "object",\n  "properties": {\n    "result": { "type": "string" }\n  }\n}'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect template variables
  const detectedVariables = useMemo(() => extractTemplateVariables(userPromptTemplate), [userPromptTemplate]);

  // Calculate gross margin
  const calculatedMargin = useMemo(() => calculateMargin(priceCredits, maxProviderCostCents), [priceCredits, maxProviderCostCents]);

  // Validate JSON schema
  const isSchemaValid = useMemo(() => {
    if (outputFormat !== "json") return true;
    try {
      JSON.parse(schemaText);
      return true;
    } catch {
      return false;
    }
  }, [schemaText, outputFormat]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName.trim()) {
      setError("Action name is required.");
      return;
    }
    if (outputFormat === "json" && !isSchemaValid) {
      setError("Please provide a valid JSON Schema.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        actionName: actionName.trim(),
        model,
        priceCredits: Number(priceCredits),
        maxProviderCostCents: Number(maxProviderCostCents),
        outputFormat,
        systemPrompt,
        userPromptTemplate,
        outputSchema: outputFormat === "json" ? JSON.parse(schemaText) : undefined,
        rateLimit: {
          maxRequests: Number(maxRequests),
          windowSeconds: Number(windowSeconds)
        }
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish action");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModelPricing = SUPPORTED_MODELS.find((m) => m.id === model) || SUPPORTED_MODELS[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 p-6 sm:p-8 flex flex-col h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {initialAction ? `Edit Action: ${initialAction.actionName}` : "Publish New Action Version"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Define prompts, model unit economics, and security parameters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6 flex-1">
          {/* Action Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Action Name (Slug)</label>
            <input
              type="text"
              required
              disabled={!!initialAction}
              placeholder="e.g. optimize-resume"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 mono-code focus:outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          {/* Model Selection & Unit Economics */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">Model & Economics</label>
              <span className="text-[11px] text-zinc-400 font-mono">
                Input: ${selectedModelPricing.inputPerMillion}/1M | Output: ${selectedModelPricing.outputPerMillion}/1M
              </span>
            </div>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider}) — Context {m.contextWindow}
                </option>
              ))}
            </select>

            {/* Price, Cost & Calculated Margin */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Price (Credits)</label>
                <input
                  type="number"
                  min="1"
                  value={priceCredits}
                  onChange={(e) => setPriceCredits(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-amber-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Max Cost (Cents)</label>
                <input
                  type="number"
                  min="1"
                  value={maxProviderCostCents}
                  onChange={(e) => setMaxProviderCostCents(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Margin Guard</label>
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono flex items-center justify-between ${
                  calculatedMargin >= 50
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : calculatedMargin >= 20
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  <span>{calculatedMargin}%</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">System Prompt</label>
            <textarea
              rows={3}
              placeholder="Instructions for the AI model..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* User Prompt Template with Dynamic Variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">User Prompt Template</label>
              <span className="text-[11px] text-zinc-500 font-mono">Use {"{{variableName}}"}</span>
            </div>
            <textarea
              rows={4}
              placeholder="Candidate text: {{cvText}}"
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
            />

            {/* Detected Variables Bar */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-500">Detected parameters:</span>
              {detectedVariables.length === 0 ? (
                <span className="text-[11px] text-zinc-600 italic">None (static template)</span>
              ) : (
                detectedVariables.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-mono font-medium"
                  >
                    {v}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Output Format & Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Output Specification</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    checked={outputFormat === "text"}
                    onChange={() => setOutputFormat("text")}
                    className="text-blue-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>Plain Text</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="outputFormat"
                    checked={outputFormat === "json"}
                    onChange={() => setOutputFormat("json")}
                    className="text-blue-500 bg-zinc-900 border-zinc-700"
                  />
                  <span>Structured JSON</span>
                </label>
              </div>
            </div>

            {outputFormat === "json" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-zinc-400">JSON Schema Definition</span>
                  <span className={`text-[10px] flex items-center gap-1 font-mono ${
                    isSchemaValid ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {isSchemaValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {isSchemaValid ? "Valid JSON Schema" : "Invalid JSON"}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-lg bg-zinc-950 border text-xs text-zinc-200 font-mono focus:outline-none leading-relaxed ${
                    isSchemaValid ? "border-zinc-800 focus:border-blue-500" : "border-rose-500"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Rate Limiting */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Rate Limit (Max Requests)</label>
              <input
                type="number"
                min="1"
                value={maxRequests}
                onChange={(e) => setMaxRequests(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Time Window (Seconds)</label>
              <input
                type="number"
                min="1"
                value={windowSeconds}
                onChange={(e) => setWindowSeconds(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (outputFormat === "json" && !isSchemaValid)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-sm"
            >
              {isSubmitting ? "Publishing Version..." : "Publish Version"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
