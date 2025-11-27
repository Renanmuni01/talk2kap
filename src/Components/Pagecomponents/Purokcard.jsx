// HoverDevCards.jsx - Purok Cards with embedded mini BarChart
import React from "react";
import { FiMail, FiArrowLeft, FiAlertTriangle, FiClock } from "react-icons/fi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";

const HoverDevCards = ({ onPurokSelect, selectedPurok, onBackToDashboard }) => {
  const purokStats = {
    1: { urgent: 2, nonUrgent: 8 },
    2: { urgent: 3, nonUrgent: 10 },
    3: { urgent: 5, nonUrgent: 19 },
    4: { urgent: 3, nonUrgent: 10 },
    5: { urgent: 2, nonUrgent: 20 },
    6: { urgent: 5, nonUrgent: 20 }
  };

  if (selectedPurok) {
    return <PurokInfo purokNumber={selectedPurok} onBack={onBackToDashboard} />;
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-start bg-gray-50 relative">
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
        <p className="text-5xl font-bold mb-10 text-center">Dashboard</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {Object.keys(purokStats).map((key) => (
            <Card
              key={key}
              title={`Purok ${key}`}
              Icon={FiMail}
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
      className="relative w-full h-52 p-4 rounded-xl border border-gray-200 bg-white overflow-hidden group hover:shadow-xl transition-shadow duration-300"
    >
      {/* Background hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />

      {/* Decorative icon */}
      <Icon className="absolute z-10 -top-10 -right-10 text-[8rem] text-slate-100 group-hover:text-violet-500 group-hover:rotate-12 transition-transform duration-300" />

      {/* Main icon */}
      <Icon className="mb-2 text-3xl text-violet-600 group-hover:text-white relative z-10 duration-300" />

      {/* Title */}
      <h3 className="font-bold text-2xl md:text-3xl text-slate-950 group-hover:text-white relative z-10 mb-2">
        {title}
      </h3>

      {/* Stats Section */}
      <div className="relative z-10 space-y-1.5">
        <div className="text-xl font-semibold text-slate-700 group-hover:text-white transition-colors duration-300">
          Total: {total}
        </div>

        <div className="flex justify-between text-base md:text-lg">
          <div className="flex items-center gap-1.5 text-red-600 group-hover:text-red-200 transition-colors duration-300">
            <FiAlertTriangle size={16} />
            <span>Urgent: {urgent}</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 group-hover:text-blue-200 transition-colors duration-300">
            <FiClock size={16} />
            <span>Non - Urgent: {nonUrgent}</span>
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

const PurokInfo = ({ purokNumber, onBack }) => {
  const purokData = {
    1: { name: "Purok 1", description: "Information about Purok 1", residents: 1228, complaints: 10, urgent: 2, nonUrgent: 8 },
    2: { name: "Purok 2", description: "Information about Purok 2", residents: 1576, complaints: 13, urgent: 3, nonUrgent: 10 },
    3: { name: "Purok 3", description: "Information about Purok 3", residents: 2894, complaints: 24, urgent: 5, nonUrgent: 19 },
    4: { name: "Purok 4", description: "Information about Purok 4", residents: 1553, complaints: 13, urgent: 3, nonUrgent: 10 },
    5: { name: "Purok 5", description: "Information about Purok 5", residents: 3481, complaints: 22, urgent: 2, nonUrgent: 20 },
    6: { name: "Purok 6", description: "Information about Purok 6", residents: 3481, complaints: 25, urgent: 5, nonUrgent: 20 }
  };

  const currentPurok = purokData[purokNumber];

  // Data for complaint breakdown chart
  const complaintChartData = [
    { name: "Total Complaints", value: currentPurok.complaints, color: "#10B981" },
    { name: "Urgent", value: currentPurok.urgent, color: "#EF4444" },
    { name: "Non-Urgent", value: currentPurok.nonUrgent, color: "#3B82F6" }
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
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-indigo-600 hover:text-indigo-800 transition-colors">
          <FiArrowLeft />
          <span className="text-lg md:text-xl font-medium">Back to Dashboard</span>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{currentPurok.name}</h1>
          <p className="text-lg md:text-xl text-gray-600">{currentPurok.description}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <p className="text-blue-600 text-sm font-semibold mb-1">TOTAL RESIDENTS</p>
            <p className="text-4xl font-bold text-gray-900">{currentPurok.residents}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
            <p className="text-green-600 text-sm font-semibold mb-1">TOTAL COMPLAINTS</p>
            <p className="text-4xl font-bold text-gray-900">{currentPurok.complaints}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
            <p className="text-red-600 text-sm font-semibold mb-1">URGENT</p>
            <p className="text-4xl font-bold text-gray-900">{currentPurok.urgent}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <p className="text-blue-600 text-sm font-semibold mb-1">NON-URGENT</p>
            <p className="text-4xl font-bold text-gray-900">{currentPurok.nonUrgent}</p>
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
              <span className="text-sm font-semibold text-gray-700">Total Complaints: {currentPurok.complaints}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Urgent: {currentPurok.urgent}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Non-Urgent: {currentPurok.nonUrgent}</span>
            </div>
          </div>
        </div>

        
             

                

                
              

      </div>
    </div>
  );
};



// Demo wrapper to show functionality
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