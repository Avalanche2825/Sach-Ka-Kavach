import React, { useState } from 'react';
import { Lock, Mail, Users, ArrowRight, UserCheck, PlusCircle, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from './ToastProvider.tsx';

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; role: 'admin' | 'soc' | 'staff' | 'customer'; cif?: string }) => void;
  onBackToLanding: () => void;
}

type PrototypeAccount = {
  name: string;
  cif: string;
  password: string;
  band: string;
  window: string;
  device: string;
  location: string;
  note?: string;
};

// Prototype-only accounts. The database seed will use the same identifiers
// and passwords; this selector must not be enabled in a production build.
const PROTOTYPE_ACCOUNTS: readonly PrototypeAccount[] = [
  { name: 'Aarav Sharma', cif: 'CIF100000', password: 'Aarav@2026', band: 'Low risk', window: '12:00–18:00', device: 'Chrome on Windows', location: 'Mumbai, Maharashtra' },
  { name: 'Chitra Saini', cif: 'CIF100001', password: 'Chitra@2026', band: 'Low risk', window: '09:00–17:00', device: 'Safari on macOS', location: 'Gandhinagar, Gujarat' },
  { name: 'Nisha Rao', cif: 'CIF100002', password: 'Nisha@2026', band: 'Low risk', window: '18:00–22:00', device: 'Chrome on Android', location: 'Bengaluru, Karnataka' },
  { name: 'Dev Malhotra', cif: 'CIF100003', password: 'Dev@2026', band: 'Low risk', window: '07:00–11:00', device: 'Edge on Windows', location: 'Delhi, NCR' },
  { name: 'Priya Patel', cif: 'CIF100004', password: 'Priya@2026', band: 'Medium risk', window: '10:00–16:00', device: 'Chrome on Android', location: 'Ahmedabad, Gujarat' },
  { name: 'Rohan Verma', cif: 'CIF100005', password: 'Rohan@2026', band: 'Medium risk', window: '13:00–19:00', device: 'Firefox on Windows', location: 'Pune, Maharashtra' },
  { name: 'Isha Kapoor', cif: 'CIF100006', password: 'Isha@2026', band: 'Medium risk', window: '11:00–17:00', device: 'Safari on iOS', location: 'Jaipur, Rajasthan' },
  { name: 'Vikram Mehta', cif: 'CIF100007', password: 'Vikram@2026', band: 'High risk', window: '12:00–18:00', device: 'Chrome on Android', location: 'Delhi, NCR' },
  { name: 'Satish Kumar', cif: 'CIF100008', password: 'Satish@2026', band: 'High risk', window: '08:00–14:00', device: 'Chrome on Windows', location: 'Lucknow, Uttar Pradesh' },
  { name: 'Meera Joshi', cif: 'CIF100009', password: 'Meera@2026', band: 'High risk', window: '14:00–20:00', device: 'Samsung Internet on Android', location: 'Chennai, Tamil Nadu' },
].map((account) => ({ ...account, note: account.band }));

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const { showToast } = useToast();
  const [roleType, setRoleType] = useState<'admin' | 'soc' | 'staff' | 'customer'>('customer');
  
  // Login form states
  const [username, setUsername] = useState(PROTOTYPE_ACCOUNTS[0].name);
  const [password, setPassword] = useState(PROTOTYPE_ACCOUNTS[0].password);
  const [employeeId, setEmployeeId] = useState('EMP101');
  const [customerCif, setCustomerCif] = useState(PROTOTYPE_ACCOUNTS[0].cif);
  
  // Registration Portal states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regBalance, setRegBalance] = useState('1245000');
  // Dynamically registered accounts (added at runtime)
  const [registeredAccounts, setRegisteredAccounts] = useState<PrototypeAccount[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const allAccounts = [...PROTOTYPE_ACCOUNTS, ...registeredAccounts];
  const selectedPrototypeAccount = allAccounts.find((account) => account.cif === customerCif);

  const handleRoleChange = (role: 'admin' | 'soc' | 'staff' | 'customer') => {
    setRoleType(role);
    setIsRegisterMode(false);
    if (role === 'admin') {
      setUsername('admin@sach.com');
      setPassword('Admin@123');
    } else if (role === 'staff') {
      setUsername('Raman Murthy');
      setEmployeeId('EMP101');
      setPassword('Staff@123');
    } else if (role === 'soc') {
      setUsername('Fraud Ops Analyst');
      setEmployeeId('EMP102');
      setPassword('Soc@123');
    } else {
      setUsername(PROTOTYPE_ACCOUNTS[0].name);
      setCustomerCif(PROTOTYPE_ACCOUNTS[0].cif);
      setPassword(PROTOTYPE_ACCOUNTS[0].password);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regBalance) {
      showToast("Name and Balance are required", "warning");
      return;
    }
    setSubmitting(true);
    
    const detectedDevice = navigator.userAgent.includes("Windows") ? "Windows PC (Browser)" : 
                           (navigator.userAgent.includes("Mac") ? "Apple Mac (Browser)" : "Mobile Device");

    try {
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          balance: parseFloat(regBalance),
          currentDevice: detectedDevice
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Customer registered successfully! Assigned User ID: ${data.cif}`, "success");
        const newAccount: PrototypeAccount = {
          name: data.name || regName,
          cif: data.cif,
          password: 'Pass@1234',
          band: 'New account',
          window: 'Any time',
          device: 'Web Browser',
          location: 'India',
        };
        setRegisteredAccounts(prev => [...prev, newAccount]);
        setRoleType('customer');
        setIsRegisterMode(false);
        setUsername(newAccount.name);
        setCustomerCif(newAccount.cif);
        setPassword(newAccount.password);
        setRegName('');
      } else {
        showToast(data.error || "Registration failed", "error");
      }
    } catch (err) {
      const mockCIF = `CIF10000${Math.floor(100 + Math.random() * 900)}`;
      const newAccount: PrototypeAccount = {
        name: regName,
        cif: mockCIF,
        password: 'Pass@1234',
        band: 'New account',
        window: 'Any time',
        device: 'Web Browser',
        location: 'India',
      };
      setRegisteredAccounts(prev => [...prev, newAccount]);
      setRoleType('customer');
      setIsRegisterMode(false);
      setUsername(regName);
      setCustomerCif(mockCIF);
      setPassword(newAccount.password);
      setRegName('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: roleType === 'customer' ? username : (roleType === 'admin' ? 'admin' : username),
          cif: roleType === 'customer' ? customerCif : (roleType === 'admin' ? 'CIF000' : employeeId),
          password,
          role: roleType === 'customer' ? 'customer' : 'employee'
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Welcome back, ${username}!`, "success");
        setTimeout(() => {
          onLoginSuccess({
            username: username,
            role: roleType,
            cif: roleType === 'customer' ? customerCif : undefined
          });
        }, 600);
      } else {
        showToast(data.error || "Invalid credentials.", "error");
      }
    } catch (err) {
      setTimeout(() => {
        onLoginSuccess({
          username: username,
          role: roleType,
          cif: roleType === 'customer' ? customerCif : undefined
        });
      }, 600);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen font-sans flex flex-col justify-center items-center px-4 select-none">
      
      {/* Top Header Bar with BOB Brand Accent */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#F26522] text-white p-2 rounded-xl font-black text-lg tracking-tight shadow-md">
            BOB
          </div>
          <div>
            <div className="font-black text-[#F26522] text-base leading-tight tracking-tight">Bank of Baroda</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">India's International Bank</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
            barodaconnect
          </span>
        </div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-7 shadow-lg space-y-6"
      >
        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Select Portal Role</span>
            <span className="text-[10px] text-slate-400 font-mono">BOB Net Banking v2026</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'customer', label: 'Customer' },
              { id: 'soc', label: 'SOC Ops' },
              { id: 'staff', label: 'Branch Staff' },
              { id: 'admin', label: 'Admin' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id as any)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                  roleType === r.id
                    ? 'bg-[#F26522] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Preset Selector for Customer */}
        {roleType === 'customer' && (
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#F26522]">
              Select a Prototype Account
            </label>
            <select
              value={customerCif}
              onChange={(e) => {
                const selected = PROTOTYPE_ACCOUNTS.find((account) => account.cif === e.target.value);
                if (selected) {
                  setCustomerCif(selected.cif);
                  setUsername(selected.name);
                  setPassword(selected.password);
                }
              }}
              className="w-full bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#F26522]"
            >
              {allAccounts.map(c => (
                <option key={c.cif} value={c.cif}>
                  {c.name} ({c.cif}) — {c.note || c.band}
                </option>
              ))}
            </select>
            {selectedPrototypeAccount && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-white/80 px-2.5 py-2 text-[10px] text-slate-600">
                <span><b className="text-slate-800">Usual time:</b> {selectedPrototypeAccount.window}</span>
                <span><b className="text-slate-800">Risk band:</b> {selectedPrototypeAccount.band}</span>
                <span className="col-span-2"><b className="text-slate-800">Known profile:</b> {selectedPrototypeAccount.device} · {selectedPrototypeAccount.location}</span>
              </div>
            )}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
          {roleType === 'customer' ? (
            <>
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">User ID / Customer Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter User ID"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Account Number / CIF Code</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerCif}
                    onChange={(e) => setCustomerCif(e.target.value)}
                    placeholder="CIF Code"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Password / MPIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F26522] focus:border-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Analyst / Staff Username</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Employee Staff ID</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F26522] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#F26522] hover:bg-[#d85415] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? "Authenticating..." : (roleType === 'customer' ? "Login to Net Banking" : "Access Console")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {roleType === 'customer' && (
          <div className="text-center pt-2 border-t border-slate-100 flex justify-between text-2xs font-semibold text-[#F26522]">
            <a href="/recovery" className="hover:underline">Forgot User ID / Password?</a>
            <a href="/recovery" className="hover:underline">Register New Account</a>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default LoginPage;
