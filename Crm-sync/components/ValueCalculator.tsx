import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

export const ValueCalculator: React.FC = () => {
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(50);

  const yearlyHours = hoursPerWeek * 52;
  const yearlyCost = yearlyHours * hourlyRate;
  const savedCost = yearlyCost * 0.98; // 98% time savings
  const savedHours = yearlyHours * 0.98;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">Calculate Your Savings</h3>
        <p className="text-white/90">See how much time and money CRM-Sync saves you</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Hours per week slider */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Hours spent on data entry per week: <span className="text-primary text-xl">{hoursPerWeek}</span>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1 hour</span>
            <span>20 hours</span>
          </div>
        </div>

        {/* Hourly rate slider */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Your hourly rate: <span className="text-primary text-xl">${hourlyRate}</span>
          </label>
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>$20/hr</span>
            <span>$200/hr</span>
          </div>
        </div>

        {/* Results */}
        <motion.div
          key={`${hoursPerWeek}-${hourlyRate}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mx-auto mb-3 shadow-sm">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-dark mb-1">{savedHours.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Hours Saved/Year</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mx-auto mb-3 shadow-sm">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-dark mb-1">${savedCost.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Saved/Year</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mx-auto mb-3 shadow-sm">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div className="text-3xl font-bold text-dark mb-1">98%</div>
              <div className="text-sm text-gray-600">Time Savings</div>
            </div>
          </div>

          <div className="border-t border-white/50 pt-6">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-gray-600 mb-4">
                <span className="font-semibold text-dark">That's {(savedHours / 8).toFixed(0)} full work days</span> you could spend on revenue-generating activities!
              </p>
              <button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 inline-flex items-center"
              >
                Start Saving Time Now
                <TrendingUp className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-xs text-gray-500 text-center">
          * Based on average time savings reported by CRM-Sync users
        </p>
      </div>
    </div>
  );
};
