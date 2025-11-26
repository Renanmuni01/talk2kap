// src/components/OfficialTable.jsx
import React, { useEffect, useState } from "react";
import { FiUser, FiStar, FiMessageCircle, FiXCircle } from "react-icons/fi";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

const emptyForm = { name: "", position: "Kagawad", rating: null };

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

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
      return "bg-gray-100 text-gray-600";
    return rating >= 4 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  const createOfficial = async () => {
    if (!form.name.trim()) return alert("Please enter a name");

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    await push(ref(db, "officials"), { ...form });
    setForm(emptyForm);
  };

  const startEdit = (o) => {
    setEditing(o.id);
    setForm({ name: o.name, position: o.position, rating: o.rating ?? null });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update(ref(db, `officials/${editing}`), {
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Background watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.18,
          filter: "brightness(1.4) contrast(1.1)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Total Officials", value: stats.total, color: "indigo" },
            { title: "Top Rated (≥4⭐)", value: stats.topRated, color: "green" },
            { title: "Needs Improvement (<4⭐)", value: stats.lowRated, color: "yellow" },
          ].map((s, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl shadow-lg border-2 border-${s.color}-200 p-6 hover:shadow-2xl transition-shadow`}
            >
              <p className="text-sm font-semibold text-gray-500">{s.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Search officials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "topRated", "lowRated"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? `All (${stats.total})`
                  : f === "topRated"
                  ? `Top Rated (${stats.topRated})`
                  : `Needs Improvement (${stats.lowRated})`}
              </button>
            ))}
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit Official" : "Add Official"}</h3>
          <div className="flex flex-wrap gap-4">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Kapitan">Kapitan</option>
              <option value="Kagawad">Kagawad</option>         
              <option value="Secretary">Secretary</option>
              <option value="Treasurer">Treasurer</option>
            </select>
            {editing ? (
              <>
                <button
                  onClick={saveEdit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={createOfficial}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Officials Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                {["Name", "Position", "Rating", "Feedback", "Actions"].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-4 text-left text-sm font-bold text-gray-700"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2">
                    <FiUser className="text-indigo-600" /> {o.name}
                  </td>
                  <td className="px-6 py-4">{o.position}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingBadge(o.rating)}`}
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
                    <button
                      onClick={() => startEdit(o)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteOfficial(o.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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
          <FeedbackModal
            official={selectedOfficial}
            onClose={() => setSelectedOfficial(null)}
          />
        )}
      </div>
    </div>
  );
}

// Feedback Modal
function FeedbackModal({ official, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const feedbackRef = ref(db, `officials/${official.id}/feedback`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFeedbacks(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else setFeedbacks([]);
    });
    return () => unsubscribe();
  }, [official.id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative flex flex-col max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiXCircle size={22} />
        </button>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <FiUser className="text-indigo-600" /> {official.name}
        </h2>
        <p className="text-gray-600 mb-2">{official.position}</p>
        <p className="text-yellow-600 font-semibold flex items-center gap-1 mb-4">
          <FiStar /> Rating: {official.rating !== null ? official.rating + "⭐" : "N/A"}
        </p>
        <div className="space-y-3 pr-2">
          {feedbacks.length > 0 ? (
            feedbacks.map((f) => (
              <div key={f.id} className="bg-gray-100 rounded-lg p-3 shadow-sm border">
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
