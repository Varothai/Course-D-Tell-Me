import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;

interface TextAnalysisResult {
  isInappropriate: boolean;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  inappropriateWords: string[];
}

// Define inappropriate words lists
const inappropriateWords = {
  th: [
    'ควย', 'เหี้ย', 'สัส', 'ไอ้เหี้ย', 'ไอ้สัส', 'มึง', 'กู', 'เย็ด', 'หี', 'จิ๋ม',
    // Add more Thai inappropriate words
  ],
  en: [
    'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'cunt', 'bastard','asshole',
    // Add more English inappropriate words
  ]
};

const isThai = (text: string): boolean => {
  return /[\u0E00-\u0E7F]/.test(text);
};

// Basic word filter check
const checkInappropriateWords = (text: string): string[] => {
  const foundWords: string[] = [];
  const lowerText = text.toLowerCase();

  // Check Thai words
  inappropriateWords.th.forEach(word => {
    if (text.includes(word)) {
      foundWords.push(word);
    }
  });

  // Check English words
  inappropriateWords.en.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  });

  return foundWords;
};

export const analyzeText = async (text: string): Promise<TextAnalysisResult> => {
  try {
    // First do a basic word filter check
    const foundInappropriateWords = checkInappropriateWords(text);
    
    if (foundInappropriateWords.length > 0) {
      return {
        isInappropriate: true,
        confidence: 1, // High confidence for exact matches
        severity: foundInappropriateWords.length > 2 ? 'high' : 'medium',
        inappropriateWords: foundInappropriateWords
      };
    }

    // If no explicit inappropriate words found, use the transformer model
    // for more nuanced analysis
    const classifier = isThai(text) 
      ? await pipeline('text-classification', 'airesearch/wangchanberta-base-att-spm-uncased')
      : await pipeline('text-classification', 'roberta-base');
    
    const result = await classifier(text, {
      topk: 1
    });

    const prediction = Array.isArray(result) ? result[0] : result;
    const confidence = 'score' in prediction ? prediction.score : 0;
    const label = 'label' in prediction ? prediction.label : '';
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (confidence > 0.8) {
      severity = 'high';
    } else if (confidence > 0.6) {
      severity = 'medium';
    }

    return {
      isInappropriate: label === 'INAPPROPRIATE',
      confidence,
      severity,
      inappropriateWords: []
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    return {
      isInappropriate: false,
      confidence: 0,
      severity: 'low',
      inappropriateWords: []
    };
  }
}; 