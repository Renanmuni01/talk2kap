import React, { useState, useEffect, useRef } from "react";
import {
  FiUser,
  FiCheck,
  FiX,
  FiSearch,
  FiMail,
  FiXCircle,
  FiSend,
  FiInbox,
} from "react-icons/fi";

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

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const matchesSearch = c.participants
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: conversations.length,
    unread: conversations.filter((c) => c.status === "unread").length,
    read: conversations.filter((c) => c.status === "read").length,
  };

  const updateStatus = (id, newStatus) => {
    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, status: newStatus } : c
      )
    );
  };

  const handleSendReply = () => {
    if (!reply.trim() || !selectedConversation) return;

    const newMessage = {
      from: "Admin",
      text: reply,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedConvos = conversations.map((c) =>
      c.id === selectedConversation.id
        ? { ...c, messages: [...c.messages, newMessage], status: "read" }
        : c
    );
    setConversations(updatedConvos);

    const updatedCurrent = updatedConvos.find(
      (c) => c.id === selectedConversation.id
    );
    setSelectedConversation(updatedCurrent);

    setReply("");
  };

  const openConversation = (conversation) => {
    const updated = { ...conversation, status: "read" };
    setSelectedConversation(updated);
    updateStatus(conversation.id, "read");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="space-y-4 relative min-h-screen">

      {/* BACKGROUND WATERMARK */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: 'right 35% center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '49%',
          opacity: 0.35,
          filter: 'brightness(1.35) contrast(1.2)'
        }}
      />

      <div className="relative z-10">

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiInbox className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Unread</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiMail className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Read</p>
                <p className="text-2xl font-bold text-green-600">{stats.read}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="bg-white/60 rounded-lg shadow-sm border p-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

            <div className="relative flex-1 max-w-md w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white/90 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({stats.total})
              </button>

              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "unread"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Unread ({stats.unread})
              </button>

              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "read"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Read ({stats.read})
              </button>
            </div>
          </div>
        </div>

        {/* WHITER TABLE */}
        <div className="rounded-lg shadow-md border mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">

            <thead className="bg-white/80 border-b">
              <tr>
                {["Participant", "Last Message", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredConversations.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-white/70 transition-colors cursor-pointer border-b border-gray-300/60 last:border-none"
                    onClick={() => openConversation(c)}
                  >
                    <td className="px-6 py-4 text-gray-900 bg-white/80">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-600" /> {c.participants}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-900 bg-white/80 max-w-xs truncate">
                      <div title={lastMsg.text}>{lastMsg.text}</div>
                    </td>

                    <td className="px-6 py-4 bg-white/80">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          c.status === "unread"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {c.status === "unread" ? "Unread" : "Read"}
                      </span>
                    </td>

                    <td
                      className="px-6 py-4 bg-white/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2 text-gray-600">
                        {c.status === "unread" && (
                          <button
                            onClick={() => updateStatus(c.id, "read")}
                            className="hover:text-indigo-700"
                          >
                            <FiCheck />
                          </button>
                        )}
                        {c.status === "read" && (
                          <button
                            onClick={() => updateStatus(c.id, "unread")}
                            className="hover:text-yellow-700"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No conversations found
            </div>
          )}
        </div>

        {/* MODAL */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl border">
              
              {/* HEADER */}
              <div className="p-6 border-b bg-white/60 backdrop-blur-sm relative">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle size={24} />
                </button>
                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
                  <FiMail /> {selectedConversation.participants}
                </h2>
              </div>

              {/* MESSAGE LIST WITH BLUR + DIVIDER LINES */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white/50 backdrop-blur-sm rounded-b-2xl">
                {selectedConversation.messages.map((m, i) => (
                  <div key={i} className="space-y-2 border-b border-gray-300/50 pb-4 last:border-none">
                    <div
                      className={`flex ${m.from === "Admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-sm shadow-sm ${
                          m.from === "Admin"
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{m.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            m.from === "Admin" ? "text-indigo-200" : "text-gray-600"
                          }`}
                        >
                          {m.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* REPLY BOX */}
              <div className="p-6 border-t bg-white/60 backdrop-blur-sm rounded-b-2xl">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${selectedConversation.participants}...`}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 resize-none"
                />

                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500">
                    Press Enter to send, Shift+Enter for new line
                  </p>

                  <button
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <FiSend /> Send Reply
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
