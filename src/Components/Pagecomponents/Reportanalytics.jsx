import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, BarChart3, Calendar, AlertCircle, CheckCircle, FileText, PieChart, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart as RPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { ref, onValue } from "firebase/database";
import { db } from "../../firebaseConfig";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const nonUrgent = payload.find(p => p.dataKey === 'nonUrgent')?.value || 0;
    const urgent = payload.find(p => p.dataKey === 'urgent')?.value || 0;
    const total = payload.find(p => p.dataKey === 'total')?.value || 0;

    return (
      <div className="bg-white p-4 border-2 border-indigo-200 rounded-lg shadow-2xl">
        <p className="font-bold text-gray-800 mb-3 text-base border-b pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-amber-600 font-medium">Non-Urgent:</span>
            <span className="font-bold text-amber-700">{nonUrgent}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-red-600 font-medium">Urgent:</span>
            <span className="font-bold text-red-700">{urgent}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <span className="text-indigo-700 font-bold">Total:</span>
              <span className="font-bold text-indigo-800 text-lg">{total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ReportAnalytics = () => {
  const [view, setView] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [complaintData, setComplaintData] = useState({
    monthlyComplaints: [],
    weeklyComplaints: {},
    topComplaints: []
  });
  const [loading, setLoading] = useState(true);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const formatComplaintType = (type) => {
    const typeMapping = {
      'medical': 'Medical Emergency',
      'fire': 'Fire Incident',
      'noise': 'Noise Complaints',
      'waste': 'Waste Management',
      'infrastructure': 'Infrastructure Issues',
      'unknown': 'Other Issues'
    };
    return typeMapping[type?.toLowerCase()] || type;
  };

  const parseTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const [datePart, timePart] = timestamp.split(", ");
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split("/");
    const validDate = new Date(`${year}-${month}-${day}T${timePart}`);
    return isNaN(validDate.getTime()) ? null : validDate;
  };

  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = firstDay.getDay();
    const weekNumber = Math.ceil((dayOfMonth + dayOfWeek) / 7);
    return Math.min(weekNumber, 4); // Cap at week 4
  };

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      // Base historical data (January to November Week 3)
      const baseMonthlyData = [
        { month: "January", urgent: 2, nonUrgent: 10 },
        { month: "February", urgent: 1, nonUrgent: 8 },
        { month: "March", urgent: 4, nonUrgent: 7 },
        { month: "April", urgent: 3, nonUrgent: 8 },
        { month: "May", urgent: 1, nonUrgent: 9 },
        { month: "June", urgent: 2, nonUrgent: 6 },
        { month: "July", urgent: 2, nonUrgent: 9 },
        { month: "August", urgent: 3, nonUrgent: 7 },
        { month: "September", urgent: 1, nonUrgent: 9 },
        { month: "October", urgent: 2, nonUrgent: 9 },
        { month: "November", urgent: 2, nonUrgent: 9 },
        { month: "December", urgent: 0, nonUrgent: 0 },
      ];

      const baseWeeklyData = {
        January: [
          { week: "Week 1", urgent: 0, nonUrgent: 3 },
          { week: "Week 2", urgent: 0, nonUrgent: 2 },
          { week: "Week 3", urgent: 1, nonUrgent: 3 },
          { week: "Week 4", urgent: 1, nonUrgent: 2 },
        ],
        February: [
          { week: "Week 1", urgent: 0, nonUrgent: 3 },
          { week: "Week 2", urgent: 0, nonUrgent: 2 },
          { week: "Week 3", urgent: 1, nonUrgent: 1 },
          { week: "Week 4", urgent: 0, nonUrgent: 2 },
        ],
        March: [
          { week: "Week 1", urgent: 1, nonUrgent: 2 },
          { week: "Week 2", urgent: 1, nonUrgent: 1 },
          { week: "Week 3", urgent: 0, nonUrgent: 3 },
          { week: "Week 4", urgent: 2, nonUrgent: 1 },
        ],
        April: [
          { week: "Week 1", urgent: 1, nonUrgent: 1 },
          { week: "Week 2", urgent: 1, nonUrgent: 2 },
          { week: "Week 3", urgent: 0, nonUrgent: 3 },
          { week: "Week 4", urgent: 1, nonUrgent: 2 },
        ],
        May: [
          { week: "Week 1", urgent: 0, nonUrgent: 2 },
          { week: "Week 2", urgent: 0, nonUrgent: 4 },
          { week: "Week 3", urgent: 1, nonUrgent: 2 },
          { week: "Week 4", urgent: 0, nonUrgent: 1 },
        ],
        June: [
          { week: "Week 1", urgent: 1, nonUrgent: 1 },
          { week: "Week 2", urgent: 0, nonUrgent: 1 },
          { week: "Week 3", urgent: 1, nonUrgent: 3 },
          { week: "Week 4", urgent: 0, nonUrgent: 1 },
        ],
        July: [
          { week: "Week 1", urgent: 1, nonUrgent: 3 },
          { week: "Week 2", urgent: 1, nonUrgent: 1 },
          { week: "Week 3", urgent: 0, nonUrgent: 2 },
          { week: "Week 4", urgent: 0, nonUrgent: 3 },
        ],
        August: [
          { week: "Week 1", urgent: 0, nonUrgent: 2 },
          { week: "Week 2", urgent: 0, nonUrgent: 1 },
          { week: "Week 3", urgent: 1, nonUrgent: 3 },
          { week: "Week 4", urgent: 1, nonUrgent: 2 },
        ],
        September: [
          { week: "Week 1", urgent: 0, nonUrgent: 2 },
          { week: "Week 2", urgent: 0, nonUrgent: 3 },
          { week: "Week 3", urgent: 0, nonUrgent: 2 },
          { week: "Week 4", urgent: 1, nonUrgent: 2 },
        ],
        October: [
          { week: "Week 1", urgent: 1, nonUrgent: 3 },
          { week: "Week 2", urgent: 0, nonUrgent: 2 },
          { week: "Week 3", urgent: 0, nonUrgent: 2 },
          { week: "Week 4", urgent: 1, nonUrgent: 2 },
        ],
        November: [
          { week: "Week 1", urgent: 1, nonUrgent: 3 },
          { week: "Week 2", urgent: 1, nonUrgent: 4 },
          { week: "Week 3", urgent: 0, nonUrgent: 2 },
          { week: "Week 4", urgent: 0, nonUrgent: 0 },
        ],
        December: [
          { week: "Week 1", urgent: 0, nonUrgent: 0 },
          { week: "Week 2", urgent: 0, nonUrgent: 0 },
          { week: "Week 3", urgent: 0, nonUrgent: 0 },
          { week: "Week 4", urgent: 0, nonUrgent: 0 },
        ],
      };

      // Base top complaints will be calculated from historical + new data
      const baseTypeMapping = {
        'noise': 3,
        'waste': 1,
        'infrastructure': 4, // Combined road maintenance + street lighting + drainage
        'medical': 0,
        'fire': 0
      };

      if (!snapshot.exists()) {
        // If no Firebase data, show base historical counts
        const fallbackComplaints = Object.entries(baseTypeMapping)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => ({ type: formatComplaintType(type), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setComplaintData({
          monthlyComplaints: baseMonthlyData,
          weeklyComplaints: baseWeeklyData,
          topComplaints: fallbackComplaints
        });
        setLoading(false);
        return;
      }

      const usersData = snapshot.val();
      const allComplaints = [];

      // Collect all complaints from Firebase
      Object.keys(usersData).forEach((userId) => {
        const user = usersData[userId];
        if (user.userComplaints) {
          Object.keys(user.userComplaints).forEach((complaintId) => {
            const complaint = user.userComplaints[complaintId];
            const parsedDate = parseTimestamp(complaint.timestamp);
            
            if (parsedDate) {
              allComplaints.push({
                ...complaint,
                date: parsedDate,
                month: parsedDate.getMonth(),
                monthName: months[parsedDate.getMonth()],
                week: getWeekOfMonth(parsedDate),
                isUrgent: complaint.label === 'urgent'
              });
            }
          });
        }
      });

      // Merge base data with new Firebase data
      const monthlyStats = baseMonthlyData.map((baseMonth, index) => {
        const newMonthComplaints = allComplaints.filter(c => c.month === index);
        const newUrgent = newMonthComplaints.filter(c => c.isUrgent).length;
        const newNonUrgent = newMonthComplaints.filter(c => !c.isUrgent).length;
        
        return {
          month: baseMonth.month,
          urgent: baseMonth.urgent + newUrgent,
          nonUrgent: baseMonth.nonUrgent + newNonUrgent
        };
      });

      // Merge weekly data
      const weeklyStats = {};
      months.forEach((monthName, monthIndex) => {
        const baseWeeks = baseWeeklyData[monthName] || [
          { week: "Week 1", urgent: 0, nonUrgent: 0 },
          { week: "Week 2", urgent: 0, nonUrgent: 0 },
          { week: "Week 3", urgent: 0, nonUrgent: 0 },
          { week: "Week 4", urgent: 0, nonUrgent: 0 },
        ];

        weeklyStats[monthName] = baseWeeks.map((baseWeek, weekIndex) => {
          const weekNum = weekIndex + 1;
          const newWeekComplaints = allComplaints.filter(
            c => c.month === monthIndex && c.week === weekNum
          );
          const newUrgent = newWeekComplaints.filter(c => c.isUrgent).length;
          const newNonUrgent = newWeekComplaints.filter(c => !c.isUrgent).length;
          
          return {
            week: baseWeek.week,
            urgent: baseWeek.urgent + newUrgent,
            nonUrgent: baseWeek.nonUrgent + newNonUrgent
          };
        });
      });

      // Merge top complaints - start with base historical data
      const typeCount = { ...baseTypeMapping };
      
      // Add new complaints from Firebase
      allComplaints.forEach(complaint => {
        const type = complaint.type?.toLowerCase() || 'unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      // Format and sort
      const topComplaints = Object.entries(typeCount)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({ type: formatComplaintType(type), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setComplaintData({
        monthlyComplaints: monthlyStats,
        weeklyComplaints: weeklyStats,
        topComplaints
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const monthlyData = months.map((m) => {
    const record = complaintData.monthlyComplaints.find((d) => d.month === m);
    const urgent = record?.urgent || 0;
    const nonUrgent = record?.nonUrgent || 0;
    return { name: m.substring(0, 3), urgent, nonUrgent, total: urgent + nonUrgent };
  });

  const weeklyData = (complaintData.weeklyComplaints[selectedMonth] || []).map((d) => {
    const urgent = d.urgent;
    const nonUrgent = d.nonUrgent;
    return { name: d.week, urgent, nonUrgent, total: urgent + nonUrgent };
  });

  const graphData = view === "monthly" ? monthlyData : weeklyData;

  // Calculate comprehensive statistics based on current view
  const currentData = view === "monthly" 
    ? complaintData.monthlyComplaints 
    : complaintData.weeklyComplaints[selectedMonth] || [];
  
  const totalComplaints = currentData.reduce((sum, item) => sum + item.urgent + item.nonUrgent, 0);
  const totalUrgent = currentData.reduce((sum, item) => sum + item.urgent, 0);
  const totalNonUrgent = currentData.reduce((sum, item) => sum + item.nonUrgent, 0);
  const avgPerPeriod = view === "monthly" 
    ? Math.round(totalComplaints / 12)
    : Math.round(totalComplaints / currentData.length);
  const urgentPercentage = totalComplaints > 0 ? ((totalUrgent / totalComplaints) * 100).toFixed(1) : '0.0';
  const nonUrgentPercentage = totalComplaints > 0 ? ((totalNonUrgent / totalComplaints) * 100).toFixed(1) : '0.0';

  // Pie chart data for complaint distribution
  const pieData = [
    { name: 'Urgent', value: totalUrgent, color: '#EF4444' },
    { name: 'Non-Urgent', value: totalNonUrgent, color: '#F59E0B' }
  ];

  // Category distribution data
  const categoryData = complaintData.topComplaints.map(c => ({
    name: c.type,
    value: c.count
  }));

  const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Background Watermark */}
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
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Activity className="text-indigo-600" size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Data Visualization Controls</h2>
                <p className="text-sm text-gray-600">Select time period and view preferences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("monthly")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 border-2 ${
                  view === 'monthly' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                <Calendar size={18} />
                Monthly View
              </button>
              <button
                onClick={() => setView("weekly")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 border-2 ${
                  view === 'weekly' 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                <Calendar size={18} />
                Weekly View
              </button>
            </div>
          </div>

          {view === "weekly" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-3">Month Selection</label>
              <select
                className="w-full md:w-64 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Key Performance Indicators */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Key Performance Indicators (KPI)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BarChart3 size={28} className="text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">TOTAL</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{totalComplaints}</p>
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-xs text-gray-500 mt-2">
                {view === 'monthly' ? 'Annual aggregate data' : `For ${selectedMonth}`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle size={28} className="text-red-600" />
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">{urgentPercentage}%</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{totalUrgent}</p>
              <p className="text-sm font-medium text-gray-600">Urgent Cases</p>
              <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <CheckCircle size={28} className="text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{nonUrgentPercentage}%</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{totalNonUrgent}</p>
              <p className="text-sm font-medium text-gray-600">Non-Urgent Cases</p>
              <p className="text-xs text-gray-500 mt-2">Standard priority level</p>
            </div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <TrendingUp className="text-indigo-600" size={28} />
              Figure 1: Complaint Trend Analysis
            </h3>
            <p className="text-sm text-gray-600 ml-10">
              {view === 'monthly' ? 'Monthly distribution of urgent and non-urgent complaints across the year' : `Weekly breakdown for ${selectedMonth} showing complaint patterns`}
            </p>
          </div>

          <div className="h-96 w-full bg-gray-50 rounded-lg p-4 border border-gray-200">
            <ResponsiveContainer>
              <ComposedChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  stroke="#4B5563"
                  style={{ fontSize: '13px', fontWeight: '600' }}
                  label={{ value: view === 'monthly' ? 'Months' : 'Weeks', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold' } }}
                />
                <YAxis 
                  stroke="#4B5563"
                  style={{ fontSize: '13px', fontWeight: '600' }}
                  label={{ value: 'Number of Complaints', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', textAnchor: 'middle' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontWeight: '600' }}
                  iconType="circle"
                />

                <Bar 
                  dataKey="nonUrgent" 
                  fill="#F59E0B"
                  name="Non-Urgent Complaints"
                />
                <Bar 
                  dataKey="urgent" 
                  fill="#EF4444"
                  name="Urgent Complaints"
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  name="Total Complaints"
                  dot={{ fill: '#4F46E5', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4">
              <PieChart className="text-indigo-600" size={24} />
              Figure 2: Complaint Priority Distribution
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <RPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4">
              <BarChart3 className="text-indigo-600" size={24} />
              Figure 3: Complaint Category Distribution
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    style={{ fontSize: '12px', fontWeight: '600' }}
                    allowDecimals={false}
                  />
                  <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '11px', fontWeight: '500' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-6">
            <Clock className="text-orange-600" size={24} />
            Table 1: Top Complaint Categories
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Complaint Category</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Total Cases</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {complaintData.topComplaints.length > 0 ? (
                  complaintData.topComplaints.map((complaint, index) => {
                    const totalCases = complaintData.topComplaints.reduce((sum, c) => sum + c.count, 0);
                    const percentage = totalCases > 0 ? ((complaint.count / totalCases) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={complaint.type} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">{complaint.type}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-2xl font-bold text-gray-900">{complaint.count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold text-sm">
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No complaint data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportAnalytics;