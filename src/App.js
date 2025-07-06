import React, {
  useState,
  useEffect,
  createContext,
  useContext
} from 'react';
import {
  supabase
} from './supabaseClient';
import {
  Calendar,
  Heart,
  Baby,
  User,
  Lock,
  TrendingUp,
  Clock,
  Target,
  Trash2,
  Edit3,
  LogOut,
  UserX,
  UserCheck,
  Activity,
  Shield,
  Database,
  AlertTriangle,
  Moon,
  Sun,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Smartphone,
  ChevronDown,
  Filter,
  Search,
  X
} from 'lucide-react';

// Dark Mode Context
const ThemeContext = createContext();

const ThemeProvider = ({
  children
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('fertility-tracker-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('fertility-tracker-dark-mode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return ( <
    ThemeContext.Provider value = {
      {
        isDarkMode,
        toggleDarkMode
      }
    } >
    <
    div className = {
      isDarkMode ? 'dark' : ''
    } > {
      children
    } <
    /div> < /
    ThemeContext.Provider >
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const App = () => {
  return ( <
    ThemeProvider >
    <
    AppContent / >
    <
    /ThemeProvider>
  );
};

const AuthComponent = ({ logUserEvent }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSymbol
    };
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const passwordValidation = validatePassword(password);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        if (!email || !password || !firstName || !lastName || !birthDate) {
          setMessage('Please fill in all required fields.');
          setLoading(false);
          return;
        }

        if (!passwordValidation.isValid) {
          setMessage('Password does not meet security requirements.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setMessage('Passwords do not match.');
          setLoading(false);
          return;
        }

        const age = calculateAge(birthDate);
        if (age < 13) {
          setMessage('You must be at least 13 years old to create an account.');
          setLoading(false);
          return;
        }

		const { data: authData, error } = await supabase.auth.signUp({
		  email,
		  password,
		  options: {
			data: {
			  first_name: firstName,
			  last_name: lastName,
			  full_name: `${firstName} ${lastName}`,
			  date_of_birth: birthDate,
			  age: age,
			  weight: weight ? parseFloat(weight) : null // Direct kg value, no conversion
			}
		  }
		});

        if (error) throw error;

        if (authData.user && !authData.user.email_confirmed_at) {
          setMessage('Please check your email for the confirmation link!');
        }
      } else {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <Heart className="mx-auto text-pink-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fertility Tracker</h1>
          <p className="text-gray-600 dark:text-gray-300">Your personal cycle companion</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

				<div>
				  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Date *</label>
				  <input
					type="date"
					value={birthDate}
					onChange={(e) => setBirthDate(e.target.value)}
					min="1920-01-01"
					max={new Date().toISOString().split('T')[0]}
					className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
					required
				  />
				  {birthDate && (
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
					  Age: {calculateAge(birthDate)} years
					</p>
				  )}
				</div>

			<div>
			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg) - Optional</label>
			  <input
				type="number"
				value={weight}
				onChange={(e) => setWeight(e.target.value)}
				placeholder="Enter weight in kg"
				className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
				min="1"
				step="0.1"
			  />
			</div>

              <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {password && (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Password Requirements:</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries({
                      minLength: 'At least 8 characters',
                      hasUppercase: 'At least 1 uppercase letter (A-Z)',
                      hasLowercase: 'At least 1 lowercase letter (a-z)',
                      hasNumber: 'At least 1 number (0-9)',
                      hasSymbol: 'At least 1 symbol (!@#$%^&*)'
                    }).map(([key, text]) => (
                      <div key={key} className={`flex items-center space-x-2 ${passwordValidation[key] ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span>{passwordValidation[key] ? '✅' : '❌'}</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('error') || message.includes('Error') || message.includes('not match') || message.includes('requirements')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:bg-gray-400"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
              className="text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const { isDarkMode } = useTheme();

  // COMPREHENSIVE LOGGING UTILITY FUNCTIONS
  const logUserEvent = async (action, category = 'general', details = {}) => {
    try {
      await supabase.rpc('log_user_event', {
        event_action: action,
        event_category: category,
        event_details: details
      });
    } catch (error) {
      console.error('Failed to log user event:', error);
    }
  };

  const updateLoginStats = async (userId) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: supabase.raw('COALESCE(login_count, 0) + 1')
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update login stats:', error);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - create a basic one
          console.log('Profile not found, creating basic profile...');
          try {
            const { data: userData } = await supabase.auth.getUser();
            const email = userData?.user?.email;
            
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                username: email ? email.split('@')[0] : 'user',
                full_name: '',
                is_admin: false,
                is_active: true
              })
              .select()
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
              return; // Don't sign out, just return
            }
            
            setUser(newProfile);
            return;
          } catch (createErr) {
            console.error('Failed to create profile:', createErr);
            return; // Don't sign out
          }
        }
        
        // For other errors, don't sign out immediately
        console.error('Profile fetch error, but not signing out:', error);
        return;
      }

      if (data) {
        if (data.is_active === false) {
          alert('Your account has been deactivated. Please contact support.');
          await supabase.auth.signOut();
          return;
        }

        console.log('Profile loaded successfully:', data.username);
        setUser(data);
        
        if (data.password_reset_required) {
          setShowPasswordChangeModal(true);
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      // Don't sign out on unexpected errors
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          if (session) {
            // Don't await profile fetch to prevent blocking
            fetchUserProfile(session.user.id).catch(err => {
              console.error('Profile fetch failed:', err);
              // Don't sign out immediately, just set loading to false
              setLoading(false);
            });
            
            logUserEvent('app_accessed', 'auth', {
              timestamp: new Date().toISOString(),
              dark_mode: isDarkMode
            }).catch(err => console.error('Logging failed:', err));
            
            updateLoginStats(session.user.id).catch(err => console.error('Login stats update failed:', err));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Session initialization timeout');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session ? 'session exists' : 'no session');
      
      setSession(session);
      setLoading(false); // Always set loading to false
      
      if (event === 'SIGNED_IN' && session) {
        // Don't await these to prevent blocking
        fetchUserProfile(session.user.id).catch(err => console.error('Profile fetch failed:', err));
        logUserEvent('user_login', 'auth', {
          login_method: 'email',
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Logging failed:', err));
        updateLoginStats(session.user.id).catch(err => console.error('Login stats failed:', err));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveTab('dashboard');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto text-pink-500 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthComponent logUserEvent={logUserEvent} />;
  }

  return (
    <>
      <MainApp 
        user={user} 
        setUser={setUser} 
        logUserEvent={logUserEvent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        session={session}
      />
      {showPasswordChangeModal && (
        <PasswordChangeModal 
          user={user} 
          setUser={setUser}
          onClose={() => setShowPasswordChangeModal(false)}
          logUserEvent={logUserEvent}
        />
      )}
    </>
  );
};

const PasswordChangeModal = ({
  user,
  setUser,
  onClose,
  logUserEvent
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSymbol
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handlePasswordChange = async () => {
    if (!passwordValidation.isValid) {
      setMessage('Password does not meet security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      const {
        error: profileError
      } = await supabase
        .from('user_profiles')
        .update({
          password_reset_required: false,
          password_reset_at: null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setUser({
        ...user,
        password_reset_required: false
      });

      await logUserEvent('password_changed_successfully', 'auth', {
        reset_completed_at: new Date().toISOString()
      });

      alert('Password updated successfully!');
      onClose();
    } catch (error) {
      setMessage(`Error updating password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return ( <
    div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" >
    <
    div className = "bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4" >
    <
    h3 className = "text-lg font-semibold text-gray-800 dark:text-white mb-4" > 🔐Password Change Required < /h3>

    <
    div className = "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4" >
    <
    p className = "text-sm text-yellow-800 dark:text-yellow-200" >
    Your administrator has reset your password.Please create a new secure password to
    continue. <
      /p> < /
    div >

    <
    div className = "space-y-4" >
    <
    div >
    <
    label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > New Password < /label> <
    input type = "password"
    value = {
      newPassword
    }
    onChange = {
      (e) => setNewPassword(e.target.value)
    }
    className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
    >
    <
    /div>

    <
    div >
    <
    label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > Confirm New Password < /label> <
    input type = "password"
    value = {
      confirmPassword
    }
    onChange = {
      (e) => setConfirmPassword(e.target.value)
    }
    className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
    >
    <
    /div>

    <
    div className = "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4" >
    <
    h4 className = "font-medium text-gray-800 dark:text-white mb-2" > Password Requirements: < /h4> <
    div className = "space-y-1 text-sm" > {
      Object.entries({
        minLength: 'At least 8 characters',
        hasUppercase: 'At least 1 uppercase letter (A-Z)',
        hasLowercase: 'At least 1 lowercase letter (a-z)',
        hasNumber: 'At least 1 number (0-9)',
        hasSymbol: 'At least 1 symbol (!@#$%^&*)'
      }).map(([key, text]) => ( <
        div key = {
          key
        }
        className = {
          `flex items-center space-x-2 ${passwordValidation[key] ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`
        } >
        <
        span > {
          passwordValidation[key] ? '✅' : '❌'
        } < /span> <
        span > {
          text
        } < /span> < /
        div >
      ))
    } <
    /div> < /
    div >

    {
      message && ( <
        div className = "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3" >
        <
        p className = "text-sm text-red-800 dark:text-red-200" > {
          message
        } < /p> < /
        div >
      )
    }

    <
    button onClick = {
      handlePasswordChange
    }
    disabled = {
      loading || !passwordValidation.isValid
    }
    className = "w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" > {
      loading ? 'Updating...' : 'Update Password'
    } <
    /button> < /
    div > <
    /div> < /
    div >
  );
};

const MainApp = ({ user, setUser, logUserEvent, activeTab, setActiveTab, session }) => {
  const [cycles, setCycles] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    if (user?.id) {
      fetchCycles();
    }
  }, [user]);

  // Emergency profile creation if session exists but no user profile
  useEffect(() => {
    if (session && !user) {
      const timer = setTimeout(async () => {
        console.log('No profile found after 3 seconds, attempting to create...');
        try {
          const { data: userData } = await supabase.auth.getUser();
          const email = userData?.user?.email;
          
          if (email) {
            const { data: newProfile, error } = await supabase
              .from('user_profiles')
              .insert({
                id: session.user.id,
                username: email.split('@')[0],
                full_name: '',
                is_admin: false,
                is_active: true
              })
              .select()
              .single();
              
            if (!error && newProfile) {
              setUser(newProfile);
              console.log('Emergency profile created successfully');
            }
          }
        } catch (err) {
          console.error('Emergency profile creation failed:', err);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [session, user, setUser]);

  const fetchCycles = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available for fetching cycles');
        return;
      }

      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id) // CRITICAL: Filter by user_id
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      console.error('Error fetching cycles:', error);
      setCycles([]);
    }
  };

  const handleSignOut = async () => {
    try {
      await logUserEvent('user_logout', 'auth');
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force sign out even if logging fails
      await supabase.auth.signOut();
    }
  };

  const exportData = async (format = 'csv') => {
    try {
      await logUserEvent('data_export_initiated', 'general', { format });

      if (format === 'csv') {
        // Create CSV content
        const headers = ['Start Date', 'End Date', 'Period Length', 'Flow', 'Symptoms', 'Notes'];
        const csvContent = [
          headers.join(','),
          ...cycles.map(cycle => [
            cycle.start_date,
            cycle.end_date || '',
            cycle.period_length || '',
            cycle.flow || '',
            cycle.symptoms ? cycle.symptoms.join('; ') : '',
            cycle.notes ? `"${cycle.notes.replace(/"/g, '""')}"` : ''
          ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fertility-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        await logUserEvent('data_export_completed', 'general', { format: 'csv', cycles_count: cycles.length });
      } else if (format === 'pdf') {
        // Simple PDF report
        const reportContent = `
FERTILITY TRACKER REPORT
Generated: ${new Date().toLocaleDateString()}
User: ${user?.full_name || user?.username}

CYCLE SUMMARY:
- Total cycles tracked: ${cycles.length}
- Average cycle length: ${user?.typical_cycle_length} days
- Average period length: ${user?.typical_period_length} days

RECENT CYCLES:
${cycles.slice(0, 10).map(cycle => 
  `${cycle.start_date} - ${cycle.end_date || 'Ongoing'} (${cycle.period_length || '?'} days, ${cycle.flow || 'unknown'} flow)`
).join('\n')}
        `;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fertility-tracker-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        await logUserEvent('data_export_completed', 'general', { format: 'pdf', cycles_count: cycles.length });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      await logUserEvent('data_export_failed', 'general', { format, error: error.message });
      alert('Error exporting data. Please try again.');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'periods', label: 'Period Tracker', icon: Calendar },
    { id: 'pregnancy', label: 'Pregnancy Planner', icon: Baby },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  if (user?.is_admin) {
    tabs.push({ id: 'admin', label: 'Admin Panel', icon: Lock });
  }

  // Show loading state if we have session but no user yet
  if (session && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto text-pink-500 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600 dark:text-gray-300">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile-First Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="text-pink-500" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Fertility Tracker</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Welcome, {user?.full_name || user?.username || 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Export Button */}
              <div className="relative group">
                <button className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-1">
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => exportData('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportData('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    Export Report
                  </button>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User Info & Logout */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2">
                  {user?.is_admin && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded font-medium">
                      👑 Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center space-x-1"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <Smartphone size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Navigation */}
          <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mb-6`}>
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                        logUserEvent('tab_changed', 'navigation', { tab: tab.id });
                      }}
                      className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-lg text-center transition-colors ${
                        activeTab === tab.id
                          ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64">
            <nav className="space-y-2 sticky top-24">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      logUserEvent('tab_changed', 'navigation', { tab: tab.id });
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            {activeTab === 'analytics' && <AdvancedAnalytics user={user} cycles={cycles} />}
            {activeTab === 'periods' && <PeriodTracker user={user} cycles={cycles} setCycles={setCycles} fetchCycles={fetchCycles} logUserEvent={logUserEvent} />}
            {activeTab === 'pregnancy' && <PregnancyPlanner user={user} cycles={cycles} />}
            {activeTab === 'profile' && <Profile user={user} setUser={setUser} logUserEvent={logUserEvent} />}
            {activeTab === 'admin' && user?.is_admin && <AdminPanel user={user} logUserEvent={logUserEvent} />}
          </div>
        </div>
      </div>
    </div>
  );
};

  // ENHANCED DASHBOARD WITH BETTER PREDICTIONS
  const Dashboard = ({
    user,
    cycles
  }) => {
    const calculateAdvancedPredictions = (cycles, typicalCycleLength, numberOfPeriods = 4) => {
      if (!cycles || cycles.length === 0) return [];

      // Calculate average cycle length from recent cycles
      const recentCycles = cycles.slice(0, 6);
      let avgCycleLength = typicalCycleLength;

      if (recentCycles.length >= 2) {
        const cycleLengths = [];
        for (let i = 0; i < recentCycles.length - 1; i++) {
          const current = new Date(recentCycles[i].start_date);
          const next = new Date(recentCycles[i + 1].start_date);
          const length = Math.ceil((current - next) / (24 * 60 * 60 * 1000));
          if (length > 15 && length < 45) { // Valid cycle length
            cycleLengths.push(length);
          }
        }

        if (cycleLengths.length > 0) {
          avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
        }
      }

      const lastPeriod = new Date(cycles[0].start_date);
      const predictions = [];

      for (let i = 1; i <= numberOfPeriods; i++) {
        const nextPeriod = new Date(lastPeriod);
        nextPeriod.setDate(lastPeriod.getDate() + (avgCycleLength * i));

        // Calculate confidence based on cycle regularity
        const variance = recentCycles.length >= 3 ?
          Math.max(0, 100 - (Math.abs(avgCycleLength - typicalCycleLength) * 10)) : 75;

        const confidence = Math.max(variance - (i * 8), 45);

        // Calculate fertile window (ovulation typically 14 days before next period)
        const ovulationDate = new Date(nextPeriod);
        ovulationDate.setDate(nextPeriod.getDate() + avgCycleLength - 14);

        const fertileStart = new Date(ovulationDate);
        fertileStart.setDate(ovulationDate.getDate() - 5);

        const fertileEnd = new Date(ovulationDate);
        fertileEnd.setDate(ovulationDate.getDate() + 1);

        predictions.push({
          cycle: i,
          startDate: nextPeriod.toISOString().split('T')[0],
          confidence: Math.round(confidence),
          ovulationDate: ovulationDate.toISOString().split('T')[0],
          fertileWindowStart: fertileStart.toISOString().split('T')[0],
          fertileWindowEnd: fertileEnd.toISOString().split('T')[0],
          avgCycleLength
        });
      }
      return predictions;
    };

    // Late period check function
    const checkLatePeriod = (cycles, typicalCycleLength) => {
      if (!cycles || cycles.length === 0) return null;
      
      const lastPeriod = new Date(cycles[0].start_date + 'T00:00:00');
      const today = new Date();
      const daysSinceLastPeriod = Math.ceil((today - lastPeriod) / (24 * 60 * 60 * 1000));
      const expectedCycleLength = typicalCycleLength || 28;
      
      // Calculate expected next period date
      const expectedNextPeriod = new Date(lastPeriod);
      expectedNextPeriod.setDate(lastPeriod.getDate() + expectedCycleLength);
      
      const daysLate = Math.ceil((today - expectedNextPeriod) / (24 * 60 * 60 * 1000));
      
      if (daysLate > 0) {
        return {
          isLate: true,
          daysLate: daysLate,
          expectedDate: expectedNextPeriod.toDateString(),
          lastPeriodDate: lastPeriod.toDateString(),
          daysSinceLastPeriod: daysSinceLastPeriod
        };
      }
      
      return { isLate: false, daysSinceLastPeriod };
    };

    // Quick start period function
    const quickStartPeriod = async () => {
      try {
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (user?.typical_period_length || 5) - 1);
        
        const cycleData = {
          user_id: user.id,
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
          period_length: user?.typical_period_length || 5,
          cycle_length: user?.typical_cycle_length || 28,
          flow: 'medium',
          symptoms: [],
          notes: 'Period started (late period logged quickly)'
        };

        const { error } = await supabase
          .from('cycles')
          .insert([cycleData]);

        if (error) throw error;
        
        // Refresh the cycles data
        window.location.reload(); // Simple refresh to update all components
        
        alert('Period logged successfully!');
      } catch (error) {
        console.error('Error logging period:', error);
        alert('Error logging period. Please try again.');
      }
    };

    const nextPeriods = calculateAdvancedPredictions(cycles, user?.typical_cycle_length || 28);
    const latePeriodStatus = checkLatePeriod(cycles, user?.typical_cycle_length || 28);

    if (!cycles || cycles.length === 0) {
      return ( <
        div className = "space-y-6" >
        <
        div className = "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6" >
        <
        h2 className = "text-2xl font-bold mb-2" >
        Welcome, {
          user?.full_name || user?.username
        }!
        <
        /h2> <
        p className = "opacity-90" > Start tracking your cycles to get personalized insights < /p> < /
        div >

        <
        div className = "bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700 text-center" >
        <
        Calendar className = "mx-auto text-pink-300 mb-4"
        size = {
          64
        }
        /> <
        h3 className = "text-xl font-semibold text-gray-800 dark:text-white mb-2" > No Cycle Data Yet < /h3> <
        p className = "text-gray-600 dark:text-gray-400 mb-4" >
        Start tracking your periods to get personalized predictions and insights. <
        /p> < /
        div > <
        /div>
      );
    }

    const cycleStats = {
      totalCycles: cycles.length,
      averageLength: Math.round(cycles.reduce((sum, c) => sum + (c.period_length || 5), 0) / cycles.length),
      mostCommonFlow: cycles.reduce((acc, c) => {
        acc[c.flow] = (acc[c.flow] || 0) + 1;
        return acc;
      }, {}),
      mostCommonSymptoms: cycles.reduce((acc, c) => {
        if (c.symptoms) {
          c.symptoms.forEach(symptom => {
            acc[symptom] = (acc[symptom] || 0) + 1;
          });
        }
        return acc;
      }, {})
    };

    const topFlow = Object.keys(cycleStats.mostCommonFlow).reduce((a, b) =>
      cycleStats.mostCommonFlow[a] > cycleStats.mostCommonFlow[b] ? a : b, 'medium'
    );

    const topSymptoms = Object.keys(cycleStats.mostCommonSymptoms)
      .sort((a, b) => cycleStats.mostCommonSymptoms[b] - cycleStats.mostCommonSymptoms[a])
      .slice(0, 3);

    return ( <
      div className = "space-y-6" >
      <
      div className = "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-6" >
      <
      h2 className = "text-2xl font-bold mb-2" >
      Welcome back, {
        user?.full_name || user?.username
      }!
      <
      /h2> <
      p className = "opacity-90" > Here 's your cycle overview and advanced predictions</p> < /
      div >

      {/* Late Period Alert */}
      {latePeriodStatus?.isLate && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-600">
          <div className="flex items-center space-x-3">
            <AlertTriangle size={32} className="text-yellow-100" />
            <div>
              <h3 className="text-xl font-bold mb-1">⏰ Period is Late</h3>
              <p className="opacity-90 mb-2">
                Your period is {latePeriodStatus.daysLate} day{latePeriodStatus.daysLate > 1 ? 's' : ''} late
              </p>
              <div className="text-sm opacity-80">
                <p>Expected: {latePeriodStatus.expectedDate}</p>
                <p>Last period: {latePeriodStatus.lastPeriodDate} ({latePeriodStatus.daysSinceLastPeriod} days ago)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button 
              onClick={() => quickStartPeriod()}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📅 Log Period Now
            </button>
            <button 
              onClick={() => {
                alert('Consider taking a pregnancy test if your period is more than a week late and you\'re sexually active. Consult with a healthcare provider for personalized advice.');
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              ℹ️ What Should I Do?
            </button>
          </div>
        </div>
      )}

      {/* Show cycle length info for periods that are getting close */}
      {!latePeriodStatus?.isLate && latePeriodStatus?.daysSinceLastPeriod > ((user?.typical_cycle_length || 28) - 3) && (
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Clock size={24} className="text-blue-100" />
            <div>
              <h4 className="font-semibold">📅 Period Expected Soon</h4>
              <p className="text-sm opacity-90">
                It's been {latePeriodStatus.daysSinceLastPeriod} days since your last period. 
                Your next period is expected in the next few days.
              </p>
            </div>
          </div>
        </div>
      )}

      {
        /* Enhanced Stats Grid */
      } <
      div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" >
      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex items-center space-x-3 mb-4" >
      <
      Calendar className = "text-pink-500"
      size = {
        24
      }
      /> <
      h3 className = "font-semibold text-gray-800 dark:text-white" > Current Cycle < /h3> < /
      div > <
      div className = "space-y-2" >
      <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Last Period: < span className = "font-medium text-gray-800 dark:text-white" > {
        new Date(cycles[0]?.start_date + 'T00:00:00').toDateString()
      } <
      /span> < /
      p > {
        nextPeriods.length > 0 && ( <
          p className = "text-sm text-gray-600 dark:text-gray-400" >
          Next Period: < span className = "font-medium text-pink-600 dark:text-pink-400" > {
            new Date(nextPeriods[0].startDate + 'T00:00:00').toDateString()
          } <
          /span> < /
          p >
        )
      } <
      /div> < /
      div >

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex items-center space-x-3 mb-4" >
      <
      TrendingUp className = "text-green-500"
      size = {
        24
      }
      /> <
      h3 className = "font-semibold text-gray-800 dark:text-white" > Cycle Stats < /h3> < /
      div > <
      div className = "space-y-2" >
      <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Cycles Tracked: < span className = "font-medium text-gray-800 dark:text-white" > {
        cycleStats.totalCycles
      } < /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Avg Length: <span className="font-medium text-gray-800 dark:text-white">
  	{cycleStats.averageLength} days
	</span> < /
      p > <
      /div> < /
      div >

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex items-center space-x-3 mb-4" >
      <
      Heart className = "text-red-500"
      size = {
        24
      }
      /> <
      h3 className = "font-semibold text-gray-800 dark:text-white" > Period Pattern < /h3> < /
      div > <
      div className = "space-y-2" >
      <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Typical Flow: < span className = "font-medium text-gray-800 dark:text-white capitalize" > {
        topFlow
      } < /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Length: < span className = "font-medium text-gray-800 dark:text-white" > {
        user?.typical_period_length || 5
      }
       days < /span> < /
      p > <
      /div> < /
      div >

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex items-center space-x-3 mb-4" >
      <
      Target className = "text-blue-500"
      size = {
        24
      }
      /> <
      h3 className = "font-semibold text-gray-800 dark:text-white" > Predictions < /h3> < /
      div > <
      div className = "space-y-2" >
      <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Accuracy: < span className = "font-medium text-green-600 dark:text-green-400" > {
        nextPeriods[0]?.confidence || 75
      } %
      <
      /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Based on {
        Math.min(cycles.length, 6)
      }
      cycles <
      /p> < /
      div > <
      /div> < /
      div >

      {
        /* Enhanced Predictions */
      } {
        nextPeriods.length > 0 && ( <
          div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Advanced Period Predictions < /h3> <
          div className = "grid grid-cols-1 md:grid-cols-2 gap-4" > {
            nextPeriods.map((period, index) => ( <
              div key = {
                index
              }
              className = "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-4 rounded-lg border dark:border-gray-600" >
              <
              div className = "flex justify-between items-center mb-3" >
              <
              h4 className = "font-medium text-gray-800 dark:text-white" > Cycle {
                period.cycle
              } < /h4> <
              span className = {
                `text-xs px-2 py-1 rounded ${
                    period.confidence >= 80 ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    period.confidence >= 60 ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`
              } > {
                period.confidence
              } % confidence <
              /span> < /
              div > <
              div className = "space-y-2 text-sm" >
              <
              p className = "text-gray-600 dark:text-gray-400" >
              <
              strong > Period Start: < /strong> {new Date(period.startDate + 'T00:00:00').toDateString()} < /
              p > <
              p className = "text-gray-600 dark:text-gray-400" >
              <
              strong > Fertile Window: < /strong> {new Date(period.fertileWindowStart + 'T00:00:00').toLocaleDateString()} - {new Date(period.fertileWindowEnd + 'T00:00:00').toLocaleDateString()} < /
              p > <
              p className = "text-gray-600 dark:text-gray-400" >
              <
              strong > Ovulation: < /strong> {new Date(period.ovulationDate + 'T00:00:00').toDateString()} < /
              p > <
              /div> < /
              div >
            ))
          } <
          /div> < /
          div >
        )
      }

      {
        /* Common Symptoms */
      } {
        topSymptoms.length > 0 && ( <
          div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Your Most Common Symptoms < /h3> <
          div className = "flex flex-wrap gap-2" > {
            topSymptoms.map(symptom => ( <
              span key = {
                symptom
              }
              className = "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 px-3 py-1 rounded-full text-sm" > {
                symptom
              }({
                  cycleStats.mostCommonSymptoms[symptom]
                }
                x) <
              /span>
            ))
          } <
          /div> < /
          div >
        )
      } <
      /div>
    );
  };

  // NEW ADVANCED ANALYTICS COMPONENT
  const AdvancedAnalytics = ({
    user,
    cycles
  }) => {
    const [activeChart, setActiveChart] = useState('cycle-length');

    if (!cycles || cycles.length < 3) {
      return ( <
        div className = "space-y-6" >
        <
        div className = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6" >
        <
        h2 className = "text-2xl font-bold mb-2" > Advanced Analytics < /h2> <
        p className = "opacity-90" > Detailed insights into your cycle patterns < /p> < /
        div >

        <
        div className = "bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border dark:border-gray-700 text-center" >
        <
        BarChart3 className = "mx-auto text-blue-300 mb-4"
        size = {
          64
        }
        /> <
        h3 className = "text-xl font-semibold text-gray-800 dark:text-white mb-2" > Need More Data < /h3> <
        p className = "text-gray-600 dark:text-gray-400" >
        Track at least 3 cycles to see detailed analytics and trends. <
        /p> < /
        div > <
        /div>
      );
    }

    // Calculate analytics data
    const cycleLengths = [];
    const periodLengths = cycles.map(c => c.period_length || 5);

    for (let i = 0; i < cycles.length - 1; i++) {
      const current = new Date(cycles[i].start_date);
      const next = new Date(cycles[i + 1].start_date);
      const length = Math.ceil((current - next) / (24 * 60 * 60 * 1000));
      if (length > 15 && length < 45) {
        cycleLengths.push(length);
      }
    }

    const avgCycleLength = cycleLengths.length > 0 ?
      Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28;
    const avgPeriodLength = Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length);

    const flowData = cycles.reduce((acc, c) => {
      acc[c.flow || 'unknown'] = (acc[c.flow || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const symptomData = cycles.reduce((acc, c) => {
      if (c.symptoms) {
        c.symptoms.forEach(symptom => {
          acc[symptom] = (acc[symptom] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const charts = [{
        id: 'cycle-length',
        label: 'Cycle Length',
        icon: LineChart
      },
      {
        id: 'period-length',
        label: 'Period Length',
        icon: BarChart3
      },
      {
        id: 'flow-patterns',
        label: 'Flow Patterns',
        icon: PieChart
      },
      {
        id: 'symptoms',
        label: 'Symptoms',
        icon: Target
      }
    ];

    return ( <
      div className = "space-y-6" >
      <
      div className = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6" >
      <
      h2 className = "text-2xl font-bold mb-2" > Advanced Analytics < /h2> <
      p className = "opacity-90" > Detailed insights based on {
        cycles.length
      }
      tracked cycles < /p> < /
      div >

      {
        /* Chart Selection */
      } <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex flex-wrap gap-2" > {
        charts.map(chart => {
          const Icon = chart.icon;
          return ( <
            button key = {
              chart.id
            }
            onClick = {
              () => setActiveChart(chart.id)
            }
            className = {
              `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeChart === chart.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            } >
            <
            Icon size = {
              16
            }
            /> <
            span className = "font-medium" > {
              chart.label
            } < /span> < /
            button >
          );
        })
      } <
      /div> < /
      div >

      {
        /* Analytics Content */
      } <
      div className = "grid grid-cols-1 lg:grid-cols-3 gap-6" > {
        /* Main Chart Area */
      } <
      div className = "lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" > {
        activeChart === 'cycle-length' && ( <
          div >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Cycle Length Trends < /h3> <
          div className = "h-64 flex items-end justify-center space-x-2" > {
            cycleLengths.slice(-12).map((length, index) => ( <
              div key = {
                index
              }
              className = "flex flex-col items-center" >
              <
              div className = "bg-blue-500 w-8 rounded-t"
              style = {
                {
                  height: `${(length / 45) * 200}px`
                }
              }
              /> <
              span className = "text-xs text-gray-500 dark:text-gray-400 mt-1" > {
                length
              } < /span> < /
              div >
            ))
          } <
          /div> <
          div className = "mt-4 text-center" >
          <
          p className = "text-sm text-gray-600 dark:text-gray-400" >
          Average: {
            avgCycleLength
          }
          days | Range: {
            Math.min(...cycleLengths)
          } - {
            Math.max(...cycleLengths)
          }
           days <
          /p> < /
          div > <
          /div>
        )
      }

      {
        activeChart === 'period-length' && ( <
          div >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Period Length Patterns < /h3> <
          div className = "h-64 flex items-end justify-center space-x-2" > {
            periodLengths.slice(-12).map((length, index) => ( <
              div key = {
                index
              }
              className = "flex flex-col items-center" >
              <
              div className = "bg-pink-500 w-8 rounded-t"
              style = {
                {
                  height: `${(length / 10) * 200}px`
                }
              }
              /> <
              span className = "text-xs text-gray-500 dark:text-gray-400 mt-1" > {
                length
              } < /span> < /
              div >
            ))
          } <
          /div> <
          div className = "mt-4 text-center" >
          <
          p className = "text-sm text-gray-600 dark:text-gray-400" >
          Average: {
            avgPeriodLength
          }
          days | Most common: {
            user?.typical_period_length || 5
          }
           days <
          /p> < /
          div > <
          /div>
        )
      }

      {
        activeChart === 'flow-patterns' && ( <
          div >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Flow Intensity Distribution < /h3> <
          div className = "space-y-4" > {
            Object.entries(flowData).map(([flow, count]) => ( <
              div key = {
                flow
              }
              className = "flex items-center space-x-3" >
              <
              span className = "w-16 text-sm capitalize text-gray-700 dark:text-gray-300" > {
                flow
              } < /span> <
              div className = "flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6" >
              <
              div className = {
                `h-6 rounded-full ${
                          flow === 'light' ? 'bg-pink-300' :
                          flow === 'medium' ? 'bg-pink-500' :
                          flow === 'heavy' ? 'bg-pink-700' : 'bg-gray-400'
                        }`
              }
              style = {
                {
                  width: `${(count / cycles.length) * 100}%`
                }
              }
              /> < /
              div > <
              span className = "text-sm text-gray-600 dark:text-gray-400" > {
                count
              }({
                Math.round((count / cycles.length) * 100)
              } % ) < /span> < /
              div >
            ))
          } <
          /div> < /
          div >
        )
      }

      {
        activeChart === 'symptoms' && ( <
          div >
          <
          h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Symptom Frequency < /h3> <
          div className = "space-y-3" > {
            Object.entries(symptomData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([symptom, count]) => ( <
              div key = {
                symptom
              }
              className = "flex items-center space-x-3" >
              <
              span className = "w-24 text-sm text-gray-700 dark:text-gray-300" > {
                symptom
              } < /span> <
              div className = "flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6" >
              <
              div className = "h-6 bg-purple-500 rounded-full"
              style = {
                {
                  width: `${(count / cycles.length) * 100}%`
                }
              }
              /> < /
              div > <
              span className = "text-sm text-gray-600 dark:text-gray-400" > {
                count
              }
              /{cycles.length}</span >
              <
              /div>
            ))
          } <
          /div> < /
          div >
        )
      } <
      /div>

      {
        /* Stats Sidebar */
      } <
      div className = "space-y-4" >
      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700" >
      <
      h4 className = "font-semibold text-gray-800 dark:text-white mb-3" > Cycle Health Score < /h4> <
      div className = "text-center" >
      <
      div className = "text-3xl font-bold text-green-600 dark:text-green-400 mb-2" > {
        Math.min(95, 60 + (cycles.length * 5))
      } %
      <
      /div> <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Based on {
        cycles.length
      }
      cycles of data <
      /p> < /
      div > <
      /div>

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700" >
      <
      h4 className = "font-semibold text-gray-800 dark:text-white mb-3" > Regularity Index < /h4> <
      div className = "space-y-2" >
      <
      div className = "flex justify-between" >
      <
      span className = "text-sm text-gray-600 dark:text-gray-400" > Cycle Length < /span> <
      span className = "text-sm font-medium text-gray-800 dark:text-white" > {
        cycleLengths.length > 0 && Math.max(...cycleLengths) - Math.min(...cycleLengths) <= 7 ? 'Regular' : 'Variable'
      } <
      /span> < /
      div > <
      div className = "flex justify-between" >
      <
      span className = "text-sm text-gray-600 dark:text-gray-400" > Period Length < /span> <
      span className = "text-sm font-medium text-gray-800 dark:text-white" > {
        Math.max(...periodLengths) - Math.min(...periodLengths) <= 2 ? 'Consistent' : 'Variable'
      } <
      /span> < /
      div > <
      /div> < /
      div >

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700" >
      <
      h4 className = "font-semibold text-gray-800 dark:text-white mb-3" > Insights < /h4> <
      div className = "space-y-2 text-sm" > {
        cycleLengths.length > 0 && Math.max(...cycleLengths) - Math.min(...cycleLengths) <= 7 && ( <
          p className = "text-green-600 dark:text-green-400" > ✓Your cycles are very regular < /p>
        )
      } {
        avgPeriodLength >= 3 && avgPeriodLength <= 7 && ( <
          p className = "text-green-600 dark:text-green-400" > ✓Normal period length < /p>
        )
      } {
        cycles.length >= 6 && ( <
          p className = "text-blue-600 dark:text-blue-400" > ℹ Good data
          for predictions < /p>
        )
      } <
      /div> < /
      div > <
      /div> < /
      div > <
      /div>
    );
  };

  // FIXED PROFILE COMPONENT
  const Profile = ({
    user,
    setUser,
    logUserEvent
  }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      full_name: user?.full_name || '',
      date_of_birth: user?.date_of_birth || '',
      age: user?.age || '',
      weight: user?.weight || '',
      typical_cycle_length: user?.typical_cycle_length || 28,
      typical_period_length: user?.typical_period_length || 5
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    };

    useEffect(() => {
      if (formData.date_of_birth) {
        const calculatedAge = calculateAge(formData.date_of_birth);
        setFormData(prev => ({
          ...prev,
          age: calculatedAge
        }));
      }
    }, [formData.date_of_birth]);

    useEffect(() => {
      if (formData.first_name || formData.last_name) {
        const fullName = `${formData.first_name} ${formData.last_name}`.trim();
        setFormData(prev => ({
          ...prev,
          full_name: fullName
        }));
      }
    }, [formData.first_name, formData.last_name]);

    const handleSave = async () => {
      setLoading(true);
      setMessage('');

      try {
        // Prepare the update data - only include non-null values
        const updateData = {};

        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
            updateData[key] = formData[key];
          }
        });

        // Ensure age is properly calculated
        if (updateData.date_of_birth) {
          updateData.age = calculateAge(updateData.date_of_birth);
        }

        // Update the profile
        const {
          data,
          error
        } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Profile update error:', error);
          throw error;
        }

        // Update local user state with the returned data
        setUser({
          ...user,
          ...data
        });
        setEditMode(false);
        setMessage('Profile updated successfully!');

        await logUserEvent('profile_updated', 'profile', {
          updated_fields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error updating profile:', error);
        setMessage(`Error updating profile: ${error.message}`);

        await logUserEvent('profile_update_failed', 'profile', {
          error: error.message,
          attempted_fields: Object.keys(formData)
        });
      } finally {
        setLoading(false);
      }
    };

    return ( <
      div className = "space-y-6" >
      <
      div className = "bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-6" >
      <
      h2 className = "text-2xl font-bold mb-2" > Profile Settings < /h2> <
      p className = "opacity-90" > Manage your personal information and preferences < /p> < /
      div >

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex justify-between items-center mb-6" >
      <
      h3 className = "font-semibold text-gray-800 dark:text-white" > Personal Information < /h3> <
      div className = "flex space-x-2" > {
        editMode && ( <
          button onClick = {
            () => {
              setEditMode(false);
              setMessage('');
              setFormData({
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                full_name: user?.full_name || '',
                date_of_birth: user?.date_of_birth || '',
                age: user?.age || '',
                weight: user?.weight || '',
                typical_cycle_length: user?.typical_cycle_length || 28,
                typical_period_length: user?.typical_period_length || 5
              });
            }
          }
          className = "bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors" >
          Cancel <
          /button>
        )
      } <
      button onClick = {
        () => editMode ? handleSave() : setEditMode(true)
      }
      disabled = {
        loading
      }
      className = "bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400" > {
        loading ? 'Saving...' : (editMode ? 'Save' : 'Edit')
      } <
      /button> < /
      div > <
      /div>

      {
        message && ( <
          div className = {
            `mb-4 p-3 rounded-lg text-sm ${
            message.includes('Error') || message.includes('error')
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700'
          }`
          } > {
            message
          } <
          /div>
        )
      }

      <
      div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > First Name < /label> <
      input type = "text"
      value = {
        formData.first_name
      }
      onChange = {
        (e) => setFormData(prev => ({
          ...prev,
          first_name: e.target.value
        }))
      }
      disabled = {
        !editMode
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Last Name < /label> <
      input type = "text"
      value = {
        formData.last_name
      }
      onChange = {
        (e) => setFormData(prev => ({
          ...prev,
          last_name: e.target.value
        }))
      }
      disabled = {
        !editMode
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Date of Birth < /label> <
      input type = "date"
      value = {
        formData.date_of_birth
      }
      onChange = {
        (e) => setFormData(prev => ({
          ...prev,
          date_of_birth: e.target.value
        }))
      }
      disabled = {
        !editMode
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Age < /label> <
      input type = "number"
      value = {
        formData.age || ''
      }
      disabled = {
        true
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      placeholder = "Auto-calculated from birth date" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Weight(kg) < /label> <
      input type = "number"
      value = {
        formData.weight || ''
      }
      onChange = {
        (e) => setFormData(prev => ({
          ...prev,
          weight: parseFloat(e.target.value) || null
        }))
      }
      disabled = {
        !editMode
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Typical Cycle Length(days) < /label> <
      input type = "number"
      value = {
        formData.typical_cycle_length
      }
      onChange = {
        (e) => setFormData(prev => ({
          ...prev,
          typical_cycle_length: parseInt(e.target.value) || 28
        }))
      }
      disabled = {
        !editMode
      }
      min = "15"
      max = "45"
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /
      >
      <
      /div>

      <
      div >
      <
      label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" >
      Typical Period Length(days) <
      span className = "text-xs text-gray-500 dark:text-gray-400 block" > Auto - calculated from recent periods < /span> < /
      label > <
      input type = "number"
      value = {
        formData.typical_period_length
      }
      disabled = {
        true
      }
      className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
      placeholder = "Based on your recent period data" /
      >
      <
      /div> < /
      div > <
      /div>

      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Account Information < /h3> <
      div className = "space-y-2" >
      <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Username: < span className = "font-medium text-gray-800 dark:text-white" > {
        user?.username
      } < /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Account created: < span className = "font-medium text-gray-800 dark:text-white" > {
        new Date(user?.created_at).toLocaleDateString()
      } <
      /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Last login: < span className = "font-medium text-gray-800 dark:text-white" > {
        user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'
      } <
      /span> < /
      p > <
      p className = "text-sm text-gray-600 dark:text-gray-400" >
      Total logins: < span className = "font-medium text-gray-800 dark:text-white" > {
        user?.login_count || 0
      } < /span> < /
      p > <
      /div> < /
      div > <
      /div>
    );
  };

  // Enhanced Period Tracker Component
  const PeriodTracker = ({
      user,
      cycles,
      setCycles,
      fetchCycles,
      logUserEvent
    }) => {
      const [newPeriod, setNewPeriod] = useState({
        startDate: '',
        endDate: '',
        flow: 'medium',
        symptoms: [],
        notes: ''
      });
      const [loading, setLoading] = useState(false);
      
      // Edit modal states
      const [showEditModal, setShowEditModal] = useState(false);
      const [editingCycle, setEditingCycle] = useState(null);
      const [editFormData, setEditFormData] = useState({
        startDate: '',
        endDate: '',
        flow: 'medium',
        symptoms: [],
        notes: ''
      });

      const symptoms = [
        'Cramps', 'Bloating', 'Headache', 'Mood Changes', 'Breast Pain',
        'Fatigue', 'Acne', 'Back Pain', 'Nausea', 'Food Cravings'
      ];

      const addPeriod = async () => {
        if (!newPeriod.startDate) {
          alert('Please enter a start date');
          return;
        }

        setLoading(true);
        try {
          // Fix: Use date strings directly instead of Date objects to avoid timezone issues
          const startDateStr = newPeriod.startDate; // Keep as string
          let endDateStr = newPeriod.endDate;
          let periodLength = user?.typical_period_length || 5;

          if (newPeriod.endDate) {
            // Calculate period length using date strings
            const start = new Date(newPeriod.startDate + 'T00:00:00');
            const end = new Date(newPeriod.endDate + 'T00:00:00');
            periodLength = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1;
          } else {
            // Calculate end date by adding days to start date
            const start = new Date(newPeriod.startDate + 'T00:00:00');
            const end = new Date(start);
            end.setDate(start.getDate() + periodLength - 1);
            endDateStr = end.toISOString().split('T')[0];
          }

          const cycleData = {
            user_id: user.id,
            start_date: startDateStr, // Use string directly
            end_date: endDateStr,     // Use string directly
            period_length: periodLength,
            cycle_length: user?.typical_cycle_length || 28,
            flow: newPeriod.flow,
            symptoms: newPeriod.symptoms || [],
            notes: newPeriod.notes || ''
          };

          const { data, error } = await supabase
            .from('cycles')
            .insert([cycleData])
            .select();

          if (error) throw error;

          await fetchCycles();
          await logUserEvent('period_added', 'cycle', {
            start_date: newPeriod.startDate,
            flow: newPeriod.flow,
            symptoms_count: newPeriod.symptoms.length
          });

          setNewPeriod({
            startDate: '',
            endDate: '',
            flow: 'medium',
            symptoms: [],
            notes: ''
          });

          alert('Period added successfully!');
        } catch (error) {
          console.error('Error adding period:', error);
          alert(`Error adding period: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      const deletePeriod = async (id) => {
        try {
          const {
            error
          } = await supabase
            .from('cycles')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await fetchCycles();
          await logUserEvent('period_deleted', 'cycle', {
            cycle_id: id
          });
        } catch (error) {
          console.error('Error deleting period:', error);
        }
      };

      // Edit functions
      const openEditModal = (cycle) => {
        setEditingCycle(cycle);
        setEditFormData({
          startDate: cycle.start_date,
          endDate: cycle.end_date || '',
          flow: cycle.flow || 'medium',
          symptoms: cycle.symptoms || [],
          notes: cycle.notes || ''
        });
        setShowEditModal(true);
      };

      const closeEditModal = () => {
        setShowEditModal(false);
        setEditingCycle(null);
        setEditFormData({
          startDate: '',
          endDate: '',
          flow: 'medium',
          symptoms: [],
          notes: ''
        });
      };

      const updatePeriod = async () => {
        if (!editFormData.startDate) {
          alert('Please enter a start date');
          return;
        }

        setLoading(true);
        try {
          // Fix: Use date strings directly to avoid timezone issues
          const startDateStr = editFormData.startDate;
          let endDateStr = editFormData.endDate;
          let periodLength = user?.typical_period_length || 5;

          if (editFormData.endDate) {
            const start = new Date(editFormData.startDate + 'T00:00:00');
            const end = new Date(editFormData.endDate + 'T00:00:00');
            periodLength = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1;
          } else {
            const start = new Date(editFormData.startDate + 'T00:00:00');
            const end = new Date(start);
            end.setDate(start.getDate() + periodLength - 1);
            endDateStr = end.toISOString().split('T')[0];
          }

          const updateData = {
            start_date: startDateStr,
            end_date: endDateStr,
            period_length: periodLength,
            flow: editFormData.flow,
            symptoms: editFormData.symptoms || [],
            notes: editFormData.notes || ''
          };

          const { error } = await supabase
            .from('cycles')
            .update(updateData)
            .eq('id', editingCycle.id);

          if (error) throw error;

          await fetchCycles();
          await logUserEvent('period_updated', 'cycle', {
            cycle_id: editingCycle.id,
            start_date: editFormData.startDate,
            flow: editFormData.flow
          });

          closeEditModal();
          alert('Period updated successfully!');
        } catch (error) {
          console.error('Error updating period:', error);
          alert(`Error updating period: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      const toggleSymptom = (symptom) => {
        setNewPeriod(prev => ({
          ...prev,
          symptoms: prev.symptoms.includes(symptom) ?
            prev.symptoms.filter(s => s !== symptom) : [...prev.symptoms, symptom]
        }));
      };

      const toggleEditSymptom = (symptom) => {
        setEditFormData(prev => ({
          ...prev,
          symptoms: prev.symptoms.includes(symptom) 
            ? prev.symptoms.filter(s => s !== symptom) 
            : [...prev.symptoms, symptom]
        }));
      };
	  
      // Auto-fill end date when start date changes
      useEffect(() => {
        if (newPeriod.startDate) {
          const startDate = new Date(newPeriod.startDate + 'T00:00:00');
          const typicalLength = user?.typical_period_length || 5;
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + typicalLength - 1);
          
          setNewPeriod(prev => ({
            ...prev,
            endDate: endDate.toISOString().split('T')[0]
          }));
        } else {
          setNewPeriod(prev => ({
            ...prev,
            endDate: ''
          }));
        }
      }, [newPeriod.startDate, user?.typical_period_length]);

      return ( <
        div className = "space-y-6" >
        <
        div className = "bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-xl p-6" >
        <
        h2 className = "text-2xl font-bold mb-2" > Period Tracker < /h2> <
        p className = "opacity-90" > Log your periods and track symptoms < /p> < /
        div >

        {
          /* Add New Period */
        } <
        div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
        <
        h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Add New Period < /h3>

        <
        div className = "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" >
        
		<div>
		  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
		  <input
			type="date"
			value={newPeriod.startDate}
			onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
			min="2020-01-01"
			max="2050-12-31"
			className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
		  />
		</div>

		<div>
		  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date (Auto-filled)</label>
		  <input
			type="date"
			value={newPeriod.endDate}
			onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
			min="2020-01-01"
			max="2050-12-31"
			className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
		  />
		  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
			Auto-filled based on your typical period length ({user?.typical_period_length || 5} days)
		  </p>
		</div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Flow Intensity < /label> <
        select value = {
          newPeriod.flow
        }
        onChange = {
          (e) => setNewPeriod(prev => ({
            ...prev,
            flow: e.target.value
          }))
        }
        className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" >
        <
        option value = "light" > Light < /option> <
        option value = "medium" > Medium < /option> <
        option value = "heavy" > Heavy < /option> < /
        select > <
        /div> < /
        div >

        <
        div className = "mb-4" >
        <
        label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Symptoms < /label> <
        div className = "grid grid-cols-2 md:grid-cols-5 gap-2" > {
          symptoms.map(symptom => ( <
            button key = {
              symptom
            }
            onClick = {
              () => toggleSymptom(symptom)
            }
            className = {
              `p-2 rounded-lg text-sm transition-colors ${
                  newPeriod.symptoms.includes(symptom)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`
            } > {
              symptom
            } <
            /button>
          ))
        } <
        /div> < /
        div >

        <
        div className = "mb-4" >
        <
        label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Notes(Optional) < /label> <
        textarea value = {
          newPeriod.notes
        }
        onChange = {
          (e) => setNewPeriod(prev => ({
            ...prev,
            notes: e.target.value
          }))
        }
        placeholder = "Any additional notes..."
        className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        rows = "3" /
        >
        <
        /div>

        <
        button onClick = {
          addPeriod
        }
        disabled = {
          !newPeriod.startDate || loading
        }
        className = "bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" > {
          loading ? 'Adding...' : 'Add Period'
        } <
        /button> < /
        div >

        {
          /* Period History */
        } <
        div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
        <
        h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > Period History < /h3>

        {
          cycles.length === 0 ? ( <
            p className = "text-gray-500 dark:text-gray-400 text-center py-8" > No periods recorded yet.Add your first period above! < /p>
          ) : ( <
            div className = "space-y-4" > {
              cycles.map((cycle) => ( <
                  div key = {
                    cycle.id
                  }
                  className = "border border-gray-200 dark:border-gray-600 rounded-lg p-4" >
                  <
                  div className = "flex justify-between items-start mb-3" >
                  <
                  div >
                  <
                  div className = "flex items-center space-x-3" >
                  <
                  span className = "font-medium text-gray-800 dark:text-white" > {
                    new Date(cycle.start_date + 'T00:00:00').toDateString()
                  } <
                  /span> {
                  cycle.end_date && ( <
                    span className = "text-sm text-gray-600 dark:text-gray-400" >
                    to {
                      new Date(cycle.end_date + 'T00:00:00').toDateString()
                    } <
                    /span>
                  )
                } <
                span className = {
                  `w-4 h-4 rounded-full ${
                        cycle.flow === 'light' ? 'bg-pink-200' :
                        cycle.flow === 'heavy' ? 'bg-pink-600' : 'bg-pink-400'
                      }`
                } > < /span> <
                span className = "text-sm capitalize text-gray-600 dark:text-gray-400" > {
                  cycle.flow
                }
                flow < /span> < /
                div > <
                p className = "text-sm text-gray-600 dark:text-gray-400 mt-1" >
                Duration: {
                  cycle.period_length
                }
                days {
                  cycle.cycle_length && ` • Cycle: ${cycle.cycle_length} days`
                } <
                /p> {
                cycle.notes && ( <
                  p className = "text-sm text-gray-500 dark:text-gray-400 mt-1 italic" > {
                    cycle.notes
                  } < /p>
                )
              } <
              /div> 
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => openEditModal(cycle)}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Edit Period"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => deletePeriod(cycle.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Period"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <
              /div>

              {
                cycle.symptoms && cycle.symptoms.length > 0 && ( <
                  div className = "mt-2" >
                  <
                  p className = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > Symptoms: < /p> <
                  div className = "flex flex-wrap gap-1" > {
                    cycle.symptoms.map((symptom, index) => ( <
                      span key = {
                        index
                      }
                      className = "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-xs px-2 py-1 rounded" > {
                        symptom
                      } <
                      /span>
                    ))
                  } <
                  /div> < /
                  div >
                )
              } <
              /div>
            ))
        } <
        /div>
      )
    } <
    /div>

    {/* Edit Period Modal */}
    {showEditModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              📝 Edit Period
            </h3>
            <button 
              onClick={closeEditModal}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={editFormData.startDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min="2020-01-01"
                max="2050-12-31"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={editFormData.endDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min="2020-01-01"
                max="2050-12-31"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Flow Intensity
              </label>
              <select 
                value={editFormData.flow}
                onChange={(e) => setEditFormData(prev => ({ ...prev, flow: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symptoms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {symptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleEditSymptom(symptom)}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    editFormData.symptoms.includes(symptom)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea 
              value={editFormData.notes}
              onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={updatePeriod}
              disabled={!editFormData.startDate || loading}
              className="flex-1 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Period'}
            </button>
            <button
              onClick={closeEditModal}
              className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    < /
  div >
);
};

// Enhanced Pregnancy Planner
const PregnancyPlanner = ({
  user,
  cycles
}) => {
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

  return ( <
    div className = "space-y-6" >
    <
    div className = "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6" >
    <
    h2 className = "text-2xl font-bold mb-2" > Pregnancy Planning < /h2> <
    p className = "opacity-90" > Plan your perfect timing
    for conception and delivery < /p> < /
    div >

    <
    div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
    <
    h3 className = "font-semibold text-gray-800 dark:text-white mb-4" > When do you want your baby ? < /h3> <
    div className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" >
    <
    div >
    <
    label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Target Birth Month < /label> <
    select value = {
      targetMonth
    }
    onChange = {
      (e) => setTargetMonth(e.target.value)
    }
    className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" > {
      months.map((month, index) => ( <
        option key = {
          index
        }
        value = {
          index + 1
        } > {
          month
        } < /option>
      ))
    } <
    /select> < /
    div > <
    div >
    <
    label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" > Target Birth Year < /label> <
    select value = {
      targetYear
    }
    onChange = {
      (e) => setTargetYear(e.target.value)
    }
    className = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" > {
      [2025, 2026, 2027, 2028, 2029, 2050].map(year => ( <
        option key = {
          year
        }
        value = {
          year
        } > {
          year
        } < /option>
      ))
    } <
    /select> < /
    div > <
    /div>

    {
      calculation ? ( <
        div className = "bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border dark:border-blue-700" >
        <
        h4 className = "font-semibold text-gray-800 dark:text-white mb-4 flex items-center" >
        <
        Baby className = "text-blue-500 mr-2"
        size = {
          20
        }
        />
        Your Pregnancy Timeline <
        /h4>

        <
        div className = "grid grid-cols-1 md:grid-cols-2 gap-6" >
        <
        div className = "space-y-4" >
        <
        div className = "flex items-start space-x-3" >
        <
        Target className = "text-green-500 mt-1"
        size = {
          16
        }
        /> <
        div >
        <
        p className = "font-medium text-gray-800 dark:text-white" > Target Delivery Date < /p> <
        p className = "text-sm text-gray-600 dark:text-gray-400" > {
          calculation.targetDelivery
        } < /p> < /
        div > <
        /div>

        <
        div className = "flex items-start space-x-3" >
        <
        Heart className = "text-red-500 mt-1"
        size = {
          16
        }
        /> <
        div >
        <
        p className = "font-medium text-gray-800 dark:text-white" > Optimal Conception Date < /p> <
        p className = "text-sm text-gray-600 dark:text-gray-400" > {
          calculation.optimalConceptionDate
        } < /p> < /
        div > <
        /div>

        <
        div className = "flex items-start space-x-3" >
        <
        Clock className = "text-blue-500 mt-1"
        size = {
          16
        }
        /> <
        div >
        <
        p className = "font-medium text-gray-800 dark:text-white" > Days from Now < /p> <
        p className = "text-sm text-gray-600 dark:text-gray-400" > {
          calculation.daysFromNow
        }
         days < /p> < /
        div > <
        /div> < /
        div >

        <
        div className = "space-y-4" >
        <
        div className = "flex items-start space-x-3" >
        <
        Calendar className = "text-purple-500 mt-1"
        size = {
          16
        }
        /> <
        div >
        <
        p className = "font-medium text-gray-800 dark:text-white" > Cycle #{
          calculation.cycleNumber
        } < /p> <
        p className = "text-sm text-gray-600 dark:text-gray-400" > Period starts: {
          calculation.periodStart
        } < /p> < /
        div > <
        /div>

        <
        div className = "bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-600" >
        <
        p className = "font-medium text-gray-800 dark:text-white mb-2" > Best Conception Window: < /p> <
        p className = "text-sm text-gray-600 dark:text-gray-400 mb-1" >
        <
        strong > Fertile Window: < /strong> {calculation.fertileWindowStart} to {calculation.fertileWindowEnd} < /
        p > <
        p className = "text-sm text-gray-600 dark:text-gray-400" >
        <
        strong > Ovulation: < /strong> {calculation.ovulationDate} < /
        p > <
        /div> < /
        div > <
        /div>

        <
        div className = "mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg" >
        <
        p className = "text-sm text-yellow-800 dark:text-yellow-200" >
        <
        strong > 💡Tip: < /strong> Start taking folic acid supplements at least one month before conception. 
        Track your basal body temperature and cervical mucus
        for more accurate timing. <
        /p> < /
        div > <
        /div>
      ) : ( <
        div className = "bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center border dark:border-gray-600" >
        <
        Calendar className = "mx-auto text-gray-300 dark:text-gray-500 mb-4"
        size = {
          48
        }
        /> <
        h4 className = "font-medium text-gray-600 dark:text-gray-400 mb-2" > Need More Cycle Data < /h4> <
        p className = "text-sm text-gray-500 dark:text-gray-400" >
        Please add some period data first to calculate your optimal conception timing. <
        /p> < /
        div >
      )
    } <
    /div> < /
    div >
  );
};

// Enhanced Admin Panel with Mobile Responsiveness and Dark Mode
const AdminPanel = ({
  user,
  logUserEvent
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();

      logUserEvent('admin_panel_accessed', 'admin', {
        timestamp: new Date().toISOString(),
        initial_tab: activeAdminTab
      });
    }
  }, [user]);

  const resetUserPassword = async (userId, username) => {
    try {
      setLoading(true);

      const {
        data,
        error
      } = await supabase
        .rpc('admin_reset_user_password', {
          target_user_id: userId
        });

      if (error) throw error;

      setTempPassword(data);
      setSelectedUser({
        id: userId,
        username
      });
      setShowPasswordModal(true);

      await fetchUsers();
      await logUserEvent('password_reset_completed', 'admin', {
        target_user_id: userId,
        target_username: username
      });

    } catch (error) {
      console.error('Error resetting password:', error);
      alert(`Error resetting password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const {
        data,
        error
      } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    try {
      const {
        error
      } = await supabase
        .from('user_profiles')
        .update({
          is_admin: !currentStatus
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      await logUserEvent('user_admin_status_changed', 'admin', {
        target_user_id: userId,
        old_status: currentStatus,
        new_status: !currentStatus
      });

      alert(`User ${currentStatus ? 'removed from' : 'granted'} admin privileges.`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status.');
    }
  };

  const deactivateUser = async (userId, username) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Are you sure you want to deactivate user "${username}"?`)) {
      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error
      } = await supabase
        .rpc('admin_deactivate_user', {
          target_user_id: userId
        });

      if (error) throw error;

      await fetchUsers();
      await logUserEvent('user_deactivated', 'admin', {
        target_user_id: userId,
        target_username: username
      });

      alert(`User "${username}" has been deactivated successfully.`);
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert(`Error deactivating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reactivateUser = async (userId, username) => {
    try {
      setLoading(true);

      const {
        data,
        error
      } = await supabase
        .rpc('admin_reactivate_user', {
          target_user_id: userId
        });

      if (error) throw error;

      await fetchUsers();
      await logUserEvent('user_reactivated', 'admin', {
        target_user_id: userId,
        target_username: username
      });

      alert(`User "${username}" has been reactivated successfully.`);
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert(`Error reactivating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(userData => {
    const matchesSearch = userData.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userData.full_name && userData.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && userData.is_active) ||
      (filterStatus === 'inactive' && !userData.is_active) ||
      (filterStatus === 'admin' && userData.is_admin);
    return matchesSearch && matchesStatus;
  });

  const adminTabs = [{
      id: 'users',
      label: 'Users',
      icon: User
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: Target
    }
  ];

  return ( <
      div className = "space-y-6" >
      <
      div className = "bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-xl p-6" >
      <
      h2 className = "text-2xl font-bold mb-2" > 👑Admin Panel < /h2> <
      p className = "opacity-90" > Comprehensive system management and monitoring < /p> < /
      div >

      {
        /* User Management */
      } <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700" >
      <
      div className = "flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center mb-6" >
      <
      h3 className = "font-semibold text-gray-800 dark:text-white" > 👥User Management < /h3>

      {
        /* Search and Filter Controls */
      } <
      div className = "flex flex-col sm:flex-row gap-2" >
      <
      div className = "relative" >
      <
      Search className = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      size = {
        16
      }
      /> <
      input type = "text"
      placeholder = "Search users..."
      value = {
        searchTerm
      }
      onChange = {
        (e) => setSearchTerm(e.target.value)
      }
      className = "pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /
      >
      {
        searchTerm && ( <
          button onClick = {
            () => setSearchTerm('')
          }
          className = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" >
          <
          X size = {
            16
          }
          /> < /
          button >
        )
      } <
      /div>

      <
      div className = "relative" >
      <
      Filter className = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      size = {
        16
      }
      /> <
      select value = {
        filterStatus
      }
      onChange = {
        (e) => setFilterStatus(e.target.value)
      }
      className = "pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none" >
      <
      option value = "all" > All Users < /option> <
      option value = "active" > Active < /option> <
      option value = "inactive" > Deactivated < /option> <
      option value = "admin" > Admins < /option> < /
      select > <
      /div>

      <
      button onClick = {
        () => {
          fetchUsers();
          logUserEvent('users_list_refreshed', 'admin');
        }
      }
      disabled = {
        loading
      }
      className = "bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm whitespace-nowrap" > {
        loading ? 'Loading...' : 'Refresh'
      } <
      /button> < /
      div > <
      /div> {
      /* Mobile-Responsive User List */
    } <
    div className = "space-y-4 sm:space-y-0" > {
      /* Desktop Table View */
    } <
    div className = "hidden lg:block overflow-x-auto" >
    <
    table className = "w-full border-collapse" >
    <
    thead >
    <
    tr className = "bg-gray-50 dark:bg-gray-700" >
    <
    th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Name < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Username < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Status < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Last Login < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Cycles < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Role < /th> <
  th className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" > Actions < /th> < /
  tr > <
    /thead> <
  tbody > {
      filteredUsers.map((userData) => ( <
        tr key = {
          userData.id
        }
        className = {
          `hover:bg-gray-50 dark:hover:bg-gray-700 ${!userData.is_active ? 'bg-red-50 dark:bg-red-900/20' : ''}`
        } >
        <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white" > {
          userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'
        } <
        /td> <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white" > {
          userData.username
        } < /td> <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2" >
        <
        span className = {
          `px-2 py-1 rounded text-xs font-medium ${
                        userData.is_active 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`
        } > {
          userData.is_active ? 'Active' : 'Deactivated'
        } <
        /span> < /
        td > <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white" > {
          userData.last_login_at ? new Date(userData.last_login_at).toLocaleDateString() : 'Never'
        } <
        /td> <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white" > {
          userData.cycle_count
        } < /td> <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2" >
        <
        span className = {
          `px-2 py-1 rounded text-xs font-medium ${
                        userData.is_admin 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`
        } > {
          userData.is_admin ? 'Admin' : 'User'
        } <
        /span> < /
        td > <
        td className = "border border-gray-300 dark:border-gray-600 px-3 py-2" >
        <
        div className = "flex space-x-1 flex-wrap" >
        <
        button onClick = {
          () => toggleUserAdmin(userData.id, userData.is_admin)
        }
        disabled = {
          userData.id === user.id || loading
        }
        className = "bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed" > {
          userData.is_admin ? 'Remove Admin' : 'Make Admin'
        } <
        /button>

        {
          userData.is_active && ( <
            button onClick = {
              () => resetUserPassword(userData.id, userData.username)
            }
            disabled = {
              loading
            }
            className = "bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300" >
            Reset Password <
            /button>
          )
        }

        {
          userData.is_active ? ( <
            button onClick = {
              () => deactivateUser(userData.id, userData.username)
            }
            disabled = {
              userData.id === user.id || loading
            }
            className = "bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 disabled:bg-gray-300 flex items-center space-x-1" >
            <
            UserX size = {
              12
            }
            /> <
            span className = "hidden sm:inline" > Deactivate < /span> < /
            button >
          ) : ( <
            button onClick = {
              () => reactivateUser(userData.id, userData.username)
            }
            disabled = {
              loading
            }
            className = "bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-300 flex items-center space-x-1" >
            <
            UserCheck size = {
              12
            }
            /> <
            span className = "hidden sm:inline" > Reactivate < /span> < /
            button >
          )
        } <
        /div> < /
        td > <
        /tr>
      ))
    } <
    /tbody> < /
  table > <
    /div>

  {
    /* Mobile Card View */
  } <
  div className = "lg:hidden space-y-4" > {
      filteredUsers.map((userData) => ( <
        div key = {
          userData.id
        }
        className = {
          `border rounded-lg p-4 ${!userData.is_active ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`
        } >
        <
        div className = "flex justify-between items-start mb-3" >
        <
        div >
        <
        h4 className = "font-medium text-gray-900 dark:text-white" > {
          userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username
        } <
        /h4> <
        p className = "text-sm text-gray-600 dark:text-gray-400" > @ {
          userData.username
        } < /p> < /
        div > <
        div className = "flex space-x-2" >
        <
        span className = {
          `px-2 py-1 rounded text-xs font-medium ${
                      userData.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`
        } > {
          userData.is_active ? 'Active' : 'Deactivated'
        } <
        /span> <
        span className = {
          `px-2 py-1 rounded text-xs font-medium ${
                      userData.is_admin 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`
        } > {
          userData.is_admin ? 'Admin' : 'User'
        } <
        /span> < /
        div > <
        /div>

        <
        div className = "grid grid-cols-2 gap-4 mb-3 text-sm" >
        <
        div >
        <
        span className = "text-gray-600 dark:text-gray-400" > Last Login: < /span> <
        p className = "text-gray-900 dark:text-white" > {
          userData.last_login_at ? new Date(userData.last_login_at).toLocaleDateString() : 'Never'
        } < /p> < /
        div > <
        div >
        <
        span className = "text-gray-600 dark:text-gray-400" > Cycles: < /span> <
        p className = "text-gray-900 dark:text-white" > {
          userData.cycle_count
        } < /p> < /
        div > <
        /div>

        <
        div className = "flex flex-wrap gap-2" >
        <
        button onClick = {
          () => toggleUserAdmin(userData.id, userData.is_admin)
        }
        disabled = {
          userData.id === user.id || loading
        }
        className = "bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed" > {
          userData.is_admin ? 'Remove Admin' : 'Make Admin'
        } <
        /button>

        {
          userData.is_active && ( <
            button onClick = {
              () => resetUserPassword(userData.id, userData.username)
            }
            disabled = {
              loading
            }
            className = "bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300" >
            Reset Password <
            /button>
          )
        }

        {
          userData.is_active ? ( <
            button onClick = {
              () => deactivateUser(userData.id, userData.username)
            }
            disabled = {
              userData.id === user.id || loading
            }
            className = "bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600 disabled:bg-gray-300 flex items-center space-x-1" >
            <
            UserX size = {
              12
            }
            /> <
            span > Deactivate < /span> < /
            button >
          ) : ( <
            button onClick = {
              () => reactivateUser(userData.id, userData.username)
            }
            disabled = {
              loading
            }
            className = "bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-300 flex items-center space-x-1" >
            <
            UserCheck size = {
              12
            }
            /> <
            span > Reactivate < /span> < /
            button >
          )
        } <
        /div> < /
        div >
      ))
    } <
    /div> < /
  div >

    {
      filteredUsers.length === 0 && !loading && ( <
        div className = "text-center py-8 text-gray-500 dark:text-gray-400" > {
          searchTerm || filterStatus !== 'all' ?
          'No users match your search criteria.' : 'No users found. Try refreshing the data.'
        } <
        /div>
      )
    } <
    /div>

  {
    /* Password Reset Modal */
  } {
    showPasswordModal && ( <
      div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" >
      <
      div className = "bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4" >
      <
      h3 className = "text-lg font-semibold text-gray-800 dark:text-white mb-4" > 🔐Password Reset Successful < /h3>

      <
      div className = "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4" >
      <
      p className = "text-sm text-yellow-800 dark:text-yellow-200 mb-2" >
      <
      strong > User: < /strong> {selectedUser?.username} < /
      p > <
      p className = "text-sm text-yellow-800 dark:text-yellow-200 mb-2" >
      <
      strong > Temporary Password: < /strong> < /
      p > <
      div className = "bg-white dark:bg-gray-700 border rounded p-2 font-mono text-sm break-all text-gray-900 dark:text-white" > {
        tempPassword
      } <
      /div> < /
      div >

      <
      div className = "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4" >
      <
      p className = "text-sm text-red-800 dark:text-red-200" >
      <
      strong > ⚠️Important: < /strong> Share this password securely with the user. 
      They will be required to change it on their next login. <
      /p> < /
      div >

      <
      div className = "flex space-x-3" >
      <
      button onClick = {
        () => {
          navigator.clipboard.writeText(tempPassword);
          alert('Password copied to clipboard!');
          logUserEvent('temp_password_copied', 'admin', {
            target_user_id: selectedUser?.id
          });
        }
      }
      className = "flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600" > 📋Copy Password <
      /button> <
      button onClick = {
        () => {
          setShowPasswordModal(false);
          setTempPassword('');
          setSelectedUser(null);
          logUserEvent('password_reset_modal_closed', 'admin');
        }
      }
      className = "flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600" >
      Close <
      /button> < /
      div > <
      /div> < /
      div >
    )
  } <
  /div>
);
};

export default App;
