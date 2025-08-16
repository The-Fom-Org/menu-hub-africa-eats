
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Refunds = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
              <p className="leading-relaxed mb-4">
                At MenuHub Africa, we want you to be completely satisfied with our service. This refund 
                policy outlines the circumstances under which refunds may be provided and the process 
                for requesting them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Subscription Refunds</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Free Trial Period</h3>
                  <p className="leading-relaxed mb-2">
                    During your free trial period, you can cancel at any time without charge. No refund 
                    is necessary as no payment has been made.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Monthly Subscriptions</h3>
                  <p className="leading-relaxed mb-2">
                    Monthly subscription fees are generally non-refundable. However, we may provide 
                    pro-rated refunds in exceptional circumstances at our discretion.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Annual Subscriptions</h3>
                  <p className="leading-relaxed mb-2">
                    Annual subscription refunds may be considered within 30 days of initial payment, 
                    provided the service has not been extensively used.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Eligible Refund Scenarios</h2>
              <p className="leading-relaxed mb-4">
                Refunds may be considered in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Technical issues that prevent you from using the service for extended periods</li>
                <li>Billing errors or duplicate charges</li>
                <li>Service downtime exceeding our service level agreement</li>
                <li>Cancellation within 30 days of annual subscription (case-by-case basis)</li>
                <li>Extraordinary circumstances at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Items</h2>
              <p className="leading-relaxed mb-4">
                The following are generally not eligible for refunds:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Setup fees and one-time charges</li>
                <li>Custom development work</li>
                <li>Training and consultation services</li>
                <li>Third-party service fees (payment processing, SMS, etc.)</li>
                <li>Partial month usage after cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Refund Process</h2>
              <p className="leading-relaxed mb-4">
                To request a refund:
              </p>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Contact our support team at menuhubafrica@gmail.com</li>
                <li>Provide your account details and reason for the refund request</li>
                <li>Include any relevant documentation or evidence</li>
                <li>Allow 5-10 business days for review and response</li>
                <li>If approved, refunds will be processed within 14 business days</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Payment Method Refunds</h2>
              <p className="leading-relaxed mb-4">
                Refunds will be processed using the original payment method:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>M-Pesa: Refunded to the original M-Pesa number</li>
                <li>Bank cards: Refunded to the original card (may take 5-10 business days)</li>
                <li>Bank transfers: Refunded to the original bank account</li>
                <li>Other methods: Processed according to the provider's policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cancellation vs. Refund</h2>
              <p className="leading-relaxed mb-4">
                Cancelling your subscription stops future billing but does not automatically entitle 
                you to a refund for the current billing period. You will continue to have access to 
                the service until the end of your current billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Dispute Resolution</h2>
              <p className="leading-relaxed mb-4">
                If you disagree with our refund decision, you may escalate the matter through:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Direct discussion with our management team</li>
                <li>Mediation through relevant consumer protection agencies</li>
                <li>Local jurisdiction dispute resolution processes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
              <p className="leading-relaxed">
                For refund requests or questions about this policy, contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p>Email: menuhubafrica@gmail.com</p>
                <p>Phone: +254 791829358</p>
                <p>Address: Nairobi, Kenya</p>
                <p>WhatsApp: +254 791829358</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Refunds;
