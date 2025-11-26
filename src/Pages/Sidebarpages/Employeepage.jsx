import React from "react";
import EmployeeTable from "../../Components/Pagecomponents/Employeetable";

const Employeepage = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 w-full">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Barangay Employees
          </h1>
          <p className="text-gray-600">
            Feedbacks, Ratings, and Complaints about specific Employees
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm  overflow-hidden mb-6">
          <EmployeeTable />
        </div>
        
      </div>
    </div>
  );
};

export default Employeepage;
