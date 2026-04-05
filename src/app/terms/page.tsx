export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Terms of Service</h1>
      <div className="prose prose-sm sm:prose-base dark:prose-invert text-[var(--color-text-muted)] space-y-6">
        <p><strong>Last updated:</strong> April 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Caliber platform, including our application, APIs, and associated services, 
            you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, 
            you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">2. Description of Service</h2>
          <p>
            Caliber provides an analytics and monitoring platform tailored for AI agent evaluations. 
            We reserve the right to modify, suspend, or discontinue the service (or any part or content thereof) 
            at any time with or without notice to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">3. Service Limitations and Availability</h2>
          <p>
            Given the experimental nature of Generative AI, our evaluation tools are provided to assist your existing continuous integration processes. 
            Caliber does not guarantee 100% accuracy in detecting PII, toxicity, or hallucinatory behavior. 
            Final responsibility for AI payload outputs rests with the user.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">4. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the security of your account credentials, configuration API keys, and authorization secrets.
            You agree not to use the service for any illegal or unauthorized purpose, nor violate any laws in your jurisdiction 
            while interacting with the Caliber evaluation pipelines.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mt-8 mb-4">5. Limitation of Liability</h2>
          <p>
            In no event shall Caliber, its directors, employees, or agents, be liable for any indirect, incidental, 
            special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from your access to or use of, or inability to access or use the service.
          </p>
        </section>
      </div>
    </div>
  );
}