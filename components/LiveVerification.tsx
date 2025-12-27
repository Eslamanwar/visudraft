
import React, { useState, useEffect, useRef } from 'react';
import { verifyLiveDeployment, fixFindingsFromAudit } from '../services/geminiService';

interface TestStep {
  type: 'CLICK' | 'TYPE';
  action: string;
  logic: string;
  targetSelector: string;
  text?: string;
  status: string;
}

interface Checkpoint {
  category: string;
  label: string;
  status: string;
  passed: boolean;
  details?: string;
}

interface LiveVerificationProps {
  url: string;
  code: string;
  onCodeUpdated: (newCode: string) => void;
}

const LiveVerification: React.FC<LiveVerificationProps> = ({ url, code, onCodeUpdated }) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [testSequence, setTestSequence] = useState<TestStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const actionResolvers = useRef<Record<string, (coords: {x: number, y: number}) => void>>({});

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [currentStepIndex, testSequence, isSimulationActive]);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'COORDS_RESPONSE') {
        const resolver = actionResolvers.current[event.data.actionId];
        if (resolver) {
          resolver(event.data.coords);
          delete actionResolvers.current[event.data.actionId];
        }
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  const getElementCoords = (selector: string): Promise<{x: number, y: number}> => {
    return new Promise((resolve) => {
      const actionId = Math.random().toString(36).substr(2, 9);
      actionResolvers.current[actionId] = resolve;
      
      const sendRequest = () => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'GET_COORDS',
          targetSelector: selector,
          actionId
        }, '*');
      };

      sendRequest();
      const retry = setTimeout(sendRequest, 300);
      
      const timeout = setTimeout(() => {
        resolve({ x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 });
      }, 1000);

      const originalResolve = resolve;
      resolve = (val) => {
        clearTimeout(retry);
        clearTimeout(timeout);
        originalResolve(val);
      };
    });
  };

  const runAudit = async () => {
    setLoading(true);
    setTestSequence([]);
    setCurrentStepIndex(-1);
    setIsSimulationActive(false);
    setCheckpoints([]);
    setSelectedCheckpoint(null);
    try {
      const result = await verifyLiveDeployment(url, code);
      if (result) {
        setCheckpoints(result.checkpoints);
        setTestSequence(result.testSequence || []);
        if (result.testSequence?.length > 0) {
          await new Promise(r => setTimeout(r, 1000));
          simulateSequence(result.testSequence);
        }
      }
    } catch (e) {
      console.error("Audit failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const simulateSequence = async (steps: TestStep[]) => {
    setIsSimulationActive(true);
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      const step = steps[i];

      const coords = await getElementCoords(step.targetSelector);
      const iframeElement = iframeRef.current;
      if (iframeElement) {
        setCursorPos({
          x: (coords.x / iframeElement.offsetWidth) * 100,
          y: (coords.y / iframeElement.offsetHeight) * 100
        });
      }
      
      await new Promise(r => setTimeout(r, 800));

      if (step.type === 'CLICK') {
        setIsClicking(true);
        iframeRef.current?.contentWindow?.postMessage({
          type: 'CLICK',
          targetSelector: step.targetSelector
        }, '*');
        await new Promise(r => setTimeout(r, 500));
        setIsClicking(false);
      } else if (step.type === 'TYPE') {
        setIsTyping(true);
        const text = step.text || '';
        for (let charIdx = 0; charIdx <= text.length; charIdx++) {
          setTypingText(text.substring(0, charIdx));
          await new Promise(r => setTimeout(r, 30));
        }
        iframeRef.current?.contentWindow?.postMessage({
          type: 'TYPE',
          targetSelector: step.targetSelector,
          text: text
        }, '*');
        await new Promise(r => setTimeout(r, 600));
        setIsTyping(false);
        setTypingText('');
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsSimulationActive(false);
    // Move index to end to clear "Live" badges
    setCurrentStepIndex(steps.length);
  };

  const handleFixAll = async () => {
    const failedOnes = checkpoints.filter(c => !c.passed).map(c => `[${c.category}] ${c.label}: ${c.status}`);
    if (failedOnes.length === 0) return;
    setIsFixing(true);
    try {
      const updatedCode = await fixFindingsFromAudit(code, failedOnes);
      onCodeUpdated(updatedCode);
    } catch (e) {
      console.error("Fix attempt failed:", e);
    } finally {
      setIsFixing(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'accessibility': return 'fa-universal-access';
      case 'functional': return 'fa-vials';
      case 'structural': return 'fa-sitemap';
      case 'ui/ux': return 'fa-wand-magic-sparkles';
      default: return 'fa-clipboard-check';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Simulation Header */}
      <div className="bg-indigo-600 p-3 flex items-center justify-between shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i className={`fa-solid fa-microchip text-white ${isSimulationActive ? 'animate-pulse' : ''}`}></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Professional QA Engine</h3>
            <p className="text-[10px] text-indigo-200 font-bold uppercase">
              {isSimulationActive ? `Layer ${currentStepIndex + 1}/${testSequence.length} Exhaustion` : 'Ready for Multi-Layer Audit'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {checkpoints.length > 0 && (
             <div className="hidden md:flex gap-4 px-4 border-l border-white/20">
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
                  Compliance: <span className="text-white font-bold">{Math.round((checkpoints.filter(c => c.passed).length / checkpoints.length) * 100)}%</span>
                </span>
             </div>
          )}
          <button 
            onClick={runAudit} 
            disabled={loading || isSimulationActive} 
            className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-stethoscope"></i>}
            {loading ? 'Running Audit...' : 'Start Full Audit'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Prototype Display Area */}
        <div className="flex-1 relative bg-slate-100 border-b border-slate-800">
          <div className="h-full relative overflow-hidden shadow-inner">
            {isSimulationActive && (
              <div 
                className="absolute z-[100] pointer-events-none transition-all duration-500 ease-in-out"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="relative">
                   <div className={`relative ${isClicking ? 'scale-75' : 'scale-100'} transition-transform duration-150`}>
                      <i className="fa-solid fa-arrow-pointer text-slate-900 drop-shadow-[0_0_10px_white] text-3xl"></i>
                      {isClicking && <div className="absolute inset-0 bg-indigo-500/50 rounded-full blur-xl animate-ping"></div>}
                   </div>
                   
                   {(isTyping || isClicking) && (
                     <div className="absolute left-10 top-0 bg-slate-900 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap animate-in slide-in-from-left-4">
                        {isTyping ? (
                          <span className="flex items-center gap-3">
                            <i className="fa-solid fa-keyboard text-indigo-400"></i>
                            <span className="text-indigo-200 font-mono tracking-tighter">{typingText}</span>
                            <span className="w-1 h-4 bg-indigo-400 animate-pulse"></span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                             <i className="fa-solid fa-mouse-pointer text-indigo-400"></i>
                             INTERACTING: {testSequence[currentStepIndex]?.action}
                          </span>
                        )}
                     </div>
                   )}
                </div>
              </div>
            )}
            <iframe ref={iframeRef} srcDoc={code} title="Audit Sandbox" className="w-full h-full border-none bg-white" />
          </div>
        </div>

        {/* Audit Controls Dashboard */}
        <div className="h-80 bg-slate-950 flex border-t border-slate-800">
          
          {/* Logic Trace Column */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
            <div className="px-4 py-2 bg-black/40 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <i className="fa-solid fa-scroll text-indigo-500"></i>
                 Interaction Log
              </h4>
              {testSequence.length > 0 && isSimulationActive && (
                <span className="text-[9px] font-mono text-indigo-400">EXECUTING {currentStepIndex + 1} / {testSequence.length}</span>
              )}
            </div>
            
            <div className="flex-1 flex overflow-x-auto p-4 gap-4 scrollbar-thin scrollbar-thumb-slate-700 bg-black/10 items-center">
              {testSequence.length === 0 && !loading && (
                <div className="w-full text-center text-slate-700 text-xs italic font-bold uppercase tracking-tighter">No interaction data available</div>
              )}

              {testSequence.map((step, idx) => {
                const isActive = idx === currentStepIndex && isSimulationActive;
                const isComplete = idx < currentStepIndex || (idx === currentStepIndex && !isSimulationActive);
                if (idx > currentStepIndex && !isSimulationActive && !isComplete) return null;

                return (
                  <div key={idx} className={`flex-shrink-0 w-80 h-full p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${isActive ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl ring-2 ring-indigo-500/20' : 'bg-slate-800/20 border-slate-800/50 opacity-60'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{idx + 1}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.type}</span>
                        </div>
                        {isActive ? <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase animate-pulse">Running</span> : isComplete ? <i className="fa-solid fa-check-double text-green-500 text-xs"></i> : null}
                      </div>
                      <h5 className={`text-[11px] font-bold mb-2 truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{step.action}</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      <span className="text-indigo-400 font-bold uppercase text-[9px] mr-1 italic">Audit Rationale:</span>
                      {step.logic}
                    </p>
                  </div>
                );
              })}
              <div ref={consoleEndRef} className="w-10 flex-shrink-0" />
            </div>
          </div>

          {/* Health Matrix Column */}
          <div className="w-[500px] flex flex-col bg-slate-900 border-l border-slate-800">
            <div className="px-4 py-2 bg-black/40 border-b border-slate-800 flex items-center justify-between">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Health Matrix Summary</h4>
               {selectedCheckpoint && (
                 <button onClick={() => setSelectedCheckpoint(null)} className="text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase flex items-center gap-1">
                   <i className="fa-solid fa-chevron-left"></i> All Checks
                 </button>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedCheckpoint ? (
                <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase mb-3 ${selectedCheckpoint.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <i className={`fa-solid ${selectedCheckpoint.passed ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                    {selectedCheckpoint.passed ? 'Passed Compliance' : 'Structural Failure'}
                  </div>
                  <h5 className="text-white text-sm font-bold mb-1 tracking-tight">{selectedCheckpoint.label}</h5>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-black">{selectedCheckpoint.category}</span>
                    <span className="text-slate-500 text-[10px] italic">Verdict: {selectedCheckpoint.status}</span>
                  </div>
                  
                  <div className="bg-black/50 rounded-2xl p-5 border border-slate-800 shadow-2xl">
                    <h6 className="text-[10px] text-indigo-400 font-black uppercase mb-3 tracking-widest border-b border-slate-800 pb-2">Technical Analysis</h6>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {selectedCheckpoint.details || "Generating deep analysis details..."}
                    </p>
                  </div>
                </div>
              ) : checkpoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 text-center px-12 space-y-4">
                   <i className="fa-solid fa-radar text-4xl mb-2 opacity-10"></i>
                   <p className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed">System ready for professional-grade QA audit sequence.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {checkpoints.map((check, i) => (
                    <button key={i} onClick={() => setSelectedCheckpoint(check)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${check.passed ? 'border-green-500/10 bg-green-500/5 text-green-400/80 hover:bg-green-500/10' : 'border-red-500/10 bg-red-500/5 text-red-400/80 hover:bg-red-500/10'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 border border-slate-800 ${check.passed ? 'text-green-500' : 'text-red-500'}`}>
                           <i className={`fa-solid ${getCategoryIcon(check.category)}`}></i>
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-black uppercase tracking-tight truncate w-full text-left text-[11px]">{check.label}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{check.category}</span>
                        </div>
                      </div>
                      <i className={`fa-solid ${check.passed ? 'fa-check-circle' : 'fa-circle-xmark'} text-lg opacity-40 group-hover:opacity-100 transition-opacity`}></i>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {checkpoints.some(c => !c.passed) && !isSimulationActive && checkpoints.length > 0 && (
               <div className="p-4 bg-black/40 border-t border-slate-800">
                  <button onClick={handleFixAll} disabled={isFixing} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-950 flex items-center justify-center gap-3">
                    {isFixing ? <i className="fa-solid fa-gear fa-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
                    {isFixing ? 'Applying Structural Fixes...' : 'Auto-Resolve Vulnerabilities'}
                  </button>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveVerification;
