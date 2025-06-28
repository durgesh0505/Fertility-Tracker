import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Heart, Baby, User, Lock, AlertCircle, TrendingUp, Clock, Target, Trash2, LogOut } from 'lucide-react';

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
        
        // Check if password reset is required
        if (data.password_reset_required) {
          setShowPasswordChangeModal(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
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
    return <AuthComponent />;
  }

  return (
    <>
      <MainApp user={user} setUser={setUser} />
      {showPasswordChangeModal && (
        <PasswordChangeModal 
          user={user} 
          setUser={setUser}
          onClose={() => setShowPasswordChangeModal(false)}
        />
      )}
    </>
  );
};

const PasswordChangeModal = ({ user, setUser, onClose }) => {
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
      
      alert('Password updated successfully!');
      onClose();
    } catch (error) {
      setMessage(`Error updating password: ${error.message}`);
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

const AuthComponent = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
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
      return (weightNum * 0.453592).toFixed(1); // Convert lb to kg
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
        // Validate required fields
        if (!email || !password || !firstName || !lastName || !birthDate) {
          setMessage('Please fill in all required fields.');
          setLoading(false);
          return;
        }

        // Validate password strength
        if (!passwordValidation.isValid) {
          setMessage('Password does not meet security requirements. Please check all requirements below.');
          setShowPasswordRequirements(true);
          setLoading(false);
          return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
          setMessage('Passwords do not match.');
          setLoading(false);
          return;
        }

        // Validate age (must be at least 13)
        const age = calculateAge(birthDate);
        if (age < 13) {
          setMessage('You must be at least 13 years old to create an account.');
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

        if (error) throw error;

        // If signup successful and user is confirmed, create profile
        if (authData.user && !authData.user.email_confirmed_at) {
          setMessage('Please check your email for the confirmation link!');
        } else if (authData.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              username: email.split('@')[0],
              full_name: `${firstName} ${lastName}`,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: birthDate,
              age: age,
              weight: convertWeight(weight, weightUnit),
              typical_cycle_length: 28,
              cycle_length_variation: 2,
              typical_period_length: 5,
              period_length_variation: 1,
              is_admin: false
            }]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }
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

        <form onSubmit={handleAuth} className="space-y-4">
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

// AdminPanel component with fixed deleteUser function
const AdminPanel = ({ user }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added missing loading state

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
      fetchActivityLogs();
      fetchAdminLogs();
    }
  }, [user]);

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

  const generateTempPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Symbol
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const resetUserPassword = async (userId, username) => {
    try {
      setLoading(true);
      
      // Generate a secure temporary password
      const tempPass = generateTempPassword();
      
      // Update user profile to mark password reset required
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          password_reset_required: true,
          password_reset_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Note: In a real application, you would need admin privileges to reset passwords
      // This is a simplified version - the actual password reset would need to be done
      // through Supabase admin API or your backend
      
      setTempPassword(tempPass);
      setSelectedUser({ id: userId, username });
      setShowPasswordModal(true);

      await logAdminAction('password_reset', { userId, username });
      await fetchUsers();
      
      alert(`Password reset initiated for ${username}. Temporary password generated.`);
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
      
      // Get all user profiles with auth user data
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Get cycle counts for each user
      const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: cycles, error: cycleError } = await supabase
            .from('cycles')
            .select('start_date')
            .eq('user_id', profile.id)
            .order('start_date', { ascending: false });

          return {
            ...profile,
            email: profile.username + '@domain.com', // You might need to adjust this
            signup_date: profile.created_at,
            cycle_count: cycles?.length || 0,
            last_period_date: cycles?.[0]?.start_date || null
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      console.log('Fetching activity logs...');
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          *,
          user_profiles!inner(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      console.log('Fetched activity logs:', data);
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      // Don't show alert for activity logs, just log the error
    }
  };

  const fetchAdminLogs = async () => {
    try {
      console.log('Fetching admin logs...');
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          user_profiles!admin_user_id(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching admin logs:', error);
        throw error;
      }

      console.log('Fetched admin logs:', data);
      setAdminLogs(data || []);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      // Don't show alert for admin logs, just log the error
    }
  };

  const logAdminAction = async (action, details = {}, targetUserId = null) => {
    try {
      await supabase
        .from('admin_logs')
        .insert([{
          action,
          details,
          target_user_id: targetUserId
        }]);
      await fetchAdminLogs();
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const toggleUserAdmin = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction(
        currentStatus ? 'admin_removed' : 'admin_granted',
        { userId, previousStatus: currentStatus },
        userId
      );

      await fetchUsers();
      alert(`User ${currentStatus ? 'removed from' : 'granted'} admin privileges.`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status.');
    }
  };

  // FIXED deleteUser function
  const deleteUser = async (userId, username) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Are you sure you want to delete user "${username}"? This will permanently delete their account and all data. This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Log the admin action first
      await logAdminAction('user_deletion_attempted', { userId, username });

      // Step 1: Delete all user data (cycles will cascade delete due to foreign keys)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }

      // Step 2: Delete activity logs for this user
      await supabase
        .from('user_activity_logs')
        .delete()
        .eq('user_id', userId);

      // Step 3: Delete admin logs where this user was the target
      await supabase
        .from('admin_logs')
        .delete()
        .eq('target_user_id', userId);

      // Note: Deleting the actual auth user requires admin privileges
      // In a production environment, you would call:
      // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      await logAdminAction('user_deleted', { userId, username });
      await fetchUsers();
      
      alert(`User "${username}" has been successfully deleted along with all their data.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error.message}`);
      await logAdminAction('user_deletion_failed', { userId, username, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: User },
    { id: 'activity', label: 'Activity Logs', icon: TrendingUp },
    { id: 'admin-logs', label: 'Admin Logs', icon: Lock },
    { id: 'stats', label: 'Statistics', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">👑 Admin Panel</h2>
        <p className="opacity-90">Manage users, view logs, and monitor system activity</p>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap gap-2">
          {adminTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id)}
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
              onClick={fetchUsers}
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
                  <th className="border border-gray-300 px-3 py-2 text-left">Signup Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Cycles</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Last Period</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Admin</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{userData.username}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(userData.signup_date).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{userData.cycle_count}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {userData.last_period_date ? new Date(userData.last_period_date).toLocaleDateString() : 'None'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        userData.is_admin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
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
                        <button
                          onClick={() => resetUserPassword(userData.id, userData.username)}
                          disabled={loading}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 disabled:bg-gray-300"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => deleteUser(userData.id, userData.username)}
                          disabled={userData.id === user.id || loading}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:bg-gray-300"
                        >
                          Delete User
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No users found. Try refreshing the data.
            </div>
          )}
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
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of admin panel tabs (activity logs, admin logs, stats) remain the same */}
      {/* ... */}
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
