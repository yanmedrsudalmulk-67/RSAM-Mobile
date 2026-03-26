import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, CreditCard, MapPin, Phone, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FloatingInput } from './FloatingInput';

interface LoginProps {
  onLogin: (user: any) => void;
  assets: Record<string, string>;
}

export default function Login({ onLogin, assets }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'patient'>('patient');
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'otp'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    username: '' // For admin
  });

  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    otp: ''
  });

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    nama_pasien: '',
    nik: '',
    tanggal_lahir: '',
    alamat: '',
    no_hp: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = activeTab === 'admin' 
        ? { type: 'admin', username: loginForm.username, password: loginForm.password }
        : { type: 'patient', email: loginForm.email, password: loginForm.password };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneForm.phone.length < 10) {
      setError('Nomor HP tidak valid');
      return;
    }
    setLoading(true);
    setError('');
    // Mock sending OTP
    setTimeout(() => {
      setLoading(false);
      setLoginMethod('otp');
    }, 1500);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneForm.otp.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }
    setLoading(true);
    setError('');
    // Mock verify OTP
    setTimeout(() => {
      setLoading(false);
      onLogin({
        id: 2,
        nama: 'Pasien (OTP)',
        role: 'patient',
        email: 'pasien@example.com'
      });
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      setSuccess(`✅ ${data.message || 'Registrasi berhasil. Silakan login menggunakan akun Anda.'}`);
      setTimeout(() => {
        setView('login');
        setSuccess('');
        setLoginForm(prev => ({ ...prev, email: registerForm.email }));
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden relative h-[160px] bg-gradient-to-br from-emerald-900 to-emerald-500 text-white rounded-b-[32px] shadow-lg flex-shrink-0">
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay rounded-b-[32px]"
          style={{ backgroundImage: `url(${assets.login_bg || 'rsud-al-mulk.jpg'})` }}
        ></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-2">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-1 shadow-md mb-2 border-2 border-emerald-100/20">
              <img src={assets.logo_main || "/logo-1.jpg"} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-xl font-bold leading-tight text-white">
            UOBK RSUD AL-MULK
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-[10px] uppercase tracking-widest text-emerald-100 font-semibold">
            Kota Sukabumi
          </motion.p>
        </div>
      </div>

      {/* Desktop Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 overflow-hidden">
        <img 
          src={assets.login_bg || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"} 
          alt="Hospital Facility" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/40 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl border-4 border-emerald-100/20">
              <img src={assets.logo_main || "/logo-1.jpg"} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" />
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Selamat Datang di<br/>UOBK RSUD AL-MULK
            </h1>
            <p className="text-xl text-emerald-50 max-w-lg leading-relaxed">
              Sistem Portal Pelayanan Pasien untuk pendaftaran kunjungan dan layanan medis secara online. Pelayanan kesehatan profesional dan terpercaya untuk masyarakat.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-16 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white p-6 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 w-full"
              >
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Login ke Akun Anda</h2>
                  <p className="text-slate-500 text-sm">Silakan pilih tipe login dan masukkan kredensial Anda.</p>
                </div>

                {/* Login Tabs */}
                <div className="relative flex p-1 bg-slate-100/80 rounded-xl mb-6">
                  <motion.div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                    animate={{ left: activeTab === 'patient' ? '4px' : 'calc(50%)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <button
                    onClick={() => { setActiveTab('patient'); setLoginMethod('email'); setError(''); }}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      activeTab === 'patient' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pasien
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin'); setLoginMethod('email'); setError(''); }}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      activeTab === 'admin' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100 flex items-center">
                    {success}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {loginMethod === 'email' ? (
                    <motion.form 
                      key="email-form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleLogin} 
                      className="space-y-4"
                    >
                      {activeTab === 'admin' ? (
                        <FloatingInput
                          label="Username"
                          type="text"
                          required
                          icon={<User size={20} />}
                          value={loginForm.username}
                          onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                          validationFn={(val) => val.length >= 3}
                          errorMessage="Username minimal 3 karakter"
                        />
                      ) : (
                        <FloatingInput
                          label="Email"
                          type="email"
                          required
                          icon={<Mail size={20} />}
                          value={loginForm.email}
                          onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                          validationFn={(val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)}
                          errorMessage="Format email tidak valid"
                        />
                      )}

                      <div className="relative">
                        <FloatingInput
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          icon={<Lock size={20} />}
                          value={loginForm.password}
                          onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                          validationFn={(val) => val.length >= 6}
                          errorMessage="Password minimal 6 karakter"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 z-10 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {activeTab === 'patient' && (
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-4 h-4">
                              <input type="checkbox" className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded-sm checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer" />
                              <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                            </div>
                            <span className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember Me</span>
                          </label>
                          <a href="#" className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Lupa Password?</a>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-[16px] font-bold shadow-md hover:shadow-lg transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? 'Memproses...' : 'Masuk ke Akun'}
                          {!loading && <ArrowRight size={18} />}
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-active:scale-100 rounded-[16px] transition-transform duration-300 origin-center opacity-0 group-active:opacity-100"></div>
                      </button>

                      {activeTab === 'patient' && (
                        <div className="pt-3 text-center">
                          <div className="relative flex items-center py-2 mb-2">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold">ATAU</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setLoginMethod('phone')} 
                            className="w-full py-3 rounded-[16px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <Phone size={18} />
                            Login dengan Nomor HP
                          </button>
                        </div>
                      )}
                    </motion.form>
                  ) : loginMethod === 'phone' ? (
                    <motion.form 
                      key="phone-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleSendOTP} 
                      className="space-y-4"
                    >
                      <FloatingInput
                        label="Nomor HP"
                        type="tel"
                        required
                        icon={<Phone size={20} />}
                        value={phoneForm.phone}
                        onChange={e => setPhoneForm({...phoneForm, phone: e.target.value.replace(/\D/g, '')})}
                        validationFn={(val) => val.length >= 10}
                        errorMessage="Nomor HP tidak valid"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-[16px] font-bold shadow-md hover:shadow-lg transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                          {!loading && <ArrowRight size={18} />}
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-active:scale-100 rounded-[16px] transition-transform duration-300 origin-center opacity-0 group-active:opacity-100"></div>
                      </button>
                      <div className="pt-4 text-center">
                        <button 
                          type="button" 
                          onClick={() => setLoginMethod('email')} 
                          className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          Kembali ke Login Email
                        </button>
                      </div>
                    </motion.form>
                  ) : loginMethod === 'otp' ? (
                    <motion.form 
                      key="otp-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleVerifyOTP} 
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <p className="text-sm text-slate-600">Kode OTP telah dikirim ke <br/><span className="font-bold text-slate-900">{phoneForm.phone}</span></p>
                      </div>
                      <FloatingInput
                        label="Kode OTP (6 Digit)"
                        type="text"
                        required
                        maxLength={6}
                        icon={<Lock size={20} />}
                        value={phoneForm.otp}
                        onChange={e => setPhoneForm({...phoneForm, otp: e.target.value.replace(/\D/g, '')})}
                        className="text-center tracking-widest text-lg font-bold"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-[16px] font-bold shadow-md hover:shadow-lg transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? 'Memverifikasi...' : 'Verifikasi & Login'}
                          {!loading && <CheckCircle2 size={18} />}
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-active:scale-100 rounded-[16px] transition-transform duration-300 origin-center opacity-0 group-active:opacity-100"></div>
                      </button>
                      <div className="pt-4 text-center">
                        <button 
                          type="button" 
                          onClick={() => setLoginMethod('phone')} 
                          className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          Ganti Nomor HP
                        </button>
                      </div>
                    </motion.form>
                  ) : null}
                </AnimatePresence>

                {activeTab === 'patient' && loginMethod === 'email' && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                      Belum memiliki akun?{' '}
                      <button 
                        onClick={() => { setView('register'); setError(''); }}
                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                      >
                        Daftar Akun Baru
                      </button>
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white p-6 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 w-full"
              >
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Daftar Akun Baru</h2>
                  <p className="text-slate-500 text-sm">Lengkapi data diri Anda untuk membuat akun pasien.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <FloatingInput
                    label="Nama Lengkap *"
                    type="text"
                    required
                    icon={<User size={18} />}
                    value={registerForm.nama_pasien}
                    onChange={e => setRegisterForm({...registerForm, nama_pasien: e.target.value})}
                    validationFn={(val) => val.length >= 3}
                    errorMessage="Nama minimal 3 karakter"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="NIK (16 Digit) *"
                      type="text"
                      required
                      maxLength={16}
                      icon={<CreditCard size={18} />}
                      value={registerForm.nik}
                      onChange={e => setRegisterForm({...registerForm, nik: e.target.value.replace(/\D/g, '')})}
                      validationFn={(val) => val.length === 16}
                      errorMessage="NIK harus 16 digit"
                    />
                    <FloatingInput
                      label="Tanggal Lahir *"
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={registerForm.tanggal_lahir}
                      onChange={e => setRegisterForm({...registerForm, tanggal_lahir: e.target.value})}
                      onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Tanggal lahir wajib diisi')}
                      onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
                    <textarea
                      required
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all"
                      value={registerForm.alamat}
                      onChange={e => setRegisterForm({...registerForm, alamat: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="No Telepon *"
                      type="tel"
                      required
                      icon={<Phone size={18} />}
                      value={registerForm.no_hp}
                      onChange={e => setRegisterForm({...registerForm, no_hp: e.target.value.replace(/\D/g, '')})}
                      validationFn={(val) => val.length >= 10}
                      errorMessage="No Telepon tidak valid"
                    />
                    <FloatingInput
                      label="Email *"
                      type="email"
                      required
                      icon={<Mail size={18} />}
                      value={registerForm.email}
                      onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                      validationFn={(val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)}
                      errorMessage="Format email salah"
                    />
                  </div>

                  <div className="relative">
                    <FloatingInput
                      label="Password *"
                      type={showPassword ? 'text' : 'password'}
                      required
                      icon={<Lock size={18} />}
                      value={registerForm.password}
                      onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                      validationFn={(val) => val.length >= 6}
                      errorMessage="Password minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 z-10 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-[16px] font-bold shadow-md hover:shadow-lg transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? 'Memproses...' : 'Daftar Akun'}
                      {!loading && <ArrowRight size={18} />}
                    </span>
                    <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-active:scale-100 rounded-[16px] transition-transform duration-300 origin-center opacity-0 group-active:opacity-100"></div>
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Sudah memiliki akun?{' '}
                    <button 
                      onClick={() => { setView('login'); setError(''); }}
                      className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                    >
                      Login di sini
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
