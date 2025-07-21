import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DrillType, DrillResult } from '../../types';
import { drillLabels } from '../../utils/drillUtils';
import { storageUtils } from '../../utils/storage';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';

const drillTypes: DrillType[] = [
  'audio_force_play',
  'force_play_replay',
  'check_swing',
  'check_swing_middle',
  'pick_off_1b',
  'steal_2b',
  'steal_3b',
  'fair_foul',
  'play_at_plate',
  'plays_at_1b_advanced',
  'force_plays_middle'
];

interface ChartDataPoint {
  date: string;
  percentage: number;
  confirmed: number;
  total: number;
}

const DrillAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [selectedDrill, setSelectedDrill] = useState<DrillType | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [drillStats, setDrillStats] = useState<Record<DrillType, { total: number; percentage: number }>>({} as any);

  useEffect(() => {
    if (!user) return;

    // Calculate stats for all drills
    const stats: Record<DrillType, { total: number; percentage: number }> = {} as any;
    
    drillTypes.forEach(drillType => {
      const results = storageUtils.getUserDrillResultsByType(user.id, drillType);
      const confirmed = results.filter(r => r.result === 'confirmed').length;
      const total = results.length;
      
      stats[drillType] = {
        total,
        percentage: total > 0 ? (confirmed / total) * 100 : 0
      };
    });
    
    setDrillStats(stats);
  }, [user]);

  useEffect(() => {
    if (!user || !selectedDrill) {
      setChartData([]);
      return;
    }

    const results = storageUtils.getUserDrillResultsByType(user.id, selectedDrill);
    
    if (results.length === 0) {
      setChartData([]);
      return;
    }

    // Group results by date and calculate running percentage
    const dataByDate: Record<string, DrillResult[]> = {};
    
    results.forEach(result => {
      const date = new Date(result.timestamp).toDateString();
      if (!dataByDate[date]) {
        dataByDate[date] = [];
      }
      dataByDate[date].push(result);
    });

    // Calculate cumulative percentage over time
    const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    let cumulativeConfirmed = 0;
    let cumulativeTotal = 0;
    
    const chartPoints: ChartDataPoint[] = sortedDates.map(date => {
      const dayResults = dataByDate[date];
      const dayConfirmed = dayResults.filter(r => r.result === 'confirmed').length;
      
      cumulativeConfirmed += dayConfirmed;
      cumulativeTotal += dayResults.length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: (cumulativeConfirmed / cumulativeTotal) * 100,
        confirmed: cumulativeConfirmed,
        total: cumulativeTotal
      };
    });

    setChartData(chartPoints);
  }, [user, selectedDrill]);

  const handleDrillClick = (drillType: DrillType) => {
    setSelectedDrill(selectedDrill === drillType ? null : drillType);
  };

  const getMaxPercentage = () => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => d.percentage));
    return Math.ceil(max / 10) * 10; // Round up to nearest 10
  };

  const getMinPercentage = () => {
    if (chartData.length === 0) return 0;
    const min = Math.min(...chartData.map(d => d.percentage));
    return Math.floor(min / 10) * 10; // Round down to nearest 10
  };

  if (!user) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white">
          <img src="/EL1_Logo.png" alt="EL Logo" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-mlb-navy to-mlb-red bg-clip-text text-transparent">Performance Analytics</h2>
          <p className="text-gray-500 text-sm font-medium">Track your progress over time for each drill type</p>
        </div>
      </div>

      {/* Drill Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {drillTypes.map(drillType => {
          const stats = drillStats[drillType] || { total: 0, percentage: 0 };
          const isSelected = selectedDrill === drillType;
          
          return (
            <button
              key={drillType}
              onClick={() => handleDrillClick(drillType)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-mlb-navy bg-mlb-navy/5 shadow-lg'
                  : 'border-gray-200 hover:border-mlb-navy/50 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Target className={`w-5 h-5 ${isSelected ? 'text-mlb-navy' : 'text-gray-400'}`} />
                <h3 className={`font-bold text-sm ${isSelected ? 'text-mlb-navy' : 'text-gray-700'}`}>
                  {drillLabels[drillType]}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Success Rate</span>
                  <span className={`text-sm font-bold ${stats.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {stats.total > 0 ? `${stats.percentage.toFixed(1)}%` : 'No data'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total Attempts</span>
                  <span className="text-sm font-bold text-mlb-navy">
                    {stats.total}
                  </span>
                </div>
                
                {stats.total > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              
              {isSelected && (
                <div className="mt-3 text-xs text-mlb-navy font-medium">
                  Click to hide chart
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart Section */}
      {selectedDrill && (
        <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-mlb-navy" />
            <h3 className="text-lg font-bold text-mlb-navy">
              {drillLabels[selectedDrill]} - Performance Over Time
            </h3>
          </div>
          
          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No training data available</p>
              <p className="text-gray-400 text-sm">Complete some drills to see your progress chart</p>
            </div>
          ) : (
            <div className="relative">
              {/* Chart Container */}
              <div className="h-64 relative bg-white rounded-lg p-4 border border-gray-200/50">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500 font-medium">
                  <span>{getMaxPercentage()}%</span>
                  <span>{Math.round((getMaxPercentage() + getMinPercentage()) / 2)}%</span>
                  <span>{getMinPercentage()}%</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-8 mr-4 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    <div className="h-full border-l border-gray-200"></div>
                    <div className="absolute top-0 w-full border-t border-gray-100"></div>
                    <div className="absolute top-1/2 w-full border-t border-gray-100"></div>
                    <div className="absolute bottom-0 w-full border-t border-gray-200"></div>
                  </div>
                  
                  {/* Line chart */}
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    
                    {chartData.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={chartData.map((point, index) => {
                          const x = (index / (chartData.length - 1)) * 90.9; // 100% / 1.1 to leave 10% space
                          const y = 100 - ((point.percentage - getMinPercentage()) / (getMaxPercentage() - getMinPercentage())) * 100;
                          return `${x}%,${y}%`;
                        }).join(' ')}
                      />
                    )}
                    
                    {/* Data points */}
                    {chartData.map((point, index) => {
                      const x = (index / Math.max(chartData.length - 1, 1)) * 90.9; // 100% / 1.1 to leave 10% space
                      const y = 100 - ((point.percentage - getMinPercentage()) / (getMaxPercentage() - getMinPercentage())) * 100;
                      
                      return (
                        <g key={index}>
                          <circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="4"
                            fill="#10b981"
                            stroke="white"
                            strokeWidth="2"
                            className="hover:r-6 transition-all duration-200"
                          />
                          
                          {/* Tooltip on hover */}
                          <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <rect
                              x={`${x}%`}
                              y={`${y - 15}%`}
                              width="60"
                              height="30"
                              rx="4"
                              fill="rgba(0,0,0,0.8)"
                              transform="translate(-30, -15)"
                            />
                            <text
                              x={`${x}%`}
                              y={`${y - 5}%`}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {point.percentage.toFixed(1)}%
                            </text>
                            <text
                              x={`${x}%`}
                              y={`${y + 5}%`}
                              textAnchor="middle"
                              fill="white"
                              fontSize="8"
                            >
                              {point.confirmed}/{point.total}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-gray-500 font-medium">
                  <div className="flex justify-between w-full" style={{ width: '90.9%' }}>
                    {chartData.map((point, index) => (
                      <span key={index} className={index % Math.ceil(chartData.length / 6) === 0 ? '' : 'hidden'}>
                        {point.date}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Chart Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {chartData[chartData.length - 1]?.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Current Rate</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-mlb-navy">
                    {Math.max(...chartData.map(d => d.percentage)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Best Rate</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-mlb-navy">
                    {chartData[chartData.length - 1]?.total || 0}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Total Attempts</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-mlb-navy">
                    {chartData.length}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Training Days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrillAnalytics;