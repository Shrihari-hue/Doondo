import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const validateLogin = ({ email, password }) => {
  if (!email.trim()) {
    return "Email is required";
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Enter a valid email address";
  }

  if (!password) {
    return "Password is required";
  }

  return "";
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ tone: "", message: "" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast({ tone: "", message: "" }), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateLogin(form);

    if (validationError) {
      setToast({ tone: "error", message: validationError });
      return;
    }

    setToast({ tone: "", message: "" });
    setLoading(true);

    try {
      const response = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const fallback = response.user.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker";
      navigate(location.state?.from?.pathname || fallback);
    } catch (requestError) {
      setToast({
        tone: "error",
        message: requestError.response?.data?.message || "Login failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl card-surface p-6 md:p-8">
      <Toast tone={toast.tone} message={toast.message} onClose={() => setToast({ tone: "", message: "" })} />
      <h1 className="font-display text-3xl">Login to Doondo</h1>
      <p className="mt-2 text-white/60">Use your real account email and password. Successful logins load your saved MongoDB profile.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input className="input-base" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input-base" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <button type="submit" className="button-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
