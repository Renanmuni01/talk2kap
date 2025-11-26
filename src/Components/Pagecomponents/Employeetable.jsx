// src/components/EmployeeTable.jsx
import React, { useEffect, useState } from "react";
import { FiUser, FiStar, FiMessageCircle, FiXCircle } from "react-icons/fi";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

const emptyForm = { name: "", position: "Staff", rating: null };

export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setEmployees(list);
    });
    return () => unsubscribe();
  }, []);

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "highRated" && e.rating >= 4) ||
      (filter === "lowRated" && e.rating !== null && e.rating < 4) ||
      (filter === "noRating" && e.rating === null);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: employees.length,
    highRated: employees.filter((e) => e.rating >= 4).length,
    lowRated: employees.filter((e) => e.rating !== null && e.rating < 4).length,
    noRating: employees.filter((e) => e.rating === null).length,
  };

  const getRatingBadge = (rating) => {
    if (rating === null) return "bg-gray-100 text-gray-600";
    return rating >= 4 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  // CRUD
  const createEmployee = async () => {
    if (!form.name.trim()) return alert("Please enter a name");
    await push(ref(db, "employees"), { ...form });
    setForm(emptyForm);
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setForm({ name: e.name, position: e.position, rating: e.rating ?? null });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update(ref(db, `employees/${editing}`), {
      name: form.name,
      position: form.position,
      rating: form.rating !== null ? Number(form.rating) : null,
    });
    setEditing(null);
    setForm(emptyForm);
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await remove(ref(db, `employees/${id}`));
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: "Total Employees", value: stats.total, color: "indigo" },
            { title: "High Rated (≥4⭐)", value: stats.highRated, color: "green" },
            { title: "Needs Improvement (<4⭐)", value: stats.lowRated, color: "yellow" },
            { title: "No Rating", value: stats.noRating, color: "gray" },
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
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "highRated", "lowRated", "noRating"].map((f) => (
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
                  : f === "highRated"
                  ? `High Rated (${stats.highRated})`
                  : f === "lowRated"
                  ? `Needs Improvement (${stats.lowRated})`
                  : `No Rating (${stats.noRating})`}
              </button>
            ))}
          </div>
        </div>

       {/* Add/Edit Form */}
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
  <h3 className="text-lg font-bold mb-4">{editing ? "Edit Employee" : "Add Employee"}</h3>
  <div className="flex flex-wrap gap-4">
    <input
      placeholder="Name"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <input
      placeholder="Position"
      value={form.position}
      onChange={(e) => setForm({ ...form, position: e.target.value })}
      className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
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
        onClick={createEmployee}
        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
      >
        Add
      </button>
    )}
  </div>
</div>


        {/* Employees Table */}
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
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-2">
                    <FiUser className="text-indigo-600" /> {e.name}
                  </td>
                  <td className="px-6 py-4">{e.position}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingBadge(
                        e.rating
                      )}`}
                    >
                      {e.rating !== null ? e.rating + "⭐" : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedEmployee(e)}
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <FiMessageCircle /> View Feedback
                    </button>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => startEdit(e)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEmployee(e.id)}
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
            <div className="text-center py-8 text-gray-500">No employees found.</div>
          )}
        </div>

        {/* Feedback Modal */}
        {selectedEmployee && (
          <FeedbackModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}
      </div>
    </div>
  );
}

// Feedback Modal
function FeedbackModal({ employee, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const feedbackRef = ref(db, `employees/${employee.id}/feedback`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFeedbacks(Object.entries(data).map(([id, value]) => ({ id, ...value })));
    });
    return () => unsubscribe();
  }, [employee.id]);

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
          <FiUser className="text-indigo-600" /> {employee.name}
        </h2>
        <p className="text-gray-600 mb-2">{employee.position}</p>
        <p className="text-yellow-600 font-semibold flex items-center gap-1 mb-4">
          <FiStar /> Rating: {employee.rating !== null ? employee.rating + "⭐" : "N/A"}
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
            <p className="text-gray-500 italic text-sm">No feedback yet for this employee.</p>
          )}
        </div>
      </div>
    </div>
  );
}
