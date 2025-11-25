// src/components/OfficialTable.jsx
import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiStar,
  FiSearch,
  FiXCircle,
  FiMessageCircle,
} from "react-icons/fi";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

// Default form: rating is null so new officials are unrated
const emptyForm = { name: "", position: "Kagawad", rating: null };

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Realtime fetch of officials
  useEffect(() => {
    const officialsRef = ref(db, "officials");
    const unsubscribe = onValue(officialsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setOfficials(list);
    });
    return () => unsubscribe();
  }, []);

  // Filter logic
  const filtered = officials.filter((o) => {
    const matchesSearch =
      o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "topRated" && o.rating >= 4) ||
      (filter === "lowRated" && o.rating < 4 && o.rating !== null);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: officials.length,
    topRated: officials.filter((o) => o.rating >= 4).length,
    lowRated: officials.filter((o) => o.rating < 4 && o.rating !== null).length,
  };

  const getRatingBadge = (rating) => {
    if (rating === null || rating === undefined)
      return "bg-gray-100 text-gray-600"; // unrated badge
    return rating >= 4 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  // Create new official
  const createOfficial = async () => {
    if (!form.name.trim()) {
      alert("Please enter a name");
      return;
    }

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) {
        alert("Only one Kapitan can be added!");
        return;
      }
    }

    const officialsRef = ref(db, "officials");
    await push(officialsRef, { ...form });
    setForm(emptyForm);
  };

  // Edit
  const startEdit = (o) => {
    setEditing(o.id);
    setForm({
      name: o.name,
      position: o.position,
      rating: o.rating ?? null,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const r = ref(db, `officials/${editing}`);
    await update(r, {
      name: form.name,
      position: form.position,
      rating: form.rating !== null ? Number(form.rating) : null,
    });
    setEditing(null);
    setForm(emptyForm);
  };

  const deleteOfficial = async (id) => {
    if (!confirm("Delete this official?")) return;
    await remove(ref(db, `officials/${id}`));
  };

  return (
    <div className="relative min-h-screen space-y-6 p-6">
      {/* Background Watermark Logo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.4,
          filter: "brightness(1.4) contrast(1.1)",
        }}
        aria-hidden="true"
      />

      {/* Content with higher z-index */}
      <div className="relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Total Officials", value: stats.total },
            { title: "Top Rated (≥4⭐)", value: stats.topRated },
            { title: "Needs Improvement (<4⭐)", value: stats.lowRated },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white/75 p-4 rounded-lg shadow-sm flex items-center justify-between border backdrop-blur-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-sm text-gray-600">{s.title}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white/70 rounded-lg shadow-sm border p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search officials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("topRated")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "topRated" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Top Rated ({stats.topRated})
            </button>
            <button
              onClick={() => setFilter("lowRated")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === "lowRated" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Needs Improvement ({stats.lowRated})
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white/70 p-4 rounded-lg shadow-sm border mb-4">
          <h3 className="font-semibold mb-2">{editing ? "Edit Official" : "Add Official"}</h3>
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-md px-3 py-2"
            />
            <select
              className="border rounded-md px-3 py-2"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              <option value="Kapitan">Kapitan</option>
              <option value="Kagawad">Kagawad</option>
            </select>
            {editing ? (
              <>
                <button
                  onClick={saveEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={createOfficial}
                className="bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Officials Table */}
        <div className="bg-white/70 rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-gray-50/70 border-b">
              <tr>
                {["Name", "Position", "Rating", "Feedback", "Actions"].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2">
                    <FiUser /> {o.name}
                  </td>
                  <td className="px-6 py-4">{o.position}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingBadge(
                        o.rating
                      )}`}
                    >
                      {o.rating !== null ? o.rating + "⭐" : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOfficial(o)}
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <FiMessageCircle /> View Feedback
                    </button>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => startEdit(o)}>Edit</button>
                    <button onClick={() => deleteOfficial(o.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">No officials found.</div>
          )}
        </div>

        {selectedOfficial && (
          <FeedbackModal official={selectedOfficial} onClose={() => setSelectedOfficial(null)} />
        )}
      </div>
    </div>
  );
}

// Feedback Modal — shows comments & ratings from Firebase
function FeedbackModal({ official, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const feedbackRef = ref(db, `officials/${official.id}/feedback`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const feedbackArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setFeedbacks(feedbackArray);
      } else {
        setFeedbacks([]);
      }
    });
    return () => unsubscribe();
  }, [official.id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative flex flex-col max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiXCircle size={22} />
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiUser /> {official.name}
        </h2>
        <p className="text-gray-600 mb-2">{official.position}</p>
        <p className="text-yellow-600 font-medium flex items-center gap-1 mb-4">
          <FiStar /> Rating: {official.rating !== null ? official.rating + "⭐" : "N/A"}
        </p>

        <div className="space-y-3 pr-2">
          {feedbacks.length > 0 ? (
            feedbacks.map((f, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-3 shadow-sm border">
                <p className="text-sm text-gray-900">
                  <strong>{f.citizen || "Anonymous"}:</strong> {f.comment}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ⭐ {f.rating || 0} — {f.timestamp ? new Date(f.timestamp).toLocaleString() : "No date"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-sm">No feedback yet for this official.</p>
          )}
        </div>
      </div>
    </div>
  );
}
