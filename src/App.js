import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Heart, Baby, User, Lock, AlertCircle, TrendingUp, Clock, Target, Trash2, LogOut, UserX, UserCheck, Activity, Shield, Database, AlertTriangle } from 'lucide-react';

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const logSystemEvent = async (eventType, source, message, details = {}) => {
    try {
      await supabase.rpc('log_system_event', {
        event_type: eventType,
        event_source: source,
        event_message: message,
        event_details: details
      });
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  };

  const updateLoginStats = async (userId) => {
    try {
      // Update login count and last login time
      const { error } = await supabase
        .from('user_profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: supabase.raw('login_count + 1')
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update login stats:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        // Log initial app access
        logUserEvent('app_accessed', 'auth', {
          timestamp: new Date().toISOString(),
          session_id: session.access_token.substring(0, 10) + '...'
        });
        updateLoginStats(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session) {
        await fetchUserProfile(session.user.id);
        await logUserEvent('user_login', 'auth', {
          login_method: 'email',
          timestamp: new Date().toISOString()
        });
        await updateLoginStats(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        await logSystemEvent('info', 'auth', 'User signed out', {
          timestamp: new Date().toISOString()
        });
      } else if (event === 'TOKEN_REFRESHED') {
        await logUserEvent('session_refreshed', 'auth', {
          timestamp: new Date().toISOString()
        });
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
        await logSystemEvent('error', 'database', 'Failed to fetch user profile', {
          user_id: userId,
          error: error.message
        });
        return;
      }

      if (data) {
        // Check if user is deactivated
        if (!data.is_active) {
          await logUserEvent('deactivated_user_attempted_access', 'auth', {
            timestamp: new Date().toISOString()
          }, userId);
          alert('Your account has been deactivated. Please contact support.');
          await supabase.auth.signOut();
          return;
        }

        setUser(data);
        
        // Check if password reset is required
        if (data.password_reset_required) {
          setShowPasswordChangeModal(true);
          await logUserEvent('password_reset_modal_shown', 'auth', {
            reset_required_since: data.password_reset_at
          });
        }

        await logUserEvent('profile_loaded', 'profile', {
          has_cycles: data.typical_period_length !== 5,
          is_admin: data.is_admin
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await logSystemEvent('error', 'api', 'Profile fetch failed', {
        error: error.message,
        user_id: userId
      });
    }
  };

  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

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
    return <AuthComponent logUserEvent={logUserEvent} logSystemEvent={logSystemEvent} />;
  }

  return (
    <>
      <MainApp 
        user={user} 
        setUser={setUser} 
        logUserEvent={logUserEvent} 
        logSystemEvent={logSystemEvent} 
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

const PasswordChangeModal = ({ user, setUser, onClose, logUserEvent }) => {
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
      await logUserEvent('password_change_failed', 'auth', {
        reason: 'validation_failed',
        requirements_met: passwordValidation
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      await logUserEvent('password_change_failed', 'auth', {
        reason: 'passwords_dont_match'
      });
      return;
    }

    setLoading(true);
    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update user profile to remove password reset requirement
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          password_reset_required: false,
          password_reset_at: null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local user state
      setUser({ ...user, password_reset_required: false });
      
      await logUserEvent('password_changed_successfully', 'auth', {
        reset_completed_at: new Date().toISOString(),
        was_admin_reset: true
      });
      
      alert('Password updated successfully!');
      onClose();
    } catch (error) {
      setMessage(`Error updating password: ${error.message}`);
      await logUserEvent('password_change_error', 'auth', {
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔐 Password Change Required</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Your administrator has reset your password. Please create a new secure password to continue.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Password Requirements:</h4>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                <span>{passwordValidation.minLength ? '✅' : '❌'}</span>
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                <span>{passwordValidation.hasUppercase ? '✅' : '❌'}</span>
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                <span>{passwordValidation.hasLowercase ? '✅' : '❌'}</span>
                <span>At least 1 lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                <span>{passwordValidation.hasNumber ? '✅' : '❌'}</span>
                <span>At least 1 number (0-9)</span>
              </div>
              <div className={`flex items-center space-x-2 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-red-600'}`}>
                <span>{passwordValidation.hasSymbol ? '✅' : '❌'}</span>
                <span>At least 1 symbol (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          {message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={loading || !passwordValidation.isValid}
            className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-300"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

// UPDATED AUTH COMPONENT WITH LOGGING
const AuthComponent = ({ logUserEvent, logSystemEvent }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

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

  const convertWeight = (weight, unit) => {
    if (!weight) return null;
    const weightNum = parseFloat(weight);
    if (unit === 'lb') {
      return (weightNum * 0.453592).toFixed(1);
    }
    return weightNum;
  };

  const passwordValidation = validatePassword(password);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // Log signup attempt
        await logSystemEvent('info', 'auth', 'Signup attempt started', {
          email: email,
          has_weight: !!weight,
          weight_unit: weightUnit
        });

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !birthDate) {
          setMessage('Please fill in all required fields.');
          await logSystemEvent('warning', 'auth', 'Signup failed - missing required fields', {
            email: email,
            missing_fields: {
              email: !email,
              password: !password,
              firstName: !firstName,
              lastName: !lastName,
              birthDate: !birthDate
            }
          });
          setLoading(false);
          return;
        }

        // Validate password strength
        if (!passwordValidation.isValid) {
          setMessage('Password does not meet security requirements. Please check all requirements below.');
          setShowPasswordRequirements(true);
          await logSystemEvent('warning', 'auth', 'Signup failed - weak password', {
            email: email,
            password_requirements: passwordValidation
          });
          setLoading(false);
          return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
          setMessage('Passwords do not match.');
          await logSystemEvent('warning', 'auth', 'Signup failed - password mismatch', {
            email: email
          });
          setLoading(false);
          return;
        }

        // Validate age (must be at least 13)
        const age = calculateAge(birthDate);
        if (age < 13) {
          setMessage('You must be at least 13 years old to create an account.');
          await logSystemEvent('warning', 'auth', 'Signup failed - age restriction', {
            email: email,
            calculated_age: age
          });
          setLoading(false);
          return;
        }

        // Sign up with metadata
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
              weight: convertWeight(weight, weightUnit)
            }
          }
        });

        if (error) {
          await logSystemEvent('error', 'auth', 'Signup failed - auth error', {
            email: email,
            error: error.message
          });
          throw error;
        }

        // If signup successful
        if (authData.user && !authData.user.email_confirmed_at) {
          setMessage('Please check your email for the confirmation link!');
          await logSystemEvent('info', 'auth', 'Signup successful - email confirmation required', {
            user_id: authData.user.id,
            email: email
          });
        } else if (authData.user) {
          await logSystemEvent('info', 'auth', 'Signup successful - user confirmed', {
            user_id: authData.user.id,
            email: email
          });
        }
      } else {
        // Log signin attempt
        await logSystemEvent('info', 'auth', 'Signin attempt', {
          email: email
        });

        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          await logSystemEvent('warning', 'auth', 'Signin failed', {
            email: email,
            error: error.message
          });
          throw error;
        }

        await logSystemEvent('info', 'auth', 'Signin successful', {
          email: email
        });
      }
    } catch (error) {
      setMessage(error.message);
      await logSystemEvent('error', 'auth', 'Authentication error', {
        action: isSignUp ? 'signup' : 'signin',
        email: email,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <Heart className="mx-auto text-pink-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-800">Fertility Tracker</h1>
          <p className="text-gray-600">Your personal cycle companion</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* REORDERED FORM: Personal info first, then email/password */}
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
                {birthDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Age: {calculateAge(birthDate)} years
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Optional)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="1"
                  />
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
                {weight && (
                  <p className="text-sm text-gray-600 mt-1">
                    {weightUnit === 'lb' ? 
                      `≈ ${convertWeight(weight, weightUnit)} kg` : 
                      `≈ ${(parseFloat(weight) * 2.20462).toFixed(1)} lb`
                    }
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>
            </>
          )}

          {/* Email and Password Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {(showPasswordRequirements || password) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Password Requirements:</h4>
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{passwordValidation.minLength ? '✅' : '❌'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{passwordValidation.hasUppercase ? '✅' : '❌'}</span>
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{passwordValidation.hasLowercase ? '✅' : '❌'}</span>
                      <span>At least 1 lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{passwordValidation.hasNumber ? '✅' : '❌'}</span>
                      <span>At least 1 number (0-9)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{passwordValidation.hasSymbol ? '✅' : '❌'}</span>
                      <span>At least 1 symbol (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('error') || message.includes('Error') || message.includes('not match') || message.includes('requirements')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
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
                setShowPasswordRequirements(false);
              }}
              className="text-pink-600 hover:text-pink-800 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// UPDATED ADMIN PANEL WITH COMPREHENSIVE LOGGING VIEWS
const AdminPanel = ({ user, logUserEvent }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
      fetchActivityLogs();
      fetchAdminLogs();
      fetchSystemLogs();
      fetchAuditLogs();
      
      // Log admin panel access
      logUserEvent('admin_panel_accessed', 'admin', {
        timestamp: new Date().toISOString(),
        initial_tab: activeAdminTab
      });
    }
  }, [user]);

  const resetUserPassword = async (userId, username) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('admin_reset_user_password', { target_user_id: userId });

      if (error) throw error;

      setTempPassword(data);
      setSelectedUser({ id: userId, username });
      setShowPasswordModal(true);

      await fetchUsers();
      await logUserEvent('password_reset_completed', 'admin', {
        target_user_id: userId,
        target_username: username
      });
      
    } catch (error) {
      console.error('Error resetting password:', error);
      await logUserEvent('password_reset_failed', 'admin', {
        target_user_id: userId,
        target_username: username,
        error: error.message
      });
      alert(`Error resetting password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_admin_users');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          *,
          user_profiles!inner(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchAdminLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          user_profiles!admin_user_id(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAdminLogs(data || []);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSystemLogs(data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
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
      await logUserEvent('admin_status_change_failed', 'admin', {
        target_user_id: userId,
        error: error.message
      });
      alert('Error updating admin status.');
    }
  };

  const deactivateUser = async (userId, username) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Are you sure you want to deactivate user "${username}"? They will not be able to access their account until reactivated.`)) {
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('admin_deactivate_user', { target_user_id: userId });

      if (error) throw error;

      await fetchUsers();
      await logUserEvent('user_deactivated', 'admin', {
        target_user_id: userId,
        target_username: username
      });
      
      alert(`User "${username}" has been deactivated successfully.`);
    } catch (error) {
      console.error('Error deactivating user:', error);
      await logUserEvent('user_deactivation_failed', 'admin', {
        target_user_id: userId,
        target_username: username,
        error: error.message
      });
      alert(`Error deactivating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reactivateUser = async (userId, username) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('admin_reactivate_user', { target_user_id: userId });

      if (error) throw error;

      await fetchUsers();
      await logUserEvent('user_reactivated', 'admin', {
        target_user_id: userId,
        target_username: username
      });
      
      alert(`User "${username}" has been reactivated successfully.`);
    } catch (error) {
      console.error('Error reactivating user:', error);
      await logUserEvent('user_reactivation_failed', 'admin', {
        target_user_id: userId,
        target_username: username,
        error: error.message
      });
      alert(`Error reactivating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'info':
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'auth': return 'text-purple-700 bg-purple-100';
      case 'cycle': return 'text-pink-700 bg-pink-100';
      case 'profile': return 'text-green-700 bg-green-100';
      case 'admin': return 'text-red-700 bg-red-100';
      case 'security': return 'text-orange-700 bg-orange-100';
      case 'user_management': return 'text-indigo-700 bg-indigo-100';
      case 'system': return 'text-gray-700 bg-gray-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: User },
    { id: 'activity', label: 'User Activity', icon: Activity },
    { id: 'admin-logs', label: 'Admin Actions', icon: Shield },
    { id: 'system-logs', label: 'System Events', icon: Database },
    { id: 'audit', label: 'Data Audit', icon: AlertTriangle },
    { id: 'stats', label: 'Statistics', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">👑 Admin Panel</h2>
        <p className="opacity-90">Comprehensive system management and monitoring</p>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-2">
          {adminTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveAdminTab(tab.id);
                  logUserEvent('admin_tab_changed', 'admin', {
                    new_tab: tab.id,
                    tab_label: tab.label
                  });
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeAdminTab === tab.id
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">👥 User Management</h3>
            <button
              onClick={() => {
                fetchUsers();
                logUserEvent('users_list_refreshed', 'admin');
              }}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Username</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Last Login</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Login Count</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Cycles</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Admin</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id} className={`hover:bg-gray-50 ${!userData.is_active ? 'bg-red-50' : ''}`}>
                    <td className="border border-gray-300 px-3 py-2">
                      {userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{userData.username}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        userData.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {userData.last_login_at ? new Date(userData.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{userData.login_count || 0}</td>
                    <td className="border border-gray-300 px-3 py-2">{userData.cycle_count}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        userData.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userData.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex space-x-1 flex-wrap">
                        <button
                          onClick={() => toggleUserAdmin(userData.id, userData.is_admin)}
                          disabled={userData.id === user.id || loading}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          {userData.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        
                        {userData.is_active && (
                          <button
                            onClick={() => resetUserPassword(userData.id, userData.username)}
                            disabled={loading}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            Reset Password
                          </button>
                        )}
                        
                        {userData.is_active ? (
                          <button
                            onClick={() => deactivateUser(userData.id, userData.username)}
                            disabled={userData.id === user.id || loading}
                            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 disabled:bg-gray-300 flex items-center space-x-1"
                          >
                            <UserX size={12} />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateUser(userData.id, userData.username)}
                            disabled={loading}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-300 flex items-center space-x-1"
                          >
                            <UserCheck size={12} />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Activity Logs */}
      {activeAdminTab === 'activity' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">📊 User Activity Logs</h3>
            <button
              onClick={() => {
                fetchActivityLogs();
                logUserEvent('activity_logs_refreshed', 'admin');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {log.user_profiles?.username || 'Unknown User'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-700">{log.action}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="bg-gray-50 rounded p-2">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Action Logs */}
      {activeAdminTab === 'admin-logs' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">🔐 Admin Action Logs</h3>
            <button
              onClick={() => {
                fetchAdminLogs();
                logUserEvent('admin_logs_refreshed', 'admin');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {adminLogs.map((log) => (
              <div key={log.id} className={`border rounded-lg p-4 ${getSeverityColor(log.severity)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {log.user_profiles?.username || 'Unknown Admin'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <span className="text-sm opacity-75">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">{log.action}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="bg-white bg-opacity-50 rounded p-2">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Event Logs */}
      {activeAdminTab === 'system-logs' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">🖥️ System Event Logs</h3>
            <button
              onClick={() => {
                fetchSystemLogs();
                logUserEvent('system_logs_refreshed', 'admin');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {systemLogs.map((log) => (
              <div key={log.id} className={`border rounded-lg p-4 ${getSeverityColor(log.event_type)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.event_type)}`}>
                      {log.event_type}
                    </span>
                    <span className="text-sm font-medium">{log.source}</span>
                  </div>
                  <span className="text-sm opacity-75">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">{log.message}</span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="bg-white bg-opacity-50 rounded p-2">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Audit Logs */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">🔍 Data Audit Trail</h3>
            <button
              onClick={() => {
                fetchAuditLogs();
                logUserEvent('audit_logs_refreshed', 'admin');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{log.table_name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.operation === 'INSERT' ? 'bg-green-100 text-green-800' :
                      log.operation === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.operation}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.changed_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Record ID: <span className="font-mono">{log.record_id}</span>
                </div>
                {(log.old_values || log.new_values) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {log.old_values && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Old Values:</h5>
                        <div className="bg-red-50 rounded p-2">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {log.new_values && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">New Values:</h5>
                        <div className="bg-green-50 rounded p-2">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Statistics */}
      {activeAdminTab === 'stats' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">📈 Comprehensive System Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {users.filter(u => !u.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Deactivated Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.is_admin).length}
              </p>
              <p className="text-sm text-gray-600">Administrators</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Activity Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Users with cycles:</span>
                  <span className="font-medium">{users.filter(u => u.cycle_count > 0).length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Total cycles tracked:</span>
                  <span className="font-medium">{users.reduce((sum, u) => sum + (u.cycle_count || 0), 0)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Average cycles per user:</span>
                  <span className="font-medium">
                    {users.length > 0 ? 
                      (users.reduce((sum, u) => sum + (u.cycle_count || 0), 0) / users.length).toFixed(1) : 
                      '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Total user logins:</span>
                  <span className="font-medium">{users.reduce((sum, u) => sum + (u.login_count || 0), 0)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {users
                  .filter(u => u.last_login_at)
                  .sort((a, b) => new Date(b.last_login_at) - new Date(a.last_login_at))
                  .slice(0, 5)
                  .map((userData) => (
                    <div key={userData.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium text-sm">{userData.username}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          {new Date(userData.last_login_at).toLocaleDateString()}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${userData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Log Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm">User activity events:</span>
                  <span className="font-medium">{activityLogs.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm">Admin actions:</span>
                  <span className="font-medium">{adminLogs.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="text-sm">System events:</span>
                  <span className="font-medium">{systemLogs.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm">Data changes:</span>
                  <span className="font-medium">{auditLogs.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔐 Password Reset Successful</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>User:</strong> {selectedUser?.username}
              </p>
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Temporary Password:</strong>
              </p>
              <div className="bg-white border rounded p-2 font-mono text-sm break-all">
                {tempPassword}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Important:</strong> Share this password securely with the user. 
                They will be required to change it on their next login.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  alert('Password copied to clipboard!');
                  logUserEvent('temp_password_copied', 'admin', {
                    target_user_id: selectedUser?.id
                  });
                }}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                📋 Copy Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setTempPassword('');
                  setSelectedUser(null);
                  logUserEvent('password_reset_modal_closed', 'admin');
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
      {/* Statistics Tab with enhanced info */}
      {activeAdminTab === 'stats' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-4">📈 System Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {users.filter(u => !u.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Deactivated Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.is_admin).length}
              </p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">User Activity Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Users with cycles:</span>
                  <span className="font-medium">{users.filter(u => u.cycle_count > 0).length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Total cycles tracked:</span>
                  <span className="font-medium">{users.reduce((sum, u) => sum + (u.cycle_count || 0), 0)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Average cycles per user:</span>
                  <span className="font-medium">
                    {users.length > 0 ? 
                      (users.reduce((sum, u) => sum + (u.cycle_count || 0), 0) / users.length).toFixed(1) : 
                      '0'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Recent Signups</h4>
              <div className="space-y-2">
                {users.slice(0, 5).map((userData) => (
                  <div key={userData.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{userData.username}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {new Date(userData.signup_date).toLocaleDateString()}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${userData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity and Admin Logs tabs remain the same but will show deactivation logs */}
    </div>
  );
};

const MainApp = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCycles();
      logActivity('app_accessed', { timestamp: new Date().toISOString() });
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

  const logActivity = async (action, details = {}) => {
    try {
      await supabase
        .from('user_activity_logs')
        .insert([{
          action,
          details,
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleSignOut = async () => {
    await logActivity('user_logout');
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'periods', label: 'Period Tracker', icon: Calendar },
    { id: 'pregnancy', label: 'Pregnancy Planner', icon: Baby },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Add admin tab if user is admin
  if (user?.is_admin) {
    tabs.push({ id: 'admin', label: 'Admin Panel', icon: Lock });
  }

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
                <span className="text-gray-700">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User'}
                </span>
                {user?.is_admin && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">
                    👑 Admin
                  </span>
                )}
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
            {activeTab === 'periods' && <PeriodTracker user={user} cycles={cycles} setCycles={setCycles} fetchCycles={fetchCycles} logActivity={logActivity} />}
            {activeTab === 'pregnancy' && <PregnancyPlanner user={user} cycles={cycles} />}
            {activeTab === 'profile' && <Profile user={user} setUser={setUser} />}
            {activeTab === 'admin' && user?.is_admin && <AdminPanel user={user} />}
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
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}!
          </h2>
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
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}!
        </h2>
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

const PeriodTracker = ({ user, cycles, setCycles, fetchCycles, logActivity }) => {
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
    if (!newPeriod.startDate) {
      alert('Please enter a start date');
      return;
    }

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

      const cycleData = {
        user_id: user.id,
        start_date: newPeriod.startDate,
        end_date: endDate.toISOString().split('T')[0],
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

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      await fetchCycles();
      await logActivity('period_added', { start_date: newPeriod.startDate, flow: newPeriod.flow });
      
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
      setFormData(prev => ({ ...prev, age: calculatedAge }));
    }
  }, [formData.date_of_birth]);

  useEffect(() => {
    if (formData.first_name || formData.last_name) {
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      setFormData(prev => ({ ...prev, full_name: fullName }));
    }
  }, [formData.first_name, formData.last_name]);

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
      alert('Profile updated successfully!');
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
          <div className="flex space-x-2">
            {editMode && (
              <button
                onClick={() => {
                  setEditMode(false);
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
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : (editMode ? 'Save' : 'Edit')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              disabled={!editMode}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
              disabled={true}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              placeholder="Auto-calculated from birth date"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typical Period Length (days)
              <span className="text-xs text-gray-500 block">Auto-calculated from recent periods</span>
            </label>
            <input
              type="number"
              value={formData.typical_period_length}
              disabled={true}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              placeholder="Based on your recent period data"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Username: <span className="font-medium">{user?.username}</span></p>
          <p className="text-sm text-gray-600">Account created: <span className="font-medium">{new Date(user?.created_at).toLocaleDateString()}</span></p>
        </div>
      </div>
    </div>
  );
};

export default App;
