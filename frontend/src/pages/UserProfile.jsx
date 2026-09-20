import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit3,
  Mail,
  Phone,
  User,
  AtSign,
  FileText,
  Calendar,
  Circle,
  Loader2,
  X,
  Save,
  ImagePlus,
} from "lucide-react";

import api from "../services/api";

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  // ---------------------------------------------
  // Get logged-in chat user
  // ---------------------------------------------

  const getLoggedInUser = () => {
    try {
      const savedUser = localStorage.getItem("chat_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("chat_user parse error:", error);
      return null;
    }
  };

  const loggedInUser = getLoggedInUser();

  // ---------------------------------------------
  // State
  // ---------------------------------------------

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    phone: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ---------------------------------------------
  // Is this my profile?
  // ---------------------------------------------

  const isMyProfile =
    !userId || userId === loggedInUser?.id;

  // ---------------------------------------------
  // Fetch Profile
  // ---------------------------------------------

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        let response;

        if (isMyProfile) {
          response = await api.get("/users/me");
        } else {
          response = await api.get(`/users/${userId}`);
        }

        const fetchedUser = response.data.user;

        setProfile(fetchedUser);

        setFormData({
          name: fetchedUser?.name || "",
          username: fetchedUser?.username || "",
          bio: fetchedUser?.bio || "",
          phone: fetchedUser?.phone || "",
        });

        setImagePreview(
          fetchedUser?.profileImage || ""
        );
      } catch (error) {
        console.error("Profile fetch error:", error);

        setError(
          error?.response?.data?.message ||
            "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isMyProfile]);

  // ---------------------------------------------
  // Input Change
  // ---------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------
  // Select Profile Image
  // ---------------------------------------------

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Allowed image types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );

      e.target.value = "";
      return;
    }

    // 5 MB frontend limit
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Profile image must be less than 5 MB");

      e.target.value = "";
      return;
    }

    setError("");
    setSelectedImage(file);

    // Preview
    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ---------------------------------------------
  // Save Profile
  // ---------------------------------------------

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // -----------------------------------------
      // FormData
      // -----------------------------------------

      const data = new FormData();

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "username",
        formData.username.trim()
      );

      data.append(
        "bio",
        formData.bio.trim()
      );

      data.append(
        "phone",
        formData.phone.trim()
      );

      // Add image only if user selected new image
      if (selectedImage) {
        data.append(
          "profileImage",
          selectedImage
        );
      }

      // -----------------------------------------
      // API
      // -----------------------------------------

      const response = await api.put(
        "/users/profile",
        data
      );

      const updatedUser = response.data.user;

      // -----------------------------------------
      // Update page
      // -----------------------------------------

      setProfile(updatedUser);

      setFormData({
        name: updatedUser?.name || "",
        username: updatedUser?.username || "",
        bio: updatedUser?.bio || "",
        phone: updatedUser?.phone || "",
      });

      setImagePreview(
        updatedUser?.profileImage || ""
      );

      setSelectedImage(null);

      // -----------------------------------------
      // Update localStorage
      // -----------------------------------------

      const oldUser = getLoggedInUser();

      if (oldUser) {
        const updatedLocalUser = {
          ...oldUser,
          id:
            updatedUser._id ||
            oldUser.id,

          name: updatedUser.name,

          email:
            updatedUser.email ||
            oldUser.email,

          profileImage:
            updatedUser.profileImage || "",

          status:
            updatedUser.status ||
            oldUser.status,
        };

        localStorage.setItem(
          "chat_user",
          JSON.stringify(updatedLocalUser)
        );
      }

      setIsEditing(false);

      setSuccess(
        "Profile updated successfully"
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------
  // Cancel Edit
  // ---------------------------------------------

  const handleCancel = () => {
    if (!profile) return;

    setFormData({
      name: profile?.name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
    });

    setSelectedImage(null);

    setImagePreview(
      profile?.profileImage || ""
    );

    setError("");
    setIsEditing(false);
  };

  // ---------------------------------------------
  // Date
  // ---------------------------------------------

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ---------------------------------------------
  // Last Seen
  // ---------------------------------------------

  const formatLastSeen = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ---------------------------------------------
  // Loading
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={30}
            className="animate-spin text-indigo-400"
          />

          <p className="text-sm text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Profile Not Found
  // ---------------------------------------------

  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <User
              size={30}
              className="text-red-400"
            />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Profile not found
          </h2>

          <p className="text-sm text-slate-400 mb-5">
            {error ||
              "Unable to load this profile"}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="
              px-5 py-2.5
              rounded-xl
              bg-white/10
              hover:bg-white/15
              text-sm
              transition
            "
          >
            Go Back
          </button>

        </div>
      </div>
    );
  }

  const isOnline =
    profile?.status === "online";

  const avatarSource = isEditing
    ? imagePreview
    : profile.profileImage;

  const avatarLetter =
    profile?.name
      ?.charAt(0)
      ?.toUpperCase() || "U";

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header className="
        sticky top-0 z-30
        border-b border-white/10
        bg-slate-950/90
        backdrop-blur-xl
      ">

        <div className="
          max-w-5xl mx-auto
          px-4 sm:px-6
          h-16
          flex items-center
          justify-between
        ">

          <div className="flex items-center gap-3">

            <button
              onClick={() => navigate(-1)}
              className="
                w-10 h-10
                rounded-xl
                flex items-center justify-center
                text-slate-400
                hover:text-white
                hover:bg-white/[0.06]
                transition
              "
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="font-semibold text-base sm:text-lg">
                Profile
              </h1>

              <p className="text-xs text-slate-500">
                {isMyProfile
                  ? "Your profile"
                  : "User profile"}
              </p>
            </div>

          </div>

          {isMyProfile &&
            !isEditing && (
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setIsEditing(true);
                }}
                className="
                  flex items-center gap-2
                  px-3 sm:px-4
                  py-2
                  rounded-xl
                  bg-indigo-600
                  hover:bg-indigo-500
                  text-sm
                  font-medium
                  transition
                "
              >
                <Edit3 size={16} />

                <span className="hidden sm:inline">
                  Edit Profile
                </span>

                <span className="sm:hidden">
                  Edit
                </span>
              </button>
            )}

        </div>
      </header>

      {/* ========================================= */}
      {/* MAIN */}
      {/* ========================================= */}

      <main className="
        max-w-5xl mx-auto
        px-4 sm:px-6
        py-6 sm:py-10
      ">

        {/* Success */}

        {success && (
          <div className="
            mb-5
            flex items-center gap-3
            px-4 py-3
            rounded-xl
            border border-emerald-500/20
            bg-emerald-500/10
            text-emerald-400
            text-sm
          ">
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="
            mb-5
            flex items-center gap-3
            px-4 py-3
            rounded-xl
            border border-red-500/20
            bg-red-500/10
            text-red-400
            text-sm
          ">
            <X size={18} />
            {error}
          </div>
        )}

        <div className="
          grid
          grid-cols-1
          lg:grid-cols-[320px_1fr]
          gap-5
        ">

          {/* ======================================= */}
          {/* PROFILE CARD */}
          {/* ======================================= */}

          <section className="
            rounded-2xl
            border border-white/10
            bg-white/[0.03]
            overflow-hidden
          ">

            <div className="
              h-28
              bg-gradient-to-r
              from-indigo-600/30
              via-purple-600/20
              to-cyan-500/20
            " />

            <div className="px-5 pb-6">

              {/* Avatar */}

              <div className="
                -mt-14
                mb-4
                flex justify-center
              ">

                <div className="
                  relative
                  w-28 h-28
                  rounded-full
                  border-4 border-slate-950
                  bg-indigo-600
                  overflow-hidden
                  flex items-center justify-center
                ">

                  {avatarSource ? (
                    <img
                      src={avatarSource}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <span className="
                      text-4xl
                      font-bold
                      text-white
                    ">
                      {avatarLetter}
                    </span>
                  )}

                  {isEditing && (
                    <>
                      <label
                        htmlFor="profile-image"
                        className="
                          absolute
                          bottom-1
                          right-1
                          w-9 h-9
                          rounded-full
                          bg-indigo-600
                          border-2 border-slate-950
                          flex items-center justify-center
                          cursor-pointer
                          hover:bg-indigo-500
                          transition
                        "
                      >
                        <Camera size={16} />

                        <input
                          id="profile-image"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}

                </div>

              </div>

              {/* Change photo button */}

              {isEditing && (
                <div className="flex justify-center mb-5">

                  <label
                    htmlFor="profile-image"
                    className="
                      flex items-center gap-2
                      px-3 py-2
                      rounded-xl
                      border border-white/10
                      bg-white/[0.04]
                      hover:bg-white/[0.08]
                      text-xs
                      text-slate-300
                      cursor-pointer
                      transition
                    "
                  >
                    <ImagePlus size={15} />
                    Choose Profile Photo
                  </label>

                </div>
              )}

              {/* Name */}

              <div className="text-center">

                <h2 className="text-xl font-bold">
                  {profile.name}
                </h2>

                {profile.username && (
                  <p className="text-sm text-indigo-400 mt-1">
                    @{profile.username}
                  </p>
                )}

                <div className="
                  flex items-center
                  justify-center
                  gap-2
                  mt-3
                ">

                  <span
                    className={`
                      w-2 h-2 rounded-full
                      ${
                        isOnline
                          ? "bg-emerald-400"
                          : "bg-slate-500"
                      }
                    `}
                  />

                  <span className="text-xs text-slate-400">
                    {isOnline
                      ? "Online"
                      : "Offline"}
                  </span>

                </div>

              </div>

              {/* Bio */}

              <div className="mt-6 text-center">

                <p className="
                  text-sm
                  text-slate-400
                  leading-6
                ">
                  {profile.bio ||
                    "No bio added yet."}
                </p>

              </div>

            </div>
          </section>

          {/* ======================================= */}
          {/* INFORMATION */}
          {/* ======================================= */}

          <section className="
            rounded-2xl
            border border-white/10
            bg-white/[0.03]
            overflow-hidden
          ">

            <div className="
              px-5 sm:px-6
              py-5
              border-b border-white/10
              flex items-center
              justify-between
            ">

              <div>

                <h2 className="font-semibold">
                  Personal Information
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {isEditing
                    ? "Update your profile information"
                    : "Your account information"}
                </p>

              </div>

              {isEditing && (
                <div className="
                  hidden sm:flex
                  items-center gap-2
                  text-xs text-indigo-400
                ">
                  <Edit3 size={14} />
                  Editing
                </div>
              )}

            </div>

            {/* ===================================== */}
            {/* VIEW MODE */}
            {/* ===================================== */}

            {!isEditing ? (
              <div className="p-5 sm:p-6">

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                ">

                  <InfoCard
                    icon={<User size={18} />}
                    label="Full Name"
                    value={profile.name}
                  />

                  <InfoCard
                    icon={<AtSign size={18} />}
                    label="Username"
                    value={
                      profile.username
                        ? `@${profile.username}`
                        : "Not added"
                    }
                  />

                  <InfoCard
                    icon={<Mail size={18} />}
                    label="Email"
                    value={profile.email}
                  />

                  <InfoCard
                    icon={<Phone size={18} />}
                    label="Phone"
                    value={
                      profile.phone ||
                      "Not added"
                    }
                  />

                  <InfoCard
                    icon={<Circle size={18} />}
                    label="Status"
                    value={
                      isOnline
                        ? "Online"
                        : "Offline"
                    }
                  />

                  <InfoCard
                    icon={<Calendar size={18} />}
                    label="Joined"
                    value={formatDate(
                      profile.createdAt
                    )}
                  />

                </div>

                <div className="
                  mt-4
                  p-4
                  rounded-xl
                  border border-white/10
                  bg-black/10
                ">

                  <p className="text-xs text-slate-500 mb-1">
                    Last Seen
                  </p>

                  <p className="text-sm text-slate-200">
                    {isOnline
                      ? "Active now"
                      : formatLastSeen(
                          profile.lastSeen
                        )}
                  </p>

                </div>

              </div>
            ) : (

              /* =================================== */
              /* EDIT MODE */
              /* =================================== */

              <form
                onSubmit={handleSave}
                className="p-5 sm:p-6"
              >

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-5
                ">

                  <FormField
                    icon={<User size={17} />}
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />

                  <FormField
                    icon={<AtSign size={17} />}
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />

                  {/* Email */}

                  <div className="sm:col-span-2">

                    <label className="
                      block
                      text-xs
                      font-medium
                      text-slate-400
                      mb-2
                    ">
                      Email
                    </label>

                    <div className="
                      flex items-center gap-3
                      h-12
                      px-4
                      rounded-xl
                      border border-white/10
                      bg-black/20
                      text-slate-500
                    ">

                      <Mail size={17} />

                      <span className="text-sm truncate">
                        {profile.email}
                      </span>

                    </div>

                    <p className="
                      text-[11px]
                      text-slate-600
                      mt-2
                    ">
                      Email cannot be changed here.
                    </p>

                  </div>

                  <FormField
                    icon={<Phone size={17} />}
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />

                  {/* Profile Image */}

                  <div>

                    <label className="
                      block
                      text-xs
                      font-medium
                      text-slate-400
                      mb-2
                    ">
                      Profile Photo
                    </label>

                    <label
                      htmlFor="profile-image"
                      className="
                        h-12
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        rounded-xl
                        border border-white/10
                        bg-black/20
                        text-slate-400
                        hover:border-indigo-500/60
                        hover:bg-white/[0.03]
                        cursor-pointer
                        transition
                      "
                    >
                      <Camera size={17} />

                      <span className="text-sm truncate">
                        {selectedImage
                          ? selectedImage.name
                          : "Choose a photo"}
                      </span>
                    </label>

                    <input
                      id="profile-image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <p className="
                      text-[11px]
                      text-slate-600
                      mt-2
                    ">
                      JPG, PNG or WEBP • Max 5 MB
                    </p>

                  </div>

                  {/* Bio */}

                  <div className="sm:col-span-2">

                    <label className="
                      block
                      text-xs
                      font-medium
                      text-slate-400
                      mb-2
                    ">
                      Bio
                    </label>

                    <div className="relative">

                      <FileText
                        size={17}
                        className="
                          absolute
                          left-4
                          top-4
                          text-slate-500
                        "
                      />

                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        maxLength={160}
                        rows={4}
                        placeholder="Tell something about yourself..."
                        className="
                          w-full
                          resize-none
                          rounded-xl
                          border border-white/10
                          bg-black/20
                          pl-11
                          pr-4
                          py-3
                          text-sm
                          text-white
                          placeholder:text-slate-600
                          outline-none
                          focus:border-indigo-500/60
                          focus:ring-2
                          focus:ring-indigo-500/10
                          transition
                        "
                      />

                    </div>

                    <div className="flex justify-end mt-1">

                      <span className="
                        text-[11px]
                        text-slate-600
                      ">
                        {formData.bio.length}/160
                      </span>

                    </div>

                  </div>

                </div>

                {/* Buttons */}

                <div className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                  mt-7
                  pt-5
                  border-t border-white/10
                ">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="
                      h-11
                      px-5
                      rounded-xl
                      border border-white/10
                      bg-white/[0.03]
                      hover:bg-white/[0.07]
                      text-sm
                      font-medium
                      text-slate-300
                      transition
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      h-11
                      px-5
                      rounded-xl
                      bg-indigo-600
                      hover:bg-indigo-500
                      text-sm
                      font-medium
                      text-white
                      flex items-center
                      justify-center
                      gap-2
                      transition
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                  >

                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Save Changes
                      </>
                    )}

                  </button>

                </div>

              </form>
            )}

          </section>

        </div>
      </main>
    </div>
  );
};

// ================================================
// INFO CARD
// ================================================

const InfoCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="
      p-4
      rounded-xl
      border border-white/10
      bg-black/10
    ">

      <div className="
        flex items-center
        gap-2
        mb-2
      ">

        <div className="
          w-8 h-8
          rounded-lg
          bg-indigo-500/10
          text-indigo-400
          flex items-center
          justify-center
        ">
          {icon}
        </div>

        <span className="text-xs text-slate-500">
          {label}
        </span>

      </div>

      <p className="
        text-sm
        text-slate-200
        break-words
      ">
        {value}
      </p>

    </div>
  );
};

// ================================================
// FORM FIELD
// ================================================

const FormField = ({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  return (
    <div>

      <label className="
        block
        text-xs
        font-medium
        text-slate-400
        mb-2
      ">
        {label}
      </label>

      <div className="relative">

        <span className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-slate-500
        ">
          {icon}
        </span>

        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full
            h-12
            rounded-xl
            border border-white/10
            bg-black/20
            pl-11
            pr-4
            text-sm
            text-white
            placeholder:text-slate-600
            outline-none
            focus:border-indigo-500/60
            focus:ring-2
            focus:ring-indigo-500/10
            transition
          "
        />

      </div>

    </div>
  );
};

export default UserProfile;
