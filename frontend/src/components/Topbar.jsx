import { useAuth } from "../context/AuthContext";

const uploadBaseUrl = import.meta.env.VITE_UPLOAD_URL || "http://localhost:5000";

const Topbar = () => {
  const { user } = useAuth();

  const profileImageUrl = user?.profileImage
    ? `${uploadBaseUrl}/${user.profileImage}`
    : "";

  return (
    <header className="topbar">
      <div>
        <h1>Banners Hallmark Task Management System</h1>
        <p>Manage Hallmark team tasks, workflow, files, and productivity.</p>
      </div>

      <div className="topbar-user">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt="Profile"
            className="topbar-profile-img"
          />
        ) : (
          <div className="topbar-avatar">{user?.name?.charAt(0) || "U"}</div>
        )}

        <div>
          <strong>{user?.name || "User"}</strong>
          <p>{user?.role || "USER"}</p>
        </div>
      </div>
    </header>
  );
};

export default Topbar;