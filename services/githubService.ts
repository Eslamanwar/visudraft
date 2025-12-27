
export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface DeploymentProgress {
  step: 'idle' | 'auth' | 'repo' | 'upload' | 'pages' | 'complete';
  message: string;
  error?: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

export const getGitHubUser = async (token: string): Promise<GitHubUser> => {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: { Authorization: `token ${token}` },
  });
  if (!response.ok) throw new Error('Invalid GitHub token');
  return response.json();
};

export const deployToGitHub = async (
  token: string,
  repoPath: string,
  content: string,
  onProgress: (progress: DeploymentProgress) => void
) => {
  const [owner, repo] = repoPath.split('/');
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Check if repo exists, if not, create it (simplified for this MVP)
    onProgress({ step: 'repo', message: `Checking repository ${owner}/${repo}...` });
    const repoRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
    
    if (repoRes.status === 404) {
      onProgress({ step: 'repo', message: `Creating repository ${repo}...` });
      const createRes = await fetch(`${GITHUB_API_BASE}/user/repos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: repo, auto_init: true }),
      });
      if (!createRes.ok) throw new Error('Failed to create repository');
      // Wait a moment for GitHub to initialize
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Upload index.html
    onProgress({ step: 'upload', message: 'Uploading index.html...' });
    
    // We need the current SHA if the file exists to update it
    const fileRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/index.html`, { headers });
    let sha: string | undefined;
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      sha = fileData.sha;
    }

    const uploadRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/index.html`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Deploy from VisuDraft',
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
      }),
    });

    if (!uploadRes.ok) throw new Error('Failed to upload index.html');

    // 3. Enable GitHub Pages
    onProgress({ step: 'pages', message: 'Enabling GitHub Pages...' });
    const pagesRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: { branch: 'main', path: '/' }
      }),
    });

    // 409 means already enabled, which is fine
    if (!pagesRes.ok && pagesRes.status !== 409) {
      // Fallback: Check if pages already exists but needs a moment
      const checkPages = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, { headers });
      if (!checkPages.ok) throw new Error('Failed to enable GitHub Pages');
    }

    onProgress({ step: 'complete', message: 'Successfully deployed!' });
  } catch (err: any) {
    onProgress({ step: 'idle', message: '', error: err.message });
  }
};
