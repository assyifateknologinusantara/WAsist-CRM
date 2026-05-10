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
  Filter, Activity, Smartphone, Eye, ArrowRight
} from 'lucide-react';

// === FIREBASE SETUP (Canvas Standard & Production) ===
// Sistem akan menggunakan config Canvas saat di preview, dan otomatis 
// menggunakan config asli Anda saat di-deploy ke Vercel.
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
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', icon: Icon }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md shadow-blue-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-md shadow-emerald-200",
    danger: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-md shadow-rose-200",
    outline: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-200",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200"
  };
  
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function WAsistApp() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); // 'admin' atau object user
  const [allUsers, setAllUsers] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  
  // UI States
  const [authView, setAuthView] = useState('login'); // login, register, payment
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Admin View State
  const [adminViewingUser, setAdminViewingUser] = useState(null);

  // Initialize Firebase Auth (Canvas Requirement)
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

  // Fetch Users & Leads
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const niche = form.niche.value;

    // Check if email exists
    if (allUsers.find(u => u.email === email)) {
      setErrorMsg('Email sudah terdaftar!');
      return;
    }

    // Generate unique payment
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
      
      // Send Email Notification to Owner
      fetch("https://formsubmit.co/ajax/assyifateknologinusantara@gmail.com", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: "WAsist: Pendaftaran User Baru",
          name: "Sistem WAsist",
          email: email,
          message: `User baru mendaftar!\nNama: ${name}\nEmail: ${email}\nNiche/Bisnis: ${niche}\nTotal Tagihan: Rp ${totalPayment.toLocaleString('id-ID')}\n\nMohon cek dashboard admin untuk melakukan approval setelah transfer diterima.`
        })
      }).catch(err => console.log("FormSubmit silent fail:", err));

      setAuthView('payment');
      setAppUser({ ...newUser, id: newUserId, pendingPayment: true });
    } catch (err) {
      setErrorMsg('Terjadi kesalahan sistem.');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    // Admin Check
    if (username === 'Admin!' && password === '@CRM#Real#1!') {
      setAppUser({ role: 'admin', name: 'Super Admin' });
      return;
    }

    // User Check
    const user = allUsers.find(u => u.email === username && u.password === password);
    if (user) {
      if (user.status === 'pending') {
        setErrorMsg('Akun Anda masih menunggu persetujuan admin. Silahkan selesaikan pembayaran.');
        setAuthView('payment');
        setAppUser({ ...user, pendingPayment: true });
      } else {
        setAppUser(user);
      }
    } else {
      setErrorMsg('Kredensial tidak valid!');
    }
  };

  const handleLogout = () => {
    setAppUser(null);
    setAuthView('login');
    setAdminViewingUser(null);
    setActiveTab('dashboard');
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-blue-600"><Activity className="w-8 h-8 animate-spin" /></div>;

  if (!appUser || appUser.pendingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
              <Smartphone className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">WAsist CRM</h1>
            <p className="text-gray-500 mt-2">Personal Lead Reminder for WhatsApp</p>
          </div>

          <Card className="shadow-xl shadow-blue-900/5">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username Admin</label>
                  <input name="username" type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="email@contoh.com atau Admin!" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input name="password" type="password" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full py-3">Masuk ke Dashboard</Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Belum punya akun? <button type="button" onClick={() => {setAuthView('register'); setErrorMsg('');}} className="text-blue-600 font-semibold hover:underline">Daftar sekarang</button>
                </p>
              </form>
            )}

            {authView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input name="name" type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Aktif</label>
                  <input name="email" type="email" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input name="password" type="password" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bidang Usaha / Jasa (Niche)</label>
                  <input name="niche" type="text" required placeholder="Contoh: Properti, Asuransi, dll" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <Button type="submit" className="w-full py-3">Buat Akun WAsist</Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Sudah punya akun? <button type="button" onClick={() => {setAuthView('login'); setErrorMsg('');}} className="text-blue-600 font-semibold hover:underline">Masuk</button>
                </p>
              </form>
            )}

            {authView === 'payment' && appUser?.pendingPayment && (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Selesaikan Pembayaran</h2>
                <p className="text-sm text-gray-600">Akun Anda berhasil dibuat namun membutuhkan aktivasi. Silahkan lakukan pembayaran sejumlah:</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4">
                  <span className="block text-3xl font-black text-gray-900 tracking-tight">
                    Rp {appUser.paymentAmount?.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-rose-500 mt-1 block font-medium">*Transfer tepat hingga 3 digit terakhir</span>
                </div>

                <div className="text-left bg-blue-50/50 p-4 rounded-xl text-sm text-gray-700 border border-blue-100">
                  <p className="font-semibold mb-2 text-blue-800">Transfer ke rekening berikut:</p>
                  <div className="mb-2">
                    <span className="font-bold">BCA:</span> 5745452563
                  </div>
                  <div className="mb-2">
                    <span className="font-bold">BSI:</span> 9897867570
                  </div>
                  <p className="mt-2 pt-2 border-t border-blue-200/50">a.n <strong>Hardi Hanto</strong></p>
                </div>

                <div className="pt-4">
                  <a href="https://wa.me/6285117392045?text=Halo%20Admin,%20saya%20sudah%20transfer%20untuk%20aktivasi%20WAsist%20atas%20nama%20akun%20Email:%20" target="_blank" rel="noreferrer">
                    <Button variant="success" className="w-full py-3" icon={MessageCircle}>Konfirmasi via WhatsApp</Button>
                  </a>
                  <button onClick={handleLogout} className="text-sm text-gray-500 mt-4 hover:text-gray-800">Kembali ke Login</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (appUser.role === 'admin' && !adminViewingUser) {
    const totalOmset = allUsers.filter(u => u.status === 'approved').reduce((sum, u) => sum + (u.paymentAmount || 249000), 0);
    const pendingUsers = allUsers.filter(u => u.status === 'pending').length;

    const approveUser = async (id) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wasist_users', id), { status: 'approved' });
    };

    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-slate-900 text-white p-6 flex flex-col hidden md:flex">
          <div className="flex items-center gap-3 mb-10">
            <Settings className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-2">
            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-600/20 text-blue-400"><Users className="w-5 h-5"/> Kelola Pengguna</button>
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-gray-400 hover:text-white mt-auto"><LogOut className="w-5 h-5"/> Logout</button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Statistik</h2>
            <Button onClick={() => window.print()} variant="outline" icon={Printer}>Cetak Laporan</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 mb-1">Total Omset Penjualan</p>
                  <h3 className="text-3xl font-bold">Rp {totalOmset.toLocaleString('id-ID')}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 mb-1">Total Pengguna Aktif</p>
                  <h3 className="text-3xl font-bold text-gray-800">{allUsers.filter(u => u.status === 'approved').length}</h3>
                </div>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 mb-1">Menunggu Approval</p>
                  <h3 className="text-3xl font-bold text-gray-800">{pendingUsers}</h3>
                </div>
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Pendaftar WAsist</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Nama / Email</th>
                    <th className="px-4 py-3">Bisnis (Niche)</th>
                    <th className="px-4 py-3">Tagihan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-4">{user.niche}</td>
                      <td className="px-4 py-4 font-mono">Rp {user.paymentAmount?.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {user.status === 'approved' ? 'Aktif' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex gap-2">
                        {user.status === 'pending' && (
                          <Button onClick={() => approveUser(user.id)} variant="success" className="px-3 py-1.5 text-xs">Approve</Button>
                        )}
                        <Button onClick={() => setAdminViewingUser(user)} variant="outline" className="px-3 py-1.5 text-xs" icon={Eye}>Lihat Dashboard</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentUserData = adminViewingUser || appUser;
  const isViewMode = !!adminViewingUser;
  
  // Filter leads based on current viewing user
  const userLeads = useMemo(() => allLeads.filter(l => l.userId === currentUserData.id), [allLeads, currentUserData.id]);

  // Pipeline grouping
  const pipeline = {
    'New': userLeads.filter(l => l.status === 'New'),
    'Follow Up': userLeads.filter(l => l.status === 'Follow Up'),
    'Negotiation': userLeads.filter(l => l.status === 'Negotiation'),
    'Closed Won': userLeads.filter(l => l.status === 'Closed Won'),
    'Closed Lost': userLeads.filter(l => l.status === 'Closed Lost')
  };

  const totalLeadsCount = userLeads.length;
  const wonCount = pipeline['Closed Won'].length;
  // Fitur 4: Conversion Rate Calculator
  const conversionRate = totalLeadsCount ? Math.round((wonCount / totalLeadsCount) * 100) : 0;
  // Fitur 5: CLV Tracker (Customer Lifetime Value = Total Value of Won Deals)
  const totalCLV = pipeline['Closed Won'].reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  
  // Fitur 2 & 7: Auto-Reminder & Smart Reminder
  const todayDateStr = new Date().toISOString().split('T')[0];
  const reminderLeads = userLeads.filter(l => l.status !== 'Closed Won' && l.status !== 'Closed Lost' && l.followUpDate === todayDateStr);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight tracking-tight text-slate-900">WAsist</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">CRM System</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 mx-4 mt-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-medium mb-1">{isViewMode ? 'Viewing as:' : 'Welcome back,'}</p>
          <p className="font-semibold text-sm truncate">{currentUserData.name}</p>
          <p className="text-xs text-blue-600 font-medium truncate mt-0.5">{currentUserData.niche}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'leads', label: 'Lead Database', icon: Users },
            { id: 'pipeline', label: 'Sales Pipeline', icon: Activity },
            { id: 'reminders', label: 'Smart Reminders', icon: PhoneForwarded, badge: reminderLeads.length },
            { id: 'reports', label: 'Daily Reports', icon: PieChart }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                activeTab === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {isViewMode ? (
             <Button onClick={() => setAdminViewingUser(null)} variant="outline" className="w-full text-xs">Kembali ke Admin</Button>
          ) : (
             <Button onClick={handleLogout} variant="ghost" className="w-full text-red-600 hover:bg-red-50" icon={LogOut}>Logout</Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50/50 relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <span className="font-bold">WAsist</span>
          </div>
          {isViewMode ? (
             <button onClick={() => setAdminViewingUser(null)} className="text-xs bg-gray-100 px-3 py-1 rounded-lg">Back to Admin</button>
          ) : (
             <button onClick={handleLogout} className="text-gray-500"><LogOut className="w-5 h-5"/></button>
          )}
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
              <p className="text-slate-500 text-sm">Kelola leads dan follow-up Anda hari ini.</p>
            </div>
            {activeTab === 'leads' && !isViewMode && (
               <LeadFormModal appId={appId} userId={currentUserData.id} />
            )}
          </div>

          {}
          {activeTab === 'dashboard' && (
            <>
              {/* Fitur 4, 5, 9: Daily Sales Report & Calculators Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-500">
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Total Leads</p>
                  <h3 className="text-2xl font-bold text-slate-800">{totalLeadsCount}</h3>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500">
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Conversion Rate</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-800">{conversionRate}%</h3>
                    <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md font-medium">{wonCount} Deal</span>
                  </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-amber-500">
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Need Follow Up</p>
                  <h3 className="text-2xl font-bold text-slate-800">{pipeline['Follow Up'].length}</h3>
                </Card>
                <Card className="p-5 border-l-4 border-l-purple-500 md:col-span-1 col-span-2">
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">CLV (Nilai Total)</p>
                  <h3 className="text-xl font-bold text-slate-800">Rp {totalCLV.toLocaleString('id-ID')}</h3>
                </Card>
              </div>

              {/* Fitur 2: Auto-Reminder Widget */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-800">Tugas Follow-up Hari Ini</h3>
                  </div>
                  <button onClick={() => setActiveTab('reminders')} className="text-sm text-blue-600 hover:underline">Lihat Semua</button>
                </div>
                {reminderLeads.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">Tidak ada jadwal follow-up hari ini.</div>
                ) : (
                  <div className="space-y-3">
                    {reminderLeads.slice(0, 3).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.nicheInfo || 'Prospek potensial'}</p>
                        </div>
                        <OneClickWA lead={lead} userNiche={currentUserData.niche} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {}
          {activeTab === 'leads' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                 <div className="relative flex-1 max-w-md">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Cari nama atau nomor..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <Button variant="outline" className="hidden sm:flex" icon={Filter}>Filter (Segmentasi)</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Informasi Lead</th>
                      <th className="px-6 py-4 font-medium">Status & Nilai</th>
                      <th className="px-6 py-4 font-medium">Jadwal Follow-up</th>
                      <th className="px-6 py-4 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {userLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{lead.name}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <PhoneForwarded className="w-3 h-3" /> {lead.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.status} />
                          <div className="text-xs text-slate-500 mt-1 font-medium">Rp {Number(lead.value||0).toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.followUpDate ? (
                            <span className="text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3"/> {lead.followUpDate}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <OneClickWA lead={lead} userNiche={currentUserData.niche} />
                        </td>
                      </tr>
                    ))}
                    {userLeads.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-10 text-slate-500">Belum ada data leads. Tambahkan prospek pertama Anda!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {}
          {activeTab === 'pipeline' && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {Object.keys(pipeline).map(status => (
                <div key={status} className="flex-none w-72 bg-slate-100/50 rounded-2xl p-4 snap-center border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        status==='New' ? 'bg-blue-500' : status==='Follow Up' ? 'bg-amber-500' : status==='Negotiation' ? 'bg-purple-500' : status==='Closed Won' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {status}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">{pipeline[status].length}</span>
                  </div>
                  <div className="space-y-3">
                    {pipeline[status].map(lead => (
                      <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className="font-semibold text-sm text-slate-800">{lead.name}</div>
                        <div className="text-xs text-slate-500 mt-1 mb-3">{lead.phone}</div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                           <span className="text-xs font-medium text-slate-600">Rp {(Number(lead.value||0)/1000).toLocaleString('id-ID')}k</span>
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
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white p-6 rounded-2xl shadow-lg mb-6 flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-bold mb-1">Prioritas Hari Ini</h2>
                   <p className="text-white/80 text-sm">Ada {reminderLeads.length} prospek yang menunggu untuk dihubungi kembali.</p>
                 </div>
                 <AlertCircle className="w-12 h-12 text-white/20" />
              </div>
              
              {reminderLeads.map(lead => (
                <Card key={lead.id} className="hover:border-blue-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 text-lg">{lead.name}</h3>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Smartphone className="w-4 h-4"/> {lead.phone}</p>
                      {lead.notes && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">Catatan: {lead.notes}</p>}
                    </div>
                    <div className="flex-shrink-0">
                      <OneClickWA lead={lead} userNiche={currentUserData.niche} showText />
                    </div>
                  </div>
                </Card>
              ))}
              {reminderLeads.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Kerja Bagus!</h3>
                  <p className="text-slate-500">Semua jadwal follow-up hari ini sudah diselesaikan.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Daily Reports (Fitur 9) */}
          {activeTab === 'reports' && (
             <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Laporan Kinerja Harian</h2>
                    <Button onClick={() => window.print()} variant="outline" size="sm" icon={Printer}>Cetak</Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Konversi</h4>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{width: `${conversionRate}%`}}></div>
                        <div className="bg-rose-400 h-full" style={{width: `${totalLeadsCount ? (pipeline['Closed Lost'].length/totalLeadsCount)*100 : 0}%`}}></div>
                      </div>
                      <div className="flex justify-between text-xs mt-2 text-slate-600 font-medium">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Deal: {wonCount} ({conversionRate}%)</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-400 rounded-full"></div> Lost: {pipeline['Closed Lost'].length}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                         <p className="text-blue-600 text-xs font-bold mb-1">PROYEKSI PENDAPATAN (PIPELINE)</p>
                         <h4 className="text-2xl font-black text-blue-900">
                           Rp {pipeline['Negotiation'].reduce((s,l) => s + Number(l.value||0), 0).toLocaleString('id-ID')}
                         </h4>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                         <p className="text-emerald-600 text-xs font-bold mb-1">PENDAPATAN TEREALISASI</p>
                         <h4 className="text-2xl font-black text-emerald-900">
                           Rp {totalCLV.toLocaleString('id-ID')}
                         </h4>
                      </div>
                    </div>
                  </div>
                </Card>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const colors = {
    'New': 'bg-blue-100 text-blue-700',
    'Follow Up': 'bg-amber-100 text-amber-700',
    'Negotiation': 'bg-purple-100 text-purple-700',
    'Closed Won': 'bg-emerald-100 text-emerald-700',
    'Closed Lost': 'bg-rose-100 text-rose-700'
  };
  return (
    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${colors[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
};

// Fitur 10: One-Click WhatsApp Chat & Smart Message Generator
const OneClickWA = ({ lead, userNiche, compact = false, showText = false }) => {
  const generateMessage = () => {
    let msg = `Halo Bapak/Ibu ${lead.name},\n`;
    if (lead.status === 'New') msg += `Saya dari layanan ${userNiche}. Apakah Anda memiliki waktu untuk berdiskusi mengenai penawaran kami?`;
    else if (lead.status === 'Follow Up') msg += `Menindaklanjuti pembicaraan kita sebelumnya mengenai ${userNiche}, apakah ada pertanyaan lebih lanjut yang bisa saya bantu?`;
    else if (lead.status === 'Negotiation') msg += `Terkait proposal ${userNiche} yang telah kami ajukan, kami siap memberikan solusi terbaik. Bagaimana menurut Bapak/Ibu?`;
    else msg += `Terima kasih atas kepercayaannya terhadap layanan ${userNiche} kami.`;
    return encodeURIComponent(msg);
  };

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
  const link = `https://wa.me/${finalPhone}?text=${generateMessage()}`;

  if (compact) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" title="Chat WA">
        <MessageCircle className="w-4 h-4" />
      </a>
    );
  }

  return (
    <a href={link} target="_blank" rel="noreferrer">
      <Button variant="success" className="px-3 py-1.5 text-xs rounded-lg" icon={MessageCircle}>
        {showText ? 'Kirim Pesan WA' : 'Chat'}
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
      const db = getFirestore();
      const newLeadId = `lead_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wasist_leads', newLeadId), newLead);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} icon={UserPlus}>Tambah Lead Baru</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Input Data Lead Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Prospek</label>
              <input name="leadName" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No WhatsApp</label>
              <input name="phone" required placeholder="0812..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200">
                <option value="New">New</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Nilai (Rp)</label>
              <input name="value" type="number" required placeholder="1000000" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jadwal Follow-up</label>
              <input name="followUpDate" type="date" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan/Minat</label>
              <input name="nicheInfo" placeholder="Contoh: Berminat rumah tipe 36" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
              <textarea name="notes" rows="2" className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none border-slate-200"></textarea>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Lead'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
