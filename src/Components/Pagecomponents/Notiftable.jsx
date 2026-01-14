import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiClock, FiSearch, FiX, FiUser, FiMapPin,
  FiFileText, FiCalendar, FiCheckCircle, FiHome
} from 'react-icons/fi';
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebaseConfig";

const Complaintstable = () => {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAvailable, setFeedbackAvailable] = useState({});
  // Persisted list of dismissed feedback keys (stored in localStorage)
  const [dismissedFeedback, setDismissedFeedback] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedFeedback') || '[]';
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      return new Set();
    }
  });

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setNotifications([]);
        return;
      }

      const usersData = snapshot.val();
      const allComplaints = [];
      const feedbackMap = {};

      Object.keys(usersData).forEach((userId) => {
        const user = usersData[userId];

        // Compose full name, but do not use 'Anonymous' if empty
        let fullName = `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim();
        if (!fullName) fullName = '';

        if (user.userComplaints) {
          Object.keys(user.userComplaints).forEach((complaintId) => {
            allComplaints.push({
              complaintKey: complaintId,
              userId,
              name: fullName,
              purok: user.incidentPurok || "â€”",
              address: user.address || "â€”",
              evidencePhoto: user.userComplaints[complaintId].evidencePhoto || null,
              ...user.userComplaints[complaintId],
            });
          });
        }
      });

      // Sort by timestamp - latest first
      allComplaints.sort((a, b) => {
        const dateA = parseTimestamp(a.timestamp);
        const dateB = parseTimestamp(b.timestamp);
        return dateB - dateA;
      });

      setNotifications(allComplaints);

      // Check for feedback on all resolved complaints
      const feedbackRef = ref(db, "complaintFeedback");
      onValue(feedbackRef, (feedbackSnapshot) => {
        const feedbackData = feedbackSnapshot.val();
        if (feedbackData) {
          Object.keys(feedbackData).forEach((complaintId) => {
            if (feedbackData[complaintId].feedbackMessage) {
              // only mark available if not dismissed by the user (stored in localStorage)
              try {
                const raw = localStorage.getItem('dismissedFeedback') || '[]';
                const dismissedArr = JSON.parse(raw);
                if (!Array.isArray(dismissedArr) || dismissedArr.indexOf(complaintId) === -1) {
                  feedbackMap[complaintId] = true;
                }
              } catch (e) {
                feedbackMap[complaintId] = true;
              }
            }
          });
        }
        setFeedbackAvailable(feedbackMap);
      }, { onlyOnce: true });
    });

    return () => unsubscribe();
  }, []);

  const parseTimestamp = (timestamp) => {
    if (!timestamp) return new Date(0);
    const [datePart, timePart] = timestamp.split(", ");
    const [day, month, year] = datePart.split("/");
    const validDate = new Date(`${year}-${month}-${day}T${timePart}`);
    return isNaN(validDate.getTime()) ? new Date(0) : validDate;
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesUrgencyFilter =
      filter === "all" ||
      (filter === "urgent" && notification.label === "urgent") ||
      (filter === "non-urgent" && notification.label !== "urgent");

    const matchesStatusFilter =
      statusFilter === "all" || notification.status === statusFilter;

    const matchesSearch =
      notification.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.incidentPurok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesUrgencyFilter && matchesStatusFilter && matchesSearch;
  });

  const getUrgencyDisplay = (label) => {
    if (label === 'urgent') {
      return { icon: <FiAlertTriangle className="text-red-500" />, text: 'Urgent', bgColor: 'bg-red-100 text-red-800' };
    }
    return { icon: <FiClock className="text-blue-500" />, text: 'Non-Urgent', bgColor: 'bg-blue-100 text-blue-800' };
  };

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

  const getStatusDisplay = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Resolved' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const stats = {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    'in-progress': notifications.filter(n => n.status === 'in-progress').length,
    resolved: notifications.filter(n => n.status === 'resolved').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "â€”";
    const [datePart, timePart] = timestamp.split(", ");
    const [day, month, year] = datePart.split("/");
    const validDate = new Date(`${year}-${month}-${day}T${timePart}`);
    if (isNaN(validDate.getTime())) return "Invalid date";
    return validDate.toLocaleString();
  };

  // UPDATE STATUS IN FIREBASE
  const updateComplaintStatus = async (complaint, newStatus) => {
    if (!complaint || !complaint.userId || !complaint.complaintKey) {
      console.error("Invalid complaint data");
      return;
    }

    try {
      const complaintRef = ref(db, `users/${complaint.userId}/userComplaints/${complaint.complaintKey}`);
      
      await update(complaintRef, {
        status: newStatus
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((c) =>
          c.complaintKey === complaint.complaintKey
            ? { ...c, status: newStatus }
            : c
        )
      );

      setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));

      console.log(`Status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="space-y-4 relative min-h-screen bg-gray-50">
      {/* Background Logo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: 'right 35% center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '49%',
          opacity: 0.18,
          filter: 'brightness(1.4) contrast(1.1)'
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-700 font-medium">{key.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</p>
              <p className={`text-2xl font-bold ${key==='pending'?'text-yellow-600':key==='in-progress'?'text-blue-600':key==='resolved'?'text-green-600':'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search complaints..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Urgency Filter */}
            <div className="flex gap-2">
              {['all','urgent','non-urgent'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition ${filter===f?'bg-indigo-600 text-white shadow':'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-gray-700">Status:</span>
            {['all', 'pending', 'in-progress', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                  statusFilter === status
                    ? status === 'pending'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : status === 'in-progress'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : status === 'resolved'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-800 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All Status' : status.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                {['Urgency','Purok','Complainant','Issue Type','Description','Date','Status'].map(header => (
                  <th key={header} className="px-6 py-4 text-sm font-bold text-gray-700">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map(n => {
                const urgency = getUrgencyDisplay(n.label);
                const status = getStatusDisplay(n.status);
                return (
                  <tr key={n.complaintKey} className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setSelectedComplaint(n)}>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${urgency.bgColor} flex items-center gap-1`}>
                        {urgency.icon} {urgency.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">Purok {n.incidentPurok}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {n.name}
                        {n.status === "resolved" && feedbackAvailable[n.complaintKey] && (
                          <span className="relative flex items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 text-white text-xs font-bold items-center justify-center shadow-md">
                              â—
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueColor(n.type)}`}>{n.type}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{n.message}</td>
                    <td className="px-6 py-4">{formatDate(n.timestamp)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.text}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredNotifications.length===0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">No complaints found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {selectedComplaint && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[98vh] relative shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex-shrink-0">
                <button
                  className="absolute top-4 right-4 text-white hover:bg-red-500 hover:bg-opacity-20 rounded-full p-2 transition-all"
                  onClick={() => setSelectedComplaint(null)}
                >
                  <FiX size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Complaint Details</h2>
                <p className="text-blue-100 text-sm">Case ID: {selectedComplaint.complaintKey}</p>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
                        <p className="text-base font-semibold text-gray-800">Purok {selectedComplaint.incidentPurok}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 p-2 rounded-lg">
                        <FiHome className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Incident Location</p>
                        <p className="text-base font-semibold text-gray-800">{selectedComplaint.incidentLocation}</p>
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

                    {selectedComplaint.evidencePhoto && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 font-medium">Proof</p>
                        <img
                          src={selectedComplaint.evidencePhoto}
                          alt="Proof"
                          onClick={() => setPreviewImage(selectedComplaint.evidencePhoto)}
                          className="w-full max-w-xs h-auto object-cover rounded-lg shadow-lg border cursor-pointer hover:opacity-80 transition"
                        />
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

                {/* View Feedback Button for resolved complaints */}
                {selectedComplaint.status === "resolved" && (
                  <div className="pt-4">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                      onClick={async () => {
                        const key = selectedComplaint?.complaintKey;
                        if (!key) return;

                        // Fetch feedback from Firebase
                        const feedbackRef = ref(db, `complaintFeedback/${key}/feedbackMessage`);
                        onValue(feedbackRef, (snapshot) => {
                          const feedback = snapshot.val();
                          setFeedbackMessage(feedback || "No feedback yet.");
                          setShowFeedbackModal(true);
                        }, { onlyOnce: true });

                        // Persist dismissal so the badge is removed permanently (UI only)
                        setDismissedFeedback(prev => {
                          const s = new Set(prev);
                          s.add(key);
                          try { localStorage.setItem('dismissedFeedback', JSON.stringify(Array.from(s))); } catch (e) {}
                          return s;
                        });

                        // Remove badge from current feedbackAvailable state immediately
                        setFeedbackAvailable((prev) => {
                          const updated = { ...prev };
                          delete updated[key];
                          return updated;
                        });
                      }}
                    >
                      View Feedback
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button - Fixed at Bottom */}
              <div className="border-t p-6 flex-shrink-0">
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
                  onClick={() => {
                    if (!selectedComplaint) return;

                    const nextStatus =
                      selectedComplaint.status === "pending"
                        ? "in-progress"
                        : selectedComplaint.status === "in-progress"
                        ? "resolved"
                        : "resolved";

                    updateComplaintStatus(selectedComplaint, nextStatus);
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
        )}

        {/* FEEDBACK MODAL */}
        {showFeedbackModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999] backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}>
            <div className="bg-gradient-to-br from-indigo-100 to-white rounded-2xl shadow-2xl p-0 max-w-md w-full relative animate-fadeInUp" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white rounded-full p-2 shadow-lg"><FiCheckCircle size={22} /></span>
                  <h3 className="text-xl font-bold text-indigo-700">Feedback</h3>
                </div>
                <button className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300" onClick={() => setShowFeedbackModal(false)} title="Close">
                  <FiX size={24} />
                </button>
              </div>
              <div className="px-6 py-6">
                <p className="text-gray-700 text-base whitespace-pre-line leading-relaxed mb-2">
                  {feedbackMessage}
                </p>
              </div>
            </div>
            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(40px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fadeInUp { animation: fadeInUp 0.35s cubic-bezier(.4,0,.2,1) both; }
            `}</style>
          </div>
        )}

        {/* FULL SCREEN IMAGE PREVIEW */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999]"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl"
            />
            <button
              className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
              onClick={() => setPreviewImage(null)}
            >
              âœ•
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaintstable;
