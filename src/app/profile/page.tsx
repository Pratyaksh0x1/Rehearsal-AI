'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EvaluationModal } from '@/components/interview/EvaluationModal';
import { RANK_ORDER } from '@/config/ranks';
import { captureEvent } from '@/lib/analytics/posthog';
import {
  FileText,
  Upload,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Calendar,
  Award,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resume re-upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');

  // Report problem state
  const [reportCategory, setReportCategory] = useState('Bug Report');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Report modal view
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Resume Re-upload
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setIsUploadingResume(true);
    setResumeMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const res = await fetch('/api/user/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to replace resume.');

      setResumeMessage('✅ Resume replaced and re-parsed successfully.');
      setResumeFile(null);
      captureEvent('profile_resume_replaced', { wordCount: data.wordCount });
      await fetchProfile();
    } catch (err: any) {
      setResumeMessage(`❌ ${err.message}`);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Handle Problem Report submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setIsSubmittingReport(true);
    setReportSuccess('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: reportCategory,
          description: reportDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report.');

      setReportSuccess('Thank you! Your report has been recorded in the database.');
      setReportDescription('');
      captureEvent('problem_report_submitted', { category: reportCategory });
    } catch (err: any) {
      alert(err.message || 'Error sending report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const profileUser = profile?.user || user;
  const stats = profile?.stats;
  const history = profile?.history || [];

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Profile Header Card */}
        <div className="bg-surface border border-border rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <Image
                src={profileUser?.rankDef?.badgeUrl || '/ranks/bronze.svg'}
                alt={profileUser?.rank || 'Bronze'}
                fill
                className="object-contain drop-shadow"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider mb-2">
                Candidate Profile
              </div>
              <h1 className="text-3xl font-black text-text-primary">
                {profileUser?.username || profileUser?.name || 'Candidate'}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted font-mono mt-1">
                {profileUser?.email || 'candidate@example.com'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border border-border bg-bg-subtle px-5 py-3.5 rounded-2xl">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle block">
                Technical League
              </span>
              <strong className="text-base font-bold text-accent">
                {profileUser?.technicalRank || profileUser?.rank || 'Bronze'}
              </strong>
              <span className="text-[11px] font-mono text-text-muted block">
                {profileUser?.technicalPoints ?? profileUser?.points ?? 0} LP
              </span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle block">
                HR League
              </span>
              <strong className="text-base font-bold text-success">
                {profileUser?.hrRank || 'Bronze'}
              </strong>
              <span className="text-[11px] font-mono text-text-muted block">
                {profileUser?.hrPoints ?? 0} LP
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview & Problem Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Total Interviews & Problems Summary */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <span>Performance Metrics</span>
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-subtle border border-border rounded-xl p-4 text-center">
                <span className="text-xs text-text-muted">Total Interviews Given</span>
                <p className="text-3xl font-black text-text-primary mt-2">
                  {stats?.totalInterviews ?? 0}
                </p>
              </div>
              <div className="bg-bg-subtle border border-border rounded-xl p-4 text-center">
                <span className="text-xs text-text-muted">Problems Solved</span>
                <p className="text-3xl font-black text-accent mt-2">
                  {stats?.totalProblemsSolved ?? 0}
                </p>
              </div>
            </div>

            {/* Breakdown by Rank Tier */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted mb-3">
                Problems Solved by Rank Tier
              </h3>
              <div className="space-y-2">
                {RANK_ORDER.map((tier) => {
                  const count = stats?.problemsByTier?.[tier] ?? 0;
                  return (
                    <div
                      key={tier}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-bg border border-border"
                    >
                      <span className="font-semibold text-text-primary font-mono">{tier}</span>
                      <span className="font-bold text-accent">{count} solved</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Change Resume Section */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              <span>Change Resume</span>
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Re-upload your latest PDF resume. Our parser extracts experience, projects, and keywords to calibrate interview prompts.
            </p>

            <form onSubmit={handleResumeUpload} className="space-y-4">
              <div className="border-2 border-dashed border-border hover:border-accent rounded-xl p-5 text-center transition-colors">
                <input
                  type="file"
                  id="profile-resume"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="profile-resume" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-accent mx-auto mb-2" />
                  <span className="text-xs font-semibold text-text-primary block">
                    {resumeFile ? resumeFile.name : 'Select new PDF resume file'}
                  </span>
                  <span className="text-[11px] text-text-subtle font-mono">Max 5 MB</span>
                </label>
              </div>

              {resumeMessage && (
                <p className="text-xs font-medium text-text-primary">{resumeMessage}</p>
              )}

              <button
                type="submit"
                disabled={!resumeFile || isUploadingResume}
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploadingResume ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Replacing Resume...</span>
                  </>
                ) : (
                  <span>Replace Stored Resume</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Interview History List */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <span>Interview History</span>
          </h2>

          {history.length === 0 ? (
            <p className="text-xs text-text-subtle italic py-6 text-center">
              No interview rounds recorded yet. Complete a technical, HR, or resume review round to see your logs here.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {history.map((int: any) => (
                <div
                  key={int.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-primary">{int.type} Round</span>
                      <span className="text-xs font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded">
                        Score: {int.score}/100
                      </span>
                    </div>
                    <span className="text-xs text-text-subtle font-mono">
                      {new Date(int.startedAt).toLocaleDateString()} at{' '}
                      {new Date(int.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInterview(int);
                      setShowReportModal(true);
                    }}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>View Evaluation Report</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report a Problem Form */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-accent" />
            <span>Report a Problem</span>
          </h2>
          <p className="text-xs text-text-muted">
            Found an issue with voice latency, coding problems, or UI layout? Submit details below directly to our engineering logs.
          </p>

          <form onSubmit={handleReportSubmit} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="report-cat" className="block text-xs font-semibold text-text-muted mb-1">
                Category
              </label>
              <select
                id="report-cat"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="Bug Report">Bug / Platform Defect</option>
                <option value="Voice Quality">Voice / STT / TTS Issue</option>
                <option value="Problem Content">Problem Test Case Error</option>
                <option value="Feature Suggestion">Feature Suggestion</option>
              </select>
            </div>

            <div>
              <label htmlFor="report-desc" className="block text-xs font-semibold text-text-muted mb-1">
                Description
              </label>
              <textarea
                id="report-desc"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what occurred, expected behavior, and browser info..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed resize-y"
              />
            </div>

            {reportSuccess && (
              <p className="text-xs text-success font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {reportSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingReport || !reportDescription.trim()}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Problem Report</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Report Modal */}
      {selectedInterview && (
        <EvaluationModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          type={selectedInterview.type}
          evaluation={selectedInterview.feedbackJson}
        />
      )}

      <Footer />
    </div>
  );
}
