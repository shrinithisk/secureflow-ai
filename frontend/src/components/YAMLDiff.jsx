import React from 'react';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function YAMLDiff({ workflowData }) {
  if (!workflowData) return null;

  const {
    original_filename = "original-pipeline.yml",
    new_filename = "secure-pipeline.yml",
    content = "",
    improvements = [],
  } = workflowData;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('YAML copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = new_filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping" />
            AI GitHub Workflow Engineering
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Optimized pipeline generator & security configurations
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy YAML
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download YAML
          </button>
        </div>
      </div>

      {/* Improvements List */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Optimization Highlights:
        </h4>
        {improvements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl">
            {improvements.map((imp, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <MarkdownRenderer content={imp} className="text-slate-200" marginClass="my-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
            No workflow adjustments needed or secure YAML generated from scratch.
          </p>
        )}
      </div>

      {/* Code Editor Panel */}
      <div className="flex flex-col">
        {/* Generated secure YAML */}
        <div className="bg-green-950/20 border border-green-900/40 rounded-t-xl px-4 py-2 text-xs font-semibold text-green-400 uppercase flex justify-between items-center">
          <span>Secure Workflow ({new_filename})</span>
          <span className="px-2 py-0.5 bg-green-500/20 text-[10px] text-green-300 rounded-full font-sans uppercase">
            Secure
          </span>
        </div>
        <pre className="flex-1 bg-slate-950 p-4 rounded-b-xl border-x border-b border-green-900/20 font-mono text-xs text-slate-200 overflow-auto min-h-[300px] max-h-[550px]">
          <code>{content || "# Scaffolding secure YAML workflow..."}</code>
        </pre>
      </div>
    </div>
  );
}
