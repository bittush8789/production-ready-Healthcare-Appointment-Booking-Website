import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  ShieldCheck,
  Activity,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  photoUrl?: string;
  availability: string[];
  experience?: string;
  qualification?: string;
  consultation_fee?: number;
  rating?: number;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  symptoms?: string;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
}

// --- Components ---

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{message}</p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-text-muted hover:bg-white transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Navbar = ({ user, profile, onLogin, onLogout }: { 
  user: FirebaseUser | null, 
  profile: UserProfile | null,
  onLogin: () => void,
  onLogout: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
          +
        </div>
        <span className="text-xl font-bold text-primary-dark">Green Valley Clinic</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
        <Link to="/doctors" className="hover:text-primary transition-colors">Appointments</Link>
        <Link to="/doctors" className="hover:text-primary transition-colors">Doctors</Link>
        <Link to="/my-appointments" className="hover:text-primary transition-colors">Patient Portal</Link>
        {profile?.role === 'admin' && (
          <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block bg-primary-light text-primary-dark px-3 py-1 rounded-full text-xs font-semibold">
          HIPAA Compliant Session
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
            </div>
            <button onClick={onLogout} className="text-xs font-bold text-text-muted hover:text-primary">Sign Out</button>
          </div>
        ) : (
          <button 
            onClick={onLogin}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40 bg-bg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary-dark text-sm font-semibold mb-6 border border-primary/20">
          <ShieldCheck className="w-4 h-4" />
          Trusted Healthcare in San Diego
        </span>
        <h1 className="text-5xl lg:text-7xl font-bold text-text-main mb-8 leading-[1.1]">
          Your Health, <br />
          <span className="text-primary">Our Priority.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-text-muted mb-10 leading-relaxed">
          Compassionate Care, Advanced Medicine. Book appointments with top-rated specialists at Green Valley Clinic. 
          Modern care, compassionate doctors, and seamless scheduling.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/doctors" 
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            Book Appointment
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/symptom-checker" 
            className="w-full sm:w-auto bg-white border border-border text-text-main px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <BrainCircuit className="w-5 h-5 text-primary" />
            AI Symptom Checker
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-surface border-t border-border py-12">
    <div className="max-w-7xl mx-auto px-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">+</div>
            <span className="text-lg font-bold text-primary-dark">Green Valley Clinic</span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Providing professional healthcare services with a commitment to patient privacy and modern medical excellence.
          </p>
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>2456 Elm Street, San Diego, CA 92103</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>+1-619-555-0142</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Mon-Fri: 9:00 AM - 6:00 PM | Sat: 10:00 AM - 2:00 PM</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div>
            <h4 className="text-[13px] font-bold text-text-main mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/doctors" className="hover:text-primary">Appointments</Link></li>
              <li><Link to="/symptom-checker" className="hover:text-primary">AI Symptom Checker</Link></li>
              <li><Link to="/doctors" className="hover:text-primary">Specialists</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-text-main mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link to="/my-appointments" className="hover:text-primary">Patient Portal</Link></li>
              <li><span className="hover:text-primary cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-primary cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-text-main mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><span className="hover:text-primary cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-primary cursor-pointer">HIPAA Notice</span></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-[12px] text-text-muted">
          © 2026 Green Valley Clinic. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary px-3 py-1 bg-primary-light rounded-full border border-primary/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            SECURE HIPAA COMPLIANT
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Patient',
            email: firebaseUser.email || '',
            role: (firebaseUser.email === 'bittush9534@gmail.com' || firebaseUser.email === 'admin@greenvalleyclinic.com') ? 'admin' : 'patient'
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully.');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Stethoscope className="w-12 h-12 text-clinic-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} profile={profile} onLogin={handleLogin} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/doctors" element={<DoctorListingPage user={user} onLogin={handleLogin} />} />
            <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
            <Route path="/my-appointments" element={<MyAppointmentsPage user={user} onLogin={handleLogin} />} />
            <Route path="/admin" element={<AdminDashboardPage profile={profile} />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

// --- Page Components (Stubbed for now, will implement in next step) ---

const DoctorListingPage = ({ user, onLogin }: { user: FirebaseUser | null, onLogin: () => void }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctor) setSelectedDoctor(docs[0]);
    });
    return () => unsubscribe();
  }, []);

  const times = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:00 PM', '04:15 PM'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onLogin();
    if (!selectedDoctor) return toast.error('Please select a doctor');
    if (!time) return toast.error('Please select a time slot');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientId: user.uid,
        patientName: user.displayName || 'Patient',
        patientEmail: user.email,
        date,
        time,
        symptoms,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Send Confirmation Email
      try {
        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_name: user.displayName || 'Patient',
            doctor_name: selectedDoctor.name,
            date,
            time,
            email: user.email
          })
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      toast.success('Appointment booked successfully!');
      setTime('');
      setSymptoms('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] gap-6 min-h-[calc(100vh-64px)]">
      {/* Panel 1: Select Specialist */}
      <aside className="panel h-fit lg:h-full">
        <div className="panel-header">
          <div className="panel-title">1. Select Specialist</div>
        </div>
        <div className="overflow-y-auto max-h-[400px] lg:max-h-none">
          {doctors.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => setSelectedDoctor(doc)}
              className={cn("doctor-card", selectedDoctor?.id === doc.id && "selected")}
            >
              <div className="flex gap-3 items-center">
                <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-sm shrink-0 overflow-hidden">
                  {doc.photoUrl ? (
                    <img 
                      src={doc.photoUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = doc.name.split(' ').map(n => n[0]).join('');
                      }}
                    />
                  ) : doc.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="font-semibold text-[15px] truncate">{doc.name}</div>
                  <div className="text-[11px] text-primary font-bold uppercase tracking-wider truncate">{doc.specialization}</div>
                  {doc.rating && (
                    <div className="text-[11px] text-amber-500 flex items-center gap-1 mt-0.5">
                      ★ {doc.rating} • {doc.experience || 'Experienced'}
                    </div>
                  )}
                  <div className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Available Today
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Panel 2: Choose Date & Time */}
      <section className="panel h-fit lg:h-full">
        <div className="panel-header">
          <div className="panel-title">2. Choose Date & Time</div>
        </div>
        <div className="p-4">
          <div className="font-semibold text-[15px] mb-4">{format(new Date(), 'MMMM yyyy')}</div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const isSelected = format(d, 'yyyy-MM-dd') === date;
              return (
                <div 
                  key={i} 
                  onClick={() => setDate(format(d, 'yyyy-MM-dd'))}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-lg border border-border text-[13px] cursor-pointer transition-all",
                    isSelected ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary"
                  )}
                >
                  {format(d, 'd')}
                  {i === 0 && <span className="text-[9px] mt-0.5">Today</span>}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="panel-header border-t border-border">
          <div className="panel-title">Available Slots</div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 p-4">
          {times.map(t => (
            <div 
              key={t}
              onClick={() => setTime(t)}
              className={cn(
                "p-2.5 border border-border rounded-lg text-center text-[13px] font-medium cursor-pointer transition-all",
                time === t ? "bg-primary-light border-primary text-primary" : "hover:border-primary hover:text-primary"
              )}
            >
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* Panel 3: Patient Details */}
      <aside className="panel h-fit lg:h-full">
        <div className="panel-header">
          <div className="panel-title">3. Patient Details</div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 space-y-4 flex-grow">
            <div>
              <label className="block text-[12px] font-semibold text-text-muted mb-1">Full Name</label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                className="input-field"
                defaultValue={user?.displayName || ''}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted mb-1">Email Address</label>
              <input 
                type="email" 
                placeholder="jane.doe@example.com" 
                className="input-field"
                defaultValue={user?.email || ''}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted mb-1">Phone Number</label>
              <input type="tel" placeholder="(555) 000-0000" className="input-field" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-muted mb-1">Symptoms / Notes (Optional)</label>
              <textarea 
                placeholder="Briefly describe your concern..." 
                className="input-field h-20 resize-none"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-4 pt-0 space-y-3">
            {selectedDoctor?.consultation_fee && (
              <div className="flex justify-between items-center text-sm border-t border-border pt-3 mb-2">
                <span className="text-text-muted">Consultation Fee</span>
                <span className="font-bold text-text-main">${selectedDoctor.consultation_fee}</span>
              </div>
            )}
            <button 
              type="submit" 
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Processing..." : "Confirm Appointment"}
            </button>
          </div>

          <div className="p-3 px-4 text-[11px] text-text-muted leading-relaxed border-t border-border bg-[#fefce8]">
            <strong>HIPAA Notice:</strong> This connection is encrypted using 256-bit SSL. Your personal health information is protected under federal law and will only be shared with your chosen practitioner.
          </div>
        </form>
      </aside>
    </div>
  );
};



const SymptomCheckerPage = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const checkSymptoms = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are an AI Medical Assistant. A patient is describing symptoms: "${input}". 
        Provide a brief, helpful analysis. 
        IMPORTANT: Start with a clear medical disclaimer. 
        Suggest potential specializations they should consult. 
        Do NOT give a definitive diagnosis. 
        Keep it professional and empathetic.`
      });
      setResult(response.text);
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze symptoms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="panel overflow-hidden">
        <div className="panel-header bg-primary-light border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="panel-title text-primary-dark">AI Symptom Checker</div>
              <div className="text-[12px] text-primary-dark/70">Describe your symptoms for a quick analysis</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> This tool is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-text-main mb-2">How are you feeling?</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I've had a sharp pain in my lower back for 3 days..."
              className="input-field h-32 resize-none text-base"
            />
          </div>

          <button 
            onClick={checkSymptoms}
            disabled={loading || !input.trim()}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? "Analyzing Symptoms..." : "Run AI Analysis"}
          </button>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-slate-50 rounded-xl border border-border"
            >
              <div className="prose prose-slate max-w-none text-[15px] text-text-main leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-center">
                <Link to="/doctors" className="text-primary font-bold hover:underline flex items-center gap-2">
                  Find a specialist for these symptoms
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const MyAppointmentsPage = ({ user, onLogin }: { user: FirebaseUser | null, onLogin: () => void }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'appointments'), where('patientId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    });
    return () => unsubscribe();
  }, [user]);

  const handleCancel = async (appointmentId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled'
      });
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to cancel appointment');
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your appointments</h2>
        <button onClick={onLogin} className="btn-primary px-8">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-text-main">My Appointments</h2>
        <Link to="/doctors" className="btn-primary py-2 px-4 text-sm">Book New</Link>
      </div>
      
      {appointments.length === 0 ? (
        <div className="panel p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-text-muted font-medium mb-4">No appointments found.</p>
          <Link to="/doctors" className="text-primary font-bold">Book your first appointment</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(app => (
            <div key={app.id} className="panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{app.doctorName}</h3>
                  <div className="flex items-center gap-4 text-[13px] text-text-muted mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {app.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {app.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  app.status === 'confirmed' ? "bg-green-100 text-green-700" : 
                  app.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                )}>
                  {app.status}
                </span>
                <div className="flex items-center gap-3">
                  <button className="text-[13px] font-bold text-text-muted hover:text-primary">View Details</button>
                  {app.status !== 'cancelled' && (
                    <button 
                      onClick={() => setCancelModal({ isOpen: true, id: app.id })}
                      className="text-[13px] font-bold text-red-500 hover:text-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, id: null })}
        onConfirm={() => cancelModal.id && handleCancel(cancelModal.id)}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
      />
    </div>
  );
};

const AdminDashboardPage = ({ profile }: { profile: UserProfile | null }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors'>('appointments');
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    const unsubApp = onSnapshot(collection(db, 'appointments'), (s) => {
      setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    });
    const unsubDoc = onSnapshot(collection(db, 'doctors'), (s) => {
      setDoctors(s.docs.map(d => ({ id: d.id, ...d.data() } as Doctor)));
    });
    return () => { unsubApp(); unsubDoc(); };
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-text-muted mt-2">You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-3xl font-bold text-text-main">Admin Dashboard</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('appointments')}
            className={cn("px-6 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'appointments' ? "bg-white shadow-sm text-primary" : "text-text-muted")}
          >
            Appointments
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
            className={cn("px-6 py-2 rounded-md text-sm font-bold transition-all", activeTab === 'doctors' ? "bg-white shadow-sm text-primary" : "text-text-muted")}
          >
            Doctors
          </button>
        </div>
      </div>

      {activeTab === 'appointments' ? (
        <div className="panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-text-main text-sm">{app.patientName}</div>
                    <div className="text-[11px] text-text-muted">{app.patientEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-main">{app.doctorName}</td>
                  <td className="px-6 py-4 text-sm text-text-main">
                    <div>{app.date}</div>
                    <div className="text-[11px] text-text-muted">{app.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      app.status === 'confirmed' ? "bg-green-100 text-green-700" : 
                      app.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {app.status !== 'confirmed' && (
                        <button 
                          onClick={async () => {
                            await updateDoc(doc(db, 'appointments', app.id), { status: 'confirmed' });
                            toast.success('Appointment confirmed');
                          }}
                          className="p-2 hover:bg-primary-light rounded-lg text-primary transition-colors"
                          title="Confirm Appointment"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {app.status !== 'cancelled' && (
                        <button 
                          onClick={() => setCancelModal({ isOpen: true, id: app.id })}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Cancel Appointment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {doctors.map(doc => (
            <div key={doc.id} className="panel p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary-light flex items-center justify-center font-bold text-primary-dark text-lg shrink-0 overflow-hidden">
                  {doc.photoUrl ? (
                    <img 
                      src={doc.photoUrl} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = doc.name.split(' ').map(n => n[0]).join('');
                      }}
                    />
                  ) : doc.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{doc.name}</h3>
                  <p className="text-[11px] text-primary font-bold uppercase">{doc.specialization}</p>
                </div>
              </div>
              <button className="w-full py-2 border border-border rounded-lg text-xs font-bold hover:border-primary transition-all">Edit Profile</button>
            </div>
          ))}
          <button 
            className="panel p-6 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary hover:border-primary transition-all group"
            onClick={async () => {
              try {
                // 1. Seed Doctors
                const doctorsData = [
                  {
                    name: "Dr. John Smith",
                    specialization: "Cardiologist",
                    experience: "12 years",
                    qualification: "MD, Cardiology",
                    consultation_fee: 120,
                    rating: 4.8,
                    photoUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200",
                    availability: ["10:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
                    bio: "Expert cardiologist with over 12 years of experience in cardiovascular health."
                  },
                  {
                    name: "Dr. Emily Rose",
                    specialization: "Dermatologist",
                    experience: "8 years",
                    qualification: "MD, Dermatology",
                    consultation_fee: 90,
                    rating: 4.6,
                    photoUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200",
                    availability: ["9:00 AM", "12:00 PM", "3:00 PM"],
                    bio: "Specialist in dermatology, helping patients with skin health for 8 years."
                  },
                  {
                    name: "Dr. Michael Lee",
                    specialization: "General Physician",
                    experience: "10 years",
                    qualification: "MBBS",
                    consultation_fee: 70,
                    rating: 4.7,
                    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200",
                    availability: ["9:30 AM", "11:30 AM", "1:30 PM", "5:00 PM"],
                    bio: "Dedicated general physician with a decade of experience in primary care."
                  }
                ];

                const doctorRefs: Record<string, string> = {};
                const existingDoctorsSnap = await getDocs(collection(db, 'doctors'));
                const existingDoctors = existingDoctorsSnap.docs.map(d => ({ id: d.id, name: d.data().name }));

                for (const docData of doctorsData) {
                  // Ensure photoUrl exists or use a placeholder
                  const finalDocData = {
                    ...docData,
                    photoUrl: docData.photoUrl || `https://picsum.photos/seed/${encodeURIComponent(docData.name)}/200/200`
                  };

                  const existing = existingDoctors.find(d => d.name === docData.name);
                  if (existing) {
                    await updateDoc(doc(db, 'doctors', existing.id), finalDocData);
                    doctorRefs[docData.name] = existing.id;
                  } else {
                    const docRef = await addDoc(collection(db, 'doctors'), finalDocData);
                    doctorRefs[docData.name] = docRef.id;
                  }
                }

                // 2. Seed Appointments
                const appointmentsData = [
                  {
                    patientName: "Alice Johnson",
                    patientEmail: "alice.johnson@example.com",
                    patientId: "user_001",
                    doctorName: "Dr. John Smith",
                    doctorId: doctorRefs["Dr. John Smith"],
                    date: "2026-05-02",
                    time: "10:00 AM",
                    status: "confirmed",
                    symptoms: "Chest pain and shortness of breath",
                    createdAt: serverTimestamp()
                  },
                  {
                    patientName: "Robert Brown",
                    patientEmail: "robert.brown@example.com",
                    patientId: "user_002",
                    doctorName: "Dr. Emily Rose",
                    doctorId: doctorRefs["Dr. Emily Rose"],
                    date: "2026-05-03",
                    time: "12:00 PM",
                    status: "pending",
                    symptoms: "Skin rash and itching",
                    createdAt: serverTimestamp()
                  }
                ];

                for (const appData of appointmentsData) {
                  await addDoc(collection(db, 'appointments'), appData);
                }

                toast.success('Initial data seeded successfully!');
              } catch (error) {
                console.error("Seeding failed:", error);
                toast.error('Failed to seed data.');
              }
            }}
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-light transition-all mb-2">
              <Plus className="w-5 h-5 text-text-muted group-hover:text-primary" />
            </div>
            <span className="text-xs font-bold">Seed Initial Data</span>
          </button>
        </div>
      )}

      <ConfirmationModal 
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, id: null })}
        onConfirm={async () => {
          if (cancelModal.id) {
            await updateDoc(doc(db, 'appointments', cancelModal.id), { status: 'cancelled' });
            toast.success('Appointment cancelled');
          }
        }}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action will notify the patient/doctor."
      />
    </div>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
