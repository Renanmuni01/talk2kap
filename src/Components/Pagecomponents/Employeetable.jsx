import React, { useEffect, useState } from "react";
import { FiUser, FiStar, FiMessageCircle, FiXCircle } from "react-icons/fi";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

const emptyForm = { name: "", position: "BARANGAY UTILITY" };

export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("All Positions");

  const positionOptions = [
    "All Positions",
    "BARANGAY UTILITY",
    "DAY CARE SERVICES",
    "VAWC",
    "BNS",
    "BHW",
    "CHIEF BANTAY BAYAN",
    "BANTAY BAYAN",
    "BANTAY BAYAN/UTILITY",
    "BANTAY BAYAN/DRIVER",
    "LUPON TAGAPAMAYAPA"
  ];

  // FETCH DATA with calculated ratings from feedback
  // Structure: employees/{employeeUniqueID}/feedback/{feedbackUniqueID}/rating
  useEffect(() => {
    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([employeeId, employeeData]) => {
        // Calculate average rating from feedback
        let calculatedRating = null;
        
        // Check if feedback exists under this employee
        if (employeeData.feedback) {
          const feedbacks = Object.values(employeeData.feedback);
          
          // Extract all rating values from each feedback
          const ratings = feedbacks
            .map(feedback => {
              const rating = feedback.rating;
              // Handle both number and string ratings
              if (rating !== null && rating !== undefined && rating !== '') {
                const numRating = Number(rating);
                return !isNaN(numRating) && numRating > 0 ? numRating : null;
              }
              return null;
            })
            .filter(r => r !== null);
          
          // Calculate average if we have valid ratings
          if (ratings.length > 0) {
            const sum = ratings.reduce((acc, r) => acc + r, 0);
            calculatedRating = Number((sum / ratings.length).toFixed(1));
          }
        }

        return {
          id: employeeId,
          name: employeeData.name || '',
          position: employeeData.position || 'N/A',
          rating: calculatedRating,
          feedback: employeeData.feedback || {},
        };
      });
      setEmployees(list);
    });
    return () => unsubscribe();
  }, []);

  // FILTER LOGIC
  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "highRated" && e.rating !== null && Number(e.rating) >= 4) ||
      (filter === "lowRated" && e.rating !== null && Number(e.rating) < 4) ||
      (filter === "noRating" && e.rating === null);

    const matchesPosition = positionFilter === "All Positions" || e.position === positionFilter;

    return matchesSearch && matchesFilter && matchesPosition;
  });

  const stats = {
    total: employees.length,
    highRated: employees.filter((e) => e.rating !== null && Number(e.rating) >= 4).length,
    lowRated: employees.filter((e) => e.rating !== null && Number(e.rating) < 4).length,
    noRating: employees.filter((e) => e.rating === null).length,
  };

  const getRatingBadge = (rating) => {
    if (rating === null || rating === undefined) {
      return "bg-gray-100 text-gray-600";
    }
    const numRating = Number(rating);
    return numRating >= 4
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  // CRUD
  const createEmployee = async () => {
    if (!form.name.trim()) return alert("Please enter a name");
    await push(ref(db, "employees"), { 
      name: form.name,
      position: form.position 
    });
    setForm(emptyForm);
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setForm({ name: e.name, position: e.position });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update(ref(db, `employees/${editing}`), {
      name: form.name,
      position: form.position,
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
      {/* Watermark */}
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
            { title: "No Rating", value: stats.noRating, color: "gray" }
          ].map((s, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl shadow-lg border-2 border-${s.color}-200 p-6 hover:shadow-2xl transition-shadow`}
            >
              <p className="text-sm text-gray-500 font-semibold">{s.title}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Dropdown Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {positionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <div className="flex gap-2 flex-wrap">
            {["all", "highRated", "lowRated", "noRating"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
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

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">{editing ? "Edit Employee" : "Add Employee"}</h3>
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
              {positionOptions.filter((p) => p !== "All Positions").map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {editing ? (
              <>
                <button 
                  onClick={saveEdit} 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={createEmployee} 
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                {["Name", "Position", "Rating", "Feedback Count", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left font-bold text-gray-700 text-sm">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const feedbackCount = e.feedback ? Object.keys(e.feedback).length : 0;
                return (
                  <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <FiUser className="text-indigo-600" /> {e.name}
                    </td>
                    <td className="px-6 py-4">{e.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingBadge(e.rating)}`}>
                        {e.rating !== null && e.rating !== undefined 
                          ? Number(e.rating).toFixed(1) + "⭐" 
                          : "No rating yet"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedEmployee(e)}
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <FiMessageCircle /> {feedbackCount} {feedbackCount === 1 ? 'feedback' : 'feedbacks'}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => startEdit(e)} 
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteEmployee(e.id)} 
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">No employees found.</div>
          )}
        </div>

        {selectedEmployee && (
          <FeedbackModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
        )}
      </div>
    </div>
  );
}

function FeedbackModal({ employee, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const feedbackRef = ref(db, `employees/${employee.id}/feedback`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFeedbacks(
          Object.entries(data).map(([id, value]) => ({ id, ...value }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Sort by newest first
        );
      } else {
        setFeedbacks([]);
      }
    });
    return () => unsubscribe();
  }, [employee.id]);

  const getRatingStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`${
            i <= numRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          size={16}
        />
      );
    }
    return stars;
  };

  const getPerformanceBadge = (rating) => {
    const numRating = Number(rating) || 0;
    if (numRating >= 4.5) return { text: "Excellent", color: "bg-green-500" };
    if (numRating >= 4) return { text: "Very Good", color: "bg-emerald-500" };
    if (numRating >= 3) return { text: "Good", color: "bg-yellow-500" };
    if (numRating >= 2) return { text: "Fair", color: "bg-orange-500" };
    return { text: "Needs Improvement", color: "bg-red-500" };
  };

  const avgRating = employee.rating !== null && employee.rating !== undefined 
    ? Number(employee.rating) 
    : 0;
  const badge = getPerformanceBadge(avgRating);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <FiXCircle size={28} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <FiUser className="text-white" size={40} />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{employee.name}</h2>
              <p className="text-indigo-100 text-sm font-medium mb-3">{employee.position}</p>
              
              {/* Rating Display */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 inline-block">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/80 text-xs font-medium mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-white">
                        {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                      </span>
                      <div className="flex gap-0.5">
                        {getRatingStars(avgRating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l border-white/30 pl-3">
                    <p className="text-white/80 text-xs font-medium mb-1">Total Reviews</p>
                    <p className="text-2xl font-bold text-white">{feedbacks.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Performance Badge */}
              {avgRating > 0 && (
                <div className="mt-3">
                  <span className={`${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {badge.text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback List Section */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiMessageCircle className="text-indigo-600" />
              Citizen Feedback
            </h3>
            {feedbacks.length > 0 && (
              <span className="text-sm text-gray-500">
                {feedbacks.length} {feedbacks.length === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {feedbacks.length > 0 ? (
              feedbacks.map((f, index) => (
                <div 
                  key={f.id} 
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-100 rounded-full p-2">
                        <FiUser className="text-indigo-600" size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {f.citizen || "Anonymous Citizen"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {f.timestamp 
                            ? new Date(f.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "No date"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Individual Rating Stars */}
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <div className="flex gap-0.5">
                        {getRatingStars(f.rating)}
                      </div>
                      <span className="text-xs font-bold text-gray-700 ml-1">
                        {f.rating || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Comment */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-4 border-indigo-600">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {f.comment || "No comment provided"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-gray-400" size={40} />
                </div>
                <p className="text-gray-500 font-medium">No feedback yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  This employee hasn't received any citizen feedback
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}