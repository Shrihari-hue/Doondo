import { useEffect, useState } from "react";
import ProfileAssetsPanel from "../components/ProfileAssetsPanel";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { authService } from "../services/authService";
import { locationService } from "../services/locationService";

const validateProfile = (form, role, skills) => {
  if (!form.name.trim()) {
    return "Name is required";
  }

  if (!/^\+?[0-9\s-]{10,15}$/.test(form.phone.trim())) {
    return "Enter a valid phone number";
  }

  if (!form.location.city.trim() || !form.location.area.trim()) {
    return "City and area are required";
  }

  if (!/^\d{6}$/.test((form.location.pincode || "").trim())) {
    return "Enter a valid 6 digit pincode";
  }

  if (role === "seeker") {
    if (!skills.split(",").map((item) => item.trim()).filter(Boolean).length) {
      return "Add at least one skill";
    }
  }

  if (role === "employer") {
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

  return "";
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: { city: "", area: "", pincode: "", address: "", coordinates: { type: "Point", coordinates: [77.5946, 12.9716] } },
    seekerProfile: { skills: [], preferredJobType: "both", bio: "" },
    employerProfile: { businessName: "", businessType: "", contactNumber: "", description: "" },
  });
  const [skills, setSkills] = useState("");
  const [locationHint, setLocationHint] = useState(null);
  const [toast, setToast] = useState({ tone: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast({ tone: "", message: "" }), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handlePincodeLookup = async (pincode) => {
    if (!/^\d{6}$/.test((pincode || "").trim())) {
      setLocationHint(null);
      return;
    }

    try {
      const lookup = await locationService.lookupPincode(pincode.trim());
      setLocationHint(lookup);
    } catch (error) {
      setLocationHint({
        error: error.response?.data?.message || "Pincode lookup failed",
      });
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      name: user.name || "",
      phone: user.phone || "",
      location: user.location || form.location,
      seekerProfile: user.seekerProfile || form.seekerProfile,
      employerProfile: user.employerProfile || form.employerProfile,
    });
    setSkills(user.seekerProfile?.skills?.join(", ") || "");
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateProfile(form, user?.role, skills);

    if (validationError) {
      setToast({ tone: "error", message: validationError });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: {
          ...form.location,
          city: form.location.city.trim(),
          area: form.location.area.trim(),
          pincode: form.location.pincode.trim(),
          address: (form.location.address || "").trim(),
        },
        seekerProfile: {
          ...form.seekerProfile,
          skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
          bio: (form.seekerProfile.bio || "").trim(),
        },
        employerProfile: {
          ...form.employerProfile,
          businessName: (form.employerProfile.businessName || "").trim(),
          businessType: (form.employerProfile.businessType || "").trim(),
          contactNumber: (form.employerProfile.contactNumber || "").trim(),
          description: (form.employerProfile.description || "").trim(),
        },
      };

      const response = await authService.updateProfile(payload);
      updateUser(response.user);
      setToast({ tone: "success", message: "Profile updated successfully" });
    } catch (error) {
      setToast({
        tone: "error",
        message: error.response?.data?.message || "Unable to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl card-surface p-6 md:p-8">
      <Toast tone={toast.tone} message={toast.message} onClose={() => setToast({ tone: "", message: "" })} />
      <h1 className="section-title">Your profile</h1>
      <div className="mt-6">
        <ProfileAssetsPanel
          onSuccess={(message) => setToast({ tone: "success", message })}
          onError={(message) => setToast({ tone: "error", message })}
        />
      </div>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="input-base" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" />
        <input className="input-base" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" />
        <input
          className="input-base"
          value={form.location.city || ""}
          onChange={(event) => setForm({ ...form, location: { ...form.location, city: event.target.value } })}
          placeholder="City"
        />
        <input
          className="input-base"
          value={form.location.area || ""}
          onChange={(event) => setForm({ ...form, location: { ...form.location, area: event.target.value } })}
          placeholder="Area"
        />
        <input
          className="input-base"
          value={form.location.pincode || ""}
          onChange={(event) => setForm({ ...form, location: { ...form.location, pincode: event.target.value } })}
          onBlur={(event) => handlePincodeLookup(event.target.value)}
          placeholder="Pincode"
        />
        <div className="md:col-span-2">
          {locationHint?.error && <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm text-coral">{locationHint.error}</div>}
          {locationHint?.pincode && !locationHint.error && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Matched from {locationHint.source} lookup: {locationHint.districts.join(", ")} · Suggested areas:{" "}
              {locationHint.areas.slice(0, 8).join(", ")}
            </div>
          )}
        </div>

        {user?.role === "seeker" ? (
          <>
            <input className="input-base md:col-span-2" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Skills" />
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
              value={form.seekerProfile.bio || ""}
              onChange={(event) => setForm({ ...form, seekerProfile: { ...form.seekerProfile, bio: event.target.value } })}
              placeholder="Bio"
            />
          </>
        ) : (
          <>
            <input
              className="input-base"
              value={form.employerProfile.businessName || ""}
              onChange={(event) =>
                setForm({ ...form, employerProfile: { ...form.employerProfile, businessName: event.target.value } })
              }
              placeholder="Business name"
            />
            <input
              className="input-base"
              value={form.employerProfile.businessType || ""}
              onChange={(event) =>
                setForm({ ...form, employerProfile: { ...form.employerProfile, businessType: event.target.value } })
              }
              placeholder="Business type"
            />
            <input
              className="input-base"
              value={form.employerProfile.contactNumber || ""}
              onChange={(event) =>
                setForm({ ...form, employerProfile: { ...form.employerProfile, contactNumber: event.target.value } })
              }
              placeholder="Contact number"
            />
            <textarea
              className="input-base md:col-span-2"
              rows="4"
              value={form.employerProfile.description || ""}
              onChange={(event) =>
                setForm({ ...form, employerProfile: { ...form.employerProfile, description: event.target.value } })
              }
              placeholder="Business description"
            />
          </>
        )}
        <button type="submit" className="button-primary md:col-span-2" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
