/**
 * Professional conduct & profanity moderation filter.
 * Uses exact word-boundary regex so legitimate code words
 * like 'class', 'pass', 'assess', 'count', 'shift', 'cockpit' are never falsely matched.
 */

const PROFANITY_PATTERNS: RegExp[] = [
  /\b(fuck|fucking|fucker|fucked|f\*ck|fuk)\b/i,
  /\b(shit|bullshit|sh\*t)\b/i,
  /\b(bitch|b*tch)\b/i,
  /\b(asshole|arsehole|dumbass|jackass)\b/i,
  /\b(bastard|motherfucker|mf)\b/i,
  /\b(cunt|dick|cock|pussy)\b/i,
  /\b(chutiya|chutya|madarchod|bhenchod|harami|bhosdike|gandu|saala|kamina)\b/i,
  /\b(nigger|nigga|faggot|retard)\b/i,
  /\b(damn|dammit)\b/i,
];

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  matchedWord?: string;
}

export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text || typeof text !== 'string') {
    return { hasProfanity: false };
  }

  for (const pattern of PROFANITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        hasProfanity: true,
        matchedWord: match[0],
      };
    }
  }

  return { hasProfanity: false };
}

