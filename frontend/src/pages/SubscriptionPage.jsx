import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubscriptionCard from "../components/SubscriptionCard";
import { useAuth } from "../context/AuthContext";
import { subscriptionService } from "../services/subscriptionService";

const SubscriptionPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState("");
  const [activatingPlan, setActivatingPlan] = useState("");

  useEffect(() => {
    subscriptionService.getPlans().then(setPlans);
  }, []);

  const handleSelectPlan = async (planId) => {
    setStatus("");
    setActivatingPlan(planId);

    try {
      const response = await subscriptionService.createOrder(planId);

      if (response.mock) {
        await refreshProfile();
        setStatus(`${response.plan.name} activated for local development. You can continue posting jobs.`);
        navigate("/dashboard/employer");
        return;
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is not available right now");
      }

      const razorpay = new window.Razorpay({
        key: response.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: response.order.amount,
        currency: response.order.currency,
        name: "Doondo",
        description: `${response.plan.name} subscription`,
        order_id: response.order.id,
        handler: async (paymentResponse) => {
          await subscriptionService.verifyPayment({
            planId,
            ...paymentResponse,
          });
          await refreshProfile();
          setStatus("Subscription activated");
          navigate("/dashboard/employer");
        },
        theme: {
          color: "#f26849",
        },
        prefill: {
          name: user?.employerProfile?.businessName || user?.name,
          email: user?.email,
          contact: user?.phone || user?.employerProfile?.contactNumber,
        },
      });

      razorpay.open();
    } catch (error) {
      setStatus(
        error.response?.data?.message ||
          error.message ||
          "Unable to start subscription payment"
      );
    } finally {
      setActivatingPlan("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-surface p-6 md:p-8">
        <h1 className="section-title">Subscription plans for local businesses</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Choose a posting plan, pay with Razorpay UPI, and unlock vacancy publishing on Doondo.
        </p>
        {status && <div className="mt-4 rounded-2xl bg-teal/10 px-4 py-3 text-sm text-teal">{status}</div>}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <SubscriptionCard
            key={plan.id}
            plan={plan}
            activePlan={user?.subscription?.plan}
            onSelect={handleSelectPlan}
            busy={activatingPlan === plan.id}
          />
        ))}
      </section>
    </div>
  );
};

export default SubscriptionPage;
