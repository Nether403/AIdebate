/**
 * Topic Submission Page
 * Public page for users to submit debate topic suggestions
 *
 * Presentation only (Requirement 7.4): no data/API logic lives here — the page
 * renders through the shared AppShell (no own nav or background, single <h1>,
 * Requirement 2.6 / 9.2), sets the top bar via the SetTopBar bridge (so this
 * stays a server component), and the submission form owns all fetch/submit
 * behaviour unchanged.
 */

import { SetTopBar } from '@/components/layout/SetTopBar';
import { TopicSubmissionForm } from '@/components/topics/TopicSubmissionForm';

export default function SubmitTopicPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <SetTopBar breadcrumb={[{ label: 'Topics', href: '/admin/topics' }, { label: 'Submit' }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Submit a debate topic</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Suggest a balanced debate motion for the workbench. Topics are automatically validated for
          side-balance before approval.
        </p>
      </div>
      <TopicSubmissionForm />
    </div>
  );
}
