import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, LogOut, Terminal, UploadCloud, Globe, RefreshCw, 
  CheckCircle2, XCircle, Info, ExternalLink, Calendar, ChevronRight, MessageSquare, GitBranch,
  Trash2, FileText, Layers
} from 'lucide-react';
import YAMLDiff from './YAMLDiff';
import AIAssistantTab from './AIAssistantTab';
import MarkdownRenderer from './MarkdownRenderer';
import { API_BASE_URL } from '../config';

const capitalizeSentences = (text) => {
  if (!text) return '';
  return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
};

export default function Dashboard({ username, onLogout }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [scannerStatus, setScannerStatus] = useState({});
  const [activeScan, setActiveScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, workflows, ai-assistant
  const [expandedFindings, setExpandedFindings] = useState({});
  const [applyingFix, setApplyingFix] = useState(null);
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github_token') || '');

  useEffect(() => {
    setExpandedFindings({});
  }, [activeScan]);

  const toggleExpandFinding = (idx) => {
    setExpandedFindings(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          onLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [onLogout]);

  useEffect(() => {
    fetchHistory();
    fetchScannerStatus();
  }, []);

  const fetchHistory = async (autoSelect = false) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scans/history`, { headers });
      setHistory(response.data);
      if (response.data.length > 0 && (autoSelect || !activeScan)) {
        // Load latest scan automatically
        fetchScanDetail(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchScannerStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scanners/status`);
      setScannerStatus(response.data);
    } catch (err) {
      console.error("Failed to fetch scanner status:", err);
    }
  };

  const fetchScanDetail = async (scanId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scans/${scanId}`, { headers });
      setActiveScan({ ...response.data, id: scanId });
    } catch (err) {
      setError("Failed to load report details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlScan = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError('');
    setStatusMsg('Cloning repository and initializing state graph...');
    
    const statusInterval = setInterval(async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/scans/active-status`);
        if (resp.data.status && resp.data.status !== 'Idle') {
          setStatusMsg(resp.data.status);
        }
      } catch (err) {
        // ignore errors
      }
    }, 1000);

    try {
      await axios.post(`${API_BASE_URL}/api/scan/url`, 
        { repo_url: repoUrl.trim() }, 
        { headers }
      );
      setRepoUrl('');
      await fetchHistory(true);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.response?.data || err.message || "Scanning failed. Ensure the URL is public and valid.";
      setError(typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg));
    } finally {
      clearInterval(statusInterval);
      setLoading(false);
      setStatusMsg('');
    }
  };

  const handleZipScan = async (e) => {
    e.preventDefault();
    if (!zipFile) return;
    setLoading(true);
    setError('');
    setStatusMsg('Extracting ZIP package and executing local linters...');
    const formData = new FormData();
    formData.append('file', zipFile);

    const statusInterval = setInterval(async () => {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/scans/active-status`);
        if (resp.data.status && resp.data.status !== 'Idle') {
          setStatusMsg(resp.data.status);
        }
      } catch (err) {
        // ignore errors
      }
    }, 1000);

    try {
      await axios.post(`${API_BASE_URL}/api/scan/zip`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      setZipFile(null);
      e.target.reset();
      await fetchHistory(true);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.response?.data || err.message || "Scanning ZIP failed. Ensure it is a valid directory structure.";
      setError(typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg));
    } finally {
      clearInterval(statusInterval);
      setLoading(false);
      setStatusMsg('');
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan run?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/scans/${scanId}`, { headers });
      if (activeScan && activeScan.id === scanId) {
        setActiveScan(null);
      }
      fetchHistory(false);
    } catch (err) {
      console.error("Failed to delete scan:", err);
      alert("Failed to delete scan");
    }
  };

  const applySecurityFix = async (originalIndex) => {
    if (!activeScan) return;
    setApplyingFix(originalIndex);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/scans/${activeScan.id}/apply-fix`,
        { 
          finding_index: originalIndex,
          github_token: githubToken || null
        },
        { headers }
      );
      // Merge the database scan ID and info back into the returned LangGraph state object
      const updatedScan = {
        ...activeScan,
        ...response.data,
        health_scores: response.data.health_scores
      };
      setActiveScan(updatedScan);
      
      // Update history list with new score
      setHistory(prev => prev.map(s => 
        s.id === activeScan.id 
          ? { ...s, score: response.data.health_scores.repo_score } 
          : s
      ));
    } catch (err) {
      console.error("Failed to apply security fix:", err);
      alert("Error applying fix: " + (err.response?.data?.detail || err.message));
    } finally {
      setApplyingFix(null);
    }
  };

  // Filter findings by severity
  const filteredFindings = activeScan?.findings?.filter(f => 
    severityFilter === 'All' ? true : f.severity === severityFilter
  ) || [];

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">SecureFlow AI</h1>
              <p className="text-[10px] text-slate-400 mt-1">Logged in as {username}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/40 p-1 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Security Overview
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Vulnerability Audit
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'workflows'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Workflow Optimizer
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'dependencies'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Dependency Audit
            </button>
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'ai-assistant'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Security Assistant
            </button>
          </nav>
        </div>

        <button 
          onClick={onLogout}
          className="px-4 py-2 text-xs bg-slate-900 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-300 rounded-xl flex items-center gap-1.5 transition-all focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Repository Submission & Scanner Configs */}
        <div className="space-y-6 xl:col-span-1 no-print">
          {/* URL Scan Form */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Scan Repository URL
            </h3>
            <form onSubmit={handleUrlScan} className="space-y-3">
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !repoUrl.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Scan URL
              </button>
            </form>
          </div>

          {/* ZIP File Scan Form */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-purple-400" />
              Upload Code ZIP
            </h3>
            <form onSubmit={handleZipScan} className="space-y-3">
              <input
                type="file"
                accept=".zip"
                className="w-full text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-slate-200 file:hover:bg-slate-700"
                onChange={(e) => setZipFile(e.target.files[0])}
              />
              <button
                type="submit"
                disabled={loading || !zipFile}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Scan ZIP Package
              </button>
            </form>
          </div>

          {/* GitHub Auto-Fix Integration Widget */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              GitHub Auto-Fix Integration
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              Provide a Personal Access Token (PAT) to commit patches. Fine-grained tokens require: click <strong>Edit</strong> ➔ <strong>Repository permissions</strong> ➔ enable <strong>Contents (Read/Write)</strong> and <strong>Workflows (Read/Write)</strong>.
            </p>
            <div className="space-y-2.5">
              <input
                type="password"
                placeholder="Enter GitHub Personal Access Token..."
                className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 focus:outline-none"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  localStorage.setItem('github_token', e.target.value);
                }}
              />
              {githubToken && (
                <button
                  onClick={() => {
                    setGithubToken('');
                    localStorage.removeItem('github_token');
                  }}
                  className="w-full text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/30 border border-red-900/35 hover:border-red-900/50 py-1.5 rounded-lg transition-all focus:outline-none cursor-pointer"
                >
                  Clear Token
                </button>
              )}
            </div>
          </div>

          {/* Scanner Host Status Dashboard */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Host CLI Tools Check
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(scannerStatus).map(([scanner, active]) => (
                <div key={scanner} className="bg-slate-950/40 p-2.5 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="font-semibold capitalize text-slate-300">{scanner}</span>
                  {active ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/15">
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/15">
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* History Lists */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Audit Logs
            </h3>
            {loadingHistory ? (
              <p className="text-xs text-slate-500">Loading audit history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No repositories scanned yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map((scan) => (
                  <div
                    key={scan.id}
                    className="w-full bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all group no-print"
                  >
                    <button
                      onClick={() => fetchScanDetail(scan.id)}
                      className="text-left flex-1 min-w-0 focus:outline-none"
                    >
                      <h4 className="text-xs font-bold text-slate-200 truncate pr-2 hover:text-indigo-400 transition-colors">
                        {scan.repo_name}
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(scan.created_at).toLocaleDateString()}
                      </p>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1 items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
                        <span className="font-semibold text-indigo-400">{scan.score}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScan(scan.id);
                        }}
                        className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all focus:outline-none"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Presentation Dashboard */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Scan Loader State */}
          {loading && (
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-semibold text-indigo-300">Scanning in progress</p>
              <p className="text-xs text-slate-400 italic text-center max-w-md">{statusMsg || "Triggering orchestrator pipeline..."}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-2xl p-4">
              {error}
            </div>
          )}

          {/* Active Scan Detail Display */}
          {!loading && activeScan && (
            <div className="space-y-6">
              
              {/* Print-Only Header: Visible only during browser printing */}
              <div className="print-block border-b border-slate-300 pb-4 mb-6">
                <h1 className="text-xl font-bold text-slate-900">SecureFlow AI - DevSecOps Security Audit</h1>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  <strong>Audited Target:</strong> {activeScan.repo_url || activeScan.repo_name}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Report generated on {activeScan.created_at ? new Date(activeScan.created_at).toLocaleString() : new Date().toLocaleString()}
                </p>
              </div>
              
              {/* Premium Printable Header Bar */}
              <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl shadow-lg no-print">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    Security Report: {activeScan.repo_name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generated on {activeScan.created_at ? new Date(activeScan.created_at).toLocaleString() : new Date().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold text-slate-100 rounded-xl flex items-center gap-1.5 transition-all shadow-md focus:outline-none no-print-btn"
                >
                  <FileText className="w-4 h-4" />
                  Save as PDF
                </button>
              </div>

              {activeTab === 'dashboard' && (
                <>
                  {/* Health Score Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Repository score */}
                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-slate-100">{activeScan.health_scores?.repo_score ?? 100}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">Repository Health</h3>
                        <p className="text-xs text-slate-400 mt-1">Consolidated security risk grading</p>
                      </div>
                    </div>

                    {/* Pipeline Score */}
                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
                      <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-slate-100">{activeScan.health_scores?.pipeline_score ?? 100}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">Pipeline Health</h3>
                        <p className="text-xs text-slate-400 mt-1">CI/CD YAML configuration score</p>
                      </div>
                    </div>

                    {/* Total Alerts Count */}
                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">{activeScan.findings?.length ?? 0} Alerts</h3>
                        <p className="text-xs text-slate-400 mt-1">Vulnerabilities detected across manifests</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation & Attack Scenario Section */}
                  {activeScan.risk_assessment && (
                    <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-lg">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-4">
                        AI Threat Scenario Analysis
                      </h3>
                      <MarkdownRenderer content={activeScan.risk_assessment.summary} />
                      {activeScan.risk_assessment.threat_scenario && (
                        <div className="mt-4 bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Attacker Exploitation Model
                          </h4>
                          <MarkdownRenderer content={activeScan.risk_assessment.threat_scenario} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'audit' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Vulnerability Audit Details
                    </h3>
                    <div className="flex gap-2">
                      {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            severityFilter === sev 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SecureFlow Best-Practice Fix Order Banner */}
                  <div className="bg-indigo-950/25 border border-indigo-900/45 rounded-xl p-4.5 mb-5 text-xs text-indigo-200">
                    <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <Info className="w-4 h-4 text-indigo-400" />
                      SecureFlow Guideline: Recommended Order of Fixes
                    </h4>
                    <p className="leading-relaxed mb-2 text-slate-400">
                      To keep your repository clean and ensure all GitHub Actions builds pass:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2 text-slate-300">
                      <li>
                        <strong>Step 1: Codebase Auto-Fixes</strong> — Click <strong>"Apply Auto-Fix"</strong> on the vulnerability cards below to patch security issues in your code files first.
                      </li>
                      <li>
                        <strong>Step 2: Workflow Auto-Deploy</strong> — Go to the <strong>Workflow Optimizer</strong> tab and click <strong>"Auto-Deploy to GitHub"</strong> to add the secure build pipeline.
                      </li>
                      <li>
                        <strong>Step 3: Clean up Old Workflows</strong> — Go to your repository on GitHub and delete any old, unused, or broken YAML files inside <code>.github/workflows/</code> to prevent them from triggering failed checks.
                      </li>
                    </ol>
                  </div>

                  {filteredFindings.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No vulnerabilities found matching filter criteria.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredFindings.map((finding, idx) => (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                            finding.fixed 
                              ? 'bg-emerald-950/10 border border-emerald-500/30' 
                              : 'bg-slate-950/40 border border-slate-850 hover:border-slate-800'
                          }`}
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                finding.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                finding.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                finding.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {finding.severity}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full text-[9px] font-semibold">
                                {finding.tool?.toUpperCase()}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-full text-[9px] font-bold">
                                Line {finding.line ?? 1}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono" title={finding.file}>
                                {finding.file}
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-sm text-slate-200">
                              {finding.type} {finding.cve !== "N/A" && `(${finding.cve})`}
                            </h4>
                            
                            {finding.code_snippet && (
                              <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-300 break-all leading-normal no-print">
                                <span className="text-slate-500 font-sans font-bold block mb-1 uppercase tracking-wider text-[9px]">Affected Code Line:</span>
                                <code>{finding.code_snippet}</code>
                              </div>
                            )}
                            
                            <div className="relative text-sm text-slate-400 leading-relaxed">
                              <div className={`transition-all duration-300 overflow-hidden relative ${
                                expandedFindings[idx] ? 'max-h-none' : 'max-h-24 pb-6'
                              }`}>
                                <MarkdownRenderer 
                                  content={capitalizeSentences(finding.description)} 
                                  className="text-slate-400" 
                                  marginClass="my-0.5" 
                                />
                                {!expandedFindings[idx] && finding.description && finding.description.length > 250 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0b1222] via-[#0b1222]/80 to-transparent pointer-events-none" />
                                )}
                              </div>
                              {finding.description && finding.description.length > 250 && (
                                <button
                                  onClick={() => toggleExpandFinding(idx)}
                                  className="text-indigo-400 hover:text-indigo-300 font-bold text-xs mt-1.5 focus:outline-none transition-colors"
                                >
                                  {expandedFindings[idx] ? 'See Less' : 'See More'}
                                </button>
                              )}
                            </div>
                          </div>

                          {finding.fix_suggestion && (
                            <div className="md:max-w-xs w-full bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs text-indigo-200 shrink-0 flex flex-col justify-between">
                              <div>
                                <span className="font-bold block text-indigo-400 mb-1">Recommendation:</span>
                                <MarkdownRenderer content={capitalizeSentences(finding.fix_suggestion)} className="text-indigo-200" marginClass="my-0.5" />
                              </div>
                              <div className="mt-3 border-t border-slate-800/40 pt-2.5">
                                {finding.fixed ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded-lg text-xs font-bold w-full justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Fix Applied
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const originalIndex = activeScan.findings.findIndex(f => f === finding);
                                      applySecurityFix(originalIndex);
                                    }}
                                    disabled={applyingFix !== null}
                                    className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer focus:outline-none"
                                  >
                                    {applyingFix === activeScan.findings.findIndex(f => f === finding) ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        Applying...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Apply Auto-Fix
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'workflows' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                  <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <GitBranch className="w-5 h-5 text-indigo-400" />
                    AI GitHub Actions Workflow Optimizer
                  </h2>
                  {activeScan?.optimized_workflows && activeScan.optimized_workflows.length > 0 ? (
                    <YAMLDiff 
                      workflowData={activeScan.optimized_workflows[0]} 
                      scanId={activeScan.id}
                      githubToken={githubToken}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                      <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                        <GitBranch className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-200">No Optimized Workflows Available</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                        Please select or run a repository scan first to view and generate secure CI/CD YAML configurations.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai-assistant' && (
                <AIAssistantTab 
                  findingsContext={activeScan?.findings || []} 
                  repoName={activeScan?.repo_name}
                />
              )}

              {activeTab === 'dependencies' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                  <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Software Composition Analysis (SCA) - Dependency Audit
                  </h2>
                  
                  {activeScan?.dependencies && activeScan.dependencies.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/40">
                            <th className="p-3">Package Name</th>
                            <th className="p-3">Ecosystem</th>
                            <th className="p-3">Scanned Version</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3">Advisory / CVE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeScan.dependencies.map((dep, idx) => (
                            <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                              <td className="p-3 font-semibold text-slate-200">{dep.name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  dep.ecosystem === 'npm' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                                }`}>
                                  {dep.ecosystem}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-400">{dep.version}</td>
                              <td className="p-3 text-center">
                                {dep.is_vulnerable ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/30">
                                    <XCircle className="w-3 h-3" />
                                    Vulnerable
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Secure
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-300">
                                {dep.is_vulnerable ? (
                                  <span className="text-red-400 font-mono font-semibold">{dep.cve || 'Alert'}</span>
                                ) : (
                                  <span className="text-slate-500 italic">No vulnerabilities</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                        <Layers className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-200">No Dependency Files Found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                        SecureFlow AI could not locate package manifests (`requirements.txt` or `package.json`) in this scan. Ensure they are present at the root or nested folders.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Null state when no active scan selected */}
          {!loading && !activeScan && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                <Terminal className="w-8 h-8 text-indigo-400/80 animate-pulse" />
              </div>
              <h3 className="font-bold text-lg text-slate-200">Ready to Scan</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2">
                Log into the dashboard, paste a public repository link or upload a directory zip package to initiate the agent security audit loop.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
}
