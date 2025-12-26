import { useState } from "react";
import axios from "axios";
import RenderLoadingNotice from "../RenderLoadingNotice";

export default function RegisterProfile({ wallet, onRegister }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!wallet) return setError("Wallet not connected.");
    if (!username.trim()) return setError("Username is required.");

    // Ensure ".cow" is auto-appended
    const finalUsername = username.trim().toLowerCase().endsWith(".cow")
      ? username.trim().toLowerCase()
      : `${username.trim().toLowerCase()}.cow`;

    try {
      setLoading(true);
      setError("");

      const res = await axios.post("https://meta-cow.onrender.com/api/users/register", {
        wallet: wallet.toLowerCase(),
        username: finalUsername,
      });

      setSuccess(true);
      onRegister(res.data); // ✅ Send new user to parent
    } catch (err) {
      console.error("Registration failed", err);
      if (err?.response?.status === 409) {
        setError("This username is already taken.");
      } else if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <RenderLoadingNotice show={loading} />;

  return (
    <div className="bg-white max-w-xl mx-auto  rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
      <div className="text-4xl mb-4">👋 Welcome!</div>
      <p className="text-gray-600 mb-6">
        Let's register your <strong>.cow</strong> username.
      </p>

      {success ? (
        <div className="text-green-600 text-lg font-medium">
          🎉 Registered successfully!
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="yourname"
            className="border rounded-xl px-4 py-2 text-center"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            disabled={loading}
          />

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register yourname.cow"}
          </button>
        </div>
      )}
    </div>
  );
}
