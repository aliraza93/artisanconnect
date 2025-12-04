import { Hammer } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg text-white">
                <Hammer className="h-5 w-5" />
              </div>
              <span className="font-heading font-bold text-xl">
                ArtisanConnect<span className="text-primary">SA</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connecting South Africa's best artisans and logistics providers with clients who value quality and trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary transition-colors">Find Artisans</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Post a Job</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Logistics Services</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-slate-200">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/about" className="hover:text-primary transition-colors" data-testid="link-about">About Us</a></li>
              <li><a href="mailto:support@artisanconnect.co.za" className="hover:text-primary transition-colors" data-testid="link-contact">Contact</a></li>
              <li><a href="/about?tab=privacy" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy Policy (POPIA)</a></li>
              <li><a href="/about?tab=terms" className="hover:text-primary transition-colors" data-testid="link-terms">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4 text-slate-200">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>support@artisanconnect.co.za</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} ArtisanConnect SA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
