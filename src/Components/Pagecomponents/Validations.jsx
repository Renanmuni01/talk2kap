import React, { useState, useEffect, useMemo } from "react";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiHome,
  FiX,
  FiSearch,
  FiCheck,
  FiSlash,
  FiTrash2,
} from "react-icons/fi";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // ✅ Purok filter (now always shows Purok 1-5)
  const [purokFilter, setPurokFilter] = useState("All Purok");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUsers([]);
        return;
      }

      const userArray = Object.keys(data).map((key) => {
        const user = data[key];
        return {
          id: key,
          complainant: `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.trim(),
          ...user,
          idstatus: user.idstatus || "pending",
        };
      });

      // ✅ Sort: pending first, then declined, then approved, then alphabetically
      const order = { pending: 0, declined: 1, approved: 2 };
      userArray.sort((a, b) => {
        const ao = order[a.idstatus] ?? 9;
        const bo = order[b.idstatus] ?? 9;
        if (ao !== bo) return ao - bo;
        return (a.complainant || "").localeCompare(b.complainant || "");
      });

      setUsers(userArray);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Purok dropdown options: ALWAYS include Purok 1–5 + (optional) extras from DB
  const purokOptions = useMemo(() => {
    const base = ["All Purok", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];

    // Collect extra puroks found in DB (e.g., "6", "7", "A", etc.)
    const unique = new Set();
    users.forEach((u) => {
      const p = u.purok;
      if (p !== null && p !== undefined && String(p).trim() !== "") {
        unique.add(String(p).trim());
      }
    });

    // Convert to labels like "Purok X"
    const extraLabels = Array.from(unique).map((p) => `Purok ${p}`);

    // Remove duplicates against base, then sort extras (numeric-friendly)
    const baseSet = new Set(base);
    const extrasDeduped = extraLabels
      .filter((label) => !baseSet.has(label))
      .sort((a, b) => {
        const pa = a.replace(/^Purok\s+/i, "").trim();
        const pb = b.replace(/^Purok\s+/i, "").trim();
        const na = Number(pa);
        const nb = Number(pb);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return pa.localeCompare(pb);
      });

    return [...base, ...extrasDeduped];
  }, [users]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      pending: users.filter((u) => u.idstatus === "pending").length,
      approved: users.filter((u) => u.idstatus === "approved").length,
      declined: users.filter((u) => u.idstatus === "declined").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return users.filter((user) => {
      const matchesFilter = filter === "all" || user.idstatus === filter;

      const matchesSearch =
        (user.complainant || "").toLowerCase().includes(term) ||
        String(user.number || "").toLowerCase().includes(term) ||
        String(user.purok || "").toLowerCase().includes(term) ||
        String(user.address || "").toLowerCase().includes(term);

      // ✅ matches purok dropdown
      const matchesPurok =
        purokFilter === "All Purok"
          ? true
          : `Purok ${String(user.purok ?? "").trim()}` === purokFilter;

      return matchesFilter && matchesSearch && matchesPurok;
    });
  }, [users, filter, searchTerm, purokFilter]);

  const updateStatus = async (id, newStatus) => {
    const userRef = ref(db, `users/${id}`);
    try {
      await update(userRef, { idstatus: newStatus });

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, idstatus: newStatus } : u)));

      if (selectedUser && selectedUser.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, idstatus: newStatus } : prev));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const deleteUser = async (id) => {
    const ok = window.confirm("Delete this user permanently? This cannot be undone.");
    if (!ok) return;

    try {
      await remove(ref(db, `users/${id}`));

      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const statusChip = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "approved") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "declined") return "bg-rose-100 text-rose-800 border-rose-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Background watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.16,
          filter: "brightness(1.35) contrast(1.08)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3" />

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full lg:w-[420px]">
              <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, contact, purok, address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ✅ Purok Filter dropdown (Purok 1–5 always included) */}
            <div className="w-full sm:w-56">
              <select
                value={purokFilter}
                onChange={(e) => setPurokFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm font-bold text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {purokOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats + Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stats */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="relative p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{key}</p>
                  <p
                    className={`mt-1 text-3xl font-extrabold tracking-tight ${
                      key === "approved"
                        ? "text-emerald-700"
                        : key === "pending"
                        ? "text-amber-700"
                        : key === "declined"
                        ? "text-rose-700"
                        : "text-gray-900"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-3">Filter</p>

              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {["all", "pending", "approved", "declined"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                      filter === f
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Name", "Contact", "Purok", "Address", "ID Verification", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-600 ${
                        h === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-indigo-50/50`}
                    onClick={() => setSelectedUser(user)}
                    role="button"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{user.complainant || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">{user.number || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">Purok {user.purok || "—"}</span>
                    </td>
                    <td className="px-6 py-4 max-w-sm truncate" title={user.address || ""}>
                      <span className="text-sm text-gray-700">{user.address || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {user.id_verification ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <FiCheck /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-slate-100 text-slate-700 border-slate-200">
                          <FiSlash /> None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${statusChip(
                          user.idstatus
                        )}`}
                      >
                        {(user.idstatus || "pending").charAt(0).toUpperCase() +
                          (user.idstatus || "pending").slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        title="Delete user"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500 font-semibold">
                      No registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedUser && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="bg-white rounded-[22px] w-full max-w-2xl relative shadow-2xl overflow-hidden border border-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-6 text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <button
                  className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
                  onClick={() => setSelectedUser(null)}
                  title="Close"
                >
                  <FiX size={22} />
                </button>
                <div className="relative">
                  <h2 className="text-xl md:text-2xl font-extrabold">User Details</h2>
                  <p className="text-indigo-100 text-xs font-semibold mt-1">ID: {selectedUser.id}</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${statusChip(selectedUser.idstatus)}`}>
                  <span className="font-extrabold text-sm">
                    Status:{" "}
                    {(selectedUser.idstatus || "pending").charAt(0).toUpperCase() +
                      (selectedUser.idstatus || "pending").slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoRow label="Name" value={selectedUser.complainant} icon={<FiUser className="text-indigo-600" size={18} />} tone="indigo" />
                    <InfoRow label="Contact" value={selectedUser.number} icon={<FiPhone className="text-emerald-600" size={18} />} tone="emerald" />
                    <InfoRow label="Purok" value={selectedUser.purok} icon={<FiMapPin className="text-amber-600" size={18} />} tone="amber" />
                    <InfoRow label="Address" value={selectedUser.address} icon={<FiHome className="text-purple-600" size={18} />} tone="purple" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">ID Verification</p>

                    {selectedUser.id_verification ? (
                      <img
                        src={selectedUser.id_verification}
                        alt="ID"
                        onClick={() => setPreviewImage(selectedUser.id_verification)}
                        className="w-full max-w-sm h-auto object-cover rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                      />
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-600 font-semibold">
                        No ID submitted
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <button
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition shadow-md"
                    onClick={() => updateStatus(selectedUser.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md"
                    onClick={() => updateStatus(selectedUser.id, "declined")}
                  >
                    Decline
                  </button>
                </div>

                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-200 hover:bg-rose-100 transition inline-flex items-center justify-center gap-2"
                >
                  <FiTrash2 /> Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Preview */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999]"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
            <button
              className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
              onClick={() => setPreviewImage(null)}
              title="Close"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Validations;

const InfoRow = ({ icon, label, value, tone = "indigo" }) => {
  const tones = {
    indigo: "bg-indigo-100",
    emerald: "bg-emerald-100",
    amber: "bg-amber-100",
    purple: "bg-purple-100",
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${tones[tone] || tones.indigo}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate" title={value || ""}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
};
