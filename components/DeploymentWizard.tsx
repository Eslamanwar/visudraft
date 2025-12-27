
import React, { useState, useEffect } from 'react';
import { GitHubUser, DeploymentProgress, getGitHubUser, deployToGitHub } from '../services/githubService';

interface DeploymentWizardProps {
  generatedCode: string;
  onDeploySuccess?: (url: string) => void;
}

const DeploymentWizard: React.FC<DeploymentWizardProps> = ({ generatedCode, onDeploySuccess }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repoPath, setRepoPath] = useState('');
  const [progress, setProgress] = useState<DeploymentProgress>({ step: 'idle', message: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Load token from local storage if exists
  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
  }, []);

  // Timer logic for GitHub Pages propagation
  useEffect(() => {
    let interval: number;
    if (progress.step === 'complete' && countdown > 0) {
      interval = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [progress.step, countdown]);

  const verifyToken = async (t: string) => {
    setIsVerifying(true);
    try {
      const u = await getGitHubUser(t);
      setUser(u);
      localStorage.setItem('gh_token', t);
      // Auto-set a default repo name if empty
      if (!repoPath) setRepoPath(`${u.login}/visudraft-site`);
    } catch (e) {
      localStorage.removeItem('gh_token');
      setUser(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeploy = async () => {
    if (!token || !repoPath) return;
    setCountdown(30); // Reset timer for new deployment
    await deployToGitHub(token, repoPath, generatedCode, (p) => {
      setProgress(p);
      if (p.step === 'complete' && onDeploySuccess) {
        onDeploySuccess(getPagesUrl());
      }
    });
  };

  const getPagesUrl = () => {
    if (!repoPath) return '';
    const [owner, repo] = repoPath.split('/');
    return `https://${owner}.github.io/${repo}/`;
  };

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
          <i className="fa-brands fa-github text-3xl"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Connect GitHub</h3>
        <p className="text-sm text-slate-500 mb-8 max-w-xs">
          To deploy directly, you'll need a GitHub Personal Access Token with <code className="bg-slate-100 px-1 rounded text-indigo-600">repo</code> permissions.
        </p>
        
        <div className="w-full space-y-4">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono"
          />
          <button
            onClick={() => verifyToken(token)}
            disabled={isVerifying || !token}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-link"></i>}
            Connect GitHub Account
          </button>
          <a 
            href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=VisuDraft%20Deployment" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline font-medium block"
          >
            Create a token on GitHub →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-slate-200" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deploying as</p>
              <p className="font-bold text-slate-900">@{user.login}</p>
            </div>
          </div>
          <button 
            onClick={() => { setUser(null); localStorage.removeItem('gh_token'); }}
            className="text-xs font-bold text-red-500 hover:text-red-600"
          >
            Disconnect
          </button>
        </div>

        {progress.step === 'idle' || progress.error ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Repository</label>
              <div className="relative">
                <i className="fa-solid fa-folder absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="username/repo-name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                If the repository doesn't exist, we'll try to create it for you.
              </p>
            </div>

            {progress.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <div className="text-xs font-medium">{progress.error}</div>
              </div>
            )}

            <button
              onClick={handleDeploy}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-rocket"></i>
              Deploy to GitHub Pages
            </button>
          </div>
        ) : progress.step === 'complete' ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Finished!</h3>
            <p className="text-sm text-slate-500 mb-8 px-4">
              Your files are on GitHub. We are waiting for GitHub Pages to initialize the hosting.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 break-all font-mono text-xs text-indigo-600">
              {getPagesUrl()}
            </div>

            <div className="flex flex-col gap-3">
              {countdown > 0 ? (
                <button 
                  disabled
                  className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-not-allowed border-2 border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-clock fa-spin"></i>
                    <span>Initializing Hosting...</span>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Ready in {countdown}s</span>
                </button>
              ) : (
                <a 
                  href={getPagesUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all animate-in fade-in zoom-in-95"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  Open Live Site
                </a>
              )}
              
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">
                {countdown > 0 ? "Wait for the server to spin up" : "Site should be ready now"}
              </p>

              <button 
                onClick={() => { setProgress({ step: 'idle', message: '' }); setCountdown(30); }}
                className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors mt-4"
              >
                Back to Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-brands fa-github text-indigo-600"></i>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{progress.message}</p>
            <p className="text-xs text-slate-400">Please don't close this tab...</p>

            <div className="mt-8 w-full space-y-3">
                {[
                  { id: 'repo', label: 'Initialize Repo' },
                  { id: 'upload', label: 'Push index.html' },
                  { id: 'pages', label: 'Enable Pages' }
                ].map((s) => {
                  const steps = ['repo', 'upload', 'pages', 'complete'];
                  const currentIndex = steps.indexOf(progress.step);
                  const stepIndex = steps.indexOf(s.id);
                  const isDone = stepIndex < currentIndex;
                  const isActive = progress.step === s.id;

                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        isDone ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <i className="fa-solid fa-check"></i> : stepIndex + 1}
                      </div>
                      <span className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentWizard;
