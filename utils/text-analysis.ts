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
    // Profanity and vulgar terms
    'ควย', 'เหี้ย', 'สัส', 'ไอ้เหี้ย', 'ไอ้สัส', 'มึง', 'กู', 'เย็ด', 'หี', 'จิ๋ม',
    'กะหรี่', 'โส', 'โสโครก', 'ส้นตีน', 'ควาย', 'ควาย', 'อีเหี้ย', 'อีสัส',
    'อีควาย', 'อีส้น', 'อีโส', 'อีกะหรี่', 'ไอ้ควาย', 'ไอ้ส้น', 'ไอ้โส',
    'ไอ้กะหรี่', 'เย็ดแม่', 'เย็ดพ่อ', 'เย็ดตาย', 'เย็ดหี', 'เย็ดควย', 'แม่ง',
    // Derogatory terms
    'อีสัตว์', 'ไอ้สัตว์', 'อีหมา', 'ไอ้หมา', 'อีหมา', 'ไอ้หมา',
    // Additional vulgar terms
    'จิ๋ม', 'หำ', 'ควย', 'อวัยวะ', 'เพศ', 'เซ็กส์', 'เย็ด', 'มีเซ็กส์',
  ],
  en: [
    // Strong profanity
    'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'cunt', 'bastard', 'asshole',
    'fucking', 'shitting', 'bitching', 'dicking', 'cunting',
    // Variations and compound words
    'motherfucker', 'motherfucking', 'fuckface', 'fuckhead', 'fuckwit', 'fuckoff',
    'shithead', 'shitface', 'shithole', 'shitbag', 'shitstain', 'bullshit',
    'dickhead', 'dickface', 'dickwad', 'dickweed', 'dickbag',
    'asshat', 'asswipe', 'assclown', 'assface', 'assbag', 'assmunch',
    'bitchass', 'bitchface', 'bitchmade', 'bitchslap',
    'cuntface', 'cuntbag', 'cuntrag',
    // Sexual terms
    'cock', 'cockhead', 'cockface', 'cocksucker', 'cockwad',
    'prick', 'prickhead', 'prickface',
    'whore', 'slut', 'slutty', 'whorebag', 'slutbag',
    'nigger', 'nigga', 'niggaz', 'niggas', // Racial slurs
    'retard', 'retarded', 'retardation', // Ableist slurs
    'fag', 'faggot', 'faggy', 'faggots', // Homophobic slurs
    // Mild profanity (context-dependent)
    'damn', 'damned', 'dammit', 'hell', 'crap', 'crapper',
    // Additional offensive terms
    'douche', 'douchebag', 'douchebaggery', 'douchey',
    'scumbag', 'scum', 'scumbucket',
    'dipshit', 'dipstick', 'dipwad',
    'jackass', 'jackoff', 'jerkoff',
    'piss', 'pissed', 'pissing', 'pissedoff',
    'prick', 'prickhead',
    'twat', 'twatface', 'twatwaffle',
    'wanker', 'wank', 'wanking',
    'tosser', 'toss',
    'bellend', 'bellend',
    'arse', 'arsehole', 'arseface', // British variants
    'bloody', 'bloodyhell', // British profanity
    'bugger', 'buggered', 'buggeroff', // British profanity
    // Additional vulgar terms
    'tits', 'boobs', 'boobies', 'titties',
    'cum', 'cumming', 'cumshot',
    'jizz', 'jizzing',
    'orgasm', 'orgasmic',
    'masturbate', 'masturbating', 'masturbation',
    'penis', 'vagina', 'clitoris', // Anatomical terms (context-dependent)
    // Hate speech and slurs
    'kike', 'kyke', // Anti-Semitic slurs
    'chink', 'chinky', // Anti-Asian slurs
    'spic', 'spick', // Anti-Latino slurs
    'wetback', // Anti-Latino slurs
    'towelhead', 'raghead', // Anti-Muslim slurs
    'gook', // Anti-Asian slurs
    'coon', // Racial slurs
    'jap', // Anti-Japanese slurs (context-dependent)
  ]
};

const isThai = (text: string): boolean => {
  return /[\u0E00-\u0E7F]/.test(text);
};

// Normalize text by removing spaces, common special characters, and numbers
const normalizeText = (text: string): string => {
  // Remove all whitespace (including zero-width spaces, non-breaking spaces, etc.)
  // Remove common special characters, numbers, and punctuation
  // Remove zero-width characters that might be used to evade detection
  // Keep Thai and English letters only
  return text
    .replace(/[\s\u200B\u200C\u200D\uFEFF\u00A0\u2000-\u200F\u2028-\u202F]/g, '') // All whitespace and zero-width chars
    .replace(/[\-_\.,!@#$%^&*()\[\]{}+=|\\\/?<>~`"';\:0-9]/g, '') // Special chars and numbers
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, '') // Additional Unicode punctuation
    .toLowerCase();
};

// Check if a word appears as a whole word in text, accounting for spaces and special characters
const fuzzyMatch = (text: string, word: string, isThai: boolean): boolean => {
  const normalizedWord = isThai ? word : word.toLowerCase();
  const cleanedWord = normalizeText(word);
  
  // Step 1: Check for exact whole-word match with word boundaries
  // For English, use word boundaries (\b)
  // For Thai, check that it's not part of a larger Thai word
  if (!isThai) {
    const wordBoundaryRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (wordBoundaryRegex.test(text)) {
      return true;
    }
  } else {
    // For Thai: word is at start/end or surrounded by non-Thai characters
    const thaiWordBoundaryRegex = new RegExp(
      `(^|[^\\u0E00-\\u0E7F])${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\u0E00-\\u0E7F]|$)`,
      'g'
    );
    if (thaiWordBoundaryRegex.test(text)) {
      return true;
    }
  }

  // Step 2: For evasions, normalize the entire text and check with word boundaries
  // This handles cases like "a s s" or "a!s!s" which become "ass"
  const cleanedText = normalizeText(text);
  
  // Find all occurrences of the cleaned word in cleaned text
  let searchIndex = 0;
  const matches: Array<{ start: number; end: number }> = [];
  
  while ((searchIndex = cleanedText.indexOf(cleanedWord, searchIndex)) !== -1) {
    matches.push({
      start: searchIndex,
      end: searchIndex + cleanedWord.length
    });
    searchIndex++;
  }
  
  // For each match, verify it's at word boundaries in the original text
  for (const match of matches) {
    // Find the corresponding positions in original text
    // We need to map from cleaned text indices to original text indices
    let cleanedPos = 0;
    let originalStart = -1;
    let originalEnd = -1;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const shouldKeep = isThai 
        ? /[\u0E00-\u0E7F]/.test(char)
        : /[a-zA-Z]/.test(char);
      
      if (shouldKeep) {
        if (cleanedPos === match.start && originalStart === -1) {
          originalStart = i;
        }
        if (cleanedPos === match.end - 1) {
          originalEnd = i;
          break;
        }
        cleanedPos++;
      }
    }
    
    if (originalStart === -1 || originalEnd === -1) continue;
    
    // Check word boundaries in original text
    const beforeChar = text[originalStart - 1];
    const afterChar = text[originalEnd + 1];
    
    const isAtStart = originalStart === 0;
    const isAtEnd = originalEnd === text.length - 1;
    const hasBoundaryBefore = isAtStart || (isThai ? /[^\u0E00-\u0E7F]/.test(beforeChar) : /[^a-zA-Z0-9]/.test(beforeChar));
    const hasBoundaryAfter = isAtEnd || (isThai ? /[^\u0E00-\u0E7F]/.test(afterChar) : /[^a-zA-Z0-9]/.test(afterChar));
    
    if (hasBoundaryBefore && hasBoundaryAfter) {
      return true;
    }
  }

  // Step 3: Check individual word segments (for cases where word is within a segment with evasions)
  // Split text into word segments (by spaces and punctuation)
  const wordBoundaryPattern = isThai 
    ? /[^\u0E00-\u0E7F]+/g  // Non-Thai characters as separators
    : /[^a-zA-Z0-9]+/g;      // Non-alphanumeric as separators
  
  const segments = text.split(wordBoundaryPattern);
  
  for (const segment of segments) {
    if (!segment) continue;
    
    const cleanedSegment = normalizeText(segment);
    
    // Only check segments that are similar in length to the word
    // This prevents matching "ass" in "classroom" (which is much longer)
    if (cleanedSegment.length === cleanedWord.length) {
      if (cleanedSegment === cleanedWord) {
        return true;
      }
      
      // For Thai, also check Thai-only version
      if (isThai) {
        const thaiOnlySegment = segment.replace(/[^\u0E00-\u0E7F]/g, '');
        const thaiOnlyWord = word.replace(/[^\u0E00-\u0E7F]/g, '');
        if (thaiOnlySegment === thaiOnlyWord) {
          return true;
        }
      }
    }
  }

  return false;
};

// Basic word filter check with improved detection
const checkInappropriateWords = (text: string): string[] => {
  const foundWords: string[] = [];
  const hasThai = isThai(text);

  // Check Thai words
  inappropriateWords.th.forEach(word => {
    if (fuzzyMatch(text, word, true)) {
      foundWords.push(word);
    }
  });

  // Check English words
  inappropriateWords.en.forEach(word => {
    if (fuzzyMatch(text, word, false)) {
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