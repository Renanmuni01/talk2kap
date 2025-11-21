// NotifTable.jsx - Enhanced UI with Address only in modal + Proof Image Visible
import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock, FiSearch, FiX, FiUser, FiMapPin, FiFileText, FiCalendar, FiCheckCircle, FiHome } from 'react-icons/fi';
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebaseConfig";

const Complaintstable = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // ✅ FETCH FROM FIREBASE
  useEffect(() => {
    const usersRef = ref(db, "users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setNotifications([]);
        return;
      }

      const usersData = snapshot.val();
      const allComplaints = [];

      Object.keys(usersData).forEach((userId) => {
        const user = usersData[userId];
        if (user.userComplaints) {
          Object.keys(user.userComplaints).forEach((complaintId) => {
            allComplaints.push({
              complaintKey: complaintId,
              userId,
              name: user.name || "Anonymous",
              purok: user.purok || "—",
              address: user.address || "—",
              evidencePhoto: user.userComplaints[complaintId].evidencePhoto || null,
              ...user.userComplaints[complaintId],
            });
          });
        }
      });

      setNotifications(allComplaints);
    });

    return () => unsubscribe();
  }, []);

  // FILTER + SEARCH
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.label === filter;
    const matchesSearch =
      notification.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.purok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // URGENCY STYLE
  const getUrgencyDisplay = (label) => {
    if (label === 'urgent') {
      return { icon: <FiAlertTriangle className="text-red-500" />, text: 'Urgent', bgColor: 'bg-red-100 text-red-800' };
    }
    return { icon: <FiClock className="text-blue-500" />, text: 'Normal', bgColor: 'bg-blue-100 text-blue-800' };
  };

  // ISSUE COLORS
  const getIssueColor = (type) => {
    const colors = {
      medical: 'bg-red-100 text-red-800',
      fire: 'bg-orange-100 text-orange-800',
      noise: 'bg-purple-100 text-purple-800',
      waste: 'bg-green-100 text-green-800',
      infrastructure: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // STATUS COLORS
  const getStatusDisplay = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Resolved' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  // HEADER STATS
  const stats = {
    total: notifications.length,
    urgent: notifications.filter(n => n.label === 'urgent').length,
    pending: notifications.filter(n => n.status === 'pending').length,
    resolved: notifications.filter(n => n.status === 'resolved').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    // Example input: "20/11/2025, 22:46:55"
    const [datePart, timePart] = timestamp.split(", "); 
    const [day, month, year] = datePart.split("/");

    const validDate = new Date(`${year}-${month}-${day}T${timePart}`);

    if (isNaN(validDate.getTime())) return "Invalid date";

    return validDate.toLocaleString();
  };



  return (
    <div className="space-y-4">

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Total Notifications</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Urgent Cases</p>
          <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              All
            </button>
            <button onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg ${filter === 'urgent' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>
              Urgent
            </button>
            <button onClick={() => setFilter('normal')}
              className={`px-4 py-2 rounded-lg ${filter === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Urgency</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Purok</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Complainant</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Issue Type</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Description</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredNotifications.map((n) => {
              const urgency = getUrgencyDisplay(n.label);
              const status = getStatusDisplay(n.status);

              return (
                <tr
                  key={n.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedComplaint(n)}
                >
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${urgency.bgColor}`}>
                      {urgency.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">{n.purok}</td>
                  <td className="px-6 py-4">{n.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getIssueColor(n.type)}`}>
                      {n.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{n.message}</td>
                  <td className="px-6 py-4">{formatDate(n.timestamp)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-6 text-gray-500">No notifications found</div>
        )}
      </div>

      {/* Modal */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-30 z-50 p-4"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <button
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                onClick={() => setSelectedComplaint(null)}
              >
                <FiX size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-2">Complaint Details</h2>
              <p className="text-blue-100 text-sm">Case ID: {selectedComplaint.complaintKey}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Urgency */}
              <div className={`p-4 rounded-lg ${getStatusDisplay(selectedComplaint.status).color} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <FiCheckCircle size={20} />
                  <span className="font-semibold">Status: {getStatusDisplay(selectedComplaint.status).text}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyDisplay(selectedComplaint.label).bgColor} flex items-center gap-1`}>
                  {getUrgencyDisplay(selectedComplaint.label).icon}
                  {getUrgencyDisplay(selectedComplaint.label).text}
                </span>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FiUser className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Complainant</p>
                      <p className="text-base font-semibold text-gray-800">{selectedComplaint.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FiMapPin className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Purok</p>
                      <p className="text-base font-semibold text-gray-800">{selectedComplaint.purok}</p>
                    </div>
                  </div>

                  {/* Address Visible only in Modal */}
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <FiHome className="text-yellow-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Address</p>
                      <p className="text-base font-semibold text-gray-800">{selectedComplaint.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FiFileText className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Issue Type</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getIssueColor(selectedComplaint.type)}`}>
                        {selectedComplaint.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <FiCalendar className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date Reported</p>
                      <p className="text-base font-semibold text-gray-800">{formatDate(selectedComplaint.timestamp)}</p>
                    </div>
                  </div>

                  {/* Proof Image Visible */}
                  {selectedComplaint.evidencePhoto && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 font-medium">Proof</p>
                      <a href={selectedComplaint.evidencePhoto} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={selectedComplaint.evidencePhoto} 
                          alt="Proof" 
                          className="w-full max-w-xs h-auto object-cover rounded-lg border shadow-sm hover:shadow-md transition"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">Complaint Description</p>
                  <p className="text-gray-700 leading-relaxed">{selectedComplaint.message}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 border-t">
                <button
                  className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition 
                    ${
                      selectedComplaint.status === "pending"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : selectedComplaint.status === "in-progress"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  disabled={selectedComplaint.status === "resolved"}
                    onClick={async () => {

                      if (!selectedComplaint) return;

                      // Determine next status
                      const nextStatus =
                        selectedComplaint.status === "pending"
                          ? "in-progress"
                          : selectedComplaint.status === "in-progress"
                          ? "resolved"
                          : "resolved";

                      // Correct Firebase path
                      const complaintRef = ref(
                        db,
                        `users/${selectedComplaint.userId}/userComplaints/${selectedComplaint.complaintKey}`
                      );

                      try {
                        // Update status in Firebase
                        await update(complaintRef, { status: nextStatus });

                        // Update table UI
                        setNotifications((prev) =>
                          prev.map((c) =>
                            c.id === selectedComplaint.complaintKey
                              ? { ...c, status: nextStatus }
                              : c
                          )
                        );

                        // Update modal UI
                        setSelectedComplaint((prev) => ({ ...prev, status: nextStatus }));

                      } catch (error) {
                        console.error("Error updating status:", error);
                      }
                    }}

                >
                  {selectedComplaint.status === "pending"
                    ? "Approve"
                    : selectedComplaint.status === "in-progress"
                    ? "Resolve"
                    : "Resolved"}
                </button>
              </div>


            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Complaintstable;