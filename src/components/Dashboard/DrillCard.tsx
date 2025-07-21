import React from 'react';
import { DrillType, DrillStatsWithRecent, ResultType } from '../../types';
import { drillLabels } from '../../utils/drillUtils';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface DrillCardProps {
  drillType: DrillType;
  stats: DrillStatsWithRecent;
  onResultClick: (drillType: DrillType, result: ResultType) => void;
}

const DrillCard: React.FC<DrillCardProps> = ({ drillType, stats, onResultClick }) => {
  const getResultIcon = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'stands':
        return <MinusCircle className="w-5 h-5" />;
      case 'overturned':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getResultColor = (result: ResultType) => {
    switch (result) {
      case 'confirmed':
        return 'bg-green-600 hover:bg-green-700';
      case 'stands':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'overturned':
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {drillLabels[drillType]}
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => onResultClick(drillType, 'confirmed')}
          className={`${getResultColor('confirmed')} text-white p-3 rounded-md flex items-center justify-center gap-2 transition-colors`}
        >
          {getResultIcon('confirmed')}
          <span className="text-sm font-medium">Confirmed</span>
        </button>
        <button
          onClick={() => onResultClick(drillType, 'stands')}
          className={`${getResultColor('stands')} text-white p-3 rounded-md flex items-center justify-center gap-2 transition-colors`}
        >
          {getResultIcon('stands')}
          <span className="text-sm font-medium">Stands</span>
        </button>
        <button
          onClick={() => onResultClick(drillType, 'overturned')}
          className={`${getResultColor('overturned')} text-white p-3 rounded-md flex items-center justify-center gap-2 transition-colors`}
        >
          {getResultIcon('overturned')}
          <span className="text-sm font-medium">Overturned</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Cumulative Stats</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold">
                {stats.confirmedPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 font-semibold">
                {stats.standsPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Stands</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold">
                {stats.overturnedPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Overturned</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last 20 Attempts</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold">
                {stats.last20.confirmedPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 font-semibold">
                {stats.last20.standsPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Stands</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold">
                {stats.last20.overturnedPercentage.toFixed(1)}%
              </div>
              <div className="text-gray-500">Overturned</div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 pt-2 border-t">
          Total Attempts: {stats.total}
        </div>
      </div>
    </div>
  );
};

export default DrillCard;