import { DrillResult, DrillType, DrillStats, DrillStatsWithRecent, UserStats } from '../types';
import { storageUtils } from './storage';

export const drillLabels: Record<DrillType, string> = {
  audio_force_play: 'Audio Force Play',
  force_play_replay: 'Force Play Replay',
  check_swing: 'Check Swing',
  check_swing_middle: 'Check Swing Middle',
  pick_off_1b: 'Pick Off 1B',
  steal_2b: 'Steal 2B',
  steal_3b: 'Steal 3B',
  fair_foul: 'Fair/Foul',
  play_at_plate: 'Play at Plate',
  plays_at_1b_advanced: 'Plays at 1B Advanced',
  force_plays_middle: 'Force Plays Middle'
};

export const calculateDrillStats = (results: DrillResult[]): DrillStats => {
  const confirmed = results.filter(r => r.result === 'confirmed').length;
  const stands = results.filter(r => r.result === 'stands').length;
  const overturned = results.filter(r => r.result === 'overturned').length;
  const total = results.length;

  return {
    confirmed,
    stands,
    overturned,
    total,
    confirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0,
    standsPercentage: total > 0 ? (stands / total) * 100 : 0,
    overturnedPercentage: total > 0 ? (overturned / total) * 100 : 0
  };
};

export const calculateDrillStatsWithRecent = (results: DrillResult[]): DrillStatsWithRecent => {
  const allStats = calculateDrillStats(results);
  const last20Results = results.slice(-20);
  const last20Stats = calculateDrillStats(last20Results);

  return {
    ...allStats,
    last20: last20Stats
  };
};

export const getUserStats = (userId: string): UserStats => {
  const results = storageUtils.getUserDrillResults(userId);
  const user = storageUtils.getUsers().find(u => u.id === userId);
  
  const confirmed = results.filter(r => r.result === 'confirmed').length;
  const total = results.length;
  
  return {
    userId,
    username: user?.username || '',
    totalConfirmed: confirmed,
    totalAttempts: total,
    confirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0
  };
};

export const getLeaderboard = (): UserStats[] => {
  const users = storageUtils.getUsers();
  const userStats = users.map(user => {
    const stats = getUserStats(user.id);
    return {
      ...stats,
      level: user.level,
      location: user.location,
      city: user.city,
      state: user.state,
      profilePhoto: user.profilePhoto
    };
  });
  
  return userStats
    .filter(stats => stats.totalAttempts > 0)
    .sort((a, b) => b.confirmedPercentage - a.confirmedPercentage)
    .slice(0, 10);
};
export const getDrillLeaderboard = (drillType: DrillType): UserStats[] => {
  const users = storageUtils.getUsers();
  const userStats = users.map(user => {
    const results = storageUtils.getUserDrillResultsByType(user.id, drillType);
    const confirmed = results.filter(r => r.result === 'confirmed').length;
    const total = results.length;
    
    return {
      userId: user.id,
      username: user.username,
      level: user.level,
      location: user.location,
      totalConfirmed: confirmed,
      totalAttempts: total,
      confirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0
    };
  });
  
  return userStats
    .filter(stats => stats.totalAttempts > 0)
    .sort((a, b) => b.confirmedPercentage - a.confirmedPercentage)
    .slice(0, 10);
};

export const getDrillLast20Leaderboard = (drillType: DrillType): UserStats[] => {
  const users = storageUtils.getUsers();
  const userStats = users.map(user => {
    const results = storageUtils.getUserDrillResultsByType(user.id, drillType);
    const last20Results = results.slice(-20);
    const confirmed = last20Results.filter(r => r.result === 'confirmed').length;
    const total = last20Results.length;
    
    return {
      userId: user.id,
      username: user.username,
      level: user.level,
      location: user.location,
      totalConfirmed: confirmed,
      totalAttempts: total,
      confirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0,
      last20Confirmed: confirmed,
      last20Attempts: total,
      last20ConfirmedPercentage: total > 0 ? (confirmed / total) * 100 : 0
    };
  });
  
  return userStats
    .filter(stats => stats.totalAttempts > 0)
    .sort((a, b) => (b as any).last20ConfirmedPercentage - (a as any).last20ConfirmedPercentage)
    .slice(0, 10);
};