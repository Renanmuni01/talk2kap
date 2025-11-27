import React, { useState, useEffect, useRef } from "react";
import { FiUser, FiMail, FiCheck, FiX, FiSearch, FiSend, FiMapPin, FiFileText, FiMessageSquare } from "react-icons/fi";
import { ref, onValue, push, update } from "firebase/database";
import { db } from "../../firebaseConfig";

const MessageTable = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef(null);

  // Load complaints + chat dynamically from Firebase
  useEffect(() => {
    const usersRef = ref(db, "users");
    return onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const convos = [];
      if (data) {
        Object.entries(data).forEach(([userId, user]) => {
          if (user.userComplaints) {
            Object.entries(user.userComplaints).forEach(([complaintId, complaint]) => {
              const fullName = `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim() || "Anonymous";
              
              const messages = complaint.chat
                ? Object.entries(complaint.chat).map(([chatUid, chat]) => ({ id: chatUid, ...chat }))
                : [];

              // Get last message
              const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

              convos.push({
                id: complaintId,
                userId,
                complaintId,
                complainant: fullName,
                purok: complaint.purok || user.incidentPurok || "—",
                issueType: complaint.type || "—",
                description: complaint.message || "—",
                messages,
                status: complaint.status || "unread",
                lastMessage: lastMsg?.message || "No messages yet",
                hasMessages: messages.length > 0,
              });
            });
          }
        });
      }
      
      // Sort: conversations with messages first, then by status (unread first)
      convos.sort((a, b) => {
        if (a.hasMessages !== b.hasMessages) {
          return b.hasMessages - a.hasMessages; // true (1) comes before false (0)
        }
        if (a.status !== b.status) {
          return a.status === "unread" ? -1 : 1; // unread comes first
        }
        return 0;
      });
      
      setConversations(convos);
    });
  }, []);

  const filteredConversations = conversations.filter(c => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch = 
      c.complainant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.purok.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.status === "unread").length,
    read: conversations.filter(c => c.status === "read").length,
  };

  const openConversation = async (conversation) => {
    // Mark as read when opening
    if (conversation.status === "unread") {
      const complaintRef = ref(db, `users/${conversation.userId}/userComplaints/${conversation.complaintId}`);
      
      try {
        await update(complaintRef, { status: "read" });
        
        // Update local state
        setConversations(prev => {
          const updated = prev.map(c => 
            c.complaintId === conversation.complaintId 
              ? { ...c, status: "read" }
              : c
          );
          
          // Re-sort after status update
          return updated.sort((a, b) => {
            if (a.hasMessages !== b.hasMessages) {
              return b.hasMessages - a.hasMessages;
            }
            if (a.status !== b.status) {
              return a.status === "unread" ? -1 : 1;
            }
            return 0;
          });
        });
        
        // Set selected conversation with updated status
        setSelectedConversation({ ...conversation, status: "read" });
      } catch (error) {
        console.error("Error updating status:", error);
        setSelectedConversation(conversation);
      }
    } else {
      setSelectedConversation(conversation);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedConversation) return;

    const { userId, complaintId } = selectedConversation;
    const chatRef = ref(db, `users/${userId}/userComplaints/${complaintId}/chat`);

    const newMessage = {
      senderId: "admin",
      message: reply,
      timestamp: new Date().toLocaleString(),
    };

    await push(chatRef, newMessage);

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, { id: Date.now(), ...newMessage }],
      hasMessages: true,
    }));
    
    // Update local state to reflect new message
    setConversations(prev =>
      prev.map(c =>
        c.complaintId === complaintId
          ? { ...c, hasMessages: true, messages: [...c.messages, { id: Date.now(), ...newMessage }], lastMessage: reply }
          : c
      )
    );

    setReply("");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages]);

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
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
      unread: { color: 'bg-yellow-100 text-yellow-800', text: 'Unread' },
      read: { color: 'bg-green-100 text-green-800', text: 'Read' }
    };
    return statusConfig[status] || statusConfig.unread;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-700 font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              <p className={`text-2xl font-bold ${key==='unread'?'text-yellow-600':key==='read'?'text-green-600':'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              {['all','unread','read'].map(f => (
                <button 
                  key={f} 
                  onClick={()=>setFilter(f)} 
                  className={`px-4 py-2 rounded-lg transition ${filter===f?'bg-indigo-600 text-white shadow':'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                {['Complainant','Purok','Issue Type','Description','Message','Status'].map(header => (
                  <th key={header} className="px-6 py-4 text-sm font-bold text-gray-700">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map(c => {
                const status = getStatusDisplay(c.status);
                return (
                  <tr 
                    key={c.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer" 
                    onClick={()=>openConversation(c)}
                  >
                    <td className="px-6 py-4">{c.complainant}</td>
                    <td className="px-6 py-4">Purok {c.purok}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIssueColor(c.issueType)}`}>
                        {c.issueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={c.description}>{c.description}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={c.lastMessage}>{c.lastMessage}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredConversations.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No messages found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Chat Modal */}
        {selectedConversation && (
          <div 
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedConversation(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-3xl relative shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                <button 
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all" 
                  onClick={()=>setSelectedConversation(null)}
                >
                  <FiX size={24} />
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <FiMail /> Conversation with {selectedConversation.complainant}
                </h2>
                <p className="text-blue-100 text-sm">Case ID: {selectedConversation.complaintId}</p>
              </div>

              {/* Complaint Details */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FiMapPin className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Purok</p>
                      <p className="text-base font-semibold text-gray-800">Purok {selectedConversation.purok}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FiFileText className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Issue Type</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getIssueColor(selectedConversation.issueType)}`}>
                        {selectedConversation.issueType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FiMessageSquare className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(selectedConversation.status).color}`}>
                        {getStatusDisplay(selectedConversation.status).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">Complaint Description</p>
                  <p className="text-gray-700 leading-relaxed">{selectedConversation.description}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto bg-white/50">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiMessageSquare size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  selectedConversation.messages.map((m,i)=>(
                    <div key={i} className={`flex ${m.senderId==="admin"?"justify-end":"justify-start"}`}>
                      <div className={`p-3 rounded-2xl max-w-sm shadow-sm ${m.senderId==="admin"?"bg-indigo-600 text-white":"bg-gray-200 text-gray-900"}`}>
                        <p className="text-sm">{m.message}</p>
                        <p className={`text-xs mt-1 ${m.senderId==="admin"?"text-indigo-200":"text-gray-500"}`}>
                          {m.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div className="p-6 border-t flex gap-2 bg-white">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={e=>setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${selectedConversation.complainant}...`}
                  className="flex-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button 
                  onClick={handleSendReply} 
                  className="bg-indigo-600 text-white px-6 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition font-semibold"
                >
                  <FiSend /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageTable;