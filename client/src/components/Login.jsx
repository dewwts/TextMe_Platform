import { useState } from 'react';
import Button from './Button';
import Toggle from './Toggle';
import { useTheme } from '../contexts/ThemeContext';

function Login({ onLogin, onSwitchToRegister }) {
  const { isDark, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      await onLogin(formData.username, formData.password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900 min-h-screen">
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-600 dark:bg-blue-700"></div>
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
        <div className="relative self-stretch px-4 py-16 overflow-hidden bg-blue-600 dark:bg-blue-700 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24">
          <div className="absolute bottom-0 right-0 translate-x-[25%] translate-y-[75%]">
            <div className="border-[8px] border-white rounded-full w-96 h-96 opacity-20 lg:opacity-100"></div>
          </div>

          <div className="relative flex flex-col justify-between h-full max-w-lg mx-auto lg:mr-auto lg:max-w-md">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h1 className="text-2xl font-bold text-white">Simple Chat</h1>
              </div>
              <h2 className="text-4xl font-semibold tracking-tighter text-white sm:text-5xl xl:text-6xl">Welcome back to our community</h2>
              <p className="mt-4 text-base font-normal leading-7 text-blue-300 lg:text-lg lg:mt-6 lg:leading-8">Connect with friends, share moments, and stay in touch with real-time messaging that keeps you close to the people who matter most.</p>
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
                <p className="text-xl font-normal text-white">"Simple Chat has transformed how our team communicates. The real-time features and intuitive interface make staying connected effortless."</p>
              </blockquote>
              <div className="flex items-center mt-6">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-lg">
                  SC
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-white">Sarah Chen</p>
                  <p className="text-sm font-normal text-gray-300">Product Manager, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-16 bg-white dark:bg-gray-900 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12 flex items-center">
          <div className="max-w-lg mx-auto xl:max-w-xl w-full">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">Sign in to your account</h2>
            <p className="mt-4 text-base font-normal leading-7 text-gray-600 dark:text-gray-400 lg:text-lg lg:mt-6 lg:leading-8">Welcome back! Please enter your details to continue.</p>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-12 space-y-6 sm:mt-16 lg:mt-20">
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
                      placeholder="Enter your username"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500"
                      required
                      autoFocus
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
                      placeholder="Enter your password"
                      className="block w-full px-4 py-4 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500"
                      required
                    />
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
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-sm font-normal text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
