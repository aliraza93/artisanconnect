import { Layout } from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Building2, Mail, Users, Eye, Lock, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function About() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['about', 'privacy', 'terms'].includes(tab)) {
      setActiveTab(tab);
    } else if (location === '/privacy') {
      setActiveTab('privacy');
    } else if (location === '/terms') {
      setActiveTab('terms');
    }
  }, [location]);

  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary/5 to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4" data-testid="about-heading">
              About ArtisanConnect<span className="text-primary">SA</span>
            </h1>
            <p className="text-lg text-slate-600">
              Building trust between artisans and homeowners across South Africa
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="about" className="flex items-center gap-2" data-testid="tab-about">
                <Building2 className="h-4 w-4" />
                About Us
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2" data-testid="tab-privacy">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2" data-testid="tab-terms">
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    About ArtisanConnectSA
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p className="text-lg text-slate-700 leading-relaxed">
                    ArtisanConnectSA exists to make one thing simple: connecting skilled artisans with people who need reliable workmanship.
                  </p>
                  
                  <p className="text-slate-600 leading-relaxed mt-4">
                    Across South Africa, homeowners and businesses struggle to find trusted, verified tradespeople. At the same time, talented artisans often battle to find consistent job opportunities. We built ArtisanConnectSA to solve both problems.
                  </p>

                  <p className="text-slate-600 leading-relaxed mt-4">
                    Our platform gives customers an easy way to find, compare, and hire vetted artisans, while giving artisans a fair, transparent place to showcase their skills, receive job leads, and grow their businesses.
                  </p>

                  <p className="text-slate-600 leading-relaxed mt-4">
                    Whether you're a contractor looking for quality work or a customer needing a plumber, painter, electrician, carpenter, or any other craftsperson — you'll find them here.
                  </p>

                  <div className="bg-primary/5 p-6 rounded-lg mt-8 border border-primary/20">
                    <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Our Vision
                    </h3>
                    <p className="text-slate-700 text-lg italic">
                      "A safer, smarter, and more connected marketplace for South African artisans and the people who rely on them."
                    </p>
                  </div>

                  <p className="text-slate-600 leading-relaxed mt-6">
                    If you value reliability, transparency, and craftsmanship, you are in the right place.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-900">Vetted Artisans</h4>
                      <p className="text-sm text-slate-600">All service providers are verified</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-900">Secure Payments</h4>
                      <p className="text-sm text-slate-600">Escrow protection on all jobs</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <Scale className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold text-slate-900">Fair Platform</h4>
                      <p className="text-sm text-slate-600">Transparent pricing for everyone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Privacy Policy (POPIA Compliant)
                  </CardTitle>
                  <p className="text-sm text-slate-500">Last updated: 2025</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-slate max-w-none space-y-6">
                      <p className="text-slate-600">
                        ArtisanConnectSA ("the Platform", "we", "our", "us") is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
                      </p>
                      <p className="text-slate-600">
                        This policy explains how we collect, use, store, and protect your information.
                      </p>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">1. Information We Collect</h3>
                        <p className="text-slate-600">We may collect the following information:</p>
                        
                        <h4 className="text-md font-medium text-slate-800 mt-4">1.1 Personal Information (Users & Artisans)</h4>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Full name</li>
                          <li>Email address</li>
                          <li>Mobile number</li>
                          <li>Profile information</li>
                          <li>Job posts and service requests</li>
                          <li>Reviews, messages, and uploaded content</li>
                        </ul>

                        <h4 className="text-md font-medium text-slate-800 mt-4">1.2 Automated Data</h4>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Device information</li>
                          <li>IP address</li>
                          <li>Cookies and browsing behaviour</li>
                          <li>Analytics and performance data</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">2. How We Use Your Information</h3>
                        <p className="text-slate-600">We use your information to:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Create and manage your account</li>
                          <li>Connect customers with artisans</li>
                          <li>Facilitate communication between users</li>
                          <li>Process job requests, listings, and payments</li>
                          <li>Improve platform performance and user experience</li>
                          <li>Prevent fraud and ensure platform safety</li>
                          <li>Comply with legal requirements</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">3. Information Sharing</h3>
                        <p className="text-slate-600">We only share information when necessary:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>With artisans or customers during a job request</li>
                          <li>With trusted service providers (hosting, payments, security)</li>
                          <li>When required by law</li>
                        </ul>
                        <p className="text-slate-700 font-medium mt-2">We do not sell personal information to third parties.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">4. Data Storage & Security</h3>
                        <p className="text-slate-600">We implement industry-standard security practices to protect your data, including:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Encrypted communication</li>
                          <li>Secure data storage</li>
                          <li>Regular system monitoring</li>
                        </ul>
                        <p className="text-slate-600 mt-2">You are responsible for keeping your login details private.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">5. Your POPIA Rights</h3>
                        <p className="text-slate-600">Under POPIA, you may:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Request access to your information</li>
                          <li>Ask for corrections or updates</li>
                          <li>Withdraw consent</li>
                          <li>Request deletion where lawful</li>
                          <li>Object to processing</li>
                        </ul>
                        <div className="bg-primary/5 p-4 rounded-lg mt-4 flex items-center gap-2">
                          <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-slate-700">Requests can be made at: <a href="mailto:admin@artisanconnect.web.za" className="text-primary hover:underline" data-testid="link-privacy-email">admin@artisanconnect.web.za</a></span>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">6. Children</h3>
                        <p className="text-slate-600">We do not knowingly collect information from individuals under 18 years of age.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">7. Updates to This Policy</h3>
                        <p className="text-slate-600">We may update this policy from time to time. Continued use of the platform indicates acceptance of changes.</p>
                      </section>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Terms & Conditions
                  </CardTitle>
                  <p className="text-sm text-slate-500">Last updated: 2025</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-slate max-w-none space-y-6">
                      <p className="text-slate-600">
                        Welcome to ArtisanConnectSA. By using our platform, you agree to the following terms.
                      </p>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">1. Definitions</h3>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li><strong>"User"</strong> – any person using the platform</li>
                          <li><strong>"Artisan"</strong> – a service provider listed on the platform</li>
                          <li><strong>"Customer"</strong> – a person posting a job or hiring an artisan</li>
                          <li><strong>"Platform"</strong> – ArtisanConnectSA website or app</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">2. Your Responsibilities</h3>
                        <p className="text-slate-600">By using the platform, you agree to:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Provide accurate, truthful information</li>
                          <li>Not misuse or harm the platform</li>
                          <li>Only post legitimate job requests or services</li>
                          <li>Use respectful and lawful communication</li>
                          <li>Take responsibility for your interactions with other users</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">3. Platform Role & Disclaimer</h3>
                        <p className="text-slate-700 font-medium">ArtisanConnectSA is a connection platform, not the service provider.</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1 mt-2">
                          <li>We do not guarantee workmanship</li>
                          <li>We do not set pricing for artisans</li>
                          <li>We do not accept liability for damages, losses, or disputes arising from work done</li>
                        </ul>
                        <p className="text-slate-600 mt-2">All agreements between customers and artisans are private contracts.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">4. Payments</h3>
                        <p className="text-slate-600">Where applicable:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Platform fees are non-refundable unless otherwise stated</li>
                          <li>Payment processing may be handled by third-party providers</li>
                          <li>Users agree to comply with payment terms</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">5. Listings & Content</h3>
                        <p className="text-slate-600">You may not upload:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>False, misleading, or fraudulent content</li>
                          <li>Offensive or discriminatory material</li>
                          <li>Content violating copyrights or laws</li>
                        </ul>
                        <p className="text-slate-600 mt-2">We reserve the right to remove content that violates these terms.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">6. Reviews</h3>
                        <p className="text-slate-600">Users agree to:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Post honest, fair reviews</li>
                          <li>Not misuse reviews to mislead, intimidate, or manipulate</li>
                        </ul>
                        <p className="text-slate-600 mt-2">We may remove inappropriate reviews.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">7. Suspension or Termination</h3>
                        <p className="text-slate-600">We may suspend or terminate accounts that:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Violate these Terms</li>
                          <li>Engage in unsafe, illegal, or fraudulent behaviour</li>
                          <li>Abuse the platform</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">8. Limitation of Liability</h3>
                        <p className="text-slate-600">ArtisanConnectSA is not liable for:</p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                          <li>Workmanship quality</li>
                          <li>Pricing disputes</li>
                          <li>Damages caused by artisans or customers</li>
                          <li>Losses from platform downtime or errors</li>
                        </ul>
                        <p className="text-slate-600 mt-2">By using the platform, you acknowledge that all service agreements occur between you and the artisan/customer.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">9. Changes to Terms</h3>
                        <p className="text-slate-600">We may update these Terms periodically. Continued use of the platform means acceptance of changes.</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-slate-900">10. Contact</h3>
                        <div className="bg-primary/5 p-4 rounded-lg mt-2 flex items-center gap-2">
                          <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-slate-700">For any queries, email: <a href="mailto:admin@artisanconnect.web.za" className="text-primary hover:underline" data-testid="link-terms-email">admin@artisanconnect.web.za</a></span>
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
