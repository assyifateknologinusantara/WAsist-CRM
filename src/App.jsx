import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, Users, UserPlus, PhoneForwarded, PieChart, 
  Settings, LogOut, CheckCircle, XCircle, Search, DollarSign, 
  TrendingUp, MessageCircle, AlertCircle, Calendar, Printer,
  Filter, Activity, Smartphone, Eye, ArrowRight, Shield, BarChart, HelpCircle
} from 'lucide-react';

// === FIREBASE SETUP (Canvas Standard & Production) ===
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAHeSx_MUD2odnqQIBl47pfPlcv0zhM46s",
  authDomain: "wasist-crm.firebaseapp.com",
  projectId: "wasist-crm",
  storageBucket: "wasist-crm.firebasestorage.app",
  messagingSenderId: "740215877992",
  appId: "1:740215877992:web:d4ff3cb6832a1278b6a6dd",
  measurementId: "G-BXBQJ5J304"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'wasist-app-v1';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', icon: Icon, disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300",
    danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300",
    outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-full transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function WAsistApp() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); 
  const [allUsers, setAllUsers] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  
  const [authView, setAuthView] = useState('login'); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [adminViewingUser, setAdminViewingUser] = useState(null);

  // Fitur Keamanan: Captcha Login State
  const [captcha, setCaptcha] = useState({ n1: 0, n2: 0 });

  // Fitur Keamanan: Konfirmasi Logout State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Fitur Grafik: Filter Admin Chart
  const [chartFilter, setChartFilter] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const currentUserData = adminViewingUser || appUser || {};
  const userLeads = useMemo(() => {
    if (!currentUserData.id) return [];
    return allLeads.filter(l => l.userId === currentUserData.id);
  }, [allLeads, currentUserData.id]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'wasist_users');
    const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'wasist_leads');

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    }, (err) => console.error(err));

    const unsubLeads = onSnapshot(leadsRef, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllLeads(leadsData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubLeads();
    };
  }, [firebaseUser]);

  // Generate Captcha on Login Mount
  useEffect(() => {
    if (authView === 'login') {
      setCaptcha({ n1: Math.floor(Math.random() * 10) + 1, n2: Math.floor(Math.random() * 10) + 1 });
    }
  }, [authView]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const niche = form.niche.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (allUsers.find(u => u.email === email)) {
      setErrorMsg('Email sudah terdaftar! Silakan login.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Memproses...";

    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const totalPayment = 249000 + uniqueCode;
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newUser = {
      name, email, password, niche, 
      status: 'pending', 
      paymentAmount: totalPayment,
      createdAt: Date.now(),
      role: 'user'
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wasist_users', newUserId), newUser);
      
      fetch("https://formsubmit.co/ajax/assyifateknologinusantara@gmail.com", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: `Pendaftar Baru WAsist: ${name}`,
          Nama_Lengkap: name,
          Email: email,
          Bidang_Usaha: niche,
          Total_Tagihan: `Rp ${totalPayment.toLocaleString('id-ID')}`,
          Pesan: "User baru mendaftar di sistem. Mohon cek mutasi rekening dan lakukan approval di Dashboard Admin jika dana sudah masuk."
        })
      }).catch(err => console.log("FormSubmit silent fail:", err));

      setAuthView('payment');
      setAppUser({ ...newUser, id: newUserId, pendingPayment: true });
    } catch (err) {
      setErrorMsg('Terjadi kesalahan sistem. Coba lagi.');
      submitBtn.disabled = false;
      submitBtn.innerText = "Buat Akun WAsist";
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const form = e.target;
    
    // Fitur Keamanan: Validasi Captcha
    const captchaInput = parseInt(form.captcha.value);
    if (captchaInput !== captcha.n1 + captcha.n2) {
      setErrorMsg('Jawaban keamanan (Captcha) salah!');
      setCaptcha({ n1: Math.floor(Math.random() * 10) + 1, n2: Math.floor(Math.random() * 10) + 1 });
      form.captcha.value = '';
      return;
    }

    const username = form.username.value;
    const password = form.password.value;

    if (username === 'Admin!' && password === '@CRM#Real#1!') {
      setAppUser({ role: 'admin', name: 'Super Admin' });
      setActiveTab('dashboard');
      return;
    }

    const user = allUsers.find(u => u.email === username && u.password === password);
    if (user) {
      if (user.status === 'pending') {
        setAuthView('payment');
        setAppUser({ ...user, pendingPayment: true });
      } else {
        setAppUser(user);
        setActiveTab('dashboard');
      }
    } else {
      setErrorMsg('Kredensial tidak valid atau salah password!');
      setCaptcha({ n1: Math.floor(Math.random() * 10) + 1, n2: Math.floor(Math.random() * 10) + 1 });
      form.captcha.value = '';
    }
  };

  // Triggered by "Logout" buttons
  const promptLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Triggered by "Ya, Keluar" in the modal
  const confirmLogout = () => {
    setAppUser(null);
    setAuthView('login');
    setAdminViewingUser(null);
    setActiveTab('dashboard');
    setIsLogoutModalOpen(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 text-blue-600"><Activity className="w-10 h-10 animate-spin" /></div>;

  if (!appUser || appUser.pendingPayment) {
    return (
      <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-xl shadow-blue-200">
              <Smartphone className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">WAsist <span className="text-blue-600">CRM</span></h1>
            <p className="text-slate-500 mt-2 font-medium">Personal Lead Reminder for WhatsApp</p>
          </div>

          <Card className="shadow-2xl shadow-slate-200/50 border-0 bg-white/80 backdrop-blur-xl animate-in zoom-in-95 duration-500">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email / Username Admin</label>
                  <input name="username" type="text" required className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input name="password" type="password" required className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="••••••••" />
                </div>
                
                {/* Fitur Keamanan: Captcha UI */}
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">Berapa {captcha.n1} + {captcha.n2}?</span>
                  </div>
                  <input name="captcha" type="number" required className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-black text-slate-700 shadow-sm transition-all" placeholder="Hasil" />
                </div>

                <Button type="submit" className="w-full py-3.5 text-base mt-2">Masuk ke Dashboard</Button>
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-500">
                    Belum punya akun? <button type="button" onClick={() => {setAuthView('register'); setErrorMsg('');}} className="text-blue-600 font-bold hover:text-blue-800 transition-colors">Daftar sekarang</button>
                  </p>
                </div>
              </form>
            )}

            {authView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <input name="name" type="text" required className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Aktif</label>
                  <input name="email" type="email" required className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input name="password" type="password" required className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bidang Usaha / Jasa (Niche)</label>
                  <input name="niche" type="text" required placeholder="Contoh: Properti, Web, dll" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <Button type="submit" className="w-full py-3.5 text-base mt-4">Buat Akun WAsist</Button>
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-500">
                    Sudah punya akun? <button type="button" onClick={() => {setAuthView('login'); setErrorMsg('');}} className="text-blue-600 font-bold hover:text-blue-800 transition-colors">Masuk</button>
                  </p>
                </div>
              </form>
            )}

            {authView === 'payment' && appUser?.pendingPayment && (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <DollarSign className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Selesaikan Pembayaran</h2>
                <p className="text-sm text-slate-600 px-4">Akun Anda berhasil dibuat namun membutuhkan aktivasi. Silahkan lakukan pembayaran sejumlah:</p>
                
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 my-6 shadow-inner">
                  <span className="block text-4xl font-black text-slate-900 tracking-tight">
                    Rp {appUser.paymentAmount?.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-rose-500 mt-2 block font-bold uppercase tracking-wider">*Transfer tepat hingga 3 digit terakhir</span>
                </div>

                <div className="text-left bg-blue-50/50 p-5 rounded-2xl text-sm text-slate-700 border border-blue-100">
                  <p className="font-bold mb-3 text-blue-900 flex items-center gap-2"><ArrowRight className="w-4 h-4"/> Transfer ke rekening berikut:</p>
                  <div className="mb-2 flex justify-between items-center bg-white p-3 rounded-xl border border-blue-50">
                    <span className="font-bold text-blue-800">BCA</span> 
                    <span className="font-mono font-medium text-lg tracking-wider">5745452563</span>
                  </div>
                  <div className="mb-2 flex justify-between items-center bg-white p-3 rounded-xl border border-blue-50">
                    <span className="font-bold text-emerald-800">BSI</span> 
                    <span className="font-mono font-medium text-lg tracking-wider">9897867570</span>
                  </div>
                  <p className="mt-3 text-center text-slate-500">a.n <strong className="text-slate-800">Hardi Hanto</strong></p>
                </div>

                <div className="pt-6">
                  <a href={`https://wa.me/6285117392045?text=Halo%20Admin,%20saya%20sudah%20transfer%20sebesar%20Rp%20${appUser.paymentAmount?.toLocaleString('id-ID')}%20untuk%20aktivasi%20WAsist%20atas%20nama%20akun%20Email:%20${appUser.email}`} target="_blank" rel="noreferrer">
                    <Button variant="success" className="w-full py-4 text-base font-bold shadow-emerald-300" icon={MessageCircle}>Konfirmasi via WhatsApp</Button>
                  </a>
                  <button onClick={() => { setAppUser(null); setAuthView('login'); }} className="text-sm font-semibold text-slate-500 mt-6 hover:text-slate-800 underline decoration-slate-300 underline-offset-4 transition-colors">Kembali ke Login</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // === TAMPILAN DASHBOARD ADMIN PENUH ===
  if (appUser.role === 'admin' && !adminViewingUser) {
    const approvedUsers = allUsers.filter(u => u.status === 'approved');
    const totalOmset = approvedUsers.reduce((sum, u) => sum + (u.paymentAmount || 249000), 0);
    const pendingUsers = allUsers.filter(u => u.status === 'pending');

    const approveUser = async (id) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wasist_users', id), { status: 'approved' });
    };

    // Fitur Grafik: Memproses Data Pendapatan (Chart Logic)
    const filteredChartUsers = useMemo(() => {
      let filtered = approvedUsers;
      const now = Date.now();
      if (chartFilter === '7d') filtered = approvedUsers.filter(u => now - (u.createdAt || now) <= 7 * 24 * 60 * 60 * 1000);
      else if (chartFilter === '30d') filtered = approvedUsers.filter(u => now - (u.createdAt || now) <= 30 * 24 * 60 * 60 * 1000);
      else if (chartFilter === 'custom' && customStart && customEnd) {
         const start = new Date(customStart).getTime();
         const end = new Date(customEnd).getTime() + 86400000; 
         filtered = approvedUsers.filter(u => (u.createdAt || now) >= start && (u.createdAt || now) <= end);
      }
      return filtered;
    }, [approvedUsers, chartFilter, customStart, customEnd]);

    const chartData = useMemo(() => {
      const rawGroups = {};
      filteredChartUsers.forEach(u => {
         const dObj = new Date(u.createdAt || Date.now());
         dObj.setHours(0,0,0,0);
         const ts = dObj.getTime();
         rawGroups[ts] = (rawGroups[ts] || 0) + (u.paymentAmount || 249000);
      });
      return Object.keys(rawGroups).sort().map(ts => ({
         label: new Date(Number(ts)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
         value: rawGroups[ts]
      }));
    }, [filteredChartUsers]);

    return (
      <div className="flex h-screen bg-slate-50">
        
        {/* Sidebar Desktop Admin */}
        <div className="w-64 bg-slate-900 text-white p-6 flex-col hidden md:flex shadow-2xl z-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-400/30">
              <Settings className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Superuser</p>
            </div>
          </div>
          <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-medium transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5"/> Overview
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-medium transition-all duration-300 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users className="w-5 h-5"/> Data Pengguna
              {pendingUsers.length > 0 && <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
            </button>
            <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-medium transition-all duration-300 ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <PieChart className="w-5 h-5"/> Laporan Omset
            </button>
          </nav>
          <button onClick={promptLogout} className="flex items-center gap-3 p-3.5 text-slate-400 hover:text-rose-400 mt-auto hover:bg-slate-800 rounded-xl transition-all font-medium">
            <LogOut className="w-5 h-5"/> Logout Sistem
          </button>
        </div>

        <div className="flex-1 overflow-auto relative pb-24 md:pb-0">
          
          {/* Mobile Header Top untuk Admin */}
          <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-400/30">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-black text-lg tracking-tight">Admin Panel</span>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {activeTab === 'dashboard' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">Dashboard Statistik</h2>
                  <p className="text-slate-500 text-sm md:text-base mt-1">Pantau performa penjualan dan pendaftar WAsist.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-xl shadow-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-blue-100 mb-1 font-medium text-sm">Total Omset Penjualan</p>
                        <h3 className="text-3xl font-black tracking-tight">Rp {totalOmset.toLocaleString('id-ID')}</h3>
                      </div>
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><TrendingUp className="w-6 h-6" /></div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-sm">Total Pengguna Aktif</p>
                        <h3 className="text-3xl font-black text-slate-800">{approvedUsers.length}</h3>
                      </div>
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-500 mb-1 font-medium text-sm">Menunggu Approval</p>
                        <h3 className="text-3xl font-black text-slate-800">{pendingUsers.length}</h3>
                      </div>
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
                    </div>
                  </Card>
                </div>

                {/* --- FITUR 1: GRAFIK PENDAPATAN ADMIN --- */}
                <Card className="mt-8 border-0 shadow-lg shadow-blue-100/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-600"/> Grafik Pendapatan</h3>
                      <p className="text-xs text-slate-500 mt-1">Tren omset penjualan WAsist Anda</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="text-sm border border-slate-200 font-medium text-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none py-2 px-3 bg-slate-50 transition-all">
                        <option value="7d">7 Hari Terakhir</option>
                        <option value="30d">30 Hari Terakhir</option>
                        <option value="all">Total Keseluruhan</option>
                        <option value="custom">Pilih Tanggal</option>
                      </select>
                      {chartFilter === 'custom' && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="text-sm border border-slate-200 rounded-lg py-2 px-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" />
                          <span className="text-slate-400 font-bold">-</span>
                          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="text-sm border border-slate-200 rounded-lg py-2 px-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-64 flex items-end gap-2 md:gap-4 border-b border-slate-100 pb-2 relative mt-4">
                    {chartData.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm pb-10">
                         <BarChart className="w-8 h-8 opacity-20 mb-2"/>
                         Tidak ada transaksi di rentang waktu ini.
                      </div>
                    ) : (
                      chartData.map((d, idx) => {
                        const maxVal = Math.max(...chartData.map(c => c.value), 1);
                        const heightPct = (d.value / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer">
                            <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg font-bold">
                              Rp {d.value.toLocaleString('id-ID')}
                            </div>
                            <div className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 group-hover:from-blue-500 group-hover:to-blue-300 shadow-sm relative overflow-hidden" style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30 rounded-t-md"></div>
                            </div>
                            <span className="text-[9px] md:text-xs text-slate-500 mt-3 truncate w-full text-center font-bold tracking-tight">{d.label}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </Card>

                {pendingUsers.length > 0 && (
                  <Card className="p-0 border-0 overflow-hidden shadow-lg shadow-rose-100/50 mt-8">
                    <div className="p-5 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
                       <h3 className="font-bold text-rose-900 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Perlu Approval Segera</h3>
                       <button onClick={() => setActiveTab('users')} className="text-sm font-bold text-rose-600 hover:text-rose-800 hover:underline">Kelola Semua</button>
                    </div>
                    <div className="divide-y divide-rose-100/50">
                      {pendingUsers.slice(0, 3).map(user => (
                        <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                          <div>
                            <p className="font-bold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email} • Tagihan: Rp {user.paymentAmount?.toLocaleString('id-ID')}</p>
                          </div>
                          <Button onClick={() => approveUser(user.id)} variant="success" className="px-3 py-1.5 text-xs w-full sm:w-auto">Approve Pendaftar</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === 'users' && (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Manajemen Pengguna</h2>
                    <p className="text-slate-500 text-sm md:text-base mt-1">Kelola akses, persetujuan, dan dashboard klien.</p>
                  </div>
                </div>

                <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-slate-200/40">
                  <div className="p-5 border-b border-slate-100 bg-white">
                    <h3 className="text-lg font-bold text-slate-800">Daftar Semua Pendaftar</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Nama / Email</th>
                          <th className="px-6 py-4">Bisnis (Niche)</th>
                          <th className="px-6 py-4">Tagihan</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {allUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-base">{user.name}</div>
                              <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{user.niche}</td>
                            <td className="px-6 py-4 font-mono font-medium text-slate-700 bg-slate-50/50">Rp {user.paymentAmount?.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 text-xs rounded-lg font-bold uppercase tracking-wider ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {user.status === 'approved' ? 'Aktif' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex justify-end gap-2">
                              {user.status === 'pending' && (
                                <Button onClick={() => approveUser(user.id)} variant="success" className="px-3 py-1.5 text-xs shadow-none">Approve</Button>
                              )}
                              <Button onClick={() => setAdminViewingUser(user)} variant="outline" className="px-3 py-1.5 text-xs bg-white shadow-none" icon={Eye}>Dashboard</Button>
                            </td>
                          </tr>
                        ))}
                        {allUsers.length === 0 && (
                          <tr><td colSpan="5" className="text-center py-10 text-slate-500 font-medium">Belum ada pengguna terdaftar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'reports' && (
              <>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Laporan Omset</h2>
                    <p className="text-slate-500 text-sm md:text-base mt-1">Rekapitulasi pembayaran dari seluruh pengguna aktif.</p>
                  </div>
                  <Button onClick={() => window.print()} variant="outline" icon={Printer} className="border-slate-300 font-bold">Cetak Laporan</Button>
                </div>

                <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-slate-200/40">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Rincian Pendapatan</h3>
                    <div className="text-right">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Diterima</p>
                       <p className="text-2xl font-black text-emerald-600">Rp {totalOmset.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 uppercase text-[11px] tracking-wider">Tanggal Daftar</th>
                          <th className="px-6 py-4 uppercase text-[11px] tracking-wider">Nama Pengguna</th>
                          <th className="px-6 py-4 uppercase text-[11px] tracking-wider">Status Pembayaran</th>
                          <th className="px-6 py-4 uppercase text-[11px] tracking-wider text-right">Nominal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {approvedUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-600">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{user.name}</div>
                              <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle className="w-4 h-4"/> Lunas</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800 text-right">
                              {user.paymentAmount?.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                        {approvedUsers.length === 0 && (
                          <tr><td colSpan="4" className="text-center py-10 text-slate-500 font-medium">Belum ada pendapatan terekam.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}

          </div>
        </div>

        {/* MOBILE BOTTOM NAVIGATION ADMIN (Tampil Hanya di HP) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white border-t border-slate-800 z-50 flex justify-around items-center p-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <button onClick={() => setActiveTab('dashboard')} className={`relative flex flex-col items-center justify-center w-full py-2 ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-500/20 scale-110' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-wide">Overview</span>
          </button>
          
          <button onClick={() => setActiveTab('users')} className={`relative flex flex-col items-center justify-center w-full py-2 ${activeTab === 'users' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-500/20 scale-110' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-wide">Pengguna</span>
            {pendingUsers.length > 0 && <span className="absolute top-1 right-5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>}
          </button>

          <button onClick={() => setActiveTab('reports')} className={`relative flex flex-col items-center justify-center w-full py-2 ${activeTab === 'reports' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-blue-500/20 scale-110' : ''}`}>
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-wide">Laporan</span>
          </button>

          <button onClick={promptLogout} className="relative flex flex-col items-center justify-center w-full py-2 text-slate-500 hover:text-rose-400 transition-colors">
            <div className="p-1.5 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-1 tracking-wide opacity-70">Logout</span>
          </button>
        </nav>

        {/* MODAL KONFIRMASI LOGOUT ADMIN */}
        <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-rose-100">
              <HelpCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Konfirmasi Keluar</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">Sesi Anda akan diakhiri. Apakah Anda yakin ingin keluar dari sistem?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)} className="font-bold border-slate-300">Batal Keluar</Button>
              <Button variant="danger" onClick={confirmLogout} icon={LogOut} className="font-bold">Ya, Keluarkan Saya</Button>
            </div>
          </div>
        </Modal>

      </div>
    );
  }

  const isViewMode = !!adminViewingUser;
  
  // Pipeline grouping calculations
  const pipeline = {
    'New': userLeads.filter(l => l.status === 'New'),
    'Follow Up': userLeads.filter(l => l.status === 'Follow Up'),
    'Negotiation': userLeads.filter(l => l.status === 'Negotiation'),
    'Closed Won': userLeads.filter(l => l.status === 'Closed Won'),
    'Closed Lost': userLeads.filter(l => l.status === 'Closed Lost')
  };

  const totalLeadsCount = userLeads.length;
  const wonCount = pipeline['Closed Won'].length;
  const conversionRate = totalLeadsCount ? Math.round((wonCount / totalLeadsCount) * 100) : 0;
  const totalCLV = pipeline['Closed Won'].reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const reminderLeads = userLeads.filter(l => l.status !== 'Closed Won' && l.status !== 'Closed Lost' && l.followUpDate === todayDateStr);

  const tabsMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Database', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Activity },
    { id: 'reminders', label: 'Reminder', icon: PhoneForwarded, badge: reminderLeads.length },
    { id: 'reports', label: 'Laporan', icon: PieChart }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar Desktop User */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-20 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-blue-200">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl leading-tight tracking-tight text-slate-900">WAsist</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">CRM System</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 mx-4 mt-6 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">{isViewMode ? 'Viewing Data:' : 'Welcome back,'}</p>
          <p className="font-black text-sm truncate text-slate-800">{currentUserData.name}</p>
          <p className="text-xs text-blue-600 font-bold truncate mt-0.5 bg-blue-50 inline-block px-2 py-0.5 rounded-md">{currentUserData.niche}</p>
        </div>

        <nav className="flex-1 p-4 mt-2 space-y-1">
          {tabsMenu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                activeTab === item.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm shadow-rose-200">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {isViewMode ? (
             <Button onClick={() => { setAdminViewingUser(null); setActiveTab('dashboard'); }} variant="outline" className="w-full text-xs font-bold border-slate-300">Kembali ke Admin</Button>
          ) : (
             <Button onClick={promptLogout} variant="ghost" className="w-full text-rose-600 hover:bg-rose-50 font-bold" icon={LogOut}>Logout Sistem</Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50/50 relative pb-24 md:pb-0">
        
        {/* Mobile Header Top */}
        <div className="md:hidden bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
               <Smartphone className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight">WAsist</span>
          </div>
          {isViewMode ? (
             <button onClick={() => { setAdminViewingUser(null); setActiveTab('dashboard'); }} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">Back Admin</button>
          ) : (
             <button onClick={promptLogout} className="text-slate-400 hover:text-rose-500 bg-slate-50 p-2 rounded-xl border border-slate-100"><LogOut className="w-5 h-5"/></button>
          )}
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header Action */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
              </h1>
              <p className="text-slate-500 text-sm md:text-base font-medium mt-1">
                {activeTab === 'dashboard' ? 'Pantau performa konversi leads Anda hari ini.' : 'Kelola dan organisir prospek Anda dengan mudah.'}
              </p>
            </div>
            {activeTab === 'leads' && !isViewMode && (
               <LeadFormModal appId={appId} userId={currentUserData.id} />
            )}
          </div>

          {}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Feature Cards Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-500">
                  <p className="text-slate-500 text-[11px] font-bold mb-1 uppercase tracking-widest">Total Leads</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">{totalLeadsCount}</h3>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500">
                  <p className="text-slate-500 text-[11px] font-bold mb-1 uppercase tracking-widest">Win Rate</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{conversionRate}%</h3>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold uppercase">{wonCount} Deal</span>
                  </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-amber-500">
                  <p className="text-slate-500 text-[11px] font-bold mb-1 uppercase tracking-widest">Follow Up</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">{pipeline['Follow Up'].length}</h3>
                </Card>
                <Card className="p-5 border-l-4 border-l-purple-500 md:col-span-1 col-span-2 bg-gradient-to-br from-white to-purple-50/50">
                  <p className="text-purple-600/80 text-[11px] font-bold mb-1 uppercase tracking-widest">Customer Value</p>
                  <h3 className="text-2xl font-black text-purple-900 tracking-tight mt-1">Rp {totalCLV.toLocaleString('id-ID')}</h3>
                </Card>
              </div>

              {/* Auto-Reminder Widget */}
              <Card className="border border-rose-100/50 bg-gradient-to-br from-white to-rose-50/30">
                <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-100 p-1.5 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="font-black text-slate-800">Tugas Penting Hari Ini</h3>
                  </div>
                  <button onClick={() => setActiveTab('reminders')} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg">Lihat Semua</button>
                </div>
                
                {reminderLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                     <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3 opacity-50" />
                     <p className="font-medium text-sm">Hebat! Tidak ada jadwal follow-up yang tertunda hari ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reminderLeads.slice(0, 3).map(lead => (
                      <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-rose-100 rounded-2xl hover:border-rose-300 transition-colors shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-base">{lead.name}</p>
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{lead.nicheInfo || 'Prospek potensial'}</p>
                        </div>
                        <OneClickWA lead={lead} userNiche={currentUserData.niche} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {}
          {activeTab === 'leads' && (
            <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-slate-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="relative flex-1 w-full sm:max-w-md">
                   <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Cari nama atau nomor HP..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" />
                 </div>
                 <Button variant="outline" className="w-full sm:w-auto font-bold text-slate-600" icon={Filter}>Filter Data</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Informasi Lead</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status & Estimasi</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Jadwal Follow-up</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {userLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-base">{lead.name}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-1 font-medium">
                            <PhoneForwarded className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.status} />
                          <div className="text-xs text-slate-600 mt-2 font-bold tracking-tight">Rp {Number(lead.value||0).toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.followUpDate ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-blue-500"/> {lead.followUpDate}
                            </span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <OneClickWA lead={lead} userNiche={currentUserData.niche} />
                        </td>
                      </tr>
                    ))}
                    {userLeads.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-16 text-slate-500 font-medium">Belum ada data leads. Tambahkan prospek pertama Anda!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {}
          {activeTab === 'pipeline' && (
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x animate-in fade-in slide-in-from-bottom-4 duration-500">
              {Object.keys(pipeline).map(status => (
                <div key={status} className="flex-none w-[280px] bg-slate-100/60 rounded-3xl p-4 snap-center border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-black text-sm text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                      <div className={`w-3 h-3 rounded-full shadow-inner ${
                        status==='New' ? 'bg-blue-500' : status==='Follow Up' ? 'bg-amber-500' : status==='Negotiation' ? 'bg-purple-500' : status==='Closed Won' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {status}
                    </h3>
                    <span className="text-xs font-black text-slate-500 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-200/50">{pipeline[status].length}</span>
                  </div>
                  <div className="space-y-3">
                    {pipeline[status].map(lead => (
                      <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="font-bold text-sm text-slate-800">{lead.name}</div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5 mb-4">{lead.phone}</div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                           <span className="text-xs font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-md">Rp {(Number(lead.value||0)/1000).toLocaleString('id-ID')}k</span>
                           <OneClickWA lead={lead} userNiche={currentUserData.niche} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {}
          {activeTab === 'reminders' && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-amber-200 mb-8 flex items-center justify-between relative overflow-hidden">
                 <div className="relative z-10">
                   <h2 className="text-2xl font-black mb-1">Prioritas Hari Ini</h2>
                   <p className="text-white/90 text-sm font-medium">Ada <strong className="text-lg">{reminderLeads.length}</strong> prospek yang menunggu untuk dihubungi.</p>
                 </div>
                 <AlertCircle className="w-24 h-24 text-white/10 absolute right-4 top-1/2 -translate-y-1/2 rotate-12" />
              </div>
              
              {reminderLeads.map(lead => (
                <Card key={lead.id} className="hover:border-blue-300 hover:shadow-lg transition-all duration-300 border-2 border-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-black text-slate-800 text-xl">{lead.name}</h3>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-slate-400"/> {lead.phone}</p>
                      {lead.notes && (
                         <div className="mt-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                           <p className="text-xs font-bold text-amber-800 uppercase mb-0.5 tracking-wider">Catatan:</p>
                           <p className="text-sm text-slate-600 font-medium">{lead.notes}</p>
                         </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <OneClickWA lead={lead} userNiche={currentUserData.niche} showText />
                    </div>
                  </div>
                </Card>
              ))}
              {reminderLeads.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Kerja Bagus!</h3>
                  <p className="text-slate-500 font-medium mt-1">Semua jadwal follow-up hari ini sudah diselesaikan.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Daily Reports */}
          {activeTab === 'reports' && (
             <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-0 shadow-lg shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">Laporan Harian</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <Button onClick={() => window.print()} variant="outline" size="sm" icon={Printer} className="font-bold border-slate-300">Cetak</Button>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Metrik Konversi</h4>
                      <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden flex shadow-inner">
                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{width: `${conversionRate}%`}}></div>
                        <div className="bg-rose-400 h-full transition-all duration-1000" style={{width: `${totalLeadsCount ? (pipeline['Closed Lost'].length/totalLeadsCount)*100 : 0}%`}}></div>
                      </div>
                      <div className="flex justify-between text-xs mt-3 text-slate-600 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"></div> Deal: {wonCount} ({conversionRate}%)</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-400 rounded-full shadow-sm"></div> Lost: {pipeline['Closed Lost'].length}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/50 relative overflow-hidden">
                         <div className="relative z-10">
                           <p className="text-blue-600/80 text-[11px] font-black mb-1 uppercase tracking-widest">Proyeksi (Pipeline)</p>
                           <h4 className="text-2xl lg:text-3xl font-black text-blue-900 tracking-tight">
                             Rp {pipeline['Negotiation'].reduce((s,l) => s + Number(l.value||0), 0).toLocaleString('id-ID')}
                           </h4>
                         </div>
                         <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-500 opacity-5" />
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200/50 relative overflow-hidden">
                         <div className="relative z-10">
                           <p className="text-emerald-600/80 text-[11px] font-black mb-1 uppercase tracking-widest">Realisasi (Won)</p>
                           <h4 className="text-2xl lg:text-3xl font-black text-emerald-900 tracking-tight">
                             Rp {totalCLV.toLocaleString('id-ID')}
                           </h4>
                         </div>
                         <CheckCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-500 opacity-5" />
                      </div>
                    </div>
                  </div>
                </Card>
             </div>
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION USER (Tampil Hanya di HP) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 flex justify-around items-center p-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {tabsMenu.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-100 scale-110' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold mt-1 tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-1 right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* MODAL KONFIRMASI LOGOUT USER */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-rose-100">
            <HelpCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Konfirmasi Keluar</h3>
          <p className="text-sm text-slate-500 mb-8 font-medium">Sesi Anda akan diakhiri. Apakah Anda yakin ingin keluar dari sistem?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)} className="font-bold border-slate-300">Batal Keluar</Button>
            <Button variant="danger" onClick={confirmLogout} icon={LogOut} className="font-bold">Ya, Keluarkan Saya</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

const StatusBadge = ({ status }) => {
  const colors = {
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
    'Follow Up': 'bg-amber-100 text-amber-700 border-amber-200',
    'Negotiation': 'bg-purple-100 text-purple-700 border-purple-200',
    'Closed Won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Closed Lost': 'bg-rose-100 text-rose-700 border-rose-200'
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg border shadow-sm ${colors[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
};

// Fitur 10: One-Click WhatsApp Chat
const OneClickWA = ({ lead, userNiche, compact = false, showText = false }) => {
  const generateMessage = () => {
    let msg = `Halo Bapak/Ibu ${lead.name},\n`;
    if (lead.status === 'New') msg += `Saya dari layanan ${userNiche}. Apakah Bapak/Ibu memiliki waktu untuk berdiskusi singkat mengenai penawaran kami?`;
    else if (lead.status === 'Follow Up') msg += `Menindaklanjuti pembicaraan kita sebelumnya mengenai ${userNiche}, apakah ada pertanyaan lebih lanjut yang bisa saya bantu jawab?`;
    else if (lead.status === 'Negotiation') msg += `Terkait proposal ${userNiche} yang telah kami ajukan, kami siap memberikan solusi terbaik. Bagaimana tanggapan Bapak/Ibu?`;
    else msg += `Terima kasih atas kepercayaannya menggunakan layanan ${userNiche} kami.`;
    return encodeURIComponent(msg);
  };

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
  const link = `https://wa.me/${finalPhone}?text=${generateMessage()}`;

  if (compact) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-emerald-300" title="Chat WA">
        <MessageCircle className="w-4 h-4" />
      </a>
    );
  }

  return (
    <a href={link} target="_blank" rel="noreferrer">
      <Button variant="success" className="px-4 py-2 text-xs rounded-xl font-bold tracking-wide" icon={MessageCircle}>
        {showText ? 'Kirim Pesan WA' : 'Chat via WA'}
      </Button>
    </a>
  );
};

// Fitur 1: Input Lead Form
const LeadFormModal = ({ appId, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    
    const newLead = {
      userId,
      name: form.leadName.value,
      phone: form.phone.value,
      nicheInfo: form.nicheInfo.value,
      value: Number(form.value.value),
      status: form.status.value,
      followUpDate: form.followUpDate.value,
      notes: form.notes.value,
      createdAt: Date.now()
    };

    try {
      const newLeadId = `lead_${Date.now()}`;
      await setDoc(doc(getFirestore(), 'artifacts', appId, 'public', 'data', 'wasist_leads', newLeadId), newLead);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} icon={UserPlus} className="font-bold w-full md:w-auto shadow-blue-300">Tambah Prospek</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Data Prospek Baru">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Prospek</label>
              <input name="leadName" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" placeholder="Cth: Bpk Budi / PT Indah..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">No. WhatsApp</label>
              <input name="phone" required placeholder="081234567890" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Estimasi Nilai (Rp)</label>
              <input name="value" type="number" required placeholder="1000000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Status Pipeline</label>
              <select name="status" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700">
                <option value="New">New (Baru Masuk)</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won (Deal)</option>
                <option value="Closed Lost">Closed Lost (Batal)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Jadwal Follow-up</label>
              <input name="followUpDate" type="date" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Keterangan / Minat</label>
              <input name="nicheInfo" placeholder="Contoh: Menanyakan pricelist paket premium" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Catatan Khusus (Opsional)</label>
              <textarea name="notes" rows="2" placeholder="Catatan tambahan untuk pengingat..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"></textarea>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="font-bold">Batal</Button>
            <Button type="submit" disabled={loading} className="font-bold">{loading ? 'Menyimpan...' : 'Simpan Prospek'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
