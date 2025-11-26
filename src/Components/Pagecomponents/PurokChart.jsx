// --- FULL PUROKCHART UPDATED WITH REPORTANALYTICS TABLE STYLE ---

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Users, BarChart3, PieChart as PieIcon, ClipboardList } from 'lucide-react';

const purokData = [
  { name: 'P1', population: 1228, households: 328, registered_voters: 596 },
  { name: 'P2', population: 1576, households: 414, registered_voters: 764},
  { name: 'P3', population: 2894, households: 584, registered_voters: 1405 },
  { name: 'P4', population: 1553, households: 463, registered_voters: 754 },
  { name: 'P5', population: 3481, households: 508, registered_voters: 1690 },
  { name: 'P6', population: 3074, households: 742, registered_voters: 1493 }
];

const pieData = purokData.map(p => ({ name: p.name, value: p.population }));
const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PurokChart = () => {
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

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-indigo-600" size={32} />
          Purok Overview Dashboard
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 p-6">
            <p className="text-indigo-600 text-sm font-semibold mb-1">TOTAL POPULATION</p>
            <p className="text-4xl font-bold text-gray-900">
              {purokData.reduce((sum, p) => sum + p.population, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
            <p className="text-green-600 text-sm font-semibold mb-1">TOTAL HOUSEHOLDS</p>
            <p className="text-4xl font-bold text-gray-900">
              {purokData.reduce((sum, p) => sum + p.households, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6">
            <p className="text-amber-600 text-sm font-semibold mb-1">REGISTERED VOTERS</p>
            <p className="text-4xl font-bold text-gray-900">
              {purokData.reduce((sum, p) => sum + p.registered_voters, 0)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4">
              <BarChart3 className="text-indigo-600" size={24} />
              Figure 1: Purok Demographics
            </h3>

            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={purokData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="population" fill="#4F46E5" />
                  <Bar dataKey="households" fill="#10B981" />
                  <Bar dataKey="registered_voters" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4">
              <PieIcon className="text-indigo-600" size={24} />
              Figure 2: Population Distribution by Purok
            </h3>

            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

       <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
  
  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-6">
    <ClipboardList className="text-orange-600" size={24} />
    Table 1: Detailed Purok Information
  </h3>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-100 border-b-2 border-gray-300">
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Purok</th>
          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Population</th>
          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Households</th>
          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Registered Voters</th>
        </tr>
      </thead>

      <tbody>
        {purokData.map((purok, index) => (
          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-6 py-4">
              <span className="font-semibold text-gray-800">{purok.name}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-xl font-bold text-gray-900">{purok.population}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-xl font-bold text-gray-900">{purok.households}</span>
            </td>
            <td className="px-6 py-4 text-center">
              <span className="text-xl font-bold text-gray-900">{purok.registered_voters}</span>
            </td>
          </tr>
        ))}

        {/* Total Row */}
        <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
          <td className="px-6 py-4 text-left">Total</td>
          <td className="px-6 py-4 text-center">
            {purokData.reduce((sum, p) => sum + p.population, 0)}
          </td>
          <td className="px-6 py-4 text-center">
            {purokData.reduce((sum, p) => sum + p.households, 0)}
          </td>
          <td className="px-6 py-4 text-center">
            {purokData.reduce((sum, p) => sum + p.registered_voters, 0)}
          </td>
        </tr>

      </tbody>
    </table>
  </div>
</div>

      </div>
    </div>
  );
};

export default PurokChart;
