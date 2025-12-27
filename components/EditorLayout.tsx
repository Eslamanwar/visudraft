
import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, TabType } from '../types';
import DeploymentWizard from './DeploymentWizard';
import LiveVerification from './LiveVerification';

interface EditorLayoutProps {
  status: AppStatus;
  image: string | null;
  generatedCode: string;
  onUpload: (file: File) => void;
  onGenerate: () => void;
  onUpdateCode: (code: string) => void;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ 
  status, 
  image, 
  generatedCode, 
  onUpload, 
  onGenerate,
  onUpdateCode
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const isSuccess = status === AppStatus.SUCCESS;

  const onDeploySuccess = (url: string) => {
    setDeployedUrl(url);
  };

  const handleFixedCode = (newCode: string) => {
    onUpdateCode(newCode);
    setDeployedUrl(null);
    setActiveTab('preview');
  };

  useEffect(() => {
    if (status === AppStatus.LOADING) {
      setDeployedUrl(null);
      if (activeTab === 'verify') setActiveTab('preview');
    }
  }, [status]);

  return (
    <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-6">
        
        {/* Left Panel: Input */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-image text-indigo-500"></i>
              Sketch Source
            </h2>
            {image && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
              >
                Change Sketch
              </button>
            )}
          </div>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`flex-1 rounded-2xl border-2 border-dashed transition-all relative overflow-hidden flex flex-col items-center justify-center p-6
              ${image ? 'border-indigo-100 bg-white' : 'border-slate-300 bg-slate-100 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'}`}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Sketch" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <i className="fa-solid fa-wand-magic text-2xl text-slate-400"></i>
                </div>
                <p className="text-sm font-semibold text-slate-700">Drop a multi-screen sketch</p>
                <p className="text-xs text-slate-500 mt-1 px-4">AI detects arrows & screens to build a flow</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <button
            onClick={onGenerate}
            disabled={!image || status === AppStatus.LOADING}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
              ${!image || status === AppStatus.LOADING 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]'}`}
          >
            {status === AppStatus.LOADING ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Architecting Flow...
              </>
            ) : (
              <>
                <i className="fa-solid fa-route"></i>
                Generate Interactive App
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Output */}
        <div className="flex flex-col gap-4 h-full min-h-[500px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-play text-green-500"></i>
                Live Prototype
              </h2>
            </div>
            <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Preview
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'code' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Code
              </button>
              <button 
                onClick={() => isSuccess && setActiveTab('deploy')}
                disabled={!isSuccess}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'deploy' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : isSuccess 
                      ? 'text-slate-600 hover:text-slate-900' 
                      : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                Deploy
              </button>
              {deployedUrl && (
                <button 
                  onClick={() => setActiveTab('verify')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'verify' 
                      ? 'bg-white text-green-600 shadow-sm border border-green-100' 
                      : 'text-green-600 hover:text-green-700 bg-green-50'
                  }`}
                >
                  <i className="fa-solid fa-clipboard-check text-[10px]"></i>
                  Audit
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
            {status === AppStatus.IDLE && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <i className="fa-solid fa-code-fork text-4xl mb-4 opacity-20"></i>
                <p className="text-sm font-medium">Interactive flow will appear here</p>
                <p className="text-xs mt-1">Upload a storyboard or sketch with arrows to see magic</p>
              </div>
            )}

            {status === AppStatus.LOADING && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-6">
                   <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <i className="fa-solid fa-diagram-project text-indigo-600 animate-pulse"></i>
                   </div>
                </div>
                <p className="text-sm font-bold text-slate-700">Identifying Navigation Steps...</p>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  Gemini Vision is analyzing screen transitions, button labels, and arrows to create a functional flow.
                </p>
              </div>
            )}

            {status === AppStatus.SUCCESS && (
              <>
                {activeTab === 'preview' && (
                  <div className="flex flex-col h-full">
                    <div className="bg-indigo-50/30 px-4 py-1.5 border-b border-indigo-100 text-[10px] text-indigo-600 font-bold flex items-center gap-2">
                       <i className="fa-solid fa-circle-info"></i>
                       TIP: Click buttons in the preview to test the navigation flow.
                    </div>
                    <iframe 
                      title="Live Preview"
                      srcDoc={generatedCode}
                      className="w-full h-full border-none bg-white"
                    />
                  </div>
                )}
                {activeTab === 'code' && (
                  <div className="flex-1 overflow-auto p-4 bg-slate-900">
                    <pre className="text-sm font-mono text-indigo-300">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                )}
                {activeTab === 'deploy' && (
                  <DeploymentWizard 
                    generatedCode={generatedCode} 
                    onDeploySuccess={onDeploySuccess} 
                  />
                )}
                {activeTab === 'verify' && deployedUrl && (
                  <LiveVerification 
                    url={deployedUrl} 
                    code={generatedCode} 
                    onCodeUpdated={handleFixedCode}
                  />
                )}
                
                {activeTab !== 'deploy' && activeTab !== 'verify' && (
                  <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end gap-3">
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white transition-all"
                    >
                      <i className="fa-solid fa-copy"></i>
                      Copy Code
                    </button>
                    <button 
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-all"
                    >
                      <i className="fa-solid fa-download"></i>
                      Download HTML
                    </button>
                  </div>
                )}
              </>
            )}

            {status === AppStatus.ERROR && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-red-500">
                <i className="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
                <p className="text-sm font-bold">Failed to Trace Flow</p>
                <p className="text-xs mt-2 text-slate-500">The sketch might be too complex or the API is unavailable.</p>
                <button 
                  onClick={onGenerate}
                  className="mt-6 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                >
                  Retry Generation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
