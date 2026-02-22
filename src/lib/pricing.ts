/**
 * Pricing configuration — single source of truth for landing and billing
 */

export const PRICING = {
  free: {
    name: "Free",
    credits: 3,
    price: 0,
    description: "Try the platform",
    features: ["3 practice sessions", "Email support", "All problem categories"],
  },
  pro: {
    name: "Pro",
    credits: -1, // unlimited
    price: 19,
    period: "month",
    description: "For serious candidates",
    features: ["Unlimited sessions", "Priority support", "Detailed evaluations", "Code execution"],
  },
  enterprise: {
    name: "Enterprise",
    credits: -1,
    price: null,
    description: "For teams",
    features: ["Custom problem sets", "Team analytics", "SSO", "Dedicated support"],
  },
} as const;
