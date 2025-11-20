/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Profiles, ProfilesUpdate } from "./types/database";
import { createClient } from "./lib/supabase";
import { useAuth } from "./contexts/useAuth";

const Profile = () => {
  const [profiles, setProfiles] = useState<Profiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profiles | null>(null);
  const [editedFields, setEditedFields] = useState<Partial<Profiles>>({});
  const [newProfile, setNewProfile] = useState<Partial<Profiles>>({
    full_name: "",
    email: "",
    phone: "",
  });
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchProfiles();
    } else {
      setProfiles([]);
    }
  }, [token]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching profiles:", error);
        return;
      }
      setProfiles(data || []);
    } catch (err) {
      console.error("💥 Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes for editing
  const handleFieldChange = (field: keyof Profiles, value: any) => {
    if (editingProfile) {
      setEditingProfile((prev) => (prev ? { ...prev, [field]: value } : null));
      setEditedFields((prev) => ({ ...prev, [field]: value }));
    }
  };

  // CREATE - Add new profile
  const createProfile = async () => {
    if (!newProfile.email || !newProfile.full_name) {
      alert("Email and Full Name are required");
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            ...newProfile,
            loyalty_points: 0,
            total_orders: 0,
            total_spent: 0,
            notification_preferences: { sms: false, push: true, email: true },
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setProfiles((prev) => [data[0], ...prev]);
        setNewProfile({ full_name: "", email: "", phone: "" });
        alert("Profile created successfully!");
      }
    } catch (error: any) {
      console.error("❌ Create error:", error);
      alert(`Error creating profile: ${error.message}`);
    }
  };

  // UPDATE - Edit existing profile
  const updateProfile = async () => {
    if (!editingProfile) return;

    try {
      const supabase = createClient();

      // Send only the fields that were actually edited
      const updates: ProfilesUpdate = { ...editedFields };

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", editingProfile.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === editingProfile.id ? data[0] : p))
        );
        setEditingProfile(null);
        setEditedFields({});
        alert("Profile updated successfully!");
      } else {
        // If no data returned, refetch to get updated state
        fetchProfiles();
        setEditingProfile(null);
        setEditedFields({});
        alert("Profile updated successfully!");
      }
    } catch (error: any) {
      alert(`Error updating profile: ${error.message}`);
    }
  };

  // DELETE - Remove profile
  const deleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;

      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      alert("Profile deleted successfully!");
    } catch (error: any) {
      alert(`Error deleting profile: ${error.message}`);
    }
  };

  const canModifyProfile = (profile: Profiles) => {
    // Get current user's profile to check their role
    const currentUserProfile = profiles.find((p) => p.id === user?.id);
    const isAdmin = currentUserProfile?.preferences?.app_role === "app_admin";

    return isAdmin || user?.id === profile.id;
  };

  // Reset editing when canceling
  const cancelEdit = () => {
    setEditingProfile(null);
    setEditedFields({});
  };

  if (!token) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Please log in to view profiles</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading profiles...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Profiles</h1>

      {/* CREATE FORM */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h3>Create New Profile</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={newProfile.full_name || ""}
            onChange={(e) =>
              setNewProfile((prev) => ({ ...prev, full_name: e.target.value }))
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={newProfile.email || ""}
            onChange={(e) =>
              setNewProfile((prev) => ({ ...prev, email: e.target.value }))
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Phone (Optional)"
            value={newProfile.phone || ""}
            onChange={(e) =>
              setNewProfile((prev) => ({ ...prev, phone: e.target.value }))
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={createProfile}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Create Profile
          </button>
        </div>
      </div>

      {/* EDIT FORM */}
      {editingProfile && (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            border: "1px solid #ffa500",
            borderRadius: "8px",
            backgroundColor: "#fff9e6",
          }}
        >
          <h3>Edit Profile: {editingProfile.full_name}</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="email"
              placeholder="Email"
              value={editingProfile.email || ""}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="text"
              placeholder="Full Name"
              value={editingProfile.full_name || ""}
              onChange={(e) => handleFieldChange("full_name", e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="text"
              placeholder="Phone"
              value={editingProfile.phone || ""}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="text"
              placeholder="Avatar URL"
              value={editingProfile.avatar_url || ""}
              onChange={(e) => handleFieldChange("avatar_url", e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={updateProfile}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PROFILES LIST */}
      {profiles.length === 0 ? (
        <p>No profiles found</p>
      ) : (
        profiles &&
        profiles?.map((profile) => (
          <div
            key={profile.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              margin: "10px 0",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3>{profile?.full_name || "No Name"}</h3>
                <p>
                  <strong>Email:</strong> {profile?.email}
                </p>
                <p>
                  <strong>Loyalty Points:</strong> {profile.loyalty_points}
                </p>
                <p>
                  <strong>Phone:</strong> {profile.phone || "No phone"}
                </p>
                <p>
                  <strong>ID:</strong> {profile.id}
                </p>
                {profile.preferences?.app_role && (
                  <p>
                    <strong>Role:</strong> {profile.preferences.app_role}
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {canModifyProfile(profile) && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setEditingProfile(profile)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Profile;
