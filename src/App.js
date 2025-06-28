import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Heart, Baby, Upload, User, Lock, AlertCircle, TrendingUp, Clock, Target, Plus, Trash2, Download, LogOut } from 'lucide-react';

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto text-pink-500 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthComponent />;
  }

  return <MainApp user={user} setUser={setUser} />;
};

const AuthComponent = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // Sign up with metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              full_name: ''
            }
          }
        });

        if (error) throw error;

        setMessage('Check your email for the confirmation link!');
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Heart className="mx-auto text-pink-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800">Fertility Tracker</h1>
          <p className="text-gray-600">Your personal cycle companion</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Will use email if empty"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('error') || message.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
              className="text-pink-600 hover:text-pink-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCycles();
    }
  }, [user]);

  const fetchCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'periods', label: 'Period Tracker', icon: Calendar },
    { id: 'pregnancy', label: 'Pregnancy Planner', icon: Baby },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="text-pink-500" size={32} />
              <h1 className="text-xl font-bold text-gray-800">Fertility Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="text-gray-500" size={20} />
                <span className="text-gray-700">{user?.full_name || user?.username || 'User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center space-x-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && <Dashboard user={user} cycles={cycles} />}
            {activeTab === 'periods' && <PeriodTracker user={user} cycles={cycles} setCycles={setCycles} fetchCycles={fetchCycles} />}
            {activeTab === 'pregnancy' && <PregnancyPlanner user={user} cycles={cycles} />}
            {activeTab === 'profile' && <Profile user={user} setUser={setUser} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, cycles }) => {
  const calculateNextPeriods = (cycles, typicalCycleLength, numberOfPeriods = 4) => {
    if (!cycles || cycles.length === 0) return [];
    
    const lastPeriod = new Date(cycles[0].start_date);
    const predictions = [];

    for (let i = 1; i <= numberOfPeriods; i++) {
      const nextPeriod = new Date(lastPeriod);
      nextPeriod.setDate(lastPeriod.getDate() + (typicalCycleLength * i));
      
      predictions.push({
        cycle: i,
        startDate: nextPeriod.toISOString().split('T')[0],
        confidence: Math.max(85 - (i * 5), 60)
      });
    }
    return predictions;
  };

  const nextPeriods = calculateNextPeriods(cycles, user?.typical_cycle_length || 28);

  if (!cycles || cycles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.full_name || user?.username}!</h2>
          <p className="opacity-90">Start tracking your cycles to get personalized insights</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <Calendar className="mx-auto text-pink-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Cycle Data Yet</h3>
          <p className="text-gray-600 mb-4">
            Start tracking your periods to get personalized predictions and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name || user?.username}!</h2>
        <p className="opacity-90">Here's your cycle overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="text-pink-500" size={24} />
            <h3 className="font-semibold text-gray-800">Current Cycle</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Typical Length: <span className="font-medium">{user?.typical_cycle_length || 28} days</span></p>
            <p className="text-sm text-gray-600">Last Period: <span className="font-medium">{new Date(cycles[0]?.start_date).toDateString()}</span></p>
            {nextPeriods.length > 0 && (
              <p className="text-sm text-gray-600">Next Period: <span className="font-medium text-pink-600">{new Date(nextPeriods[0].startDate).toDateString()}</span></p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-800">Cycle Health</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Cycles Tracked: <span className="font-medium">{cycles.length}</span></p>
            <p className="text-sm text-gray-600">Regularity: <span className="font-medium text-green-600">Good</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="text-red-500" size={24} />
            <h3 className="font-semibold text-gray-800">Average Period</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Length: <span className="font-medium">{user?.typical_period_length || 5} days</span></p>
            <p className="text-sm text-gray-600">Variation: <span className="font-medium">±{user?.period_length_variation || 1} days</span></p>
          </div>
        </div>
      </div>

      {nextPeriods.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">Upcoming Periods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextPeriods.map((period, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <span className="font-medium">Cycle {period.cycle}</span>
                <span className="text-sm text-gray-600">{new Date(period.startDate).toDateString()}</span>
                <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded">{period.confidence}% confidence</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PeriodTracker = ({ user, cycles, setCycles, fetchCycles }) => {
  const [newPeriod, setNewPeriod] = useState({
    startDate: '',
    endDate: '',
    flow: 'medium',
    symptoms: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const symptoms = [
    'Cramps', 'Bloating', 'Headache', 'Mood Changes', 'Breast Pain', 
    'Fatigue', 'Acne', 'Back Pain', 'Nausea', 'Food Cravings'
  ];

  const addPeriod = async () => {
    if (!newPeriod.startDate) return;

    setLoading(true);
    try {
      const startDate = new Date(newPeriod.startDate);
      let endDate = null;
      let periodLength = user?.typical_period_length || 5;

      if (newPeriod.endDate) {
        endDate = new Date(newPeriod.endDate);
        periodLength = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
      } else {
        endDate = new Date(startDate.getTime() + (periodLength * 24 * 60 * 60 * 1000));
      }

      const { data, error } = await supabase
        .from('cycles')
        .insert([
          {
            start_date: newPeriod.startDate,
            end_date: endDate.toISOString().split('T')[0],
            period_length: periodLength,
            cycle_length: user?.typical_cycle_length || 28,
            flow: newPeriod.flow,
            symptoms: newPeriod.symptoms,
            notes: newPeriod.notes
          }
        ]);

      if (error) throw error;

      await fetchCycles();
      setNewPeriod({
        startDate: '',
        endDate: '',
        flow: 'medium',
        symptoms: [],
        notes: ''
      });
    } catch (error) {
      console.error('Error adding period:', error);
      alert('Error adding period. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePeriod = async (id) => {
    try {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCycles();
    } catch (error) {
      console.error('Error deleting period:', error);
    }
  };

  const toggleSymptom = (symptom) => {
    setNewPeriod(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Period Tracker</h2>
        <p className="opacity-90">Log your periods and track symptoms</p>
      </div>

      {/* Add New Period */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4">Add New Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={newPeriod.startDate}
              onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
            <input
              type="date"
              value={newPeriod.endDate}
              onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
            <select
              value={newPeriod.flow}
              onChange={(e) => setNewPeriod(prev => ({ ...prev, flow: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {symptoms.map(symptom => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  newPeriod.symptoms.includes(symptom)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
          <textarea
            value={newPeriod.notes}
            onChange={(e) => setNewPeriod(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            rows="3"
          />
        </div>

        <button
          onClick={addPeriod}
          disabled={!newPeriod.startDate || loading}
          className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Period'}
        </button>
      </div>

      {/* Period History */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4">Period History</h3>
        
        {cycles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No periods recorded yet. Add your first period above!</p>
        ) : (
          <div className="space-y-4">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800">
                        {new Date(cycle.start_date).toDateString()}
                      </span>
                      {cycle.end_date && (
                        <span className="text-sm text-gray-600">
                          to {new Date(cycle.end_date).toDateString()}
                        </span>
                      )}
                      <span className={`w-4 h-4 rounded-full ${
                        cycle.flow === 'light' ? 'bg-pink-200' :
                        cycle.flow === 'heavy' ? 'bg-pink-600' : 'bg-pink-400'
                      }`}></span>
                      <span className="text-sm capitalize text-gray-600">{cycle.flow} flow</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {cycle.period_length} days
                      {cycle.cycle_length && ` • Cycle: ${cycle.cycle_length} days`}
                    </p>
                    {cycle.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{cycle.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePeriod(cycle.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {cycle.symptoms && cycle.symptoms.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {cycle.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PregnancyPlanner = ({ user, cycles }) => {
  const [targetMonth, setTargetMonth] = useState('5');
  const [targetYear, setTargetYear] = useState('2026');

  const calculateConceptionTiming = (month, year) => {
    if (!cycles || cycles.length === 0) return null;

    const pregnancyDuration = 280; // days
    const targetDelivery = new Date(year, month - 1, 15);
    const conceptionDate = new Date(targetDelivery);
    conceptionDate.setDate(targetDelivery.getDate() - pregnancyDuration);

    const lastPeriod = new Date(cycles[0].start_date);
    const typicalCycleLength = user?.typical_cycle_length || 28;

    let cycleNumber = 1;
    let cycleStart = new Date(lastPeriod);

    while (cycleStart < conceptionDate) {
      cycleStart.setDate(cycleStart.getDate() + typicalCycleLength);
      cycleNumber++;
    }

    cycleNumber--;
    cycleStart.setDate(cycleStart.getDate() - typicalCycleLength);

    const ovulationDay = new Date(cycleStart);
    ovulationDay.setDate(cycleStart.getDate() + 14);

    const fertileStart = new Date(ovulationDay);
    fertileStart.setDate(ovulationDay.getDate() - 5);

    const fertileEnd = new Date(ovulationDay);
    fertileEnd.setDate(ovulationDay.getDate() + 1);

    return {
      targetDelivery: targetDelivery.toDateString(),
      optimalConceptionDate: conceptionDate.toDateString(),
      cycleNumber,
      periodStart: cycleStart.toDateString(),
      fertileWindowStart: fertileStart.toDateString(),
      fertileWindowEnd: fertileEnd.toDateString(),
      ovulationDate: ovulationDay.toDateString(),
      daysFromNow: Math.ceil((conceptionDate - new Date()) / (1000 * 60 * 60 * 24))
    };
  };

  const calculation = calculateConceptionTiming(parseInt(targetMonth), parseInt(targetYear));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Pregnancy Planning</h2>
        <p className="opacity-90">Plan your perfect timing for conception and delivery</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4">When do you want your baby?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Birth Month</label>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Birth Year</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {calculation ? (
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Baby className="text-blue-500 mr-2" size={20} />
              Your Pregnancy Timeline
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="text-green-500 mt-1" size={16} />
                  <div>
                    <p className="font-medium text-gray-800">Target Delivery Date</p>
                    <p className="text-sm text-gray-600">{calculation.targetDelivery}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Heart className="text-red-500 mt-1" size={16} />
                  <div>
                    <p className="font-medium text-gray-800">Optimal Conception Date</p>
                    <p className="text-sm text-gray-600">{calculation.optimalConceptionDate}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="text-blue-500 mt-1" size={16} />
                  <div>
                    <p className="font-medium text-gray-800">Days from Now</p>
                    <p className="text-sm text-gray-600">{calculation.daysFromNow} days</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="text-purple-500 mt-1" size={16} />
                  <div>
                    <p className="font-medium text-gray-800">Cycle #{calculation.cycleNumber}</p>
                    <p className="text-sm text-gray-600">Period starts: {calculation.periodStart}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <p className="font-medium text-gray-800 mb-2">Best Conception Window:</p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Fertile Window:</strong> {calculation.fertileWindowStart} to {calculation.fertileWindowEnd}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Ovulation:</strong> {calculation.ovulationDate}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Start taking folic acid supplements at least one month before conception. 
                Track your basal body temperature and cervical mucus for more accurate timing.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <h4 className="font-medium text-gray-600 mb-2">Need More Cycle Data</h4>
            <p className="text-sm text-gray-500">
              Please add some period data first to calculate your optimal conception timing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = ({ user, setUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    date_of_birth: user?.date_of_birth || '',
    age: user?.age || '',
    weight: user?.weight || '',
    typical_cycle_length: user?.typical_cycle_length || 28,
    typical_period_length: user?.typical_period_length || 5
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...formData });
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
        <p className="opacity-90">Manage your personal information and preferences</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-800">Personal Information</h3>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : (editMode ? 'Save' : 'Edit')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Typical Cycle Length (days)</label>
            <input
              type="number"
              value={formData.typical_cycle_length}
              onChange={(e) => setFormData(prev => ({ ...prev, typical_cycle_length: parseInt(e.target.value) }))}
              disabled={!editMode}
              min="15"
              max="45"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Typical Period Length (days)</label>
            <input
              type="number"
              value={formData.typical_period_length}
              onChange={(e) => setFormData(prev => ({ ...prev, typical_period_length: parseInt(e.target.value) }))}
              disabled={!editMode}
              min="1"
              max="10"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Username: <span className="font-medium">{user?.username}</span></p>
          <p className="text-sm text-gray-600">Email: <span className="font-medium">{user?.email}</span></p>
          <p className="text-sm text-gray-600">Account created: <span className="font-medium">{new Date(user?.created_at).toLocaleDateString()}</span></p>
        </div>
      </div>
    </div>
  );
};

export default App;
