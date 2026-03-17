/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Milk, 
  Factory, 
  Truck, 
  UserCheck, 
  ChevronRight, 
  RotateCcw, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { Eslabon, Question, AppState } from './types';

// Extend window for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ESLABONES: { id: Eslabon; title: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'Finca', 
    title: 'Finca (Producción Primaria)', 
    icon: <Milk className="w-6 h-6" />, 
    description: 'Hatos inscritos ante el ICA, ordeño y enfriamiento.' 
  },
  { 
    id: 'Transformación', 
    title: 'Transformación (Plantas)', 
    icon: <Factory className="w-6 h-6" />, 
    description: 'Procesamiento, laboratorios y control de calidad.' 
  },
  { 
    id: 'Transporte', 
    title: 'Transporte y Distribución', 
    icon: <Truck className="w-6 h-6" />, 
    description: 'Cadena de frío y condiciones de transporte.' 
  },
  { 
    id: 'Consumo', 
    title: 'Consumo Final', 
    icon: <UserCheck className="w-6 h-6" />, 
    description: 'Envases, rotulado y almacenamiento final.' 
  },
];

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'menu',
    currentEslabon: null,
    currentQuestion: null,
    userAnswer: null,
    generatedImageUrl: null,
    isGeneratingImage: false,
  });

  const generateQuestion = async (eslabon: Eslabon) => {
    setState(prev => ({ ...prev, view: 'question', currentEslabon: eslabon, currentQuestion: null, generatedImageUrl: null }));
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Genera una pregunta de selección múltiple sobre la trazabilidad de la leche en el eslabón: ${eslabon}, basada estrictamente en el Decreto 616 de 2006 de Colombia. 
      La respuesta debe incluir:
      1. Una descripción detallada de una imagen ilustrativa técnica.
      2. La pregunta.
      3. 4 opciones (A, B, C, D).
      4. La opción correcta.
      5. Una explicación técnica detallada citando el artículo específico del decreto.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imageDescription: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["id", "text"]
              }
            },
            correctOption: { type: Type.STRING },
            explanation: { type: Type.STRING },
            article: { type: Type.STRING }
          },
          required: ["imageDescription", "question", "options", "correctOption", "explanation", "article"]
        }
      }
    });

    try {
      const result = await model;
      const questionData = JSON.parse(result.text) as Question;
      setState(prev => ({ ...prev, currentQuestion: questionData }));
      generateImage(questionData.imageDescription);
    } catch (error) {
      console.error("Error generating question:", error);
    }
  };

  const generateImage = async (description: string) => {
    setState(prev => ({ ...prev, isGeneratingImage: true }));
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Technical illustration for Colombian milk traceability (Decree 616): ${description}. Realistic, professional, educational style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setState(prev => ({ ...prev, generatedImageUrl: imageUrl, isGeneratingImage: false }));
          break;
        }
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      setState(prev => ({ ...prev, isGeneratingImage: false }));
    }
  };

  const handleAnswer = (optionId: string) => {
    setState(prev => ({ ...prev, view: 'feedback', userAnswer: optionId }));
  };

  const resetToMenu = () => {
    setState(prev => ({ ...prev, view: 'menu', currentEslabon: null, currentQuestion: null, userAnswer: null, generatedImageUrl: null }));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-gray-900 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetToMenu}>
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Milk className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold tracking-tight text-lg">Prompt Maestro: Trazabilidad Láctea</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {state.view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-4xl font-light text-gray-900">Sistema Experto en Normatividad Láctea</h2>
                <p className="text-gray-500 text-lg">
                  Evalúa y aprende la trazabilidad de la leche en Colombia basándote en el Decreto 616 de 2006. 
                  Selecciona un eslabón para comenzar la evaluación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ESLABONES.map((eslabon) => (
                  <button
                    key={eslabon.id}
                    onClick={() => generateQuestion(eslabon.id)}
                    className="group bg-white p-8 rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-left flex items-start gap-6"
                  >
                    <div className="bg-gray-50 p-4 rounded-xl group-hover:bg-emerald-50 transition-colors text-gray-600 group-hover:text-emerald-600">
                      {eslabon.icon}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-medium text-gray-900 flex items-center justify-between">
                        {eslabon.title}
                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-gray-500 leading-relaxed">{eslabon.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {state.view === 'question' && (
            <motion.div 
              key="question"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <button 
                onClick={resetToMenu}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al menú
              </button>

              {!state.currentQuestion ? (
                <div className="bg-white p-12 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-gray-500">Generando evaluación técnica...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative group">
                      {state.generatedImageUrl ? (
                        <img 
                          src={state.generatedImageUrl} 
                          alt="Ilustración técnica" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-3">
                          {state.isGeneratingImage ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin" />
                              <p className="text-sm">Generando ilustración técnica ({state.imageSize})...</p>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-12 h-12 opacity-20" />
                              <p className="text-sm">Imagen no disponible</p>
                            </>
                          )}
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider">
                        {state.currentEslabon}
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Pregunta de Evaluación</span>
                        <h3 className="text-2xl font-medium leading-tight text-gray-900">
                          {state.currentQuestion.question}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {state.currentQuestion.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswer(option.id)}
                            className="w-full p-4 text-left border border-black/10 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center gap-4 group"
                          >
                            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-black/5 text-sm font-bold text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                              {option.id}
                            </span>
                            <span className="flex-1 text-gray-700">{option.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {state.view === 'feedback' && state.currentQuestion && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className={`p-8 rounded-2xl border shadow-sm space-y-6 ${
                state.userAnswer === state.currentQuestion.correctOption 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-4">
                  {state.userAnswer === state.currentQuestion.correctOption ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                  )}
                  <div className="space-y-2">
                    <h3 className={`text-2xl font-semibold ${
                      state.userAnswer === state.currentQuestion.correctOption ? 'text-emerald-900' : 'text-red-900'
                    }`}>
                      {state.userAnswer === state.currentQuestion.correctOption ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta'}
                    </h3>
                    <p className={`text-lg ${
                      state.userAnswer === state.currentQuestion.correctOption ? 'text-emerald-800' : 'text-red-800'
                    }`}>
                      {state.userAnswer === state.currentQuestion.correctOption 
                        ? 'Excelente dominio de la normatividad técnica.' 
                        : `La respuesta correcta era la opción ${state.currentQuestion.correctOption}.`}
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 p-6 rounded-xl border border-black/5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                    Sustento Normativo: {state.currentQuestion.article}
                  </div>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{state.currentQuestion.explanation}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={() => generateQuestion(state.currentEslabon!)}
                    className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
                  >
                    Continuar al siguiente paso
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => generateQuestion(state.currentEslabon!)}
                    className="bg-white text-gray-700 border border-black/10 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Repetir sección
                  </button>
                  <button
                    onClick={resetToMenu}
                    className="bg-white text-gray-700 border border-black/10 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Saltar a otro eslabón
                  </button>
                </div>
              </div>

              {state.generatedImageUrl && (
                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                  <img 
                    src={state.generatedImageUrl} 
                    alt="Referencia técnica" 
                    className="w-full rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <p className="mt-3 text-xs text-gray-400 text-center italic">
                    Ilustración técnica generada para el eslabón {state.currentEslabon}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">
            © 2026 Sistema Experto en Normatividad Láctea Colombiana. Basado en el Decreto 616 de 2006.
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <span>Inocuidad</span>
            <span>Trazabilidad</span>
            <span>Calidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
