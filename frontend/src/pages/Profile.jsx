import { useState } from "react";
import {
  Mail,
  Shield,
  Building2,
  Briefcase,
  UserCircle,
  Upload,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const uploadBaseUrl = import.meta.env.VITE_UPLOAD_URL || "http://localhost:5000";

const Profile = () => {
  const { user, saveUser } = useAuth();

  const [file, setFile] = useState(null);
  const [localUser, setLocalUser] = useState(user);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  const profileImageUrl = localUser?.profileImage
    ? `${uploadBaseUrl}/${localUser.profileImage}`
    : "";

  const handleUpload = async () => {
    if (!file) {
      setMessageType("error");
      setMessage("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");

      const res = await api.put("/users/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      saveUser(res.data.user);
      setLocalUser(res.data.user);

      setMessageType("success");
      setMessage("Profile picture updated successfully.");
      setFile(null);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {message && (
        <div
          className={
            messageType === "error"
              ? "profile-message error"
              : "profile-message"
          }
        >
          {message}
        </div>
      )}

      <div className="profile-header">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt="Profile"
            className="profile-photo-large"
          />
        ) : (
          <div className="profile-avatar-large">
            {localUser?.name?.charAt(0) || "U"}
          </div>
        )}

        <div>
          <h2>{localUser?.name || "User"}</h2>
          <p>Hallmark Task Management System account profile</p>

          <div className="profile-upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button onClick={handleUpload} disabled={loading}>
              <Upload size={16} />
              {loading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-icon">
            <UserCircle size={24} />
          </div>

          <div>
            <span>Full Name</span>
            <strong>{localUser?.name || "Not available"}</strong>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-icon">
            <Mail size={24} />
          </div>

          <div>
            <span>Email Address</span>
            <strong>{localUser?.email || "Not available"}</strong>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-icon">
            <Shield size={24} />
          </div>

          <div>
            <span>Role</span>
            <strong>{localUser?.role || "Not available"}</strong>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-icon">
            <Building2 size={24} />
          </div>

          <div>
            <span>Department</span>
            <strong>{localUser?.department || "Not assigned"}</strong>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-icon">
            <Briefcase size={24} />
          </div>

          <div>
            <span>Position</span>
            <strong>{localUser?.position || "Not assigned"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;