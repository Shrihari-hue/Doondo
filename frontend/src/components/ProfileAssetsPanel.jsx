import { Camera, FileText, Scissors, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { assetUrl } from "../utils/assets";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const ProfileAssetsPanel = ({ onSuccess, onError }) => {
  const { user, updateUser } = useAuth();
  const isEmployer = user?.role === "employer";
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removingAsset, setRemovingAsset] = useState("");
  const [dragTarget, setDragTarget] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [cropSettings, setCropSettings] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [cropping, setCropping] = useState(false);
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const initials = useMemo(
    () =>
      (user?.name || "U")
        .split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.name]
  );

  useEffect(() => {
    if (!profilePhotoFile) {
      setProfilePhotoPreview("");
      return undefined;
    }

    const nextPreview = URL.createObjectURL(profilePhotoFile);
    setProfilePhotoPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [profilePhotoFile]);

  useEffect(() => {
    if (!cropSource?.url) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(cropSource.url);
    };
  }, [cropSource]);

  const openCropper = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError?.("Profile photo must be an image");
      return;
    }

    setCropSource({
      file,
      url: URL.createObjectURL(file),
    });
    setCropSettings({ zoom: 1, offsetX: 0, offsetY: 0 });
    setCropModalOpen(true);
  };

  const handlePhotoSelection = (file) => {
    if (!file) {
      return;
    }

    openCropper(file);
  };

  const handleResumeSelection = (file) => {
    if (!file) {
      return;
    }

    setResumeFile(file);
  };

  const handleDrop = (assetType, event) => {
    event.preventDefault();
    setDragTarget("");

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    if (assetType === "profilePhoto") {
      handlePhotoSelection(file);
      return;
    }

    handleResumeSelection(file);
  };

  const applyCrop = async () => {
    if (!cropSource?.url || !cropSource?.file) {
      return;
    }

    setCropping(true);

    try {
      const image = await loadImage(cropSource.url);
      const canvas = document.createElement("canvas");
      const size = 512;
      const minSide = Math.min(image.width, image.height);
      const cropSize = minSide / cropSettings.zoom;
      const maxOffsetX = Math.max((image.width - cropSize) / 2, 0);
      const maxOffsetY = Math.max((image.height - cropSize) / 2, 0);
      const sourceX = clamp(
        (image.width - cropSize) / 2 + (cropSettings.offsetX / 100) * maxOffsetX,
        0,
        Math.max(image.width - cropSize, 0)
      );
      const sourceY = clamp(
        (image.height - cropSize) / 2 + (cropSettings.offsetY / 100) * maxOffsetY,
        0,
        Math.max(image.height - cropSize, 0)
      );

      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, size, size);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
      const croppedFile = new File(
        [blob],
        cropSource.file.name.replace(/\.[^.]+$/, "") + "-cropped.png",
        { type: "image/png" }
      );

      setProfilePhotoFile(croppedFile);
      setCropModalOpen(false);
      setCropSource(null);
    } catch (error) {
      onError?.("Unable to crop image");
    } finally {
      setCropping(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!profilePhotoFile && !(resumeFile && !isEmployer)) {
      onError?.(isEmployer ? "Select a profile photo first" : "Select a profile photo or resume first");
      return;
    }

    const formData = new FormData();
    if (profilePhotoFile) {
      formData.append("profilePhoto", profilePhotoFile);
    }
    if (resumeFile && !isEmployer) {
      formData.append("resume", resumeFile);
    }

    setUploading(true);

    try {
      const response = await authService.uploadProfileAssets(formData);
      updateUser(response.user);
      setProfilePhotoFile(null);
      setResumeFile(null);
      onSuccess?.("Profile files uploaded successfully");
    } catch (error) {
      onError?.(error.response?.data?.message || "Unable to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetType) => {
    setRemovingAsset(assetType);
    try {
      const response = await authService.deleteProfileAsset(assetType);
      updateUser(response.user);
      onSuccess?.(response.message);
    } catch (error) {
      onError?.(error.response?.data?.message || "Unable to remove file");
    } finally {
      setRemovingAsset("");
    }
  };

  return (
    <section className="card-surface p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-display text-2xl">
            {isEmployer ? "Business profile photo" : "Resume and profile photo"}
          </h2>
          <p className="mt-2 text-white/60">
            {isEmployer
              ? "Upload a profile image for your business account directly from the dashboard."
              : "Upload a profile image and resume directly from the dashboard."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {profilePhotoPreview ? (
            <img
              src={profilePhotoPreview}
              alt="Selected profile preview"
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-teal/30"
            />
          ) : user?.profilePhoto?.url ? (
            <img
              src={assetUrl(user.profilePhoto.url)}
              alt={user.name}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-coral font-display text-lg text-white">
              {initials}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleUpload} className={`mt-6 grid gap-4 ${isEmployer ? "" : "md:grid-cols-2"}`}>
        <div
          className={`rounded-3xl border bg-white/5 p-4 transition ${
            dragTarget === "profilePhoto" ? "border-teal bg-teal/10" : "border-white/10"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragTarget("profilePhoto");
          }}
          onDragLeave={() => setDragTarget("")}
          onDrop={(event) => handleDrop("profilePhoto", event)}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Camera size={16} />
            Profile photo
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => handlePhotoSelection(event.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="button-secondary w-full gap-2"
          >
            <Upload size={16} />
            Drag and drop photo or choose file
          </button>
          <div className="mt-2 text-xs text-white/45">
            JPG, PNG, or WebP up to 5 MB. You can preview and crop before upload.
          </div>
          {profilePhotoPreview && (
            <div className="mt-4 space-y-3">
              <img
                src={profilePhotoPreview}
                alt="Profile crop preview"
                className="h-40 w-40 rounded-3xl object-cover"
              />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => openCropper(profilePhotoFile)} className="button-secondary gap-2 !px-4 !py-2">
                  <Scissors size={15} />
                  Crop photo
                </button>
                <button type="button" onClick={() => setProfilePhotoFile(null)} className="button-secondary !px-4 !py-2">
                  Clear selection
                </button>
              </div>
            </div>
          )}
          {user?.profilePhoto?.originalName && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-white/65">Current: {user.profilePhoto.originalName}</div>
              <div className="text-xs text-white/45">
                {(user.profilePhoto.size / 1024).toFixed(1)} KB · {user.profilePhoto.mimeType}
              </div>
              <button
                type="button"
                onClick={() => handleDelete("profilePhoto")}
                className="inline-flex items-center gap-2 text-xs text-coral underline"
                disabled={removingAsset === "profilePhoto"}
              >
                <Trash2 size={14} />
                {removingAsset === "profilePhoto" ? "Removing..." : "Remove photo"}
              </button>
            </div>
          )}
        </div>

        {!isEmployer && (
          <div
            className={`rounded-3xl border bg-white/5 p-4 transition ${
              dragTarget === "resume" ? "border-teal bg-teal/10" : "border-white/10"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragTarget("resume");
            }}
            onDragLeave={() => setDragTarget("")}
            onDrop={(event) => handleDrop("resume", event)}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} />
              Resume
            </div>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => handleResumeSelection(event.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              className="button-secondary w-full gap-2"
            >
              <Upload size={16} />
              Drag and drop resume or choose file
            </button>
            <div className="mt-2 text-xs text-white/45">
              PDF, DOC, or DOCX up to 5 MB. Resume remains optional for applying.
            </div>
            {resumeFile && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/75">
                <div className="font-semibold">{resumeFile.name}</div>
                <div className="mt-1 text-xs text-white/45">{(resumeFile.size / 1024).toFixed(1)} KB</div>
                <button type="button" onClick={() => setResumeFile(null)} className="mt-3 text-xs text-coral underline">
                  Clear selection
                </button>
              </div>
            )}
            {user?.resume?.url && (
              <div className="mt-3 space-y-2">
                <a
                  href={assetUrl(user.resume.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs text-teal underline"
                >
                  Current: {user.resume.originalName || "View resume"}
                </a>
                <div className="text-xs text-white/45">
                  {(user.resume.size / 1024).toFixed(1)} KB · {user.resume.mimeType}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete("resume")}
                  className="inline-flex items-center gap-2 text-xs text-coral underline"
                  disabled={removingAsset === "resume"}
                >
                  <Trash2 size={14} />
                  {removingAsset === "resume" ? "Removing..." : "Remove resume"}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`button-primary gap-2 ${isEmployer ? "" : "md:col-span-2"}`}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : isEmployer ? "Upload photo" : "Upload files"}
        </button>
      </form>

      {cropModalOpen && cropSource?.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#101917] p-6 shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl">Crop profile photo</h3>
                <p className="mt-1 text-sm text-white/55">Adjust the preview, then save the cropped square image.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setCropSource(null);
                }}
                className="rounded-2xl border border-white/10 p-3"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className="mx-auto h-[320px] w-[320px] overflow-hidden rounded-[32px] border border-white/10 bg-black">
                <img
                  src={cropSource.url}
                  alt="Crop preview"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `scale(${cropSettings.zoom}) translate(${cropSettings.offsetX}px, ${cropSettings.offsetY}px)`,
                  }}
                />
              </div>

              <div className="space-y-5">
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-white/75">Zoom</div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={cropSettings.zoom}
                    onChange={(event) =>
                      setCropSettings((current) => ({ ...current, zoom: Number(event.target.value) }))
                    }
                    className="w-full"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-white/75">Horizontal</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropSettings.offsetX}
                    onChange={(event) =>
                      setCropSettings((current) => ({ ...current, offsetX: Number(event.target.value) }))
                    }
                    className="w-full"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-white/75">Vertical</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropSettings.offsetY}
                    onChange={(event) =>
                      setCropSettings((current) => ({ ...current, offsetY: Number(event.target.value) }))
                    }
                    className="w-full"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={applyCrop} className="button-primary" disabled={cropping}>
                    {cropping ? "Cropping..." : "Apply crop"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePhotoFile(cropSource.file);
                      setCropModalOpen(false);
                      setCropSource(null);
                    }}
                    className="button-secondary"
                  >
                    Use original
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfileAssetsPanel;
