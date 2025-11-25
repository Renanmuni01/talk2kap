// HoverDevCards.jsx - Slightly smaller cards with proportional icons and fonts + Background Logo
import React from "react";
import { FiMail, FiArrowLeft, FiAlertTriangle, FiClock } from "react-icons/fi";

const HoverDevCards = ({ onPurokSelect, selectedPurok, onBackToDashboard }) => {
  const purokStats = {
    1: { urgent: 8, nonUrgent: 4 },
    2: { urgent: 3, nonUrgent: 5 },
    3: { urgent: 12, nonUrgent: 3 },
    4: { urgent: 5, nonUrgent: 5 },
    5: { urgent: 2, nonUrgent: 4 },
    6: { urgent: 9, nonUrgent: 5 }
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
      className="relative w-full h-60 p-5 rounded-xl border border-slate-300 bg-white overflow-hidden group hover:shadow-xl transition-shadow duration-300"
    >
      {/* Background hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />

      {/* Decorative icon */}
      <Icon className="absolute z-10 -top-12 -right-12 text-[10rem] text-slate-100 group-hover:text-violet-500 group-hover:rotate-12 transition-transform duration-300" />

      {/* Main icon */}
      <Icon className="mb-3 text-3xl text-violet-600 group-hover:text-white relative z-10 duration-300" />

      {/* Title */}
      <h3 className="font-bold text-xl md:text-2xl text-slate-950 group-hover:text-white relative z-10 mb-3">
        {title}
      </h3>

      {/* Stats Section */}
      <div className="relative z-10 space-y-2">
        <div className="text-base font-semibold text-slate-700 group-hover:text-white transition-colors duration-300">
          Total: {total}
        </div>

        <div className="flex justify-between text-sm md:text-base">
          <div className="flex items-center gap-2 text-red-600 group-hover:text-red-200 transition-colors duration-300">
            <FiAlertTriangle size={14} />
            <span>Urgent: {urgent}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-200 transition-colors duration-300">
            <FiClock size={14} />
            <span>Normal: {nonUrgent}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 group-hover:bg-gray-300 transition-colors duration-300">
          <div
            className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: total > 0 ? `${(urgent / total) * 100}%` : "0%" }}
          ></div>
        </div>
      </div>
    </button>
  );
};

const PurokInfo = ({ purokNumber, onBack }) => {
  const purokData = {
    1: { name: "Purok 1", description: "Information about Purok 1", residents: 150, complaints: 12, resolved: 8, pending: 4, urgent: 8, nonUrgent: 4 },
    2: { name: "Purok 2", description: "Information about Purok 2", residents: 175, complaints: 8, resolved: 6, pending: 2, urgent: 3, nonUrgent: 5 },
    3: { name: "Purok 3", description: "Information about Purok 3", residents: 200, complaints: 15, resolved: 10, pending: 5, urgent: 12, nonUrgent: 3 },
    4: { name: "Purok 4", description: "Information about Purok 4", residents: 180, complaints: 10, resolved: 7, pending: 3, urgent: 5, nonUrgent: 5 },
    5: { name: "Purok 5", description: "Information about Purok 5", residents: 165, complaints: 6, resolved: 4, pending: 2, urgent: 2, nonUrgent: 4 },
    6: { name: "Purok 6", description: "Information about Purok 6", residents: 190, complaints: 14, resolved: 11, pending: 3, urgent: 9, nonUrgent: 5 }
  };

  const currentPurok = purokData[purokNumber];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-indigo-600 hover:text-indigo-800 transition-colors">
        <FiArrowLeft />
        <span className="text-lg md:text-xl font-medium">Back to Dashboard</span>
      </button>

      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{currentPurok.name}</h1>
        <p className="text-lg md:text-xl text-gray-600">{currentPurok.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Residents" value={currentPurok.residents} bgColor="bg-blue-500" />
        <StatCard title="Total Complaints" value={currentPurok.complaints} bgColor="bg-yellow-500" />
        <StatCard title="Resolved" value={currentPurok.resolved} bgColor="bg-green-500" />
        <StatCard title="Pending" value={currentPurok.pending} bgColor="bg-red-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-300 p-6">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-3">
          <ActivityItem title="New complaint filed" time="2 hours ago" type="complaint" />
          <ActivityItem title="Complaint resolved" time="1 day ago" type="resolved" />
          <ActivityItem title="Barangay meeting scheduled" time="3 days ago" type="meeting" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, bgColor }) => (
  <div className="bg-white rounded-xl border border-slate-300 p-5 flex flex-col items-center">
    <div className={`w-14 h-14 ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
      <FiMail className="text-white text-2xl md:text-3xl" />
    </div>
    <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{value}</h3>
    <p className="text-lg md:text-xl text-gray-600">{title}</p>
  </div>
);

const ActivityItem = ({ title, time, type }) => {
  const getTypeColor = () => {
    switch (type) {
      case "complaint": return "text-yellow-600";
      case "resolved": return "text-green-600";
      case "meeting": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
      <span className={`font-medium text-lg md:text-xl ${getTypeColor()}`}>{title}</span>
      <span className="text-gray-500 text-sm md:text-base">{time}</span>
    </div>
  );
};

export default HoverDevCards;
