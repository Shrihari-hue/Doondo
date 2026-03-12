import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { locationService } from "../services/locationService";

const baseForm = {
  role: "seeker",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  location: {
    city: "",
    area: "",
    pincode: "",
    address: "",
    coordinates: {
      type: "Point",
      coordinates: [77.5946, 12.9716],
    },
  },
  seekerProfile: {
    skills: [],
    preferredJobType: "both",
    bio: "",
  },
  employerProfile: {
    businessName: "",
    businessType: "",
    contactNumber: "",
    description: "",
  },
};

const validateSignup = (form, skills) => {
  if (!form.name.trim()) {
    return "Full name is required";
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return "Enter a valid email address";
  }

  if (form.password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (form.password !== form.confirmPassword) {
    return "Passwords do not match";
  }

  if (!/^\+?[0-9\s-]{10,15}$/.test(form.phone.trim())) {
    return "Enter a valid phone number";
  }

  if (!form.location.city.trim() || !form.location.area.trim()) {
    return "City and area are required";
  }

  if (!/^\d{6}$/.test(form.location.pincode.trim())) {
    return "Enter a valid 6 digit pincode";
  }

  if (form.role === "employer") {
    if (!form.employerProfile.businessName.trim()) {
      return "Business name is required";
    }

    if (!form.employerProfile.businessType.trim()) {
      return "Business type is required";
    }

    if (!/^\+?[0-9\s-]{10,15}$/.test(form.employerProfile.contactNumber.trim())) {
      return "Enter a valid business contact number";
    }
  }

  if (form.role === "seeker" && !skills.split(",").map((item) => item.trim()).filter(Boolean).length) {
    return "Add at least one skill";
  }

  return "";
};

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(baseForm);
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationHint, setLocationHint] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [toast, setToast] = useState({ tone: "", message: "" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast({ tone: "", message: "" }), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handlePincodeLookup = async (nextPincode = form.location.pincode) => {
    const pincode = nextPincode.trim();
    if (!/^\d{6}$/.test(pincode)) {
      setLocationHint(null);
      return;
    }

    setLookupLoading(true);

    try {
      const lookup = await locationService.lookupPincode(pincode);
      setLocationHint(lookup);
      setForm((current) => ({
        ...current,
        location: {
          ...current.location,
          city: current.location.city || lookup.primaryCity || current.location.city,
          area:
            current.location.area ||
            (lookup.areas.length === 1 ? lookup.areas[0] : lookup.primaryArea || current.location.area),
          pincode,
        },
      }));
    } catch (requestError) {
      setLocationHint({
        error: requestError.response?.data?.message || "Pincode lookup failed",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateSignup(form, skills);

    if (validationError) {
      setToast({ tone: "error", message: validationError });
      return;
    }

    setToast({ tone: "", message: "" });
    setLoading(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        location: {
          ...form.location,
          city: form.location.city.trim(),
          area: form.location.area.trim(),
          pincode: form.location.pincode.trim(),
          address: form.location.address.trim(),
        },
        seekerProfile: {
          ...form.seekerProfile,
          skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
        },
        employerProfile: {
          ...form.employerProfile,
          businessName: form.employerProfile.businessName.trim(),
          businessType: form.employerProfile.businessType.trim(),
          contactNumber: form.employerProfile.contactNumber.trim(),
          description: form.employerProfile.description.trim(),
        },
      };

      delete payload.confirmPassword;

      const response = await register(payload);
      navigate(response.user.role === "employer" ? "/subscription" : "/dashboard/seeker");
    } catch (requestError) {
      setToast({
        tone: "error",
        message: requestError.response?.data?.message || "Unable to create account",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl card-surface p-6 md:p-8">
      <Toast tone={toast.tone} message={toast.message} onClose={() => setToast({ tone: "", message: "" })} />
      <div className="mb-6 flex flex-wrap gap-2">
        {["seeker", "employer"].map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setForm({ ...form, role })}
            className={`rounded-full px-4 py-2 text-sm ${form.role === role ? "bg-coral text-white" : "bg-white/5 text-white/70"}`}
          >
            {role === "seeker" ? "Job seeker" : "Employer / Business"}
          </button>
        ))}
      </div>

      <h1 className="font-display text-3xl">Create your Doondo account</h1>
      <p className="mt-2 text-white/60">New accounts created here are saved in MongoDB and can be used for future logins.</p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="input-base" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="input-base" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input-base" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <input
          className="input-base"
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
        />
        <input className="input-base" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input
          className="input-base"
          placeholder="City"
          value={form.location.city}
          onChange={(event) => setForm({ ...form, location: { ...form.location, city: event.target.value } })}
        />
        <input
          className="input-base"
          placeholder="Area"
          value={form.location.area}
          onChange={(event) => setForm({ ...form, location: { ...form.location, area: event.target.value } })}
        />
        <input
          className="input-base"
          placeholder="Pincode"
          value={form.location.pincode}
          onChange={(event) => {
            setForm({ ...form, location: { ...form.location, pincode: event.target.value } });
            if (locationHint) {
              setLocationHint(null);
            }
          }}
          onBlur={(event) => handlePincodeLookup(event.target.value)}
        />
        <div className="md:col-span-2">
          {lookupLoading && <div className="text-sm text-white/55">Checking Karnataka pincode directory...</div>}
          {!lookupLoading && locationHint?.error && (
            <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm text-coral">{locationHint.error}</div>
          )}
          {!lookupLoading && locationHint?.pincode && !locationHint.error && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <div>
                Matched from {locationHint.source} lookup: {locationHint.districts.join(", ")} · Karnataka
              </div>
              <div className="mt-1">
                Suggested areas: {locationHint.areas.slice(0, 8).join(", ")}
              </div>
            </div>
          )}
        </div>

        {form.role === "seeker" ? (
          <>
            <input className="input-base md:col-span-2" placeholder="Skills (comma separated)" value={skills} onChange={(event) => setSkills(event.target.value)} />
            <select
              className="input-base"
              value={form.seekerProfile.preferredJobType}
              onChange={(event) =>
                setForm({
                  ...form,
                  seekerProfile: { ...form.seekerProfile, preferredJobType: event.target.value },
                })
              }
            >
              <option value="both">Part-time + Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
            </select>
            <textarea
              className="input-base md:col-span-2"
              rows="4"
              placeholder="Short profile bio"
              value={form.seekerProfile.bio}
              onChange={(event) => setForm({ ...form, seekerProfile: { ...form.seekerProfile, bio: event.target.value } })}
            />
          </>
        ) : (
          <>
            <input
              className="input-base"
              placeholder="Business name"
              value={form.employerProfile.businessName}
              onChange={(event) =>
                setForm({
                  ...form,
                  employerProfile: { ...form.employerProfile, businessName: event.target.value },
                })
              }
            />
            <input
              className="input-base"
              placeholder="Business type"
              value={form.employerProfile.businessType}
              onChange={(event) =>
                setForm({
                  ...form,
                  employerProfile: { ...form.employerProfile, businessType: event.target.value },
                })
              }
            />
            <input
              className="input-base"
              placeholder="Business contact"
              value={form.employerProfile.contactNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  employerProfile: { ...form.employerProfile, contactNumber: event.target.value },
                })
              }
            />
            <textarea
              className="input-base md:col-span-2"
              rows="4"
              placeholder="Describe your business"
              value={form.employerProfile.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  employerProfile: { ...form.employerProfile, description: event.target.value },
                })
              }
            />
          </>
        )}

        <button type="submit" className="button-primary md:col-span-2" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
