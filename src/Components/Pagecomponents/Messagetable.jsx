import React, { useState, useEffect, useRef } from "react";
import { FiUser, FiMail, FiCheck, FiX, FiSearch, FiSend, FiXCircle, FiInbox } from "react-icons/fi";

const MessageTable = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([
    {
      id: 1,
      participants: "Juan Dela Cruz",
      status: "unread",
      messages: [
        { from: "Juan", text: "Hello po, admin!", time: "08:30 AM" },
        { from: "Admin", text: "Hi Juan! Kumusta?", time: "08:32 AM" },
        { from: "Juan", text: "Okay lang po. May update ba sa barangay project?", time: "08:35 AM" },
        { from: "Admin", text: "Yes! May meeting tayo bukas 10 AM.", time: "08:40 AM" },
        { from: "Juan", text: "Salamat po sa info!", time: "08:42 AM" },
      ],
    },
    {
      id: 2,
      participants: "Maria Santos",
      status: "read",
      messages: [
        { from: "Maria", text: "Good evening admin!", time: "07:45 PM" },
        { from: "Admin", text: "Hello Maria! Kamusta?", time: "07:47 PM" },
        { from: "Maria", text: "Pwede po ba mag-volunteer bukas?", time: "07:50 PM" },
        { from: "Admin", text: "Sure, Maria. Salamat sa pag-volunteer!", time: "07:55 PM" },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef(null);

  const filteredConversations = conversations.filter(c => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch = c.participants.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.status === "unread").length,
    read: conversations.filter(c => c.status === "read").length,
  };

  const updateStatus = (id, newStatus) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
  };

  const handleSendReply = () => {
    if (!reply.trim() || !selectedConversation) return;

    const newMessage = {
      from: "Admin",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = conversations.map(c =>
      c.id === selectedConversation.id
        ? { ...c, messages: [...c.messages, newMessage], status: "read" }
        : c
    );

    setConversations(updated);
    setSelectedConversation(updated.find(c => c.id === selectedConversation.id));
    setReply("");
  };

  const openConversation = conversation => {
    updateStatus(conversation.id, "read");
    setSelectedConversation({ ...conversation, status: "read" });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative space-y-8">

      {/* Watermark Logo */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-700 font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              <p className={`text-2xl font-bold ${
                key==='unread'?'text-yellow-600':key==='read'?'text-green-600':'text-gray-900'
              }`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all','unread','read'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg ${
                  filter===f ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-300'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                {['Participant','Last Message','Status','Actions'].map(header => (
                  <th key={header} className="px-6 py-4 text-sm font-bold text-gray-700">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map(c => {
                const lastMsg = c.messages[c.messages.length-1];
                return (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer" onClick={()=>openConversation(c)}>
                    <td className="px-6 py-4 text-gray-900">{c.participants}</td>
                    <td className="px-6 py-4 text-gray-900 truncate max-w-xs" title={lastMsg.text}>{lastMsg.text}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status==='read'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2" onClick={e=>e.stopPropagation()}>
                      {c.status==='unread' && <button onClick={()=>updateStatus(c.id,'read')} className="hover:text-indigo-700"><FiCheck /></button>}
                      {c.status==='read' && <button onClick={()=>updateStatus(c.id,'unread')} className="hover:text-yellow-700"><FiX /></button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredConversations.length === 0 && <div className="text-center py-6 text-gray-500">No conversations found</div>}
        </div>

        {/* Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                <button className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all" onClick={()=>setSelectedConversation(null)}><FiX size={24} /></button>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><FiMail /> {selectedConversation.participants}</h2>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-white/50 rounded-b-2xl">
                {selectedConversation.messages.map((m,i)=>(
                  <div key={i} className={`flex ${m.from==="Admin"?"justify-end":"justify-start"}`}>
                    <div className={`p-3 rounded-2xl max-w-sm shadow-sm ${
                      m.from==="Admin" ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-200 text-gray-900 rounded-bl-none"
                    }`}>
                      <p className="text-sm">{m.text}</p>
                      <p className={`text-xs mt-1 ${m.from==="Admin"?"text-indigo-200":"text-gray-600"}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div className="p-6 border-t flex flex-col gap-3">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={e=>setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${selectedConversation.participants}...`}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex justify-end">
                  <button onClick={handleSendReply} disabled={!reply.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                    <FiSend /> Send
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageTable;
