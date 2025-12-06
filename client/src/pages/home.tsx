import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ShieldCheck, Truck, Users, Star, ArrowRight, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/auth/login-modal";
import { SignupModal } from "@/components/auth/signup-modal";

// Import generated images
import heroImage from "@assets/generated_images/homeowner_shaking_hands_with_a_professional_artisan.png";
import artisanImage from "@assets/generated_images/professional_electrician_working.png";
import logisticsImage from "@assets/generated_images/logistics_truck_on_the_road.png";
import happyHomeownerImage from "@assets/stock_images/happy_homeowner_rela_2867d813.jpg";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handlePostJob = () => {
    if (user) {
      setLocation('/post-job');
    } else {
      setShowSignup(true);
    }
  };

  const handleJoinAsPro = () => {
    if (user) {
      setLocation('/dashboard');
    } else {
      setShowSignup(true);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8 z-10">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1 rounded-full text-sm font-medium uppercase tracking-wide border-none">
              South Africa's #1 Marketplace
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-heading font-extrabold text-slate-900 leading-tight">
              Get Your Home Projects<br />
              <span className="text-primary">Done Right.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 max-w-lg leading-relaxed">
              Stop gambling with your home projects. We connect you with vetted South African artisans and logistics pros who get the job done right.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={handlePostJob}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-lg px-8 h-14 rounded-full shadow-lg shadow-secondary/20 transform hover:-translate-y-1 transition-all"
                data-testid="button-post-job-hero"
              >
                Post a Job for Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleJoinAsPro}
                className="border-2 border-slate-200 hover:border-primary hover:text-primary font-bold text-lg px-8 h-14 rounded-full bg-white"
                data-testid="button-join-pro-hero"
              >
                Join as a Pro
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                  </div>
                ))}
              </div>
              <p>Trusted by 10,000+ South Africans</p>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-[2rem] transform rotate-3 blur-xl"></div>
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={heroImage} 
                alt="Homeowner greeting artisan" 
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700"
              />
              
              {/* Floating Badge */}
              <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl max-w-xs border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800">Verified Pro</span>
                </div>
                <p className="text-xs text-slate-500">Every artisan passes strict ID & skill checks before joining.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Why traditional hiring is broken</h2>
            <p className="text-slate-600 text-lg">You shouldn't have to worry about unvetted workers, hidden costs, or jobs left half-done.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-slate-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-2">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Accountability</h3>
                <p className="text-slate-600 text-sm">Hiring from a roadside or classifieds means zero recourse if things go wrong.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-slate-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-2">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Unpredictable Costs</h3>
                <p className="text-slate-600 text-sm">Quotes that change halfway through the job. Hidden fees and transport costs.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-slate-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-2">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Wasted Money</h3>
                <p className="text-slate-600 text-sm">Paying upfront with no guarantee the work will ever get done properly.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-slate-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-2">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Project Disasters</h3>
                <p className="text-slate-600 text-sm">Jobs abandoned halfway through, leaving you with a bigger mess than before.</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg bg-slate-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-2">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Endless Stress</h3>
                <p className="text-slate-600 text-sm">Chasing workers who don't show up and won't answer their phones.</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 shadow-xl bg-white relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-primary"></div>
              <CardContent className="p-6 space-y-3">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center text-primary mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">The ArtisanConnect Way</h3>
                <p className="text-slate-600 text-sm">Escrow payments, vetted profiles, and a dispute resolution team. Total peace of mind.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-heading font-bold">Find the right professional for any job</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 bg-white/10 p-3 rounded-xl h-fit">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Skilled Artisans</h3>
                    <p className="text-slate-400">Plumbers, electricians, builders, solar installers, HVAC techs, and more. Verified qualifications and reviews.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 bg-white/10 p-3 rounded-xl h-fit">
                    <Truck className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Logistics Experts</h3>
                    <p className="text-slate-400">Need rubble removed or materials delivered? We have a dedicated fleet ready to move.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 bg-white/10 p-3 rounded-xl h-fit">
                    <ShieldCheck className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Secure Payments</h3>
                    <p className="text-slate-400">Your money is held in escrow until the job is done and you're satisfied.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePostJob}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-full px-8 py-6 text-lg mt-4"
                data-testid="button-get-started"
              >
                Get Started Now
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <img src={artisanImage} alt="Electrician" className="rounded-2xl shadow-lg transform translate-y-8" />
              <img src={logisticsImage} alt="Truck" className="rounded-2xl shadow-lg transform -translate-y-8" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-16">Three steps to a job well done</h2>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

               <div className="relative space-y-6">
                 <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary shadow-sm">
                   1
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Post Your Job</h3>
                 <p className="text-slate-600">Describe what you need done. It's free and takes less than 2 minutes.</p>
               </div>

               <div className="relative space-y-6">
                 <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary shadow-sm">
                   2
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Receive Quotes</h3>
                 <p className="text-slate-600">Vetted artisans will send you competitive quotes. Check their profiles and ratings.</p>
               </div>

               <div className="relative space-y-6">
                 <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary shadow-sm">
                   3
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Hire & Pay Securely</h3>
                 <p className="text-slate-600">Accept a quote. Funds are held safely until the work is complete.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Imagine This Instead */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] transform -rotate-2"></div>
              <img 
                src={happyHomeownerImage} 
                alt="Happy homeowner in completed space" 
                className="relative rounded-2xl shadow-xl w-full object-cover"
              />
            </div>
            <div className="space-y-8">
              <h2 className="text-3xl lg:text-4xl font-heading font-bold text-slate-900">
                Imagine This Instead...
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-lg text-slate-700">Projects completed on time, on budget</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-lg text-slate-700">Verified professionals you can trust</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-lg text-slate-700">More time enjoying your home, not fixing it</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-lg text-slate-700">Peace of mind with every hire</p>
                </div>
              </div>
              <Button 
                onClick={handlePostJob}
                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8 py-6 text-lg mt-4"
                data-testid="button-imagine-cta"
              >
                Start Your Project Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-3xl lg:text-5xl font-heading font-bold">Ready to get started?</h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">Join thousands of South Africans who trust ArtisanConnect for their home and business needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handlePostJob}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-lg px-10 h-16 rounded-full shadow-xl"
              data-testid="button-post-job-cta"
            >
              Post a Job
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleJoinAsPro}
              className="border-2 border-white/30 hover:bg-white/10 text-white font-bold text-lg px-10 h-16 rounded-full bg-transparent"
              data-testid="button-become-pro-cta"
            >
              Become a Pro
            </Button>
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
      <SignupModal 
        open={showSignup} 
        onOpenChange={setShowSignup}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </Layout>
  );
}
