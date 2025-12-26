import { useEffect, useState } from 'react';
import { AlertTriangle, Info, Heart, Brain, Clock, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, SleepLog, LifestyleLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HealthAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  description: string;
  icon?: React.ReactNode;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  trend?: 'improving' | 'declining' | 'stable';
}

export default function HealthAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeHealthPatterns();
  }, [user]);

  const analyzeHealthPatterns = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const [sleepResult, lifestyleResult] = await Promise.all([
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', fourWeeksAgo.toISOString().split('T')[0])
          .order('log_date', { ascending: false }),
        supabase
          .from('lifestyle_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', fourWeeksAgo.toISOString().split('T')[0])
          .order('log_date', { ascending: false })
      ]);

      if (sleepResult.error) throw sleepResult.error;
      if (lifestyleResult.error) throw lifestyleResult.error;

      const detectedAlerts: HealthAlert[] = [];

      if (sleepResult.data && sleepResult.data.length > 0) {
        detectedAlerts.push(...detectSleepIssues(sleepResult.data, lifestyleResult.data || []));
      }

      setAlerts(detectedAlerts);
    } catch (error: any) {
      console.error('Error analyzing health patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectSleepIssues = (sleepLogs: SleepLog[], lifestyleLogs: LifestyleLog[]): HealthAlert[] => {
    const issues: HealthAlert[] = [];

    // Sleep Duration Analysis
    const logsWithHours = sleepLogs.filter(log => log.total_hours !== null);
    const shortSleepCount = logsWithHours.filter(log => (log.total_hours || 0) < 6).length;
    const longSleepCount = logsWithHours.filter(log => (log.total_hours || 0) > 10).length;
    const optimalSleepCount = logsWithHours.filter(log => (log.total_hours || 0) >= 7 && (log.total_hours || 0) <= 9).length;

    if (shortSleepCount >= 5) {
      issues.push({
        id: 'short-sleep',
        type: 'critical',
        title: 'Chronic Sleep Deprivation',
        description: `You've had ${shortSleepCount} nights with less than 6 hours of sleep in the past 4 weeks. This can lead to serious health issues including weakened immune system, memory problems, and increased risk of accidents.`,
        icon: <AlertTriangle className="w-5 h-5" />,
        severity: 'critical',
        recommendation: 'Establish a consistent bedtime routine, avoid caffeine after 2 PM, and create a sleep-friendly environment. Consider consulting a sleep specialist.',
        trend: 'declining'
      });
    }

    if (longSleepCount >= 5) {
      issues.push({
        id: 'long-sleep',
        type: 'warning',
        title: 'Excessive Sleep Duration',
        description: `You've had ${longSleepCount} nights with more than 10 hours of sleep. While occasional long sleep is normal, consistently oversleeping may indicate underlying health issues or poor sleep quality.`,
        icon: <Clock className="w-5 h-5" />,
        severity: 'medium',
        recommendation: 'Monitor if this extended sleep affects your daytime alertness. Consider checking for sleep disorders like sleep apnea.',
        trend: 'stable'
      });
    }

    if (optimalSleepCount >= 14) {
      issues.push({
        id: 'optimal-sleep',
        type: 'success',
        title: 'Excellent Sleep Duration',
        description: `Great job! You've maintained optimal sleep duration (7-9 hours) for ${optimalSleepCount} nights. This is excellent for your overall health and well-being.`,
        icon: <Zap className="w-5 h-5" />,
        severity: 'low',
        recommendation: 'Keep maintaining this consistent sleep schedule for optimal health benefits.',
        trend: 'improving'
      });
    }

    // Sleep Quality Analysis
    const logsWithQuality = sleepLogs.filter(log => log.sleep_quality !== null);
    const poorQualityCount = logsWithQuality.filter(log => (log.sleep_quality || 0) < 5).length;
    const goodQualityCount = logsWithQuality.filter(log => (log.sleep_quality || 0) >= 7).length;

    if (poorQualityCount >= 7) {
      issues.push({
        id: 'poor-quality',
        type: 'critical',
        title: 'Chronic Poor Sleep Quality',
        description: `Your sleep quality has been rated below 5 on ${poorQualityCount} occasions. Poor sleep quality can significantly impact your daily functioning, mood, and long-term health.`,
        icon: <AlertTriangle className="w-5 h-5" />,
        severity: 'critical',
        recommendation: 'Improve your sleep environment (dark, cool, quiet), reduce screen time before bed, and consider relaxation techniques like meditation.',
        trend: 'declining'
      });
    }

    if (goodQualityCount >= 14) {
      issues.push({
        id: 'good-quality',
        type: 'success',
        title: 'Consistently Good Sleep Quality',
        description: `Excellent! You've rated your sleep quality 7 or above for ${goodQualityCount} nights. This indicates healthy sleep patterns and good sleep hygiene.`,
        icon: <Zap className="w-5 h-5" />,
        severity: 'low',
        recommendation: 'Continue your current sleep habits and environment setup.',
        trend: 'improving'
      });
    }

    // Sleep Schedule Consistency
    const sleepTimes = sleepLogs
      .filter(log => log.bedtime)
      .map(log => {
        const [hours, minutes] = log.bedtime!.split(':').map(Number);
        return hours * 60 + minutes;
      });

    if (sleepTimes.length >= 7) {
      const avgTime = sleepTimes.reduce((a, b) => a + b, 0) / sleepTimes.length;
      const variance = sleepTimes.reduce((sum, time) => {
        const diff = Math.abs(time - avgTime);
        return sum + (diff > 720 ? 1440 - diff : diff);
      }, 0) / sleepTimes.length;

      if (variance > 90) {
        issues.push({
          id: 'irregular-schedule',
          type: 'warning',
          title: 'Irregular Sleep Schedule',
          description: 'Your bedtime varies significantly from night to night. An irregular sleep schedule disrupts your circadian rhythm and reduces sleep quality.',
          icon: <Clock className="w-5 h-5" />,
          severity: 'medium',
          recommendation: 'Try to maintain consistent sleep and wake times, even on weekends. Set a bedtime alarm to help establish routine.',
          trend: 'stable'
        });
      }
    }

    // Frequent Awakenings
    const highAwakeningsCount = sleepLogs.filter(log => (log.awakenings || 0) >= 3).length;
    if (highAwakeningsCount >= 5) {
      issues.push({
        id: 'frequent-awakenings',
        type: 'critical',
        title: 'Frequent Night Awakenings',
        description: `You've woken up 3 or more times during the night on ${highAwakeningsCount} occasions. This can indicate sleep disorders like sleep apnea or insomnia.`,
        icon: <AlertTriangle className="w-5 h-5" />,
        severity: 'critical',
        recommendation: 'Consider consulting a healthcare provider or sleep specialist. Check for sleep apnea symptoms like snoring or gasping for air.',
        trend: 'declining'
      });
    }

    // Dream Analysis
    const nightmareCount = sleepLogs.filter(log => log.dream_type === 'Nightmare').length;
    const recentNightmares = sleepLogs.filter(
      log => log.dream_type === 'Nightmare' &&
             new Date(log.log_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    if (recentNightmares >= 3) {
      issues.push({
        id: 'frequent-nightmares',
        type: 'warning',
        title: 'Frequent Nightmares',
        description: `You've experienced ${recentNightmares} nightmares in the past week. Frequent nightmares can disrupt sleep quality and may be related to stress or anxiety.`,
        icon: <Brain className="w-5 h-5" />,
        severity: 'medium',
        recommendation: 'Practice relaxation techniques before bed, consider therapy for stress management, and avoid stimulating content before sleep.',
        trend: 'stable'
      });
    }

    // Lifestyle Correlation Analysis
    if (lifestyleLogs.length > 0) {
      const highStressCount = lifestyleLogs.filter(log => (log.stress_level || 0) >= 7).length;
      const highCaffeineCount = lifestyleLogs.filter(log => (log.caffeine_intake || 0) >= 4).length;
      const lateScreenTimeCount = lifestyleLogs.filter(log => (log.screen_time || 0) >= 60).length;

      if (highStressCount >= 10) {
        issues.push({
          id: 'high-stress',
          type: 'warning',
          title: 'High Stress Levels',
          description: `You've reported high stress levels (7+) on ${highStressCount} occasions. High stress significantly impacts sleep quality and overall health.`,
          icon: <Heart className="w-5 h-5" />,
          severity: 'high',
          recommendation: 'Practice stress management techniques like meditation, exercise, or deep breathing. Consider professional help if stress persists.',
          trend: 'declining'
        });
      }

      if (highCaffeineCount >= 7) {
        issues.push({
          id: 'excessive-caffeine',
          type: 'warning',
          title: 'Excessive Caffeine Intake',
          description: `You've consumed 4+ servings of caffeine on ${highCaffeineCount} occasions. High caffeine intake can disrupt sleep patterns and quality.`,
          icon: <AlertTriangle className="w-5 h-5" />,
          severity: 'medium',
          recommendation: 'Limit caffeine intake to morning hours only, avoid caffeine after 2 PM, and gradually reduce consumption.',
          trend: 'stable'
        });
      }

      if (lateScreenTimeCount >= 10) {
        issues.push({
          id: 'excessive-screen-time',
          type: 'warning',
          title: 'Excessive Screen Time Before Bed',
          description: `You've had 60+ minutes of screen time before bed on ${lateScreenTimeCount} occasions. Blue light exposure interferes with melatonin production.`,
          icon: <AlertTriangle className="w-5 h-5" />,
          severity: 'medium',
          recommendation: 'Implement a digital curfew 1-2 hours before bed, use blue light filters, and engage in relaxing activities instead.',
          trend: 'stable'
        });
      }
    }

    // Overall Health Score
    const totalLogs = sleepLogs.length;
    if (totalLogs >= 7) {
      const healthScore = calculateHealthScore(sleepLogs, lifestyleLogs);
      
      if (healthScore >= 80) {
        issues.push({
          id: 'excellent-health',
          type: 'success',
          title: 'Excellent Sleep Health',
          description: `Your overall sleep health score is ${healthScore}/100. You're maintaining excellent sleep habits and patterns.`,
          icon: <TrendingUp className="w-5 h-5" />,
          severity: 'low',
          recommendation: 'Keep up the great work! Continue monitoring your sleep patterns.',
          trend: 'improving'
        });
      } else if (healthScore < 50) {
        issues.push({
          id: 'poor-health',
          type: 'critical',
          title: 'Poor Sleep Health',
          description: `Your overall sleep health score is ${healthScore}/100. Multiple factors are negatively impacting your sleep quality.`,
          icon: <TrendingDown className="w-5 h-5" />,
          severity: 'critical',
          recommendation: 'Focus on improving sleep hygiene, consider professional help, and prioritize sleep as a health necessity.',
          trend: 'declining'
        });
      }
    }

    return issues;
  };

  const calculateHealthScore = (sleepLogs: SleepLog[], lifestyleLogs: LifestyleLog[]): number => {
    let score = 100;

    // Sleep duration scoring
    const avgDuration = sleepLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0) / sleepLogs.length;
    if (avgDuration < 6) score -= 30;
    else if (avgDuration < 7) score -= 15;
    else if (avgDuration > 9) score -= 10;

    // Sleep quality scoring
    const avgQuality = sleepLogs.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / sleepLogs.length;
    if (avgQuality < 5) score -= 25;
    else if (avgQuality < 7) score -= 10;

    // Awakenings scoring
    const avgAwakenings = sleepLogs.reduce((sum, log) => sum + (log.awakenings || 0), 0) / sleepLogs.length;
    if (avgAwakenings >= 3) score -= 20;
    else if (avgAwakenings >= 2) score -= 10;

    // Lifestyle factors
    if (lifestyleLogs.length > 0) {
      const avgStress = lifestyleLogs.reduce((sum, log) => sum + (log.stress_level || 0), 0) / lifestyleLogs.length;
      if (avgStress >= 7) score -= 15;
      else if (avgStress >= 5) score -= 5;

      const avgCaffeine = lifestyleLogs.reduce((sum, log) => sum + (log.caffeine_intake || 0), 0) / lifestyleLogs.length;
      if (avgCaffeine >= 4) score -= 10;
      else if (avgCaffeine >= 2) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-600 p-2 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-200" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-dark-text">Health Detection</h2>
          <p className="text-xs text-dark-text-secondary">Automated analysis of your sleep patterns</p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-dark-text-muted">
            <Info className="w-10 h-10 mx-auto mb-3 text-dark-text-muted" />
            <p>Not enough data yet. Keep tracking your sleep to receive personalized health insights.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg p-4 border-l-4 transition-all duration-200 ${
                alert.type === 'critical'
                  ? 'bg-red-900/20 border-red-500 text-red-200'
                  : alert.type === 'warning'
                  ? 'bg-orange-900/20 border-orange-500 text-orange-200'
                  : alert.type === 'success'
                  ? 'bg-green-900/20 border-green-500 text-green-200'
                  : 'bg-blue-900/20 border-blue-500 text-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'critical'
                    ? 'bg-red-800/30'
                    : alert.type === 'warning'
                    ? 'bg-orange-800/30'
                    : alert.type === 'success'
                    ? 'bg-green-800/30'
                    : 'bg-blue-800/30'
                }`}>
                  {alert.icon || (
                    alert.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                    alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-orange-400" /> :
                    alert.type === 'success' ? <Zap className="w-5 h-5 text-green-400" /> :
                    <Info className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-800/50 text-red-200' :
                      alert.severity === 'high' ? 'bg-orange-800/50 text-orange-200' :
                      alert.severity === 'medium' ? 'bg-yellow-800/50 text-yellow-200' :
                      'bg-green-800/50 text-green-200'
                    }`}>
                      {alert.severity?.toUpperCase()}
                    </div>
                    {alert.trend && (
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.trend === 'improving' ? 'bg-green-800/50 text-green-200' :
                        alert.trend === 'declining' ? 'bg-red-800/50 text-red-200' :
                        'bg-blue-800/50 text-blue-200'
                      }`}>
                        {alert.trend === 'improving' ? '↗' : alert.trend === 'declining' ? '↘' : '→'} {alert.trend}
                      </div>
                    )}
                  </div>
                  <p className="text-sm opacity-90 mb-3">{alert.description}</p>
                  {alert.recommendation && (
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">💡 Recommendation:</p>
                      <p className="text-sm opacity-90">{alert.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-dark-tertiary/50 rounded-lg">
        <p className="text-xs text-dark-text-muted">
          <strong>Disclaimer:</strong> This health detection system is for informational purposes only and should not replace professional medical advice. If you have concerns about your sleep health, please consult a qualified healthcare provider.
        </p>
      </div>
    </div>
  );
}
