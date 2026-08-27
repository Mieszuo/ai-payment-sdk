import React, { useState, useMemo, useEffect } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { extractTemplateVariables } from "../../lib/parser";
import { validateDryRun, DryRunValidator } from "../playground/DryRunValidator";
import { ExecutionResult } from "../../types";
import {
  Terminal,
  Play,
  Clock,
  Zap,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Cpu
} from "lucide-react";

export const PlaygroundView: React.FC = () => {
  const { actions, activeProject, api, selectedActionName: contextActionName, setSelectedActionName: setContextActionName } = useDashboard();
  const [selectedActionName, setSelectedActionNameState] = useState<string>(
    contextActionName || actions[0]?.actionName || "optimize-resume"
  );
  const [executionMode, setExecutionMode] = useState<"Mock" | "Live">("Mock");
  const [inputs, setInputs] = useState<Record<string, string>>({
    cvText: "Senior Software Engineer with 6 years experience in distributed systems and microservices architecture.",
    targetRole: "Staff Distributed Systems Engineer"
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    if (contextActionName && contextActionName !== selectedActionName) {
      setSelectedActionNameState(contextActionName);
    }
  }, [contextActionName]);

  const currentAction = actions.find((a) => a.actionName === selectedActionName) || actions[0];

  const requiredVariables = useMemo(() => {
    return currentAction ? extractTemplateVariables(currentAction.userPromptTemplate) : [];
  }, [currentAction]);

  useEffect(() => {
    if (requiredVariables.length > 0) {
      setInputs((prev) => {
        const next: Record<string, string> = { ...prev };
        for (const v of requiredVariables) {
          if (!next[v]) {
            next[v] = v.toLowerCase().includes("cv") || v.toLowerCase().includes("doc")
              ? "Sample input text for evaluation"
              : `Sample ${v}`;
          }
        }
        return next;
      });
    }
  }, [currentAction]);

  const setSelectedActionName = (name: string) => {
    setSelectedActionNameState(name);
    setContextActionName?.(name);
  };

  const dryRunResult = useMemo(() => {
    return validateDryRun({
      requiredVars: requiredVariables,
      inputs,
      outputFormat: currentAction?.outputFormat
    });
  }, [requiredVariables, inputs, currentAction]);

  const handleInputChange = (key: string, val: string) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleExecute = async () => {
    if (!currentAction) return;
    setIsExecuting(true);
    try {
      const res = await api.executeAction({
        projectId: activeProject.projectId,
        actionName: currentAction.actionName,
        inputs,
        mode: executionMode
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        runId: `err_${Date.now()}`,
        status: "FAILED",
        output: null,
        durationMs: 0,
        costCents: 0,
        promptHash: "0000000000000000",
        inputHash: "0000000000000000",
        error: err.message || "Execution error"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResponse = async () => {
    if (!result?.output) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(JSON.stringify(result.output, null, 2));
      }
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    } catch {
      setCopiedResponse(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Action Playground</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Interactive testbench for dry-run schema validation and real model execution.
        </p>
      </div>

      {/* Split Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Config & Inputs (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-5">
          {/* Action Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Select Action</label>
            <select
              value={selectedActionName}
              onChange={(e) => setSelectedActionName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 mono-code focus:outline-none focus:border-blue-500"
            >
              {actions.map((a) => (
                <option key={a.actionName} value={a.actionName}>
                  {a.actionName} (v{a.version} • {a.priceCredits} credits)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher: Mock vs Live */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Execution Mode</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setExecutionMode("Mock")}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                  executionMode === "Mock"
                    ? "bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Mock (Zero Cost)
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode("Live")}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                  executionMode === "Live"
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Live (Real Provider)
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {executionMode === "Mock"
                ? "Simulates responses instantaneously with zero provider cost and zero credits consumed."
                : `Invokes live ${currentAction?.model || "model"} using developer test credits.`}
            </p>
          </div>

          {/* Dynamic Variable Inputs */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-semibold text-zinc-300 block">Template Input Parameters</span>
            {requiredVariables.length === 0 ? (
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-500 italic">
                No variables detected in template.
              </div>
            ) : (
              requiredVariables.map((varName) => (
                <div key={varName}>
                  <label className="block text-[11px] font-mono text-blue-300 mb-1">
                    {"{{" + varName + "}}"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`Enter value for ${varName}...`}
                    value={inputs[varName] || ""}
                    onChange={(e) => handleInputChange(varName, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 resize-y"
                  />
                </div>
              ))
            )}
          </div>

          {/* Dry Run Checklist */}
          <DryRunValidator result={dryRunResult} />

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting || !dryRunResult.isValid}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Play className={`w-4 h-4 fill-white ${isExecuting ? "animate-pulse" : ""}`} />
            <span>{isExecuting ? "Executing Model..." : "Execute Action"}</span>
          </button>
        </div>

        {/* Right Pane: Response & Telemetry (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 flex flex-col min-h-[520px]">
          {/* Response Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">Execution Response</span>
              {result && (
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-medium ${
                    result.status === "SUCCEEDED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {result.status}
                </span>
              )}
            </div>

            {result?.output && (
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copiedResponse ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Telemetry Bar */}
          {result && result.status === "SUCCEEDED" && (
            <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono">
              <div>
                <span className="text-zinc-500 block text-[10px]">Latency</span>
                <span className="text-zinc-200 font-semibold">{result.durationMs}ms</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Tokens</span>
                <span className="text-zinc-200 font-semibold">{result.tokens?.totalTokens || 500}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Cost</span>
                <span className="text-emerald-400 font-semibold">
                  {result.costCents === 0 ? "Free (Mock)" : `$${(result.costCents / 100).toFixed(4)}`}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Run ID</span>
                <span className="text-blue-400 font-semibold truncate block">{result.runId}</span>
              </div>
            </div>
          )}

          {/* Response Body */}
          <div className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 overflow-auto font-mono text-xs text-zinc-300 leading-relaxed">
            {isExecuting ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                <span className="animate-pulse">Waiting for model stream...</span>
              </div>
            ) : result?.error ? (
              <div className="text-rose-400 p-2">
                <p className="font-semibold mb-1">Execution Error:</p>
                <p>{result.error}</p>
              </div>
            ) : result?.output ? (
              <pre className="text-zinc-200 select-all whitespace-pre-wrap">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                <Cpu className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">Select an action, fill parameters, and click Execute to test response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
