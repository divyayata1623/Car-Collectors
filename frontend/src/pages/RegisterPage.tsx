import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import type { RegisterRequest } from '../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = async (data: RegisterRequest & { confirmPassword: string }) => {
    setIsLoading(true);
    setError('');
    try {
      // Register
      await authAPI.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        mobile: data.mobile,
      });

      // Auto-login after registration
      const loginResponse = await authAPI.login({
        email: data.email,
        password: data.password,
      });

      login(loginResponse.data.user, loginResponse.data.access_token);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">
            <span className="text-blue-400">CAR</span>
            <span className="text-orange-500"> COLLECTORS</span>
          </h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Registration Form */}
        <div className="bg-navy-800 border border-blue-600/20 rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                {...register('full_name', { required: 'Full name is required' })}
                className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile (Optional) */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Mobile (Optional)
              </label>
              <input
                type="tel"
                {...register('mobile')}
                className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="+91 1234567890"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                className="w-full bg-navy-900 border border-blue-600/30 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
