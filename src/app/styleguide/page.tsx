'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Textarea,
  Select,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Skeleton,
  Spinner,
  EmptyState,
  ErrorState,
  ProgressBar,
  SegmentedControl,
  toast,
} from '@/components/ui';
import { Search, Info, CheckCircle2, ShieldCheck, Flame, Bell } from 'lucide-react';

export default function StyleguidePage() {
  const [segmentedVal, setSegmentedVal] = React.useState('python');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-bg text-text-primary p-6 md:p-12 max-w-6xl mx-auto space-y-12">
        <header className="border-b border-border pb-6">
          <Badge variant="accent" className="mb-2">Dev-Only Reference</Badge>
          <h1 className="text-display">Design System & UI Kit</h1>
          <p className="text-text-muted mt-2 text-body">
            Token-based design system adhering to WCAG AA, dark-first developer aesthetic (Linear / LeetCode / Vercel).
          </p>
        </header>

        {/* 1. TYPOGRAPHY */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">1. Typography & Type Scale</h2>
          <div className="space-y-4 bg-surface p-6 rounded-lg border border-border">
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">Display (48px / 3rem)</p>
              <p className="text-display">Master Your Coding Interviews</p>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">H1 (36px / 2.25rem)</p>
              <h1 className="text-h1">Real-Time Technical Evaluation</h1>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">H2 (30px / 1.875rem)</p>
              <h2 className="text-h2">Interview Tracks & Scoring</h2>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">H3 (24px / 1.5rem)</p>
              <h3 className="text-h3">Problem Statement & Edge Cases</h3>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">H4 (20px / 1.25rem)</p>
              <h4 className="text-h4">Execution Output & Verdict</h4>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">Body (15px / 0.9375rem)</p>
              <p className="text-body text-text-muted">
                Our AI agents evaluate your code correctness, algorithmic efficiency, clean architecture, and verbal English communication.
              </p>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">Small (14px - minimum standard body text)</p>
              <p className="text-small text-text-muted">Constraints: 1 ≤ nums.length ≤ 10^5</p>
            </div>
            <div>
              <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">Caption (12px - minimum caption/metadata)</p>
              <p className="text-caption text-text-subtle">Last evaluated on Nov 9, 2026 • 240 ms runtime</p>
            </div>
          </div>
        </section>

        {/* 2. COLOR TOKENS */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">2. Color Tokens (WCAG AA Compliant)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-bg border border-border">
              <div className="text-xs text-text-subtle mb-1">bg</div>
              <div className="text-sm font-semibold text-text-primary">Background</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-xs text-text-subtle mb-1">surface</div>
              <div className="text-sm font-semibold text-text-primary">Card Surface</div>
            </div>
            <div className="p-4 rounded-lg bg-accent text-accent-foreground">
              <div className="text-xs opacity-80 mb-1">accent (Primary Blue)</div>
              <div className="text-sm font-semibold">Active & Primary</div>
            </div>
            <div className="p-4 rounded-lg bg-success text-success-foreground">
              <div className="text-xs opacity-80 mb-1">success</div>
              <div className="text-sm font-semibold">Passed & Accepted</div>
            </div>
            <div className="p-4 rounded-lg bg-warning text-warning-foreground">
              <div className="text-xs opacity-80 mb-1">warning</div>
              <div className="text-sm font-semibold">Warning & Caution</div>
            </div>
            <div className="p-4 rounded-lg bg-danger text-danger-foreground">
              <div className="text-xs opacity-80 mb-1">danger</div>
              <div className="text-sm font-semibold">Errors & Failures</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-xs text-text-subtle mb-1">text-muted</div>
              <div className="text-sm text-text-muted font-medium">Readable Secondary Text</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="text-xs text-text-subtle mb-1">text-subtle</div>
              <div className="text-sm text-text-subtle font-medium">AA Subtitle Text</div>
            </div>
          </div>
        </section>

        {/* 3. BUTTONS */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">3. Button Variants & States</h2>
          <div className="flex flex-wrap gap-4 items-center bg-surface p-6 rounded-lg border border-border">
            <Button variant="primary" size="md">Primary Button</Button>
            <Button variant="secondary" size="md">Secondary Button</Button>
            <Button variant="outline" size="md">Outline Button</Button>
            <Button variant="ghost" size="md">Ghost Button</Button>
            <Button variant="danger" size="md">Danger Button</Button>
            <Button variant="primary" size="md" isLoading>Loading State</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </section>

        {/* 4. BADGES */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">4. Badges (Status & Tier Progression)</h2>
          <div className="flex flex-wrap gap-2 items-center bg-surface p-6 rounded-lg border border-border">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Accepted</Badge>
            <Badge variant="warning">Caution</Badge>
            <Badge variant="danger">Failed</Badge>
            <Badge variant="rank-bronze">Bronze V</Badge>
            <Badge variant="rank-silver">Silver III</Badge>
            <Badge variant="rank-gold">Gold I</Badge>
            <Badge variant="rank-platinum">Platinum IV</Badge>
            <Badge variant="rank-diamond">Diamond II</Badge>
            <Badge variant="rank-crown">Crown</Badge>
            <Badge variant="rank-conqueror">Conqueror</Badge>
          </div>
        </section>

        {/* 5. INPUTS & CONTROLS */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">5. Form Inputs, Select & Segmented Control</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-lg border border-border">
            <Input label="Candidate Name" placeholder="e.g. Alex Turing" helperText="Your full name as shown on your resume" />
            <Input label="Search Problems" placeholder="Search by title, tag, or company..." leftIcon={<Search className="h-4 w-4" />} />
            <Select
              label="Target Company"
              helperText="Loads company-specific rubric questions"
              options={[
                { value: 'google', label: 'Google' },
                { value: 'meta', label: 'Meta' },
                { value: 'amazon', label: 'Amazon' },
                { value: 'microsoft', label: 'Microsoft' },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Programming Language</label>
              <SegmentedControl
                options={[
                  { value: 'python', label: 'Python' },
                  { value: 'javascript', label: 'JavaScript' },
                  { value: 'cpp', label: 'C++' },
                  { value: 'java', label: 'Java' },
                ]}
                value={segmentedVal}
                onChange={setSegmentedVal}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Notes & Clarifications" placeholder="Ask questions or type architectural thoughts..." />
            </div>
          </div>
        </section>

        {/* 6. RADIX PRIMITIVES: DIALOG & TABS & TOOLTIPS */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">6. Radix Modals, Tabs, Tooltips & Toasts</h2>
          <div className="flex flex-wrap gap-4 items-center bg-surface p-6 rounded-lg border border-border">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Open Accessible Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Interview Submission</DialogTitle>
                  <DialogDescription>
                    Are you ready to submit your solution? Your code will be evaluated by the judge against test cases, and your interviewer will finalize the evaluation.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => { setDialogOpen(false); toast.success('Solution submitted successfully!'); }}>Confirm & Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4 mr-1 text-text-subtle" />
                  Hover for Tooltip
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Keyboard shortcut: Ctrl + Enter to run tests
              </TooltipContent>
            </Tooltip>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Profile updated successfully!')}
            >
              <Bell className="h-4 w-4 mr-1 text-accent" />
              Trigger Toast
            </Button>
          </div>

          <div className="bg-surface p-6 rounded-lg border border-border">
            <Tabs defaultValue="desc">
              <TabsList>
                <TabsTrigger value="desc">Description</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="hints">Hints Used</TabsTrigger>
              </TabsList>
              <TabsContent value="desc" className="p-3 text-sm text-text-muted">
                Detailed problem description with constraints and optimal big-O bounds.
              </TabsContent>
              <TabsContent value="examples" className="p-3 text-sm text-text-muted">
                Pre-computed input/output cases with explanation steps.
              </TabsContent>
              <TabsContent value="hints" className="p-3 text-sm text-text-muted">
                Hints provided by the interviewer during the live session.
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* 7. PROGRESS & FEEDBACK STATES */}
        <section className="space-y-4">
          <h2 className="text-h2 border-b border-border pb-2">7. Progress Bar, Skeletons & Feedback States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-lg border border-border">
            <div className="space-y-4">
              <ProgressBar value={72} label="Rank Progress to Diamond" showValue variant="accent" />
              <ProgressBar value={100} label="Test Cases Passed (12/12)" showValue variant="success" />
              <div className="space-y-2 pt-2">
                <span className="text-xs text-text-subtle font-medium">Skeleton Loading Placeholders</span>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            <div>
              <EmptyState
                icon={<Flame className="h-6 w-6" />}
                title="No interview history yet"
                description="Complete your first technical round or resume review to start earning points."
                action={<Button size="sm">Start Practice Session</Button>}
              />
            </div>
          </div>
        </section>
      </main>
    </TooltipProvider>
  );
}

