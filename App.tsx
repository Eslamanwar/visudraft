
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import EditorLayout from './components/EditorLayout';
import { AppStatus } from './types';
import { generateCodeFromSketch } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setGeneratedCode('');
      setStatus(AppStatus.IDLE);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!image) return;

    setStatus(AppStatus.LOADING);
    try {
      const code = await generateCodeFromSketch(image);
      setGeneratedCode(code);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error("Failed to generate code:", error);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 bg-slate-50 overflow-hidden">
        <EditorLayout 
          status={status}
          image={image}
          generatedCode={generatedCode}
          onUpload={handleUpload}
          onGenerate={handleGenerate}
          onUpdateCode={setGeneratedCode}
        />
      </main>

      {/* Background decoration elements */}
      <div className="fixed top-20 right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-200/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  );
};

export default App;
