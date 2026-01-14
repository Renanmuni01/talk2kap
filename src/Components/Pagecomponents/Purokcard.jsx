// HoverDevCards.jsx - Firebase-Connected Dashboard with Base Data
import React, { useState, useEffect } from "react";
import { FiMail, FiArrowLeft, FiAlertTriangle, FiClock, FiGrid, FiMapPin, FiTrendingUp } from "react-icons/fi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebaseConfig";

const HoverDevCards = ({ onPurokSelect, selectedPurok, onBackToDashboard }) => {
  // Base data from reports
  const basePurokStats = {
    1: { urgent: 2, nonUrgent: 10 },
    2: { urgent: 3, nonUrgent: 11 },
    3: { urgent: 5, nonUrgent: 20 },
    4: { urgent: 3, nonUrgent: 11 },
    5: { urgent: 2, nonUrgent: 21 },
    6: { urgent: 5, nonUrgent: 21 }
  };

  const [purokStats, setPurokStats] = useState(basePurokStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      // Initialize with base data
      const purokComplaints = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

      if (!snapshot.exists()) {
        // If no Firebase data, use base stats
        setPurokStats(basePurokStats);
        setLoading(false);
        return;
      }

      const usersData = snapshot.val();

      // Collect all complaints by incidentPurok from Firebase
      Object.keys(usersData).forEach((userId) => {
        const user = usersData[userId];
        if (user.userComplaints) {
          Object.keys(user.userComplaints).forEach((complaintId) => {
            const complaint = user.userComplaints[complaintId];
            
            // Use incidentPurok instead of user.purok
            const incidentPurok = complaint.incidentPurok ? parseInt(complaint.incidentPurok) : null;
            
            if (incidentPurok >= 1 && incidentPurok <= 6) {
              purokComplaints[incidentPurok].push({
                isUrgent: complaint.label === 'urgent',
                timestamp: complaint.timestamp
              });
            }
          });
        }
      });

      // Calculate stats for each purok (BASE DATA + Firebase data)
      const updatedStats = {};
      [1, 2, 3, 4, 5, 6].forEach((purok) => {
        const complaints = purokComplaints[purok];
        
        // Count from Firebase
        const firebaseUrgent = complaints.filter(c => c.isUrgent).length;
        const firebaseNonUrgent = complaints.filter(c => !c.isUrgent).length;
        
        // Add base data
        const baseData = basePurokStats[purok];
        updatedStats[purok] = {
          urgent: baseData.urgent + firebaseUrgent,
          nonUrgent: baseData.nonUrgent + firebaseNonUrgent
        };
      });

      setPurokStats(updatedStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (selectedPurok) {
    return <PurokInfo purokNumber={selectedPurok} onBack={onBackToDashboard} purokStats={purokStats} />;
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-start bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Background Watermark Logo */}
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

      <div className="relative z-10 w-full">
        {/* Dashboard Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-indigo-500 rounded-full"></div>
            <FiGrid className="text-indigo-600 text-4xl animate-pulse" />
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-indigo-500 rounded-full"></div>
          </div>
          
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          
          <p className="text-gray-600 text-lg font-medium">
            Select a Purok to view detailed information
          </p>
          
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {Object.keys(purokStats).map((key) => (
            <Card
              key={key}
              title={`Purok ${key}`}
              Icon={FiMapPin}
              onClick={() => onPurokSelect(Number(key))}
              urgent={purokStats[key].urgent}
              nonUrgent={purokStats[key].nonUrgent}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, Icon, onClick, urgent, nonUrgent }) => {
  const total = urgent + nonUrgent;

  return (
    <button
      onClick={onClick}
      className="relative w-full h-70 p-5 rounded-2xl border-2 border-gray-200 bg-white overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:border-indigo-400"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
      
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-100 rounded-full opacity-50 group-hover:scale-150 group-hover:bg-white/20 transition-all duration-500"></div>
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-purple-100 rounded-full opacity-50 group-hover:scale-150 group-hover:bg-white/20 transition-all duration-500"></div>

      {/* Floating decorative icon */}
      <Icon className="absolute z-10 -top-6 -right-6 text-[5.5rem] text-slate-100 group-hover:text-white/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon and Title Section */}
        <div className="mb-3">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-2 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
            <Icon className="text-lg text-white group-hover:text-white-600 transition-colors duration-300" />
          </div>
          
          <h3 className="font-extrabold text-2xl md:text-3xl text-slate-900 group-hover:text-white transition-colors duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
            {title}
          </h3>
        </div>

        {/* Stats Section */}
        <div className="mt-auto space-y-2.5">
          {/* Total Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 group-hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all duration-300 border border-indigo-100 group-hover:border-white/30">
            <FiTrendingUp className="text-indigo-600 group-hover:text-indigo transition-colors duration-300" size={15} />
            <span className="text-base font-bold text-slate-800 group-hover:text-black transition-colors duration-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Total: {total}
            </span>
          </div>

          {/* Urgent & Non-Urgent Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-red-50 group-hover:bg-red-500/20 rounded-lg p-2.5 border border-red-200 group-hover:border-red-300 transition-all duration-300">
              <div className="flex items-center gap-1.5 mb-1">
                <FiAlertTriangle className="text-red-600 group-hover:text-red-100" size={13} />
                <span className="text-[9px] font-bold text-red-600 group-hover:text-red-100 uppercase tracking-wider" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Urgent</span>
              </div>
              <p className="text-2xl font-extrabold text-red-700 group-hover:text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{urgent}</p>
            </div>

            <div className="bg-blue-50 group-hover:bg-blue-500/20 rounded-lg p-2.5 border border-blue-200 group-hover:border-blue-300 transition-all duration-300">
              <div className="flex items-center gap-1 mb-1">
                <FiClock className="text-blue-600 group-hover:text-blue-100" size={13} />
                <span className="text-[9px] font-bold text-blue-600 group-hover:text-blue-100 uppercase tracking-wide" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Non-Urgent</span>
              </div>
              <p className="text-2xl font-extrabold text-blue-700 group-hover:text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{nonUrgent}</p>
            </div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-1 text-white text-xs font-bold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <span>View</span>
            <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
      </div>
    );
  }
  return null;
};

const PurokInfo = ({ purokNumber, onBack, purokStats }) => {
  const [purokData, setPurokData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      // Base purok information (static data)
      const basePurokInfo = {
        1: { name: "Purok 1", description: "Information about Purok 1", residents: 1228, complaints: 10, urgent: 2, nonUrgent: 8 },
        2: { name: "Purok 2", description: "Information about Purok 2", residents: 1576, complaints: 13, urgent: 3, nonUrgent: 10 },
        3: { name: "Purok 3", description: "Information about Purok 3", residents: 2894, complaints: 24, urgent: 5, nonUrgent: 19 },
        4: { name: "Purok 4", description: "Information about Purok 4", residents: 1553, complaints: 13, urgent: 3, nonUrgent: 10 },
        5: { name: "Purok 5", description: "Information about Purok 5", residents: 3481, complaints: 22, urgent: 2, nonUrgent: 20 },
        6: { name: "Purok 6", description: "Information about Purok 6", residents: 3074, complaints: 25, urgent: 5, nonUrgent: 20 }
      };

      const baseInfo = basePurokInfo[purokNumber];
      const stats = purokStats[purokNumber];
      
      // Combine base info with current stats from parent component
      setPurokData({
        ...baseInfo,
        complaints: stats.urgent + stats.nonUrgent,
        urgent: stats.urgent,
        nonUrgent: stats.nonUrgent
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [purokNumber, purokStats]);

  if (loading || !purokData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading purok data...</p>
        </div>
      </div>
    );
  }

  // Data for complaint breakdown chart
  const complaintChartData = [
    { name: "Total Complaints", value: purokData.complaints, color: "#10B981" },
    { name: "Urgent", value: purokData.urgent, color: "#EF4444" },
    { name: "Non-Urgent", value: purokData.nonUrgent, color: "#3B82F6" }
  ];

  return (
    <div className="relative min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Background watermark */}
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
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-indigo-600 hover:text-indigo-800 transition-colors font-semibold">
          <FiArrowLeft size={20} />
          <span className="text-lg">Back to Dashboard</span>
        </button>

        {/* Purok Info Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-indigo-500 rounded-full"></div>
            <FiMapPin className="text-indigo-600 text-4xl animate-pulse" />
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-indigo-500 rounded-full"></div>
          </div>
          
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {purokData.name}
          </h1>
          
          <p className="text-gray-600 text-lg font-medium">
            {purokData.description}
          </p>
          
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <p className="text-blue-600 text-sm font-semibold mb-1">TOTAL RESIDENTS</p>
            <p className="text-4xl font-bold text-gray-900">{purokData.residents}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
            <p className="text-green-600 text-sm font-semibold mb-1">TOTAL COMPLAINTS</p>
            <p className="text-4xl font-bold text-gray-900">{purokData.complaints}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
            <p className="text-red-600 text-sm font-semibold mb-1">URGENT</p>
            <p className="text-4xl font-bold text-gray-900">{purokData.urgent}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <p className="text-blue-600 text-sm font-semibold mb-1">NON-URGENT</p>
            <p className="text-4xl font-bold text-gray-900">{purokData.nonUrgent}</p>
          </div>
        </div>

        {/* Graph Section */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 mb-10">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-6">
            <FiAlertTriangle className="text-orange-600" size={24} />
            Figure 1: Complaint Breakdown
          </h3>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14 }}
                  angle={0}
                  textAnchor="middle"
                />
                <YAxis tick={{ fontSize: 14 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" maxBarSize={100} radius={[8, 8, 0, 0]}>
                  {complaintChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fontSize: '16px', fontWeight: 'bold', fill: '#374151' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Total Complaints: {purokData.complaints}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Urgent: {purokData.urgent}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Non-Urgent: {purokData.nonUrgent}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo wrapper
export default function App() {
  const [selectedPurok, setSelectedPurok] = React.useState(null);

  return (
    <HoverDevCards
      selectedPurok={selectedPurok}
      onPurokSelect={setSelectedPurok}
      onBackToDashboard={() => setSelectedPurok(null)}
    />
  );
}