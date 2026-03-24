import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import useStore from '../../../store/useStore';
import PasswordInput from '../../ui/PasswordInput';
import GoogleLoginButton from './GoogleLoginButton';
import { Upload, X } from 'lucide-react';

const SignIn = () => {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only allow PDF
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.signIn(form.email, form.password);
      localStorage.setItem('auth_token', data.token);
      setAuth(data.user, data.token);

      // Upload resume if provided
      if (resumeFile) {
        try {
          const formData = new FormData();
          formData.append('resume', resumeFile);
          await api.uploadResume(formData);
        } catch (resumeErr) {
          console.error('Resume upload failed:', resumeErr);
          // Don't block signin, just log the error
        }
      }

      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f172a] text-white">

      <main className="relative z-10 px-4 sm:px-6 pt-8 sm:pt-12 pb-12">
        <div className="max-w-md mx-auto">
          <div className="bg-[#0b1224]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Sign in to continue</h2>
            <p className="text-gray-400 mb-6 text-center">Enter your credentials to access your workspace.</p>
            
            {/* Google Login on Top */}
            <div className="mb-6">
              <GoogleLoginButton onError={(msg) => setError(msg)} />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-white/10 w-full" />
              <span className="text-xs text-gray-400 whitespace-nowrap">or sign in with email</span>
              <div className="h-px bg-white/10 w-full" />
            </div>

            {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@example.com"
                    className="w-full bg-[#0b1224] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Password</label>
                  <PasswordInput name="password" value={form.password} onChange={onChange} placeholder="Your password" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Keep your password secure.</span>
                  </div>
                </div>

                {/* Resume Upload - Optional */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <label className="text-sm text-gray-300 block mb-2">Resume <span className="text-gray-500">(Optional)</span></label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center justify-center gap-2 w-full bg-[#0b1224]/50 border border-dashed border-white/20 hover:border-indigo-500/50 rounded-xl px-4 py-3 cursor-pointer transition-colors"
                    >
                      <Upload size={18} className="text-indigo-400" />
                      <span className="text-sm text-gray-300">{resumeFile ? resumeFile.name : 'Upload PDF resume'}</span>
                    </label>
                  </div>
                  {resumeFile && (
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <X size={14} /> Remove file
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold py-3 rounded-xl mt-6"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
            <p className="text-sm text-gray-400 mt-4 text-center">
              New here? <Link to="/signup" className="text-indigo-400 hover:underline">Create an account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
