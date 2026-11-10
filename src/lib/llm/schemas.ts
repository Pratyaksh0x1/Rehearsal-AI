import { z } from 'zod';

export const TechnicalEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  correctness: z.number().min(0).max(100),
  approach: z.number().min(0).max(100),
  complexityAnalysis: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  englishGrammarFeedback: z.string().default('').describe("Detailed evaluation of candidate's English grammar, spoken fluency, vocabulary, and articulation flow"),
  grammarMistakes: z.array(z.string()).default([]).describe("Specific English grammatical mistakes or awkward phrasings observed in candidate's explanations"),
  pauseAnalysis: z.string().optional().describe("Evaluation of candidate's pauses: how long they paused, whether pauses were thoughtful design contemplation or struggle"),
  selfCorrectionAnalysis: z.string().optional().describe("Detailed observation of where the candidate was initially mistaken in logic/code and subsequently self-corrected"),
  codeStyleFeedback: z.string().optional().describe("Critique of coding style, clean code conventions, variable naming, modularity, and language-specific idioms"),
  screenSwitchingInfractions: z.number().optional().describe("Number of screen switching violations detected"),
  conductNotes: z.string().optional().describe("Professional conduct assessment and whether any inappropriate language was used"),
  feedback: z.string().default(''),
  timeComplexity: z.string().default('Not analysed'),
  spaceComplexity: z.string().default('Not analysed'),
  passed: z.boolean().default(false),
});

export const HREvaluationSchema = z.object({
  communicationScore: z.number().min(0).max(100),
  starStructureScore: z.number().min(0).max(100),
  confidenceClarityScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  overallFeedback: z.string(),
});

export const ResumeEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  accuracyAssessment: z.string().optional().describe("Detailed assessment of whether the candidate's answers were accurate, truthful, and technically sound when questioned on their resume projects"),
  candidateStrengths: z.array(z.string()).optional().describe("Key strengths and deep technical knowledge demonstrated by candidate"),
  resumeImprovements: z.array(z.string()).optional().describe("Concrete recommendations for what the candidate can do to improve their resume based on their answers"),
  sectionWiseNotes: z.object({
    summary: z.string(),
    skills: z.string(),
    projects: z.string(),
    experience: z.string(),
    education: z.string(),
    formattingAts: z.string(),
  }),
  topChanges: z.array(z.string()),
  rewrittenBullets: z.array(
    z.object({
      original: z.string(),
      improved: z.string(),
    })
  ),
});

export const ResumeProfileSchema = z.object({
  fullName: z.string().describe('Name explicitly shown on the resume; empty if absent'),
  headline: z.string().describe('Professional title or headline; empty if absent'),
  summary: z.string().describe('Resume summary/objective; empty if absent'),
  skills: z.array(z.string()).describe('Skills explicitly listed on the resume'),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    dates: z.string(),
    details: z.array(z.string()),
  })),
  projects: z.array(z.object({
    name: z.string(),
    technologies: z.array(z.string()),
    details: z.array(z.string()),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    dates: z.string(),
  })),
  certifications: z.array(z.string()),
});

export const OnboardingResumeEvaluationSchema = ResumeEvaluationSchema.omit({
  rewrittenBullets: true,
}).extend({
  parsedResume: ResumeProfileSchema,
});

export const ExplainerResponseSchema = z.object({
  isCsTopic: z.boolean().describe("Whether the question is directly related to Computer Science, software engineering, or technical interview topics"),
  blackboardTitle: z.string().describe("Concise title of the concept for the blackboard header"),
  spokenExplanation: z.string().describe("Spoken explanation delivered by the voice agent in the user's preferred language. If not a CS topic, this MUST be 'I cannot answer that.'"),
  explanationText: z.string().describe("Comprehensive structured pedagogical explanation on the blackboard in the preferred language. If not a CS topic, this MUST be 'I cannot answer that. I am your Computer Science Concept Explainer and can only assist with CS fundamentals like DSA, OOPs, System Design, Computer Networks, and Architecture.'"),
  diagramType: z.enum(['mermaid', 'ascii', 'none']).describe("Type of diagram to render on the blackboard"),
  diagram: z.string().nullable().optional().describe("Valid Mermaid code (e.g. flowchart TD, graph LR, sequenceDiagram) or ASCII diagram. Null if none or not a CS topic"),
  codeSnippet: z.object({
    language: z.string(),
    code: z.string(),
  }).nullable().optional().describe("Illustrative code or pseudocode block on the blackboard"),
  keyTakeaways: z.array(z.string()).describe("2-4 bullet point key takeaways in the preferred language"),
});

export type TechnicalEvaluation = z.infer<typeof TechnicalEvaluationSchema>;
export type HREvaluation = z.infer<typeof HREvaluationSchema>;
export type ResumeEvaluation = z.infer<typeof ResumeEvaluationSchema>;
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type ExplainerResponse = z.infer<typeof ExplainerResponseSchema>;

export const GreetingResponseSchema = z.object({
  reply: z
    .string()
    .describe(
      "Spoken response to the candidate. Keep it concise (1-3 sentences max), warm, encouraging, and natural for text-to-speech voicing. Never include markdown, asterisks, bullet points, or code."
    ),
  intent: z
    .enum(['has_question', 'ready_to_start', 'other'])
    .describe(
      "Candidate's intent. 'ready_to_start' if the candidate has no questions and is ready to start coding (e.g. 'no questions', 'ready', 'let\\'s go', 'all good', 'start'). 'has_question' if the candidate asks ANY question (e.g. duration, allowed languages, rules, process, whether they can ask questions while coding). 'other' if they are just replying to greeting, expressing feelings, or chatting."
    ),
});

export type GreetingResponse = z.infer<typeof GreetingResponseSchema>;

export const GeneratedProblemSchema = z.object({
  title: z
    .string()
    .min(3)
    .describe("Clear, concise title of the DSA problem without LeetCode problem numbers"),
  // LLMs often answer "easy" / "HARD"; normalise instead of failing the whole generation.
  difficulty: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.enum(['easy', 'medium', 'hard']))
    .transform((value): 'Easy' | 'Medium' | 'Hard' => {
      if (value === 'easy') return 'Easy';
      if (value === 'medium') return 'Medium';
      return 'Hard';
    }),
  topics: z
    .array(z.string())
    .min(1)
    .describe("Relevant DSA topic tags (e.g. Arrays, Two Pointers, Dynamic Programming)"),
  description: z
    .string()
    .min(50)
    .describe(
      "Full problem description in markdown formatting with problem statement, I/O specifications, and optionally a Codeforces-style real-world story"
    ),
  constraints: z
    .array(z.string())
    .min(2)
    .describe(
      "Precise mathematical constraints on inputs (e.g. 1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4)"
    ),
  examples: z
    .array(
      z.object({
        input: z.string().describe("Input representation (e.g. nums = [2, 7, 11, 15], target = 9)"),
        output: z.string().describe("Output representation (e.g. [0, 1])"),
        explanation: z.string().optional().describe("Clear explanation of why this output is produced"),
      })
    )
    .min(1)
    .describe("2 illustrative examples"),
  functionSpec: z.object({
    name: z
      .string()
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      .describe(
        "Function / method name in camelCase (e.g. twoSum, maxSubArray, lengthOfLongestSubstring)"
      ),
    params: z
      .array(
        z.object({
          name: z.string(),
          type: z
            .string()
            .describe(
              "Language-neutral parameter type: int, int[], string, string[], int[][], boolean, etc."
            ),
        })
      )
      .min(1),
    returnType: z
      .string()
      .describe("Language-neutral return type: int, int[], string, string[], boolean, etc."),
  }),
  unorderedOutput: z
    .boolean()
    .optional()
    .default(false)
    .describe("Set true if array output elements can be returned in any order"),
  starterCode: z.object({
    python: z
      .string()
      .min(10)
      .describe("LeetCode-style Solution class in Python with type annotations and pass"),
    javascript: z.string().min(10).describe("Function or Solution class in JavaScript"),
    typescript: z.string().min(10).describe("Typed function or Solution class in TypeScript"),
    cpp: z
      .string()
      .min(10)
      .describe("C++ Solution class with #include headers and vector/string typing"),
    java: z.string().min(10).describe("Java Solution class with typed method"),
  }),
  testCases: z
    .array(
      z.object({
        input: z
          .array(z.any())
          .describe("Ordered array of arguments corresponding exactly to functionSpec.params"),
        expected: z.any().describe("Expected return value matching returnType"),
        hidden: z.boolean().optional().default(false).describe("false for first 3 cases, true for last 2 tricky edge cases"),
      })
    )
    // Accept 5-8 and let the generator trim to exactly 5 (3 visible + 2 hidden).
    .min(5)
    .max(8)
    .describe(
      "Exactly 5 test cases: first 3 visible (hidden: false), last 2 hidden (hidden: true)"
    ),
  referenceSolutionPython: z
    .string()
    .min(20)
    .describe(
      "Working, optimal Python solution implementation of Solution class for sandbox output verification"
    ),
});

export type GeneratedProblem = z.infer<typeof GeneratedProblemSchema>;
