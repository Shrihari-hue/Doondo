const SUBSCRIPTION_PLANS = {
  basic: {
    id: "basic",
    name: "Basic Plan",
    amount: 499,
    currency: "INR",
    jobPostLimit: 5,
    priorityListing: false,
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    amount: 999,
    currency: "INR",
    jobPostLimit: -1,
    priorityListing: false,
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    amount: 1999,
    currency: "INR",
    jobPostLimit: -1,
    priorityListing: true,
  },
};

const canPostJob = (subscription = {}, activeJobsCount = 0) => {
  if (subscription.status !== "active" || !subscription.plan) {
    return false;
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  if (!plan) {
    return false;
  }

  return plan.jobPostLimit === -1 || activeJobsCount < plan.jobPostLimit;
};

module.exports = {
  SUBSCRIPTION_PLANS,
  canPostJob,
};
