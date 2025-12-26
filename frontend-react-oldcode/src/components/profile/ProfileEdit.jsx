import { useState } from "react";
import axios from "axios";

export default function ProfileEdit({ user, onClose, onSave }) {
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`https://meta-cow.onrender.com/api/users/${user._id}/profile`, {
        username,
        bio,
        profileImage,
      });
      onSave(res.data); // callback to update parent state
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      const res = await axios.post("https://meta-cow.onrender.com/api/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImage(res.data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("❌ Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">✏️ Edit Profile</h3>

      {/* Username */}
      <div className="space-y-2">
        <label className="text-sm text-gray-600">Username</label>
        <input
          type="text"
          className="w-full border rounded-lg p-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="text-sm text-gray-600">Bio</label>
        <textarea
          className="w-full border rounded-lg p-2 text-sm"
          rows="3"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {/* Profile Image Upload */}
      <div className="space-y-2">
        <label className="text-sm text-gray-600">Profile Image</label>
        {profileImage && (
          <img
            src={profileImage}
            alt="Preview"
            className="w-16 h-16 rounded-full object-cover border border-gray-300 mb-2"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block text-sm text-gray-600"
        />
        {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
