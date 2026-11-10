import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Mic, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Rehearsal AI',
  description: 'How Rehearsal AI collects, processes, and protects your resume and voice data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary px-4 py-12 sm:py-16 max-w-4xl mx-auto space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors focus-ring rounded-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="space-y-2 border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          Data & Privacy Commitment
        </div>
        <h1 className="text-h1">Privacy Policy</h1>
        <p className="text-text-muted text-sm">Last updated: November 2026</p>
      </div>

      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section className="space-y-3 bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            1. Overview & Core Principles
          </h2>
          <p>
            Rehearsal AI provides AI-driven technical and behavioral mock interview rehearsals. We believe your interview practice should be private, secure, and fully under your control. We never sell your personal data or train public third-party AI models on your private interview responses.
          </p>
        </section>

        <section className="space-y-3 bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            2. Resume Data & ATS Analysis
          </h2>
          <p>
            When you upload your resume (PDF format), our system extracts the plain text to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Generate personalized technical and behavioral interview questions tailored to your experience.</li>
            <li>Run an applicant-tracking system (ATS) readability assessment to show you formatting recommendations.</li>
          </ul>
          <p>
            Your resume text is encrypted at rest and tied exclusively to your authenticated user account. You can re-upload or overwrite your resume at any time directly from your Profile settings.
          </p>
        </section>

        <section className="space-y-3 bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Mic className="w-4 h-4 text-accent" />
            3. Voice Audio & Speech Processing
          </h2>
          <p>
            During voice-enabled interviews, your browser streams microphone audio to transcribe your speech into text (Speech-to-Text) and generate interviewer voice responses (Text-to-Speech). Audio chunks are processed in real-time in memory and are discarded after transcription. We do not maintain perpetual raw audio recordings of your voice.
          </p>
        </section>

        <section className="space-y-3 bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-accent" />
            4. Data Retention & Right to Deletion
          </h2>
          <p>
            You retain full ownership of your data. You may request complete deletion of your account, interview evaluation history, and uploaded resume by contacting support or submitting a request via your profile problem report form. Upon confirmation, all associated database records are permanently purged within 30 days.
          </p>
        </section>
      </div>
    </main>
  );
}

