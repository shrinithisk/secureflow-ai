import React from 'react';
import { Copy, Check } from 'lucide-react';

export default function MarkdownRenderer({ content, className = "text-slate-300", marginClass = "my-2.5", badgeColor = "indigo" }) {
  if (!content) return null;

  let stringContent = "";
  if (typeof content === 'string') {
    stringContent = content;
  } else if (Array.isArray(content)) {
    stringContent = content.map(item => {
      if (typeof item === 'string') return item.trim();
      return JSON.stringify(item);
    }).join('\n\n');
  } else if (typeof content === 'object' && content !== null) {
    const pList = [];
    if (content.overall_security_posture) {
      pList.push(content.overall_security_posture);
    }
    if (Array.isArray(content.key_weaknesses)) {
      pList.push("### Key Weaknesses");
      content.key_weaknesses.forEach(w => {
        if (w.category && w.details) {
          pList.push(`* **${w.category}**: ${w.details}`);
        } else {
          pList.push(`* ${JSON.stringify(w)}`);
        }
      });
    }
    Object.keys(content).forEach(key => {
      if (key !== 'overall_security_posture' && key !== 'key_weaknesses') {
        const val = content[key];
        pList.push(`### ${key.replace(/_/g, ' ').toUpperCase()}`);
        if (Array.isArray(val)) {
          val.forEach(v => pList.push(`* ${typeof v === 'object' ? JSON.stringify(v) : v}`));
        } else if (typeof val === 'object' && val !== null) {
          pList.push(JSON.stringify(val));
        } else {
          pList.push(String(val));
        }
      }
    });
    stringContent = pList.join('\n\n');
  } else {
    stringContent = String(content);
  }

  // Split content into blocks: code blocks and standard text blocks
  const parts = stringContent.split(/(```[\s\S]*?```)/g);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(`copy-btn-${idx}`);
    if (btn) {
      btn.innerHTML = `<span class="text-green-400 flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = `<span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</span>`;
      }, 2000);
    }
  };

  const renderTextWithFormatting = (text) => {
    // Process line by line
    const lines = text.split('\n');
    let inList = false;
    const elements = [];
    let listItems = [];

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className={`list-disc pl-5 ${marginClass} space-y-2 ${className}`}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Headings
      if (trimmed.startsWith('#### ')) {
        flushList(idx);
        elements.push(
          <h5 key={idx} className="text-sm font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2">
            {parseInlineStyles(trimmed.slice(5))}
          </h5>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList(idx);
        elements.push(
          <h4 key={idx} className="text-base font-bold text-slate-100 mt-6 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
            {parseInlineStyles(trimmed.slice(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList(idx);
        elements.push(
          <h3 key={idx} className="text-lg font-bold text-slate-100 mt-8 mb-4 border-b border-slate-800 pb-2">
            {parseInlineStyles(trimmed.slice(3))}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        flushList(idx);
        elements.push(
          <h2 key={idx} className="text-xl font-bold text-slate-100 mt-10 mb-5">
            {parseInlineStyles(trimmed.slice(2))}
          </h2>
        );
      }
      // Horizontal Rules
      else if (trimmed === '---') {
        flushList(idx);
        elements.push(<hr key={idx} className="my-6 border-slate-800" />);
      }
      // Numbered lists
      else if (/^\d+\.\s+/.test(trimmed)) {
        flushList(idx);
        const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
        const isRed = badgeColor === 'red';
        elements.push(
          <div key={idx} className="flex gap-3.5 items-start mt-3.5 first:mt-1">
            <span className={`shrink-0 flex items-center justify-center w-5.5 h-5.5 rounded-lg font-mono font-bold text-[10px] shadow-sm select-none ${
              isRed 
                ? 'bg-red-500/10 border border-red-500/25 text-red-400' 
                : 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
            }`}>
              {String(match[1]).padStart(2, '0')}
            </span>
            <div className={`text-xs leading-relaxed flex-1 mt-0.5 ${className}`}>
              {parseInlineStyles(match[2])}
            </div>
          </div>
        );
      }
      // Bullet lists
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={idx} className={`text-sm leading-relaxed ${className}`}>
            {parseInlineStyles(trimmed.slice(2))}
          </li>
        );
      }
      // Empty lines
      else if (trimmed === '') {
        flushList(idx);
      }
      // Paragraph lines
      else {
        if (inList) {
          // If we were in a list but this line doesn't start with a bullet, it might be a continuation
          listItems.push(
            <div key={idx} className="pl-4 mt-1 text-slate-400 text-[11px] leading-relaxed">
              {parseInlineStyles(trimmed)}
            </div>
          );
        } else {
          elements.push(
            <p key={idx} className={`text-sm leading-relaxed ${className} ${marginClass}`}>
              {parseInlineStyles(trimmed)}
            </p>
          );
        }
      }
    });

    flushList('final');
    return elements;
  };

  const parseInlineStyles = (text) => {
    if (!text) return '';

    // Regex for bold **text**, inline `code`, and markdown links [text](url)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-purple-300 font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[') && part.endsWith(')') && part.includes('](')) {
        const mid = part.indexOf('](');
        const linkText = part.slice(1, mid);
        const linkUrl = part.slice(mid + 2, -1);
        return (
          <a 
            key={idx} 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="markdown-body space-y-2">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code content
          const match = part.match(/^```(\w*)\n([\s\S]*?)```$/);
          const lang = match ? match[1] : '';
          const code = match ? match[2].trim() : part.slice(3, -3).trim();

          return (
            <div key={idx} className="my-4 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner font-mono text-sm">
              <div className="bg-[#121b2e] px-4 py-2 border-b border-slate-850 flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider">{lang || 'code'}</span>
                <button
                  id={`copy-btn-${idx}`}
                  onClick={() => copyToClipboard(code, idx)}
                  className="hover:text-slate-200 transition-colors flex items-center gap-1.5 focus:outline-none"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed font-mono">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          return <React.Fragment key={idx}>{renderTextWithFormatting(part)}</React.Fragment>;
        }
      })}
    </div>
  );
}
