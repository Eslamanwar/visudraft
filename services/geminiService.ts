
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCodeFromSketch = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  
  const systemInstruction = `
    You are an expert senior frontend engineer and UX architect.
    Your task is to convert a hand-drawn UI sketch into clean, production-ready HTML/Tailwind CSS.
    
    SPECIAL CAPABILITY: MULTI-SCREEN & NAVIGATION FLOW
    - Detect multiple screens (e.g., Home, Details, Settings) and arrows indicating transitions.
    - Implement navigation logic using a Single Page Application (SPA) approach (e.g., toggling "hidden" classes on sections).
    - Ensure all buttons and links identified in the sketch are functional.

    CRITICAL: REMOTE AUDIT AGENT
    You MUST include the following script exactly as written at the very end of your <body> tag.

    <style>
      .audit-highlight { 
        outline: 4px solid #6366f1 !important; 
        outline-offset: 2px !important;
        transition: outline 0.2s ease-in-out;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.5) !important;
      }
    </style>
    <script>
      window.addEventListener('message', (event) => {
        const { type, targetSelector, text, actionId } = event.data;
        
        const findElement = (selector, searchText) => {
          if (selector) {
            try {
              const el = document.querySelector(selector);
              if (el) return el;
            } catch(e) {}
          }
          const interactives = Array.from(document.querySelectorAll('button, a, input, label, [role="button"], summary, select, textarea'));
          return interactives.find(el => 
            el.innerText?.toLowerCase().includes((searchText || selector || '').toLowerCase()) ||
            el.placeholder?.toLowerCase().includes((searchText || selector || '').toLowerCase()) ||
            el.name?.toLowerCase().includes((searchText || selector || '').toLowerCase()) ||
            el.getAttribute('aria-label')?.toLowerCase().includes((searchText || selector || '').toLowerCase())
          );
        };

        const element = findElement(targetSelector, text);

        if (type === 'GET_COORDS') {
          const target = element || document.body;
          const rect = target.getBoundingClientRect();
          window.parent.postMessage({ 
            type: 'COORDS_RESPONSE', 
            actionId,
            coords: { 
              x: rect.left + rect.width / 2, 
              y: rect.top + rect.height / 2 
            } 
          }, '*');
          return;
        }

        if (!element) return;

        element.classList.add('audit-highlight');
        setTimeout(() => element.classList.remove('audit-highlight'), 1000);

        if (type === 'CLICK') {
          element.focus();
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
          element.dispatchEvent(clickEvent);
          if (typeof element.click === 'function') element.click();
        } else if (type === 'TYPE') {
          element.focus();
          element.value = text || '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    </script>
  `;

  const prompt = "Please convert this sketch into a production-ready, interactive prototype. Ensure elements are accessible and easy for a script to find. Include the Remote Audit Agent script.";

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image.split(',')[1] 
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { 
      parts: [
        { text: prompt },
        imagePart 
      ] 
    },
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
    }
  });

  const textOutput = response.text || '';
  const codeMatch = textOutput.match(/```html\n?([\s\S]*?)\n?```/) || textOutput.match(/```\n?([\s\S]*?)\n?```/);
  return codeMatch ? codeMatch[1].trim() : textOutput.trim();
};

export const verifyLiveDeployment = async (url: string, code: string): Promise<any> => {
  const ai = getAIClient();
  
  const systemInstruction = `
    You are a Lead QA Automation & Accessibility Engineer.
    Perform a professional-grade multi-layer audit of the provided prototype.

    AUDIT LAYERS:
    1. EXHAUSTIVE FORM TEST: Iterate EVERY input, select, textarea, and button. Do not skip any.
    2. ACCESSIBILITY (A11Y): Check for ARIA labels, semantic roles, tab-order capability, and alt text.
    3. SEMANTIC HTML: Verify use of <header>, <main>, <nav>, <section>, <article>.
    4. UI/UX: Check for logical flow, focus states, and intuitive labeling.
    5. RESPONSIVENESS: Ensure Tailwind classes support mobile-first layouts.

    RESPONSE REQUIREMENTS:
    - 'testSequence': A step-by-step interaction script that covers ALL interactive components.
    - 'checkpoints': Group findings into categories: "Accessibility", "Functional", "Structural", "UI/UX".
    - Each checkpoint MUST have a robust 'details' field explaining WHY it passed or failed and how to improve it.
  `;

  const prompt = `Conduct a rigorous technical audit. Test every interactive element and evaluate accessibility/semantics: \n\n${code}`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          testSequence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "CLICK or TYPE" },
                action: { type: Type.STRING, description: "Label or ID of element" },
                logic: { type: Type.STRING, description: "QA rationale" },
                targetSelector: { type: Type.STRING, description: "Selector" },
                text: { type: Type.STRING, description: "Value to type" },
                status: { type: Type.STRING, description: "Success criteria" }
              },
              required: ["type", "action", "logic", "status", "targetSelector"]
            }
          },
          checkpoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "Accessibility, Functional, Structural, or UI/UX" },
                label: { type: Type.STRING },
                status: { type: Type.STRING },
                passed: { type: Type.BOOLEAN },
                details: { type: Type.STRING, description: "Deep technical findings" }
              },
              required: ["category", "label", "status", "passed", "details"]
            }
          }
        },
        required: ["checkpoints", "testSequence"]
      }
    },
  });

  try {
    return JSON.parse(response.text || '{"checkpoints": [], "testSequence": []}');
  } catch (e) {
    return { checkpoints: [], testSequence: [] };
  }
};

export const fixFindingsFromAudit = async (currentCode: string, failedFindings: string[]): Promise<string> => {
  const ai = getAIClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: `Resolve the following QA/Accessibility findings while preserving the Remote Audit Agent:\n\nFINDINGS:\n${failedFindings.join('\n')}\n\nCURRENT CODE:\n${currentCode}` }] },
    config: {
      systemInstruction: "You are a senior frontend engineer. Fix structural and accessibility issues. Return ONLY the full corrected HTML code in a markdown block.",
      temperature: 0.1,
    }
  });

  const textOutput = response.text || '';
  const codeMatch = textOutput.match(/```html\n?([\s\S]*?)\n?```/) || textOutput.match(/```\n?([\s\S]*?)\n?```/);
  return codeMatch ? codeMatch[1].trim() : textOutput.trim();
};
