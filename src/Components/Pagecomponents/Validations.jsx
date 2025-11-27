import React, { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMapPin, FiHome, FiX, FiSearch } from 'react-icons/fi';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebaseConfig';

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const usersRef = ref(db, 'users'); 
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userArray = Object.keys(data).map((key) => {
          const user = data[key];
          return {
            id: key,
            complainant: `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim(),
            ...user,
            idstatus: user.idstatus || 'pending',
          };
        });
        setUsers(userArray);
      } else {
        setUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.idstatus === filter;
    const matchesSearch =
      user.complainant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.purok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStatus = async (id, newStatus) => {
    const userRef = ref(db, `users/${id}`);
    try {
      await update(userRef, { idstatus: newStatus });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, idstatus: newStatus } : u));
      if (selectedUser && selectedUser.id === id) setSelectedUser(prev => ({ ...prev, idstatus: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const stats = {
    total: users.length,
    pending: users.filter(u => u.idstatus === 'pending').length,
    approved: users.filter(u => u.idstatus === 'approved').length,
    declined: users.filter(u => u.idstatus === 'declined').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-700 font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              <p className={`text-2xl font-bold ${
                key==='approved'?'text-green-600':key==='pending'?'text-yellow-600':key==='declined'?'text-red-600':'text-gray-900'
              }`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search registrations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all','pending','approved','declined'].map(f => (
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
                {['Name','Contact','Purok','Address','ID Verification','Status'].map(header => (
                  <th key={header} className="px-6 py-4 text-sm font-bold text-gray-700">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-4 text-gray-900">{user.complainant}</td>
                  <td className="px-6 py-4 text-gray-900">{user.number || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{user.purok || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{user.address || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{user.id_verification ? 'Sent' : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.idstatus==='approved'?'bg-green-100 text-green-800':
                      user.idstatus==='declined'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.idstatus.charAt(0).toUpperCase() + user.idstatus.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="text-center py-6 text-gray-500">No registrations found</div>}
        </div>

        {/* Modal for user details + ID preview (keep same as before) */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4" onClick={()=>setSelectedUser(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                <button className="absolute top-4 right-4 text-white hover:bg-red-500 hover:bg-opacity-20 rounded-full p-2 transition-all" onClick={()=>setSelectedUser(null)}>
                  <FiX size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">User Details</h2>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className={`p-4 rounded-lg ${selectedUser.idstatus==='approved'?'bg-green-100 text-green-800':selectedUser.idstatus==='declined'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'} flex items-center justify-between`}>
                  <span className="font-semibold">Status: {selectedUser.idstatus.charAt(0).toUpperCase() + selectedUser.idstatus.slice(1)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left */}
                  <div className="space-y-4">
                    {[
                      { label: 'Name', value: selectedUser.complainant, icon: <FiUser className="text-blue-600" size={20} />, bg: 'bg-blue-100' },
                      { label: 'Contact', value: selectedUser.number, icon: <FiPhone className="text-green-600" size={20} />, bg: 'bg-green-100' },
                      { label: 'Purok', value: selectedUser.purok, icon: <FiMapPin className="text-yellow-600" size={20} />, bg: 'bg-yellow-100' },
                      { label: 'Address', value: selectedUser.address, icon: <FiHome className="text-purple-600" size={20} />, bg: 'bg-purple-100' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className={`${item.bg} p-2 rounded-lg`}>{item.icon}</div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                          <p className="text-base font-semibold text-gray-800">{item.value || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 font-medium">ID Verification</p>
                      {selectedUser.id_verification ? (
                        <img
                          src={selectedUser.id_verification}
                          alt="ID"
                          onClick={()=>setPreviewImage(selectedUser.id_verification)}
                          className="w-full max-w-xs h-auto object-cover rounded-lg shadow-lg border cursor-pointer hover:opacity-80 transition"
                        />
                      ) : <p className="text-gray-500 text-sm">No ID submitted</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <button className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                    onClick={()=>updateStatus(selectedUser.id,'approved')}
                  >Approve</button>
                  <button className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                    onClick={()=>updateStatus(selectedUser.id,'declined')}
                  >Decline</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full screen ID preview */}
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
      ✕
    </button>
  </div>
)}


      </div>
    </div>
  );
};

export default Validations;
