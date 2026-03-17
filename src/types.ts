export type Eslabon = 'Finca' | 'Transformación' | 'Transporte' | 'Consumo';

export interface Question {
  eslabon: Eslabon;
  imageDescription: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOption: string;
  explanation: string;
  article: string;
}

export interface AppState {
  view: 'menu' | 'question' | 'feedback';
  currentEslabon: Eslabon | null;
  currentQuestion: Question | null;
  userAnswer: string | null;
  generatedImageUrl: string | null;
  isGeneratingImage: boolean;
  imageSize: '1K' | '2K' | '4K';
}
