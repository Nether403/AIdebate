/**
 * Topic Submission Page
 * Public page for users to submit debate topic suggestions
 */

import { TopicSubmissionForm } from '@/components/topics/TopicSubmissionForm';

export default function SubmitTopicPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <TopicSubmissionForm />
    </div>
  );
}
