import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check, X, Star, Zap, Crown, Rocket, Users, BarChart3,
  MessageSquare, FileText, Phone, Shield, Headphones, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    description: "Perfect for solo sales reps getting started",
    icon: Zap,
    color: "border-border",
    badge: null,
    features: [
      { text: "Up to 500 Leads", included: true },
      { text: "Lead Management", included: true },
      { text: "Quotation Builder", included: true },
      { text: "Call Logging", included: true },
      { text: "Basic Reports", included: true },
      { text: "1 User", included: true },
      { text: "WhatsApp Messaging", included: false },
      { text: "Bulk Messages", included: false },
      { text: "Custom Fields", included: false },
      { text: "API Access", included: false },
    ],
  },
  {
    name: "Professional",
    price: "₹2,499",
    period: "/month",
    description: "For growing teams that need more power",
    icon: Star,
    color: "border-primary shadow-lg shadow-primary/10",
    badge: "Most Popular",
    features: [
      { text: "Up to 5,000 Leads", included: true },
      { text: "Lead Management", included: true },
      { text: "Quotation & Invoicing", included: true },
      { text: "Call Logging & Tracking", included: true },
      { text: "Advanced MIS Reports", included: true },
      { text: "Up to 5 Users", included: true },
      { text: "WhatsApp Messaging", included: true },
      { text: "Bulk Messages (1000/mo)", included: true },
      { text: "Custom Fields", included: true },
      { text: "API Access", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "/month",
    description: "Unlimited power for large organizations",
    icon: Crown,
    color: "border-accent",
    badge: "Best Value",
    features: [
      { text: "Unlimited Leads", included: true },
      { text: "Full Lead Management", included: true },
      { text: "Quotation & Invoicing", included: true },
      { text: "Call Logging & Analytics", included: true },
      { text: "200+ MIS Reports", included: true },
      { text: "Unlimited Users", included: true },
      { text: "WhatsApp Business API", included: true },
      { text: "Unlimited Bulk Messages", included: true },
      { text: "Custom Fields & Workflows", included: true },
      { text: "Full API Access", included: true },
    ],
  },
];

const highlights = [
  { icon: Users, title: "Team Management", desc: "Role-based access for admins, managers & reps" },
  { icon: BarChart3, title: "200+ MIS Reports", desc: "Deep analytics on leads, sales & performance" },
  { icon: MessageSquare, title: "WhatsApp Integration", desc: "Send messages, bulk broadcasts & templates" },
  { icon: FileText, title: "Smart Quotations", desc: "Auto-numbered quotations with tax & discounts" },
  { icon: Phone, title: "Call Tracking", desc: "Log & track all incoming & outgoing calls" },
  { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security with role-based access" },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center relative">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Rocket className="h-3 w-3" /> Launch Offer — 30% Off Annual Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your sales team. All plans include core CRM features
            with no hidden fees.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative flex flex-col ${plan.color} transition-all hover:shadow-lg`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 shadow-md">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-3 rounded-xl bg-muted p-3 w-fit">
                  <plan.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2.5 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full gap-2"
                  variant={plan.badge === "Most Popular" ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Everything You Need to Close More Deals</h2>
            <p className="text-muted-foreground">Banega Brand CRM is packed with features to supercharge your sales team</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h) => (
              <Card key={h.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <h.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{h.title}</h3>
                      <p className="text-sm text-muted-foreground">{h.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border">
          <Headphones className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Need a Custom Plan?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Contact our team for custom pricing, dedicated support, and enterprise features.
          </p>
          <Button size="lg" className="gap-2">
            <Phone className="h-4 w-4" /> Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
