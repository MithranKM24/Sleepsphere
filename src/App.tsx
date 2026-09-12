import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import UserProfileCard from './components/UserProfile';
import SleepLogCard from './components/SleepLog';
import LifestyleLogCard from './components/LifestyleLog';
import Analytics from './components/Analytics';
import HealthAlerts from './components/HealthAlerts';
import { Moon, User, Activity, BarChart3, AlertTriangle, LogOut } from 'lucide-react';

type Tab = 'profile' | 'sleep' | 'lifestyle' | 'analytics' | 'health';

function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="text-dark-text text-xl animate-pulse-slow">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'sleep', label: 'Sleep Log', icon: <Moon className="w-5 h-5" /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Activity className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'health', label: 'Health Alerts', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-dark-gradient">
      <nav className="bg-dark-secondary border-b border-dark-border shadow-lg sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Moon className="w-8 h-8 text-dark-accent-light animate-pulse-slow" />
              <h1 className="text-xl font-bold text-dark-text">Sleep & Dream Tracker</h1>
            </div>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-dark-text-secondary hover:text-dark-text hover:bg-dark-tertiary rounded-lg transition-all duration-200 border border-dark-border hover:border-dark-accent-light"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === tab.id
                    ? 'bg-dark-accent text-white shadow-lg border border-dark-accent-light'
                    : 'bg-dark-secondary text-dark-text-secondary hover:bg-dark-tertiary hover:text-dark-text border border-dark-border hover:border-dark-accent-light'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fadeIn">
          {activeTab === 'profile' && <UserProfileCard />}
          {activeTab === 'sleep' && <SleepLogCard />}
          {activeTab === 'lifestyle' && <LifestyleLogCard />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'health' && <HealthAlerts />}
        </div>
      </div>
    </div>
  );
}

export default App;
