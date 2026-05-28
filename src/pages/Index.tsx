import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Check, Users, BarChart3, MessageSquare, FileText,
  Phone, Shield, Zap, Star, Crown, Rocket, Upload, Download,
  Target, TrendingUp, Globe, Headphones
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Target, title: "Lead Management", desc: "Capture, track & convert leads with multi-stage pipelines" },
  { icon: MessageSquare, title: "WhatsApp & Bulk Messaging", desc: "Send WhatsApp messages, bulk broadcasts & template campaigns" },
  { icon: FileText, title: "Quotation & Invoicing", desc: "Auto-numbered quotations with tax, discounts & T&C templates" },
  { icon: Phone, title: "Call Tracking & Logs", desc: "Log all incoming, outgoing & missed calls with outcomes" },
  { icon: BarChart3, title: "200+ MIS Reports", desc: "Deep analytics on leads, sales, expenses & team performance" },
  { icon: Users, title: "Multi-User Roles", desc: "Admin, Manager & Sales Rep roles with granular permissions" },
  { icon: Upload, title: "Lead Import / Export", desc: "Bulk import leads via CSV and export your entire database" },
  { icon: Shield, title: "Post Sales & AMC", desc: "Track AMC, renewals, EMI tenure & due payments" },
  { icon: Globe, title: "Marketing 360°", desc: "Birthday reminders, email templates & customer engagement" },
];

const plans = [
  {
    name: "Starter", price: "₹999", period: "/mo", icon: Zap, popular: false,
    features: ["Up to 500 Leads", "Lead Management", "Quotation Builder", "Call Logging", "Basic Reports", "1 User"],
  },
  {
    name: "Professional", price: "₹2,499", period: "/mo", icon: Star, popular: true,
    features: ["Up to 5,000 Leads", "WhatsApp Messaging", "Bulk Messages (1000/mo)", "Advanced MIS Reports", "Custom Fields", "Up to 5 Users"],
  },
  {
    name: "Enterprise", price: "₹4,999", period: "/mo", icon: Crown, popular: false,
    features: ["Unlimited Leads", "WhatsApp Business API", "Unlimited Bulk Messages", "200+ MIS Reports", "Full API Access", "Unlimited Users"],
  },
];

const stats = [
  { value: "10,000+", label: "Leads Managed" },
  { value: "500+", label: "Happy Users" },
  { value: "200+", label: "MIS Reports" },
  { value: "99.9%", label: "Uptime" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/banega-brand-logo.png"
              alt="Banega Brand"
              className="h-10 w-auto"
            />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Why Us</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button onClick={() => navigate("/auth")} className="gap-2">
              Sign Up <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center relative">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm">
            <Rocket className="h-3.5 w-3.5" /> Launch Offer — 30% Off Annual Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
            All-in-One CRM for{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Modern Sales Teams
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Manage leads, send WhatsApp broadcasts, create quotations, track calls & expenses — 
            everything your sales team needs in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-8 h-12">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="gap-2 text-base px-8 h-12">
              View Pricing
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Close More Deals
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From lead capture to post-sale management — Banega Brand CRM covers the entire customer lifecycle.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="group hover:shadow-lg hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 shrink-0 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/20 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">No hidden fees. Choose the plan that fits your team.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative flex flex-col transition-all hover:shadow-lg ${plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 shadow-md">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="text-center mb-6 pt-4">
                    <div className="mx-auto mb-3 rounded-xl bg-muted p-3 w-fit">
                      <plan.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full gap-2"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center p-10 md:p-16 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border">
          <Headphones className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Ready to Supercharge Your Sales?</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join hundreds of sales teams already using Banega Brand CRM to close more deals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 px-8">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8">
              <Phone className="h-4 w-4" /> Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/banega-brand-logo.png"
                alt="Banega Brand"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Banega Brand. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
