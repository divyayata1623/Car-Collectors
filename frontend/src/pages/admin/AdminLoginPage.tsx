import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const { user, access_token } = response.data;

      // Check if user is admin
      if (user.role !== 'ADMIN') {
        setError('Access denied. Admin credentials required.');
        setIsLoading(false);
        return;
      }

      login(user, access_token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,105,218,0.18),transparent_34rem)]" />
      <div className="max-w-md w-full">
        {/* Admin Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-[#F26A21]/40 bg-[#F26A21]/10 text-[#FF8A4B] px-4 py-2 rounded-full text-xs font-bold tracking-[0.18em] mb-5">
            <span className="h-2 w-2 rounded-full bg-[#F26A21]" />
            ADMIN ACCESS
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome back, Admin</h1>
          <p className="text-[#9AA7BB]">Sign in to manage your collection</p>
        </div>

        {/* Login Card */}
        <div className="relative bg-[#101827] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-400/40 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[#C3CBD8] text-sm font-semibold mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#080D16] border border-white/10 focus:border-[#4F86F7] rounded-lg px-4 py-3 text-white focus:outline-none transition-all"
                placeholder="admin@carcollectors.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#C3CBD8] text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#080D16] border border-white/10 focus:border-[#4F86F7] rounded-lg px-4 py-3 text-white focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#F26A21] to-[#D94E0D] hover:from-[#FF7A31] hover:to-[#F26A21] disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-[#F26A21]/20 hover:shadow-[#F26A21]/40"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <p className="text-center text-[#68758A] text-xs mt-6 tracking-wide">
          Secure access for Car Collectors administrators
        </p>
      </div>
    </div>
  );
};
