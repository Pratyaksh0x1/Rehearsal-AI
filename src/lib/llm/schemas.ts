import { z } from 'zod';

export const TechnicalEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  correctness: z.number().min(0).max(100),
  approach: z.number().min(0).max(100),
  complexityAnalysis: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  feedback: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  passed: z.boolean(),
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

export type TechnicalEvaluation = z.infer<typeof TechnicalEvaluationSchema>;
export type HREvaluation = z.infer<typeof HREvaluationSchema>;
export type ResumeEvaluation = z.infer<typeof ResumeEvaluationSchema>;

