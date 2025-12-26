import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Moon, Activity, Clock, Zap, Brain, Heart, Target, AlertCircle, CheckCircle, Info, Maximize2, Minimize2 } from 'lucide-react';
import { supabase, SleepLog, LifestyleLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LineGraph from './LineGraph';
import PieChart from './PieChart';

interface AnalyticsData {
  sleepLogs: SleepLog[];
  lifestyleLogs: LifestyleLog[];
}

interface SleepInsight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  icon: React.ReactNode;
  recommendation?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({ sleepLogs: [], lifestyleLogs: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'duration' | 'quality' | 'dreams' | 'stress'>('duration');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'grid' | 'detailed'>('grid');

  useEffect(() => {
    loadAnalyticsData();
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const daysBack = timeRange === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [sleepResult, lifestyleResult] = await Promise.all([
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', startDate.toISOString().split('T')[0])
          .order('log_date', { ascending: true }),
        supabase
          .from('lifestyle_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', startDate.toISOString().split('T')[0])
          .order('log_date', { ascending: true })
      ]);

      if (sleepResult.error) throw sleepResult.error;
      if (lifestyleResult.error) throw lifestyleResult.error;

      setData({
        sleepLogs: sleepResult.data || [],
        lifestyleLogs: lifestyleResult.data || []
      });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    const { sleepLogs, lifestyleLogs } = data;

    const avgSleepDuration = sleepLogs.length > 0
      ? (sleepLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0) / sleepLogs.length).toFixed(1)
      : '0.0';

    const avgSleepQuality = sleepLogs.length > 0
      ? (sleepLogs.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / sleepLogs.length).toFixed(1)
      : '0.0';

    const avgStress = lifestyleLogs.length > 0
      ? (lifestyleLogs.reduce((sum, log) => sum + (log.stress_level || 0), 0) / lifestyleLogs.length).toFixed(1)
      : '0.0';

    const avgDreamRecall = sleepLogs.length > 0
      ? (sleepLogs.reduce((sum, log) => sum + (log.dream_recall_frequency || 0), 0) / sleepLogs.length).toFixed(1)
      : '0.0';

    const dreamMoods = sleepLogs
      .filter(log => log.dream_mood)
      .reduce((acc, log) => {
        acc[log.dream_mood!] = (acc[log.dream_mood!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return { avgSleepDuration, avgSleepQuality, avgStress, avgDreamRecall, dreamMoods };
  };

  const generateInsights = (): SleepInsight[] => {
    const { avgSleepDuration, avgSleepQuality, avgStress, avgDreamRecall } = calculateAverages();
    const insights: SleepInsight[] = [];

    // Sleep Duration Insights
    const duration = parseFloat(avgSleepDuration);
    if (duration < 6) {
      insights.push({
        type: 'warning',
        title: 'Insufficient Sleep Duration',
        description: `Your average sleep duration is ${avgSleepDuration} hours, which is below the recommended 7-9 hours.`,
        icon: <AlertCircle className="w-5 h-5" />,
        recommendation: 'Try to establish a consistent bedtime routine and aim for at least 7 hours of sleep.'
      });
    } else if (duration >= 7 && duration <= 9) {
      insights.push({
        type: 'positive',
        title: 'Optimal Sleep Duration',
        description: `Great! Your average sleep duration of ${avgSleepDuration} hours falls within the recommended range.`,
        icon: <CheckCircle className="w-5 h-5" />,
        recommendation: 'Maintain this consistent sleep schedule for optimal health benefits.'
      });
    } else if (duration > 9) {
      insights.push({
        type: 'info',
        title: 'Extended Sleep Duration',
        description: `Your average sleep duration is ${avgSleepDuration} hours, which is above the typical range.`,
        icon: <Info className="w-5 h-5" />,
        recommendation: 'Monitor if this extended sleep affects your daytime alertness and energy levels.'
      });
    }

    // Sleep Quality Insights
    const quality = parseFloat(avgSleepQuality);
    if (quality < 5) {
      insights.push({
        type: 'warning',
        title: 'Poor Sleep Quality',
        description: `Your sleep quality rating is ${avgSleepQuality}/10, indicating significant sleep disturbances.`,
        icon: <AlertCircle className="w-5 h-5" />,
        recommendation: 'Consider improving your sleep environment and reducing screen time before bed.'
      });
    } else if (quality >= 7) {
      insights.push({
        type: 'positive',
        title: 'Good Sleep Quality',
        description: `Excellent! Your sleep quality rating of ${avgSleepQuality}/10 indicates restful sleep.`,
        icon: <CheckCircle className="w-5 h-5" />,
        recommendation: 'Keep up the good work with your current sleep habits.'
      });
    }

    // Dream Recall Insights
    const dreamRecall = parseFloat(avgDreamRecall);
    if (dreamRecall > 0) {
      insights.push({
        type: 'info',
        title: 'Active Dream Recall',
        description: `You recall an average of ${avgDreamRecall} dreams per night, indicating good dream awareness.`,
        icon: <Brain className="w-5 h-5" />,
        recommendation: 'Consider keeping a dream journal to enhance your dream recall and analysis.'
      });
    }

    // Stress Level Insights
    const stress = parseFloat(avgStress);
    if (stress > 7) {
      insights.push({
        type: 'warning',
        title: 'High Stress Levels',
        description: `Your average stress level is ${avgStress}/10, which may be affecting your sleep quality.`,
        icon: <AlertCircle className="w-5 h-5" />,
        recommendation: 'Practice relaxation techniques like meditation or deep breathing before bedtime.'
      });
    }

    return insights;
  };

  const { avgSleepDuration, avgSleepQuality, avgStress, avgDreamRecall, dreamMoods } = calculateAverages();
  const insights = generateInsights();

  const maxDuration = Math.max(...data.sleepLogs.map(log => log.total_hours || 0), 1);
  const maxQuality = 10;

  if (loading) {
    return (
      <div className="bg-dark-secondary rounded-xl shadow-lg p-6 border border-dark-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-tertiary rounded w-1/3"></div>
          <div className="h-32 bg-dark-tertiary rounded"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-dark-accent p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-dark-accent-light" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-text">Analytics & Insights</h2>
              <p className="text-xs text-dark-text-secondary">Comprehensive sleep pattern analysis</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === 'week'
                  ? 'bg-dark-accent text-white border border-dark-accent-light'
                  : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-border border border-dark-border'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === 'month'
                  ? 'bg-dark-accent text-white border border-dark-accent-light'
                  : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-border border border-dark-border'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-3 border border-blue-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Avg Sleep Duration</span>
            </div>
            <p className="text-2xl font-bold text-blue-200">{avgSleepDuration}h</p>
            <p className="text-xs text-blue-400 mt-1">Target: 7-9h</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-3 border border-green-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-300">Avg Sleep Quality</span>
            </div>
            <p className="text-2xl font-bold text-green-200">{avgSleepQuality}/10</p>
            <p className="text-xs text-green-400 mt-1">Target: 7+</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-3 border border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Dream Recall</span>
            </div>
            <p className="text-2xl font-bold text-purple-200">{avgDreamRecall}</p>
            <p className="text-xs text-purple-400 mt-1">per night</p>
        </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-3 border border-orange-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Avg Stress Level</span>
                    </div>
            <p className="text-2xl font-bold text-orange-200">{avgStress}/10</p>
            <p className="text-xs text-orange-400 mt-1">Target: 5</p>
          </div>
        </div>

        {/* Interactive Charts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-text">Interactive Charts</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('grid')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  chartView === 'grid'
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-border'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setChartView('detailed')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  chartView === 'detailed'
                    ? 'bg-dark-accent text-white'
                    : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-border'
                }`}
              >
                Detailed View
              </button>
            </div>
          </div>

          {chartView === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Line Graph */}
              <div className="bg-dark-tertiary/30 rounded-xl p-4 border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-dark-text">Sleep Trends</h4>
                  <button
                    onClick={() => setExpandedChart(expandedChart === 'line' ? null : 'line')}
                    className="p-1 rounded hover:bg-dark-border transition-colors"
                  >
                    {expandedChart === 'line' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
                <LineGraph
                  data={data.sleepLogs}
                  metric={selectedMetric}
                  lifestyleLogs={data.lifestyleLogs}
                  width={expandedChart === 'line' ? 600 : 300}
                  height={expandedChart === 'line' ? 300 : 200}
                />
                <div className="flex gap-2 mt-3">
                  {[
                    { id: 'duration', label: 'Duration', icon: <Clock className="w-3 h-3" /> },
                    { id: 'quality', label: 'Quality', icon: <Zap className="w-3 h-3" /> },
                    { id: 'dreams', label: 'Dreams', icon: <Brain className="w-3 h-3" /> },
                    { id: 'stress', label: 'Stress', icon: <Heart className="w-3 h-3" /> }
                  ].map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => setSelectedMetric(metric.id as any)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        selectedMetric === metric.id
                          ? 'bg-dark-accent text-white'
                          : 'bg-dark-border text-dark-text-secondary hover:bg-dark-accent/20'
                      }`}
                    >
                      {metric.icon}
                      {metric.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-dark-tertiary/30 rounded-xl p-4 border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-dark-text">Dream Mood Distribution</h4>
                  <button
                    onClick={() => setExpandedChart(expandedChart === 'pie' ? null : 'pie')}
                    className="p-1 rounded hover:bg-dark-border transition-colors"
                  >
                    {expandedChart === 'pie' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
                <PieChart
                  data={dreamMoods}
                  width={expandedChart === 'pie' ? 400 : 250}
                  height={expandedChart === 'pie' ? 400 : 250}
                  title="Dream Moods"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Detailed Line Graph */}
              <div className="bg-dark-tertiary/30 rounded-xl p-6 border border-dark-border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-dark-text">Detailed Sleep Trends</h4>
                  <div className="flex gap-2">
                    {[
                      { id: 'duration', label: 'Sleep Duration', icon: <Clock className="w-4 h-4" /> },
                      { id: 'quality', label: 'Sleep Quality', icon: <Zap className="w-4 h-4" /> },
                      { id: 'dreams', label: 'Dream Recall', icon: <Brain className="w-4 h-4" /> },
                      { id: 'stress', label: 'Stress Levels', icon: <Heart className="w-4 h-4" /> }
                    ].map((metric) => (
                      <button
                        key={metric.id}
                        onClick={() => setSelectedMetric(metric.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          selectedMetric === metric.id
                            ? 'bg-dark-accent text-white border border-dark-accent-light'
                            : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-border border border-dark-border'
                        }`}
                      >
                        {metric.icon}
                        {metric.label}
                      </button>
                    ))}
                  </div>
                </div>
                <LineGraph
                  data={data.sleepLogs}
                  metric={selectedMetric}
                  lifestyleLogs={data.lifestyleLogs}
                  width={800}
                  height={400}
                />
              </div>

              {/* Detailed Pie Chart */}
              <div className="bg-dark-tertiary/30 rounded-xl p-6 border border-dark-border">
                <h4 className="text-lg font-semibold text-dark-text mb-4">Dream Mood Analysis</h4>
                <div className="flex justify-center">
                  <PieChart
                    data={dreamMoods}
                    width={400}
                    height={400}
                    title="Dream Mood Distribution"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Analytics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-dark-text mb-3">Sleep Pattern Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sleep Consistency */}
            <div className="bg-dark-tertiary/30 rounded-lg p-4 border border-dark-border">
              <h4 className="text-sm font-semibold text-dark-text mb-2">Sleep Consistency</h4>
              <div className="space-y-2">
                {data.sleepLogs.length > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-secondary">Average Bedtime</span>
                      <span className="text-dark-text font-semibold">
                        {(() => {
                          const bedtimes = data.sleepLogs
                            .filter(log => log.bedtime)
                            .map(log => {
                              const [hours, minutes] = log.bedtime!.split(':').map(Number);
                              return hours * 60 + minutes;
                            });
                          if (bedtimes.length === 0) return 'N/A';
                          const avgMinutes = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
                          const hours = Math.floor(avgMinutes / 60);
                          const mins = Math.round(avgMinutes % 60);
                          return `${hours}:${mins.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-secondary">Average Wake Time</span>
                      <span className="text-dark-text font-semibold">
                        {(() => {
                          const wakeTimes = data.sleepLogs
                            .filter(log => log.wake_time)
                            .map(log => {
                              const [hours, minutes] = log.wake_time!.split(':').map(Number);
                              return hours * 60 + minutes;
                            });
                          if (wakeTimes.length === 0) return 'N/A';
                          const avgMinutes = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length;
                          const hours = Math.floor(avgMinutes / 60);
                          const mins = Math.round(avgMinutes % 60);
                          return `${hours}:${mins.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-dark-text-muted text-sm">No sleep data available</p>
                )}
              </div>
            </div>

            {/* Dream Analysis */}
            <div className="bg-dark-tertiary/30 rounded-lg p-4 border border-dark-border">
              <h4 className="text-sm font-semibold text-dark-text mb-2">Dream Analysis</h4>
              <div className="space-y-2">
                {data.sleepLogs.length > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-secondary">Total Dreams Recorded</span>
                      <span className="text-dark-text font-semibold">
                        {data.sleepLogs.reduce((sum, log) => sum + (log.dream_recall_frequency || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-secondary">Most Common Mood</span>
                      <span className="text-dark-text font-semibold">
                        {Object.keys(dreamMoods).length > 0 
                          ? Object.entries(dreamMoods).sort(([,a], [,b]) => b - a)[0][0]
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-dark-text-muted text-sm">No dream data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-text">AI-Powered Sleep Insights</h3>
            <p className="text-xs text-dark-text-secondary">Personalized recommendations based on your data</p>
                </div>
              </div>

        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-dark-text-muted mx-auto mb-4" />
              <p className="text-dark-text-muted">Keep logging your sleep data to receive personalized insights</p>
            </div>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  insight.type === 'positive'
                    ? 'bg-green-900/20 border-green-800/30 text-green-200'
                    : insight.type === 'warning'
                    ? 'bg-red-900/20 border-red-800/30 text-red-200'
                    : 'bg-blue-900/20 border-blue-800/30 text-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'positive'
                      ? 'bg-green-800/30'
                      : insight.type === 'warning'
                      ? 'bg-red-800/30'
                      : 'bg-blue-800/30'
                  }`}>
                    {insight.icon}
                  </div>
                <div className="flex-1">
                    <h4 className="font-semibold mb-2">{insight.title}</h4>
                    <p className="text-sm mb-3 opacity-90">{insight.description}</p>
                    {insight.recommendation && (
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-sm font-medium">💡 Recommendation:</p>
                        <p className="text-sm opacity-90">{insight.recommendation}</p>
                </div>
                    )}
              </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sleep Health Score */}
      <div className="bg-gradient-to-br from-dark-accent/20 to-dark-accent-dark/20 rounded-xl shadow-lg p-4 border border-dark-accent/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-dark-accent p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-dark-accent-light" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-text">Sleep Health Score</h3>
            <p className="text-xs text-dark-text-secondary">Overall assessment of your sleep patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark-text-secondary">Overall Score</span>
              <span className="text-2xl font-bold text-dark-accent-light">
                {Math.round(
                  (parseFloat(avgSleepDuration) >= 7 ? 25 : parseFloat(avgSleepDuration) >= 6 ? 15 : 5) +
                  (parseFloat(avgSleepQuality) >= 7 ? 25 : parseFloat(avgSleepQuality) >= 5 ? 15 : 5) +
                  (parseFloat(avgStress) <= 5 ? 25 : parseFloat(avgStress) <= 7 ? 15 : 5) +
                  (parseFloat(avgDreamRecall) > 0 ? 25 : 15)
                )}/100
              </span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-3">
              <div
                className="bg-gradient-to-r from-dark-accent to-dark-accent-light h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.round(
                    (parseFloat(avgSleepDuration) >= 7 ? 25 : parseFloat(avgSleepDuration) >= 6 ? 15 : 5) +
                    (parseFloat(avgSleepQuality) >= 7 ? 25 : parseFloat(avgSleepQuality) >= 5 ? 15 : 5) +
                    (parseFloat(avgStress) <= 5 ? 25 : parseFloat(avgStress) <= 7 ? 15 : 5) +
                    (parseFloat(avgDreamRecall) > 0 ? 25 : 15)
                  )}%`
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">Sleep Duration</span>
              <span className={`text-sm font-medium ${
                parseFloat(avgSleepDuration) >= 7 ? 'text-green-400' : 
                parseFloat(avgSleepDuration) >= 6 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {parseFloat(avgSleepDuration) >= 7 ? 'Excellent' : 
                 parseFloat(avgSleepDuration) >= 6 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">Sleep Quality</span>
              <span className={`text-sm font-medium ${
                parseFloat(avgSleepQuality) >= 7 ? 'text-green-400' : 
                parseFloat(avgSleepQuality) >= 5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {parseFloat(avgSleepQuality) >= 7 ? 'Excellent' : 
                 parseFloat(avgSleepQuality) >= 5 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">Stress Management</span>
              <span className={`text-sm font-medium ${
                parseFloat(avgStress) <= 5 ? 'text-green-400' : 
                parseFloat(avgStress) <= 7 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {parseFloat(avgStress) <= 5 ? 'Excellent' : 
                 parseFloat(avgStress) <= 7 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-text-secondary">Dream Awareness</span>
              <span className={`text-sm font-medium ${
                parseFloat(avgDreamRecall) > 0 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {parseFloat(avgDreamRecall) > 0 ? 'Active' : 'Developing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}