import { useState } from 'react';
import Button from './Button';
import Toggle from './Toggle';
import { useTheme } from '../contexts/ThemeContext';

function Register({ onRegister, onSwitchToLogin }) {
  const { isDark, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await onRegister(formData.username, formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900 min-h-screen">
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#e45b8f] dark:bg-[#d04a7e]"></div>
      </div>

      {/* Dark Mode Toggle - Fixed Position */}
      <div className="absolute top-6 right-6 z-50">
        <Toggle
          enabled={isDark}
          onChange={toggleTheme}
          label={isDark ? '🌙' : '☀️'}
          size="md"
        />
      </div>

      <div className="absolute top-0 left-0 -translate-x-[60%] -translate-y-[75%] z-10">
        <div className="border-[8px] border-white rounded-full w-80 h-80 opacity-20"></div>
      </div>

      <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-5 min-h-screen">
        <div className="relative self-stretch px-4 py-16 overflow-hidden bg-[#e45b8f] dark:bg-[#d04a7e] sm:px-6 lg:col-span-2 lg:px-8 lg:py-24">
          <div className="absolute bottom-0 right-0 translate-x-[25%] translate-y-[75%]">
            <div className="border-[8px] border-white rounded-full w-96 h-96 opacity-20 lg:opacity-100"></div>
          </div>

          <div className="relative flex flex-col justify-between h-full max-w-lg mx-auto lg:mr-auto lg:max-w-md">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h1 className="text-2xl font-bold text-white">CU TextMe</h1>
              </div>
              <h2 className="text-4xl font-semibold tracking-tighter text-white sm:text-5xl xl:text-6xl">Join our community</h2>
              <p className="mt-4 text-base font-normal leading-7 text-pink-300 lg:text-lg lg:mt-6 lg:leading-8">Start connecting with friends and colleagues. Experience seamless communication with our intuitive messaging platform.</p>
            </div>

            <div className="mt-12 lg:mt-0">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-8">
                <p className="text-xl font-normal text-white">"สมัครเข้าใช้ website ของเรา ใช้งานง่ายมาก ๆ ลองเข้ามาใช้กันเยอะ ๆ นะครับผม เราตั้งใจทำมากเลยนะครับ :)"</p>
              </blockquote>
              <div className="flex items-center mt-6">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-lg">
                  TS
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-white">Tinnapt S.</p>
                  <p className="text-sm font-normal text-gray-300">คนที่ขี้เกียจเรียนที่สุด</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-16 bg-white dark:bg-gray-900 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12 flex items-center">
          <div className="max-w-lg mx-auto xl:max-w-xl w-full">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">สร้างบัญชีผู้ใช้</h2>
            <p className="mt-4 text-base font-normal leading-7 text-gray-600 dark:text-gray-400 lg:text-lg lg:mt-6 lg:leading-8">Get started with Simple Chat today. It only takes a minute to sign up.</p>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-12 space-y-12 sm:mt-16 lg:mt-20">
              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="text-base font-medium text-gray-900 dark:text-white">Username</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#e45b8f] dark:focus:border-[#e45b8f] focus:ring-1 focus:ring-[#e45b8f] dark:focus:ring-[#e45b8f]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-white">Email address</label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#e45b8f] dark:focus:border-[#e45b8f] focus:ring-1 focus:ring-[#e45b8f] dark:focus:ring-[#e45b8f]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-base font-medium text-gray-900 dark:text-white">Password</label>
                  <div className="mt-2">
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#e45b8f] dark:focus:border-[#e45b8f] focus:ring-1 focus:ring-[#e45b8f] dark:focus:ring-[#e45b8f]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="text-base font-medium text-gray-900 dark:text-white">Confirm Password</label>
                  <div className="mt-2">
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-[#e45b8f] dark:focus:border-[#e45b8f] focus:ring-1 focus:ring-[#e45b8f] dark:focus:ring-[#e45b8f]"
                      required
                    />
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="terms"
                      id="terms"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 text-[#e45b8f] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e45b8f]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-sm font-normal text-gray-700">
                      I agree with the{' '}
                      <span className="text-[#e45b8f] hover:underline cursor-pointer">Terms & Conditions</span>
                      {' '}of Simple Chat
                    </label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                fullWidth
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </Button>
            </form>

            <p className="mt-6 text-sm font-normal text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-sm font-semibold text-[#e45b8f] dark:text-[#e45b8f] hover:underline">
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;
