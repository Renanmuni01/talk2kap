import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiSearch, FiUser, FiPhone } from 'react-icons/fi';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebaseConfig';

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const usersRef = ref(db, 'users'); 
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          idstatus: data[key].idstatus || 'pending', // default status
        }));
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
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.purok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStatus = (id, newStatus) => {
    const userRef = ref(db, `users/${id}`);
    update(userRef, { idstatus: newStatus });
  };

  const stats = {
    total: users.length,
    pending: users.filter(u => u.idstatus === 'pending').length,
    approved: users.filter(u => u.idstatus === 'approved').length,
    declined: users.filter(u => u.idstatus === 'declined').length
  };

  return (
    <div className="space-y-4 relative min-h-screen">
      {/* Background Watermark Logo */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: 'right 35% center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '49%',
          opacity: 0.40,
          filter: 'brightness(1.4) contrast(1.1)'
        }}
        aria-hidden="true"
      />

      {/* Content with higher z-index */}
      <div className="relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50/70 backdrop-blur-sm">
          <div className="bg-white/75 rounded-lg p-4 shadow-sm border backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiUser className="text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/75 rounded-lg p-4 shadow-sm border backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiUser className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/75 rounded-lg p-4 shadow-sm border backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/75 rounded-lg p-4 shadow-sm border backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiX className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white/70 rounded-lg shadow-sm border p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'declined'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? f === 'all'
                      ? 'bg-indigo-600 text-white'
                      : f === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : f === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({stats[f === 'all' ? 'total' : f]})
              </button>
            ))}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white/70 rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-gray-50/70 border-b">
              <tr>
                {['User Info', 'Contact', 'Purok', 'Address', 'ID Verification', 'Status', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{user.name || '-'}</td>
                  <td className="px-6 py-4">{user.number || '-'}</td>
                  <td className="px-6 py-4">{user.purok || '-'}</td>
                  <td className="px-6 py-4">{user.address || '-'}</td>
                  <td className="px-6 py-4">
                    {user.id_verification ? (
                      <button
                        onClick={() => setSelectedImage(user.id_verification)}
                        className="text-indigo-600 hover:text-indigo-800 underline"
                      >
                        View ID
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.idstatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : user.idstatus === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.idstatus ? user.idstatus.charAt(0).toUpperCase() + user.idstatus.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button onClick={() => updateStatus(user.id, 'approved')} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50">
                      <FiCheck />
                    </button>
                    <button onClick={() => updateStatus(user.id, 'declined')} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50">
                      <FiX />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="text-center py-8 text-gray-500">No registrations found</div>}
        </div>

        {/* Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">ID Preview</h3>
                <button onClick={() => setSelectedImage(null)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-4">
                <img src={selectedImage} alt="ID Preview" className="w-full h-auto max-h-[70vh] object-contain"/>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Validations;
