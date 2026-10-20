/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, ArrowRight, AlertCircle, CheckCircle2, Lock, Sparkles, Building2 } from 'lucide-react';
import { api } from '../api';
import { UserAccount, OracleWmsUser } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('obaidullah.r');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step state: 'verify_username' | 'enter_password' | 'create_password'
  const [step, setStep] = useState<'verify_username' | 'enter_password' | 'create_password'>('enter_password');
  const [verifiedOracleUser, setVerifiedOracleUser] = useState<OracleWmsUser | null>(null);

  // Quick helper to fill demo profiles
  const fillProfile = (u: string, p: string, defaultStep: 'enter_password' | 'create_password' = 'enter_password') => {
    setUsername(u);
    setPassword(p);
    setConfirmPassword(p);
    setStep(defaultStep);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Step 1: Verify Username against Oracle WMS
  const handleVerifyUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your Oracle WMS username');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.verifyOracleUser(username.trim());
      setVerifiedOracleUser(res.oracleUser);

      if (res.hasAppPassword) {
        setStep('enter_password');
        setSuccessMessage(`Oracle WMS Verified: Welcome back, ${res.oracleUser.fullName}. Please enter your app password.`);
      } else {
        setStep('create_password');
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage(`Oracle WMS Verified: Welcome ${res.oracleUser.fullName}! You are verified to establish your app password.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification with Oracle WMS failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2A: Login with established password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Username and password are required');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      // If server responds that user needs to create password first
      if (err.message?.includes('create an app password first')) {
        setStep('create_password');
        setErrorMessage('User verified in Oracle WMS. Please create your app password below.');
      } else {
        setErrorMessage(err.message || 'Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2B: Create App Password for Oracle WMS verified user
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.registerPassword(username.trim(), password);
      setSuccessMessage('Password established successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to establish password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Brand Column (Starlinks Green aesthetic) */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle star pattern watermark */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-900 font-extrabold text-xl shadow-md">
                ★
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block">STARLINKS</span>
                <span className="text-[10px] tracking-wider text-emerald-200 font-semibold block uppercase">
                  Warehouse Pallet Flow
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight mb-2">
              Multi-Facility Inbound & Outbound Pallet Intelligence
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed mb-6">
              Unified enterprise pallet lifecycle tracking, real-time SOH analytics, and synchronized Oracle WMS identity governance.
            </p>

            <div className="space-y-3 text-xs text-emerald-100/90 border-t border-emerald-800/80 pt-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Oracle WMS API User Verification</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Company & Facility (FACO) Context</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Real-Time Stock On Hand & Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-800/60 text-[11px] text-emerald-300/80 flex items-center justify-between">
            <span>Powered by Starlinks Supply Chain</span>
            <span className="font-mono">v2.4 Enterprise</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Header indicator */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {step === 'verify_username' && 'Verify Oracle WMS User'}
                  {step === 'enter_password' && 'Warehouse Login'}
                  {step === 'create_password' && 'Create App Password'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step === 'verify_username' && 'Check username existence in Oracle WMS REST API directory'}
                  {step === 'enter_password' && 'Enter your password to access assigned facilities'}
                  {step === 'create_password' && 'You exist in Oracle WMS. Set your password to activate access.'}
                </p>
              </div>

              {/* Status pill */}
              <div className="text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Oracle WMS API</span>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Step: Verify Username */}
            {step === 'verify_username' && (
              <form onSubmit={handleVerifyUsername} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Oracle WMS Username
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. obaidullah.r or khalid.ops"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Must match an active user in Oracle WMS system.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying with Oracle WMS...' : 'Verify User in Oracle WMS'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step: Enter Password (Registered User) */}
            {step === 'enter_password' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Oracle WMS Username</label>
                    <button
                      type="button"
                      onClick={() => setStep('verify_username')}
                      className="text-[11px] text-emerald-800 font-semibold hover:underline"
                    >
                      Verify different user
                    </button>
                  </div>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Warehouse'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step: Create Password for newly verified Oracle user */}
            {step === 'create_password' && (
              <form onSubmit={handleCreatePassword} className="space-y-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    Oracle WMS Record Verified:
                  </div>
                  <div className="mt-1 text-slate-600 font-mono text-[11px]">
                    User: <strong>{username}</strong> {verifiedOracleUser && `(${verifiedOracleUser.fullName})`}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Create App Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm App Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Save Password & Enter App'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Quick Demo Role Switcher Strip */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Role Testing Profiles:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-left">
              <button
                type="button"
                onClick={() => fillProfile('obaidullah.r', 'password123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/50 text-left transition-colors text-xs"
              >
                <div className="font-semibold text-slate-900 truncate">Obaidullah R.</div>
                <div className="text-[10px] text-emerald-800 font-medium">Admin (Full)</div>
              </button>

              <button
                type="button"
                onClick={() => fillProfile('khalid.ops', 'password123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/50 text-left transition-colors text-xs"
              >
                <div className="font-semibold text-slate-900 truncate">Khalid Ops</div>
                <div className="text-[10px] text-slate-600 font-medium">Operations</div>
              </button>

              <button
                type="button"
                onClick={() => fillProfile('faisal.m', 'password123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/50 text-left transition-colors text-xs"
              >
                <div className="font-semibold text-slate-900 truncate">Faisal M.</div>
                <div className="text-[10px] text-slate-600 font-medium">Management</div>
              </button>

              <button
                type="button"
                onClick={() => fillProfile('inquiry.auditor', 'password123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/50 text-left transition-colors text-xs"
              >
                <div className="font-semibold text-slate-900 truncate">Tariq Auditor</div>
                <div className="text-[10px] text-slate-600 font-medium">Inquiry (View)</div>
              </button>
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => fillProfile('new.operator', '', 'create_password')}
                className="text-[11px] text-emerald-800 hover:underline font-semibold"
              >
                + Test New Oracle User (Nawaf Al-Zahrani password setup flow)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
