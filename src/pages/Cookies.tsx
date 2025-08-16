
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p className="leading-relaxed mb-4">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                analyzing how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                  <p className="leading-relaxed mb-2">
                    These cookies are necessary for the website to function properly. They enable core 
                    functionality such as security, network management, and accessibility.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
                  <p className="leading-relaxed mb-2">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously. This helps us improve our service.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Functional Cookies</h3>
                  <p className="leading-relaxed mb-2">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your login details and preferences.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Performance Cookies</h3>
                  <p className="leading-relaxed mb-2">
                    These cookies collect information about how you use our website to help us improve 
                    performance and user experience.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="leading-relaxed mb-4">
                We may use third-party services that place cookies on your device. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Payment processors (for secure transactions)</li>
                <li>Analytics providers (to understand usage patterns)</li>
                <li>Customer support tools (to provide better assistance)</li>
                <li>Social media platforms (for sharing functionality)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
              <p className="leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Browser settings: Most browsers allow you to control cookies through their settings</li>
                <li>Opt-out tools: Use industry opt-out tools for advertising cookies</li>
                <li>Mobile settings: Adjust your mobile device settings for app-related tracking</li>
                <li>Contact us: Reach out if you need help with cookie preferences</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Note: Disabling certain cookies may impact your experience and functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Retention</h2>
              <p className="leading-relaxed mb-4">
                Different cookies have different retention periods:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Session cookies: Deleted when you close your browser</li>
                <li>Persistent cookies: Remain until they expire or you delete them</li>
                <li>Analytics cookies: Typically retained for 2 years</li>
                <li>Functional cookies: Retained based on the specific function</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
              <p className="leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in technology, 
                legislation, or our practices. We will notify you of any significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
              <p className="leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p>Email: menuhubafrica@gmail.com</p>
                <p>Phone: +254 791829358</p>
                <p>Address: Nairobi, Kenya</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cookies;
