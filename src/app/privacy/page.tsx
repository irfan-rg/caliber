export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Privacy Policy</h1>
      <div className="prose prose-sm sm:prose-base dark:prose-invert text-[var(--color-text-muted)] space-y-6">
        <p><strong>Last updated:</strong> April 2026</p>
        
        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you explicitly provide to us when using the Caliber AI Evaluation Platform. 
            This includes evaluation payloads, environment configurations, API keys (securely encrypted), and basic account information necessary for providing the service to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">2. How We Use Information</h2>
          <p>
            Your data is strictly used to provide, maintain, and improve our evaluation and monitoring services. 
            We do not sell your personal data or your proprietary AI evaluation metrics to third parties or external data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">3. Data Security & PII Protection</h2>
          <p>
            Caliber provides advanced features to help identify and track Personally Identifiable Information (PII) regressions in your AI ecosystem. 
            We employ industry-standard security measures, including row-level security (RLS) policies and encrypted transit protocols, to protect your evaluation data from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">4. Roles and Access Control</h2>
          <p>
            You are responsible for managing the permissions granted to users within your organization. 
            Our platform provides role-based access control (Admin/Viewer) to ensure that sensitive configuration data remains isolated and protected against malicious or accidental changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our administrative support team through your dashboard help portal.
          </p>
        </section>
      </div>
    </div>
  );
}