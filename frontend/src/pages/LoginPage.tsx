import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Building2, GraduationCap, Trophy, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import { api } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login, demoAccounts } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register Modal
  const [showRegister, setShowRegister] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('SCHOOL');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.register({
        organizationName: orgName,
        organizationType: orgType,
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
      });
      await login(regEmail, regPassword);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
        
        {/* Left Info Panel */}
        <div className="lg:col-span-5 p-8 bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-900 border-r border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Talent<span className="text-indigo-400">OS</span>
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-white leading-snug">
                Human Potential Intelligence Platform
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Do not rely on universal rankings. Understand individuals through their longitudinal records, verified competencies, and growth momentum — then identify the right person for the right opportunity.
              </p>

              <div className="pt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>Works for Schools & Universities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Works for Tech Companies & Startups</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Works for Sports Academies & Teams</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-500 border-t border-slate-800/80">
            Generic Parent $\rightarrow$ Child Hierarchy Engine with Explainable AI Recommendations.
          </div>
        </div>

        {/* Right Form & 1-Click Login Panel */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-6">
          
          <div>
            <h3 className="text-lg font-bold text-white">Sign In to TalentOS</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a pre-seeded persona or enter your credentials
            </p>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* 1-Click Persona Quick Cards */}
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                1-Click Interactive Demo Personas:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.slice(0, 4).map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                      login(acc.email, acc.password);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                        {acc.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {acc.title} • {acc.orgName}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or use email</span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="e.g. principal@apex.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Need a new organization?</span>
            <button
              onClick={() => setShowRegister(true)}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Create Organization →
            </button>
          </div>
        </div>
      </div>

      {/* Register Organization Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Organization Hub</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Horizon Sports Academy"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Organization Type</label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College / University</option>
                  <option value="COMPANY">Company / Enterprise</option>
                  <option value="STARTUP">Startup</option>
                  <option value="SPORTS_ACADEMY">Sports Academy</option>
                  <option value="CLUB">Specialized Club / Team</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Head First Name</label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Head Last Name</label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Admin Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Register Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
