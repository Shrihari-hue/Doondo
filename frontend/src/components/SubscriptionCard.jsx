const SubscriptionCard = ({ plan, onSelect, activePlan, busy = false }) => (
  <article className={`card-surface p-6 ${activePlan === plan.id ? "border-coral/50 shadow-glow" : ""}`}>
    <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-teal">
      {plan.name}
    </div>
    <h3 className="font-display text-3xl">₹{plan.amount}</h3>
    <p className="mt-2 text-sm text-white/60">per month</p>
    <div className="mt-6 space-y-3 text-sm text-white/75">
      <div>{plan.jobPostLimit === -1 ? "Unlimited job posts" : `${plan.jobPostLimit} job posts`}</div>
      <div>{plan.priorityListing ? "Priority listing boost" : "Standard listing"}</div>
      <div>UPI-enabled Razorpay checkout</div>
    </div>
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      disabled={busy || activePlan === plan.id}
      className="button-primary mt-6 w-full disabled:opacity-60"
    >
      {busy ? "Activating..." : activePlan === plan.id ? "Current plan" : "Choose plan"}
    </button>
  </article>
);

export default SubscriptionCard;
