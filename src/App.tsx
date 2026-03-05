/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  Plus,
  Filter,
  Download,
  Calendar,
  Check as CheckIcon,
  Phone,
  Mail,
  FileText,
  X,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from './lib/utils';
import { Check, NavItem, Client, Supplier } from './types';
import { translations, Language } from './translations';
import Login from './components/Login';
import LandingPage from './LandingPage';
import { supabase } from './lib/supabase';

// Nav Items
const NAV_ITEMS: (t: (key: string) => string) => NavItem[] = (t) => [
  { id: 'dashboard', title: t('dashboard'), icon: LayoutDashboard },
  { id: 'clients', title: t('clients'), icon: Users },
  { id: 'suppliers', title: t('suppliers'), icon: UserCircle },
  { id: 'client-checks', title: t('clientChecks'), icon: CreditCard },
  { id: 'supplier-checks', title: t('supplierChecks'), icon: CreditCard },
  { id: 'settings', title: t('settings'), icon: Settings },
  { id: 'users', title: t('users'), icon: Users },
];

export default function App() {
  const [language, setLanguage] = useState<Language>('fr');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [checkToDelete, setCheckToDelete] = useState<Check | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openCheckMenuId, setOpenCheckMenuId] = useState<string | null>(null);
  const [clientPage, setClientPage] = useState(1);
  const [supplierPage, setSupplierPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter States
  const [clientFilters, setClientFilters] = useState({
    beneficiary: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [appliedClientFilters, setAppliedClientFilters] = useState({
    beneficiary: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [supplierFilters, setSupplierFilters] = useState({
    beneficiary: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [appliedSupplierFilters, setAppliedSupplierFilters] = useState({
    beneficiary: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const ITEMS_PER_PAGE = 5;

  React.useEffect(() => {
    // Check current session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const headers = { 'x-user-id': user.id };
      const responses = await Promise.all([
        fetch('/api/clients', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/checks', { headers }),
        fetch('/api/stats/chart', { headers })
      ]);

      // Check if all responses are OK
      for (const res of responses) {
        if (!res.ok) {
          const text = await res.text();
          console.error('Server error response:', text);
          throw new Error(`Server returned ${res.status}: ${text.substring(0, 100)}`);
        }
      }

      const [clientsData, suppliersData, checksData, chartData] = await Promise.all(
        responses.map(res => res.json())
      );

      const normalizedChecks = (Array.isArray(checksData) ? checksData : []).map((check: any) => ({
        ...check,
        dueDate: check.dueDate || check.duedate,
        paymentDate: check.paymentDate || check.paymentdate
      }));

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setChecks(normalizedChecks);
      setChartData(Array.isArray(chartData) ? chartData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  React.useEffect(() => {
    setClientPage(1);
    setSupplierPage(1);
  }, [searchQuery, activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
      };
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(newClient)
        });
        if (res.ok) {
          showToast(`Le client "${newClient.name}" a été mis à jour !`);
          setEditingClient(null);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de la mise à jour', 'error');
        }
      } else {
        const client: Client = {
          ...newClient,
          id: Math.random().toString(36).substr(2, 9),
        };
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers,
          body: JSON.stringify(client)
        });
        if (res.ok) {
          showToast(`Le client "${client.name}" a été ajouté avec succès !`);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de l\'ajout', 'error');
        }
      }
    } catch (error) {
      showToast('Erreur de connexion au serveur', 'error');
    }
  };

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientToDelete(client);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) {
        showToast(`Client "${clientToDelete.name}" supprimé`, 'error');
        setClientToDelete(null);
        fetchData();
      }
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleAddSupplier = async (newSupplier: Omit<Supplier, 'id'>) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
      };
      if (editingSupplier) {
        const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(newSupplier)
        });
        if (res.ok) {
          showToast(`Le fournisseur "${newSupplier.name}" a été mis à jour !`);
          setEditingSupplier(null);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de la mise à jour', 'error');
        }
      } else {
        const supplier: Supplier = {
          ...newSupplier,
          id: Math.random().toString(36).substr(2, 9),
        };
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers,
          body: JSON.stringify(supplier)
        });
        if (res.ok) {
          showToast(`Le fournisseur "${supplier.name}" a été ajouté avec succès !`);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de l\'ajout', 'error');
        }
      }
    } catch (error) {
      showToast('Erreur de connexion au serveur', 'error');
    }
  };

  const handleDeleteSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      setSupplierToDelete(supplier);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      const res = await fetch(`/api/suppliers/${supplierToDelete.id}`, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) {
        showToast(`Fournisseur "${supplierToDelete.name}" supprimé`, 'error');
        setSupplierToDelete(null);
        fetchData();
      }
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleAddCheck = async (newCheck: Omit<Check, 'id'>) => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'x-user-id': user?.id || ''
      };
      if (editingCheck) {
        const res = await fetch(`/api/checks/${editingCheck.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...newCheck, id: editingCheck.id })
        });
        if (res.ok) {
          showToast(`Le chèque n°${newCheck.number} a été mis à jour !`);
          setEditingCheck(null);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de la mise à jour', 'error');
        }
      } else {
        const check: Check = {
          ...newCheck,
          id: Math.random().toString(36).substr(2, 9),
        };
        const res = await fetch('/api/checks', {
          method: 'POST',
          headers,
          body: JSON.stringify(check)
        });
        if (res.ok) {
          showToast(`Le chèque n°${check.number} a été enregistré !`);
          fetchData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Erreur lors de l\'enregistrement', 'error');
        }
      }
    } catch (error) {
      showToast('Erreur de connexion au serveur', 'error');
    }
  };

  const handleDeleteCheck = (id: string) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      setCheckToDelete(check);
    }
  };

  const confirmDeleteCheck = async () => {
    if (!checkToDelete) return;
    try {
      const res = await fetch(`/api/checks/${checkToDelete.id}`, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (res.ok) {
        showToast(`Chèque n°${checkToDelete.number} supprimé`, 'error');
        setCheckToDelete(null);
        fetchData();
      }
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdateCheckStatus = async (id: string, status: Check['status']) => {
    try {
      const check = checks.find(c => c.id === id);
      if (!check) return;
      const res = await fetch(`/api/checks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ ...check, status })
      });
      if (res.ok) {
        showToast(`Statut du chèque mis à jour`);
        fetchData();
      }
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const clientChecks = useMemo(() => checks.filter(c => c.type === 'client'), [checks]);
  const supplierChecks = useMemo(() => checks.filter(c => c.type === 'supplier'), [checks]);

  const filteredClientChecks = useMemo(() => {
    return clientChecks.filter(check => {
      const matchesSearch = check.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (check.bank && check.bank.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (check.cause && check.cause.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesBeneficiary = appliedClientFilters.beneficiary === 'all' || check.beneficiary === appliedClientFilters.beneficiary;
      
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'cancelled': 'cancelled',
        'paid': 'paid',
        'deposited': 'deposited'
      };
      const matchesStatus = appliedClientFilters.status === 'all' || check.status === statusMap[appliedClientFilters.status];
      
      const checkDate = new Date(check.dueDate);
      const matchesDateFrom = !appliedClientFilters.dateFrom || checkDate >= new Date(appliedClientFilters.dateFrom);
      const matchesDateTo = !appliedClientFilters.dateTo || checkDate <= new Date(appliedClientFilters.dateTo);

      return matchesSearch && matchesBeneficiary && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [clientChecks, searchQuery, appliedClientFilters]);

  const filteredSupplierChecks = useMemo(() => {
    return supplierChecks.filter(check => {
      const matchesSearch = check.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (check.bank && check.bank.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (check.cause && check.cause.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesBeneficiary = appliedSupplierFilters.beneficiary === 'all' || check.beneficiary === appliedSupplierFilters.beneficiary;
      
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'cancelled': 'cancelled',
        'paid': 'paid',
        'deposited': 'deposited'
      };
      const matchesStatus = appliedSupplierFilters.status === 'all' || check.status === statusMap[appliedSupplierFilters.status];
      
      const checkDate = new Date(check.dueDate);
      const matchesDateFrom = !appliedSupplierFilters.dateFrom || checkDate >= new Date(appliedSupplierFilters.dateFrom);
      const matchesDateTo = !appliedSupplierFilters.dateTo || checkDate <= new Date(appliedSupplierFilters.dateTo);

      return matchesSearch && matchesBeneficiary && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [supplierChecks, searchQuery, appliedSupplierFilters]);

  const paginatedClientChecks = useMemo(() => {
    const start = (clientPage - 1) * ITEMS_PER_PAGE;
    return filteredClientChecks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClientChecks, clientPage]);

  const paginatedSupplierChecks = useMemo(() => {
    const start = (supplierPage - 1) * ITEMS_PER_PAGE;
    return filteredSupplierChecks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSupplierChecks, supplierPage]);

  const totalClientPages = Math.ceil(filteredClientChecks.length / ITEMS_PER_PAGE);
  const totalSupplierPages = Math.ceil(filteredSupplierChecks.length / ITEMS_PER_PAGE);

  const pendingClientValue = useMemo(() => clientChecks.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0), [clientChecks]);
  const pendingSupplierValue = useMemo(() => supplierChecks.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0), [supplierChecks]);
  const totalClientValue = useMemo(() => clientChecks.reduce((acc, curr) => acc + curr.amount, 0), [clientChecks]);
  const totalSupplierValue = useMemo(() => supplierChecks.reduce((acc, curr) => acc + curr.amount, 0), [supplierChecks]);

  const statusStats = useMemo(() => {
    const total = checks.length || 1;
    const pending = checks.filter(c => c.status === 'pending').length;
    const paid = checks.filter(c => c.status === 'paid').length;
    const cancelled = checks.filter(c => c.status === 'cancelled').length;
    const totalPaidAmount = checks.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amount, 0);
    const averageMonthly = totalPaidAmount / 6;

    return {
      pendingPercent: Math.round((pending / total) * 100),
      paidPercent: Math.round((paid / total) * 100),
      cancelledPercent: Math.round((cancelled / total) * 100),
      totalPaidAmount,
      averageMonthly
    };
  }, [checks]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return (
        <Login 
          onBack={() => setShowLogin(false)}
          language={language} 
        />
      );
    }
    return (
      <LandingPage 
        onGetStarted={() => setShowLogin(true)}
        onLogin={() => setShowLogin(true)}
        language={language}
      />
    );
  }

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden bg-[#F8FAFC] relative font-sans",
      isRTL ? "text-right" : ""
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 w-64 bg-brand-600 flex flex-col shrink-0 text-white z-50 transition-transform duration-300 md:relative md:translate-x-0",
        isRTL ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10",
        isSidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full")
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-lg">
              <CreditCard size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ChequePrime</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-brand-100 hover:bg-brand-500 rounded-lg md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS(t).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-white text-brand-600 shadow-lg" 
                  : "text-brand-100 hover:bg-brand-500 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-brand-600" : "text-brand-200 group-hover:text-white"
              )} />
              {item.title}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-500">
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-brand-500 transition-all group"
          >
            <LogOut size={18} className="text-brand-200 group-hover:text-white transition-colors" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden active:scale-95 transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-black text-slate-900 truncate tracking-tight">
                {NAV_ITEMS(t).find(i => i.id === activeTab)?.title || t('dashboard')}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                {format(new Date(), 'EEEE, d MMMM', { locale: language === 'fr' ? fr : undefined })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden lg:block">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
              <input 
                type="text" 
                placeholder={t('search')}
                className={cn(
                  "py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 w-48 lg:w-64 transition-all",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl relative group active:scale-95 transition-all">
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                <span className={cn(
                  "absolute top-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white",
                  isRTL ? "left-2" : "right-2"
                )}></span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
              <div className="flex items-center gap-3 pl-2 hidden sm:flex">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1">Admin</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                  <UserCircle size={24} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'supplier-checks' && (
              <motion.div
                key="supplier-checks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search and Action Buttons */}
                <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative w-full lg:flex-1">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
                      <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        className={cn(
                          "w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all",
                          isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <button 
                        onClick={() => setAppliedSupplierFilters(supplierFilters)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-4 lg:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                      >
                        <Filter size={18} />
                        <span className="hidden sm:inline">{t('filterTitle')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          const resetFilters = { beneficiary: 'all', status: 'all', dateFrom: '', dateTo: '' };
                          setSupplierFilters(resetFilters);
                          setAppliedSupplierFilters(resetFilters);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                      >
                        <RefreshCw className="rotate-45" size={18} />
                        <span className="hidden sm:inline">{t('resetFilters')}</span>
                      </button>
                      <button className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all" title={t('export')}>
                        <Download size={18} />
                      </button>
                      <button className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all" title={t('import')}>
                        <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingCheck(null);
                          setIsAddModalOpen(true);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-4 lg:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                      >
                        <Plus size={18} />
                        <span className="whitespace-nowrap">{t('add')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('suppliers')}</label>
                      <select 
                        value={supplierFilters.beneficiary}
                        onChange={(e) => setSupplierFilters(prev => ({ ...prev, beneficiary: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{t('all')}</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('status')}</label>
                      <select 
                        value={supplierFilters.status}
                        onChange={(e) => setSupplierFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{t('all')}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="paid">{t('paid')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                        <option value="deposited">{t('deposited')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dateFrom')}</label>
                      <input 
                        type="date" 
                        value={supplierFilters.dateFrom}
                        onChange={(e) => setSupplierFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dateTo')}</label>
                      <input 
                        type="date" 
                        value={supplierFilters.dateTo}
                        onChange={(e) => setSupplierFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                {/* Detailed Table / Mobile Cards */}
                <div className="space-y-4">
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('dates')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('numType')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('tierBank')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('causeMotif')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">{t('amount')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedSupplierChecks.map((check) => (
                            <tr key={check.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {check.paymentDate && (
                                    <p className="text-[10px] text-slate-400 uppercase font-medium">
                                      Date de paiement: {format(new Date(check.paymentDate), 'dd/MM/yyyy')}
                                    </p>
                                  )}
                                  <p className="text-xs font-semibold text-slate-700">
                                    Échéance: {format(new Date(check.dueDate), 'dd/MM/yyyy')}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900">{check.number}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-brand-600">{check.beneficiary}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-500 font-mono">{check.cause || '-'}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-bold text-slate-900">{check.amount.toLocaleString()} DH</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <StatusBadge status={check.status} t={t} />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingCheck(check);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Modifier"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteCheck(check.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <div className="w-px h-4 bg-slate-100 mx-1" />
                                  <div className="relative">
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                                      <RefreshCw size={16} />
                                    </button>
                                    <select 
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                      value={check.status}
                                      onChange={(e) => handleUpdateCheckStatus(check.id, e.target.value as any)}
                                      title="Changer le statut"
                                    >
                                      <option value="pending">Encours</option>
                                      <option value="paid">Encaissé</option>
                                      <option value="cancelled">Impayé</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Montant Total:</span>
                        <span className="text-sm font-bold text-brand-600">{totalSupplierValue.toLocaleString()} DH</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun enregistrement trouvé:</span>
                        <span className="text-sm font-bold text-slate-900">{supplierChecks.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedSupplierChecks.map(check => (
                      <MobileCheckCard 
                        key={check.id}
                        check={check}
                        onEdit={(c) => {
                          setEditingCheck(c);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteCheck}
                        onUpdateStatus={handleUpdateCheckStatus}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
                <Pagination 
                  currentPage={supplierPage} 
                  totalPages={totalSupplierPages} 
                  onPageChange={setSupplierPage} 
                />
              </motion.div>
            )}

            {activeTab === 'client-checks' && (
              <motion.div
                key="client-checks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search and Action Buttons */}
                <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative w-full lg:flex-1">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
                      <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        className={cn(
                          "w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all",
                          isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <button 
                        onClick={() => setAppliedClientFilters(clientFilters)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-4 lg:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                      >
                        <Filter size={18} />
                        <span className="hidden sm:inline">{t('filterTitle')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          const resetFilters = { beneficiary: 'all', status: 'all', dateFrom: '', dateTo: '' };
                          setClientFilters(resetFilters);
                          setAppliedClientFilters(resetFilters);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                      >
                        <RefreshCw className="rotate-45" size={18} />
                        <span className="hidden sm:inline">{t('resetFilters')}</span>
                      </button>
                      <button className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all" title={t('export')}>
                        <Download size={18} />
                      </button>
                      <button className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all" title={t('import')}>
                        <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingCheck(null);
                          setIsAddModalOpen(true);
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-4 lg:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                      >
                        <Plus size={18} />
                        <span className="whitespace-nowrap">{t('add')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('clients')}</label>
                      <select 
                        value={clientFilters.beneficiary}
                        onChange={(e) => setClientFilters(prev => ({ ...prev, beneficiary: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{t('all')}</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('status')}</label>
                      <select 
                        value={clientFilters.status}
                        onChange={(e) => setClientFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{t('all')}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="paid">{t('paid')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                        <option value="deposited">{t('deposited')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dateFrom')}</label>
                      <input 
                        type="date" 
                        value={clientFilters.dateFrom}
                        onChange={(e) => setClientFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dateTo')}</label>
                      <input 
                        type="date" 
                        value={clientFilters.dateTo}
                        onChange={(e) => setClientFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                {/* Detailed Table / Mobile Cards */}
                <div className="space-y-4">
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('dates')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('numType')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('tierBank')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('causeMotif')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">{t('amount')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('status')}</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedClientChecks.map((check) => (
                            <tr key={check.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {check.paymentDate && (
                                    <p className="text-[10px] text-slate-400 uppercase font-medium">
                                      Date de paiement: {format(new Date(check.paymentDate), 'dd/MM/yyyy')}
                                    </p>
                                  )}
                                  <p className="text-xs font-semibold text-slate-700">
                                    Échéance: {format(new Date(check.dueDate), 'dd/MM/yyyy')}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900">{check.number}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-brand-600">{check.beneficiary}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-500 font-mono">{check.cause || '-'}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-bold text-slate-900">{check.amount.toLocaleString()} DH</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <StatusBadge status={check.status} t={t} />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setEditingCheck(check);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                    title="Modifier"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteCheck(check.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <div className="w-px h-4 bg-slate-100 mx-1" />
                                  <div className="relative">
                                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                                      <RefreshCw size={16} />
                                    </button>
                                    <select 
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                      value={check.status}
                                      onChange={(e) => handleUpdateCheckStatus(check.id, e.target.value as any)}
                                      title="Changer le statut"
                                    >
                                      <option value="pending">Encours</option>
                                      <option value="paid">Encaissé</option>
                                      <option value="cancelled">Impayé</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('totalProcessed')}:</span>
                        <span className="text-sm font-bold text-brand-600">{totalClientValue.toLocaleString()} {t('dh')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('noRecords')}:</span>
                        <span className="text-sm font-bold text-slate-900">{clientChecks.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedClientChecks.map(check => (
                      <MobileCheckCard 
                        key={check.id}
                        check={check}
                        onEdit={(c) => {
                          setEditingCheck(c);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteCheck}
                        onUpdateStatus={handleUpdateCheckStatus}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
                <Pagination 
                  currentPage={clientPage} 
                  totalPages={totalClientPages} 
                  onPageChange={setClientPage} 
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {isLoading && (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                  </div>
                )}
                
                {!isLoading && (
                  <>
                {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard 
                      title={t('pendingClientValue')} 
                      value={pendingClientValue} 
                      trend="0%" 
                      icon={ArrowUpRight}
                      color="emerald"
                    />
                    <StatCard 
                      title={t('pendingSupplierValue')} 
                      value={pendingSupplierValue} 
                      trend="0%" 
                      icon={ArrowDownLeft}
                      color="rose"
                    />
                    <StatCard 
                      title={t('checksToDeposit')} 
                      value={clientChecks.filter(c => c.status === 'pending').length} 
                      unit={t('checks')}
                      trend="0" 
                      icon={CreditCard}
                      color="brand"
                    />
                    <StatCard 
                      title={t('checksToPay')} 
                      value={supplierChecks.filter(c => c.status === 'pending').length} 
                      unit={t('checks')}
                      trend="0" 
                      icon={CreditCard}
                      color="amber"
                    />
                  </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-slate-900">{t('cashFlow')}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                          <span className="text-xs text-slate-500">{t('clients')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          <span className="text-xs text-slate-500">{t('suppliers')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorClient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="client" 
                            stroke="#f97316" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorClient)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="supplier" 
                            stroke="#f43f5e" 
                            strokeWidth={3}
                            fill="transparent"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-6">{t('statusDistribution')}</h3>
                    <div className="space-y-6">
                      <StatusProgress label={t('pending')} value={statusStats.pendingPercent} color="bg-amber-500" />
                      <StatusProgress label={t('paid')} value={statusStats.paidPercent} color="bg-brand-500" />
                      <StatusProgress label={t('cancelled')} value={statusStats.cancelledPercent} color="bg-rose-500" />
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">{t('totalClientValue')}</span>
                          <span className="font-semibold">{clients.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">{t('totalSupplierValue')}</span>
                          <span className="font-semibold">{suppliers.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">{t('totalProcessed')}</span>
                          <span className="font-semibold">{statusStats.totalPaidAmount.toLocaleString()} {t('dh')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">{t('monthlyAverage')}</span>
                          <span className="font-semibold">{statusStats.averageMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t('dh')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tables Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 tracking-tight">{t('upcomingClientChecks')}</h3>
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-black rounded-full uppercase">
                          {clientChecks.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('client-checks')}
                        className="text-brand-600 text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        {t('viewAll')}
                      </button>
                    </div>
                    <div className="hidden md:block">
                      <CheckTable 
                        checks={clientChecks.slice(0, 6)} 
                        onUpdateStatus={handleUpdateCheckStatus}
                        onEdit={(check) => {
                          setEditingCheck(check);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteCheck}
                        showStatus={false}
                        t={t}
                      />
                    </div>
                    <div className="md:hidden p-4 space-y-4">
                      {clientChecks.slice(0, 3).map(check => (
                        <MobileCheckCard 
                          key={check.id}
                          check={check}
                          onEdit={(c) => {
                            setEditingCheck(c);
                            setIsAddModalOpen(true);
                          }}
                          onDelete={handleDeleteCheck}
                          onUpdateStatus={handleUpdateCheckStatus}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 tracking-tight">{t('upcomingSupplierChecks')}</h3>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase">
                          {supplierChecks.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('supplier-checks')}
                        className="text-brand-600 text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        {t('viewAll')}
                      </button>
                    </div>
                    <div className="hidden md:block">
                      <CheckTable 
                        checks={supplierChecks.slice(0, 6)} 
                        onUpdateStatus={handleUpdateCheckStatus}
                        onEdit={(check) => {
                          setEditingCheck(check);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteCheck}
                        showStatus={false}
                        t={t}
                      />
                    </div>
                    <div className="md:hidden p-4 space-y-4">
                      {supplierChecks.slice(0, 3).map(check => (
                        <MobileCheckCard 
                          key={check.id}
                          check={check}
                          onEdit={(c) => {
                            setEditingCheck(c);
                            setIsAddModalOpen(true);
                          }}
                          onDelete={handleDeleteCheck}
                          onUpdateStatus={handleUpdateCheckStatus}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'clients' && (
              <ClientsView 
                clients={clients} 
                onAddClient={() => {
                  setEditingClient(null);
                  setIsAddClientModalOpen(true);
                }} 
                onEditClient={(client) => {
                  setEditingClient(client);
                  setIsAddClientModalOpen(true);
                }}
                onDeleteClient={handleDeleteClient}
                t={t}
                language={language}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersView 
                suppliers={suppliers} 
                onAddSupplier={() => {
                  setEditingSupplier(null);
                  setIsAddSupplierModalOpen(true);
                }} 
                onEditSupplier={(supplier) => {
                  setEditingSupplier(supplier);
                  setIsAddSupplierModalOpen(true);
                }}
                onDeleteSupplier={handleDeleteSupplier}
                t={t}
                language={language}
              />
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-8"
              >
                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight">{t('language')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-2xl">
                    <button 
                      onClick={() => setLanguage('fr')}
                      className={cn(
                        "flex items-center justify-between p-4 md:p-6 rounded-2xl border-2 transition-all group active:scale-[0.98]",
                        language === 'fr' 
                          ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-100" 
                          : "border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-lg font-bold transition-colors",
                          language === 'fr' ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600"
                        )}>
                          FR
                        </div>
                        <div className="text-left">
                          <p className="text-sm md:text-base font-bold text-slate-900">Français</p>
                          <p className="text-[10px] md:text-xs text-slate-500">French Language</p>
                        </div>
                      </div>
                      {language === 'fr' && <div className="w-5 h-5 md:w-6 md:h-6 bg-brand-500 rounded-full flex items-center justify-center"><CheckIcon className="text-white" size={12} /></div>}
                    </button>

                    <button 
                      onClick={() => setLanguage('ar')}
                      className={cn(
                        "flex items-center justify-between p-4 md:p-6 rounded-2xl border-2 transition-all group active:scale-[0.98]",
                        language === 'ar' 
                          ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-100" 
                          : "border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-lg font-bold transition-colors",
                          language === 'ar' ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600"
                        )}>
                          AR
                        </div>
                        <div className="text-left">
                          <p className="text-sm md:text-base font-bold text-slate-900">العربية</p>
                          <p className="text-[10px] md:text-xs text-slate-500">Arabic Language</p>
                        </div>
                      </div>
                      {language === 'ar' && <div className="w-5 h-5 md:w-6 md:h-6 bg-brand-500 rounded-full flex items-center justify-center"><CheckIcon className="text-white" size={12} /></div>}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm opacity-50 pointer-events-none">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight">{t('profileSettings')}</h3>
                  <div className="space-y-6 max-w-xl">
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-slate-200">
                        <UserCircle className="text-slate-400" size={32} />
                      </div>
                      <button className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Modifier la photo</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom complet</label>
                        <input type="text" defaultValue="Admin User" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                        <input type="email" defaultValue="admin@checkflow.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="other"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Users size={32} />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-slate-900">Page en cours de développement</h2>
                  <p>La section {NAV_ITEMS(t).find(i => i.id === activeTab)?.title} sera bientôt disponible.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AddCheckModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCheck(null);
        }} 
        onAddClient={() => setIsAddClientModalOpen(true)}
        onAddSupplier={() => setIsAddSupplierModalOpen(true)}
        clients={clients}
        suppliers={suppliers}
        onSave={handleAddCheck}
        initialData={editingCheck || undefined}
        defaultType={activeTab === 'supplier-checks' ? 'supplier' : 'client'}
        t={t}
        language={language}
      />
      <AddClientModal 
        isOpen={isAddClientModalOpen} 
        onClose={() => {
          setIsAddClientModalOpen(false);
          setEditingClient(null);
        }} 
        onSave={handleAddClient}
        initialData={editingClient || undefined}
        t={t}
        language={language}
      />

      <AddSupplierModal 
        isOpen={isAddSupplierModalOpen} 
        onClose={() => {
          setIsAddSupplierModalOpen(false);
          setEditingSupplier(null);
        }} 
        onSave={handleAddSupplier}
        initialData={editingSupplier || undefined}
        t={t}
        language={language}
      />

      <DeleteConfirmationModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDeleteClient}
        title={t('confirmDelete')}
        message={t('deleteWarning')}
        t={t}
      />

      <DeleteConfirmationModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmDeleteSupplier}
        title={t('confirmDelete')}
        message={t('deleteWarning')}
        t={t}
      />

      <DeleteConfirmationModal
        isOpen={!!checkToDelete}
        onClose={() => setCheckToDelete(null)}
        onConfirm={confirmDeleteCheck}
        title={t('confirmDelete')}
        message={t('deleteWarning')}
        t={t}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl min-w-[320px]"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <CheckIcon className="text-white" size={18} />
            </div>
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MobileCheckCard: React.FC<{ 
  check: Check, 
  onEdit: (check: Check) => void, 
  onDelete: (id: string) => void,
  onUpdateStatus: (id: string, status: Check['status']) => void | Promise<void>,
  t: (key: string) => any
}> = ({ 
  check, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  t 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden group active:scale-[0.98] transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
            check.type === 'client' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('number')}</p>
            <p className="text-sm font-bold text-slate-900">{check.number}</p>
          </div>
        </div>
        <StatusBadge status={check.status} t={t} />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('beneficiary')}</p>
          <p className="text-sm font-semibold text-brand-600 truncate">{check.beneficiary}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('amount')}</p>
          <p className="text-sm font-black text-slate-900">{check.amount.toLocaleString()} DH</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={14} />
          <span className="text-xs font-medium">{format(new Date(check.dueDate), 'dd/MM/yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(check)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(check.id)}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
          <div className="relative">
            <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
              <RefreshCw size={16} />
            </button>
            <select 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              value={check.status}
              onChange={(e) => onUpdateStatus(check.id, e.target.value as any)}
            >
              <option value="pending">{t('pending')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="cancelled">{t('cancelled')}</option>
              <option value="deposited">{t('deposited')}</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BottomNav({ 
  activeTab, 
  onTabChange, 
  t 
}: { 
  activeTab: string, 
  onTabChange: (id: string) => void,
  t: (key: string) => string
}) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'client-checks', icon: CreditCard, label: 'Clients' },
    { id: 'supplier-checks', icon: CreditCard, label: 'Fourn.' },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-4 py-2 flex items-center justify-around md:hidden z-[45] pb-safe">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === item.id ? "text-brand-600" : "text-slate-400"
          )}
        >
          <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          {activeTab === item.id && (
            <motion.div 
              layoutId="bottom-nav-indicator"
              className="w-1 h-1 bg-brand-600 rounded-full mt-0.5"
            />
          )}
        </button>
      ))}
    </div>
  );
}

function ClientsView({ 
  clients, 
  onAddClient, 
  onEditClient, 
  onDeleteClient,
  t,
  language
}: { 
  clients: Client[], 
  onAddClient: () => void,
  onEditClient: (client: Client) => void,
  onDeleteClient: (id: string) => void,
  t: (key: string) => string,
  language: Language
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isRTL = language === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{t('clients')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-slate-500 mt-1">{language === 'fr' ? 'Gérez votre base de données clients.' : 'إدارة قاعدة بيانات الزبناء.'}</p>
        </div>
        <button 
          onClick={onAddClient}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-200/50 active:scale-95"
        >
          <Plus size={18} />
          {t('addClient')}
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: t('totalClientValue'), value: clients.length, icon: Users, color: 'bg-blue-500' },
          { label: language === 'fr' ? 'Nouveaux' : 'جديد', value: clients.length > 0 ? 'Recents' : '0', icon: Plus, color: 'bg-emerald-500' },
          { label: language === 'fr' ? 'Actifs' : 'نشط', value: clients.length, icon: CheckIcon, color: 'bg-orange-500', className: 'sm:col-span-2 md:col-span-1' },
        ].map((stat, i) => (
          <div key={i} className={cn("bg-white p-5 md:p-6 rounded-[24px] border border-slate-200/60 shadow-sm flex items-center gap-4", stat.className)}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {clients.map((client) => (
          <motion.div 
            key={client.id}
            whileHover={{ y: -4 }}
            className="bg-white p-5 md:p-6 rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden active:scale-[0.98]"
          >
            <div className={cn(
              "absolute top-0 p-4 transition-opacity z-10",
              "opacity-0 group-hover:opacity-100 md:opacity-0",
              isRTL ? "left-0" : "right-0"
            )}>
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-slate-100 shadow-sm">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClient(client);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClient(client.id);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                <UserCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-black text-slate-900 truncate tracking-tight">{client.name}</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={12} className="shrink-0" />
                    <span className="text-[11px] md:text-xs font-bold truncate">{client.phone || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={12} className="shrink-0" />
                    <span className="text-[11px] md:text-xs font-bold truncate">{client.email || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-[10px] font-black text-brand-600">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</span>
              </div>
              <button 
                onClick={() => onEditClient(client)}
                className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline md:hidden"
              >
                {t('edit')}
              </button>
            </div>
          </motion.div>
        ))}
        
        {/* Add New Placeholder */}
        <button 
          onClick={onAddClient}
          className="border-2 border-dashed border-slate-200 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/30 transition-all group min-h-[160px] md:min-h-[200px]"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Plus size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('addClient')}</span>
        </button>
      </div>
    </motion.div>
  );
}

function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  t
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void,
  title: string,
  message: string,
  t: (key: string) => string
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 space-y-6"
      >
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
          <Trash2 size={32} />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-rose-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
          >
            {t('delete')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddClientModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  t,
  language
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (client: Omit<Client, 'id'>) => void,
  initialData?: Client,
  t: (key: string) => string,
  language: Language
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || ''
  });
  const isRTL = language === 'ar';

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone || '',
        email: initialData.email || ''
      });
    } else {
      setFormData({ name: '', phone: '', email: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
    setFormData({ name: '', phone: '', email: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? t('editClient') : t('addClient')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Plus className="rotate-45" size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('name')} *</label>
              <input 
                type="text" 
                placeholder={t('clientNamePlaceholder')} 
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('phone')}</label>
              <input 
                type="text" 
                placeholder={t('phonePlaceholder')} 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('email')}</label>
              <input 
                type="email" 
                placeholder="client@exemple.com" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
            >
              {initialData ? t('save') : t('add')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SuppliersView({ 
  suppliers, 
  onAddSupplier, 
  onEditSupplier, 
  onDeleteSupplier,
  t,
  language
}: { 
  suppliers: Supplier[], 
  onAddSupplier: () => void,
  onEditSupplier: (supplier: Supplier) => void,
  onDeleteSupplier: (id: string) => void,
  t: (key: string) => string,
  language: Language
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isRTL = language === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{t('suppliers')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-slate-500 mt-1">{language === 'fr' ? 'Gérez votre base de données fournisseurs.' : 'إدارة قاعدة بيانات الموردين.'}</p>
        </div>
        <button 
          onClick={onAddSupplier}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-200/50 active:scale-95"
        >
          <Plus size={18} />
          {t('addSupplier')}
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: t('totalSupplierValue'), value: suppliers.length, icon: Users, color: 'bg-blue-500' },
          { label: language === 'fr' ? 'Nouveaux' : 'جديد', value: suppliers.length > 0 ? 'Recents' : '0', icon: Plus, color: 'bg-emerald-500' },
          { label: language === 'fr' ? 'Actifs' : 'نشط', value: suppliers.length, icon: CheckIcon, color: 'bg-orange-500', className: 'sm:col-span-2 md:col-span-1' },
        ].map((stat, i) => (
          <div key={i} className={cn("bg-white p-5 md:p-6 rounded-[24px] border border-slate-200/60 shadow-sm flex items-center gap-4", stat.className)}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {suppliers.map((supplier) => (
          <motion.div 
            key={supplier.id}
            whileHover={{ y: -4 }}
            className="bg-white p-5 md:p-6 rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden active:scale-[0.98]"
          >
            <div className={cn(
              "absolute top-0 p-4 transition-opacity z-10",
              "opacity-0 group-hover:opacity-100 md:opacity-0",
              isRTL ? "left-0" : "right-0"
            )}>
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-slate-100 shadow-sm">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSupplier(supplier);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSupplier(supplier.id);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                <UserCircle size={28} className="md:w-8 md:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-black text-slate-900 truncate tracking-tight">{supplier.name}</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={12} className="shrink-0" />
                    <span className="text-[11px] md:text-xs font-bold truncate">{supplier.phone || '---'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={12} className="shrink-0" />
                    <span className="text-[11px] md:text-xs font-bold truncate">{supplier.email || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-[10px] font-black text-brand-600">
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fournisseur</span>
              </div>
              <button 
                onClick={() => onEditSupplier(supplier)}
                className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline md:hidden"
              >
                {t('edit')}
              </button>
            </div>
          </motion.div>
        ))}
        
        {/* Add New Placeholder */}
        <button 
          onClick={onAddSupplier}
          className="border-2 border-dashed border-slate-200 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/30 transition-all group min-h-[160px] md:min-h-[200px]"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Plus size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('addSupplier')}</span>
        </button>
      </div>
    </motion.div>
  );
}

function AddSupplierModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  t,
  language
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (supplier: Omit<Supplier, 'id'>) => void,
  initialData?: Supplier,
  t: (key: string) => string,
  language: Language
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || ''
  });
  const isRTL = language === 'ar';

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone || '',
        email: initialData.email || ''
      });
    } else {
      setFormData({ name: '', phone: '', email: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
    setFormData({ name: '', phone: '', email: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? t('editSupplier') : t('addSupplier')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Plus className="rotate-45" size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('name')} *</label>
              <input 
                type="text" 
                placeholder={t('supplierNamePlaceholder')} 
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('phone')}</label>
              <input 
                type="text" 
                placeholder={t('phonePlaceholder')} 
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('email')}</label>
              <input 
                type="email" 
                placeholder="fournisseur@exemple.com" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
            >
              {initialData ? t('save') : t('add')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddCheckModal({ isOpen, onClose, onAddClient, onAddSupplier, clients, suppliers, onSave, initialData, defaultType = 'client', t, language }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddClient?: () => void, 
  onAddSupplier?: () => void,
  clients: Client[], 
  suppliers: Supplier[],
  onSave: (check: Omit<Check, 'id'>) => void, 
  initialData?: Check,
  defaultType?: 'client' | 'supplier',
  t: (key: string) => string,
  language: Language
}) {
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    number: '',
    beneficiary: '',
    bank: '',
    amount: 0,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    cause: '',
    type: 'client' as const,
    status: 'pending' as const
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        number: initialData.number,
        beneficiary: initialData.beneficiary,
        bank: initialData.bank || '',
        amount: initialData.amount,
        dueDate: initialData.dueDate,
        paymentDate: initialData.paymentDate || format(new Date(), 'yyyy-MM-dd'),
        cause: initialData.cause || '',
        type: initialData.type,
        status: initialData.status
      });
    } else {
      setFormData({
        number: '',
        beneficiary: '',
        bank: '',
        amount: 0,
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        cause: '',
        type: defaultType,
        status: 'pending'
      });
    }
  }, [initialData, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount.toString());
    if (!formData.number || !formData.beneficiary || isNaN(amount) || amount <= 0) {
      return;
    }
    onSave({ ...formData, amount });
    onClose();
    // Reset form
    setFormData({
      number: '',
      beneficiary: '',
      bank: '',
      amount: 0,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      cause: '',
      type: 'client',
      status: 'pending'
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 md:p-8 flex items-center justify-between shrink-0 border-b border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">{initialData ? t('edit') : t('add')}</h2>
            <span className="w-fit px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
              {formData.type === 'client' ? t('clientChecks') : t('supplierChecks')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all active:scale-90"
          >
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 px-5 md:px-8 py-6 md:py-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Informations Document */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('docInfo')}</h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('docType')}</label>
                          <select className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none cursor-pointer">
                            <option value="Chèque">{t('cheque')}</option>
                            <option value="Effet">{t('effet')}</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('number')} *</label>
                          <input 
                            type="text" 
                            placeholder="000000" 
                            required
                            value={formData.number}
                            onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('bank')}</label>
                        <input 
                          type="text" 
                          value={formData.bank}
                          onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('signer')}</label>
                        <input type="text" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Acteurs & Finance */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('actorsFinance')}</h3>
                    <div className="space-y-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {formData.type === 'client' ? t('clients') : t('suppliers')} *
                        </label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => formData.type === 'client' ? onAddClient?.() : onAddSupplier?.()}
                            className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 shrink-0 active:scale-90"
                          >
                            <Plus size={20} />
                          </button>
                          <select 
                            required
                            value={formData.beneficiary}
                            onChange={(e) => setFormData(prev => ({ ...prev, beneficiary: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">{t('choose')}</option>
                            {formData.type === 'client' ? (
                              clients.map(client => (
                                <option key={client.id} value={client.name}>{client.name}</option>
                              ))
                            ) : (
                              suppliers.map(supplier => (
                                <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                              ))
                            )}
                          </select>
                        </div>
                        {((formData.type === 'client' && clients.length === 0) || (formData.type === 'supplier' && suppliers.length === 0)) && (
                          <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">
                            {formData.type === 'client' ? t('noClientsWarning') : t('noSuppliersWarning')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('amount')} ({t('dh')}) *</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            required
                            min="0.01"
                            step="0.01"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className={cn(
                              "w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all",
                              isRTL ? "pl-12" : "pr-12"
                            )}
                          />
                          <span className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-400 uppercase",
                            isRTL ? "left-4" : "right-4"
                          )}>{t('dh')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('issueDate')} *</label>
                          <input 
                            type="date" 
                            required
                            value={formData.paymentDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                            className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all cursor-pointer" 
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('dueDate')} *</label>
                          <input 
                            type="date" 
                            required
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all cursor-pointer text-rose-500" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('initialStatus')}</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Check['status'] }))}
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="paid">{t('paid')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Désignation / Motif */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('designation')}</label>
                  <textarea 
                    rows={3} 
                    value={formData.cause}
                    onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none" 
                  />
                </div>
              </div>

              {/* Right Column - Pièce Jointe */}
              <div className="lg:col-span-4 space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('attachment')}</h3>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "aspect-square w-full border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer group relative overflow-hidden",
                    selectedFile ? "border-brand-500 bg-brand-50/10" : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                  )}
                >
                  {selectedFile ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-3xl" />
                      ) : (
                        <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600">
                          <FileText size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={removeFile}
                          className="p-4 bg-white text-rose-500 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-90"
                        >
                          <X size={24} />
                        </button>
                      </div>
                      {!previewUrl && (
                        <p className="text-[10px] font-black text-slate-600 truncate w-full px-4 uppercase tracking-widest">
                          {selectedFile.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-brand-400 transition-all group-hover:scale-110">
                        <Plus size={32} />
                      </div>
                      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-brand-600 transition-colors">
                        {t('addDocument')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 md:p-8 border-t border-slate-100 flex items-center gap-4 shrink-0 bg-slate-50/50">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              className="flex-[2] px-6 py-4 bg-brand-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 active:scale-95"
            >
              {initialData ? t('save') : t('add')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: Check['status'], t: (key: string) => string }) {
  const styles = {
    pending: "bg-brand-50 text-brand-600",
    paid: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-rose-50 text-rose-600",
    deposited: "bg-emerald-50 text-emerald-600",
  };
  
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status])}>
      {t(status)}
    </span>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void 
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-bold transition-all",
              currentPage === page 
                ? "bg-brand-600 text-white shadow-lg shadow-brand-200" 
                : "text-slate-400 hover:bg-slate-100"
            )}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 text-slate-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function StatCard({ title, value, unit = 'DH', trend, icon: Icon, color }: { 
  title: string, 
  value: number | string, 
  unit?: string,
  trend: string, 
  icon: any,
  color: 'emerald' | 'rose' | 'brand' | 'amber'
}) {
  const colorMap = {
    emerald: 'bg-emerald-500 text-white shadow-emerald-200',
    rose: 'bg-rose-500 text-white shadow-rose-200',
    brand: 'bg-brand-500 text-white shadow-brand-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-5 md:p-6 rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
    >
      <div className="flex items-center justify-between mb-5">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", colorMap[color])}>
          <Icon size={24} />
        </div>
        {trend !== '0' && trend !== '0%' && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
            trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 truncate">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatusProgress({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-900 font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function CheckTable({ checks, onUpdateStatus, onEdit, onDelete, showStatus = true, t }: { 
  checks: Check[], 
  onUpdateStatus?: (id: string, status: Check['status']) => void,
  onEdit?: (check: Check) => void,
  onDelete?: (id: string) => void,
  showStatus?: boolean,
  t: (key: string) => string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start border-collapse">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-start">{t('number')}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-start">{t('dueDate')}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-start">{t('beneficiary')}</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-end">{t('amount')}</th>
            {showStatus && <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">{t('status')}</th>}
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {checks.length === 0 ? (
            <tr>
              <td colSpan={showStatus ? 6 : 5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                {t('noRecords')}
              </td>
            </tr>
          ) : (
            checks.map((check) => (
              <tr key={check.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-start">
                  <span className="text-sm font-mono text-slate-600">{check.number}</span>
                </td>
                <td className="px-6 py-4 text-start">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    {format(new Date(check.dueDate), 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 text-start">
                  <span className="text-sm font-semibold text-slate-900">{check.beneficiary}</span>
                </td>
                <td className="px-6 py-4 text-end">
                  <span className="text-sm font-bold text-slate-900">{check.amount.toLocaleString()} {t('dh')}</span>
                </td>
                {showStatus && (
                  <td className="px-6 py-4 text-center">
                    <div className="relative inline-block group/status">
                      <StatusBadge status={check.status} t={t} />
                      {onUpdateStatus && (
                        <select 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          value={check.status}
                          onChange={(e) => onUpdateStatus(check.id, e.target.value as any)}
                          title={t('status')}
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="paid">{t('paid')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="relative">
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                        <RefreshCw size={14} />
                      </button>
                      {onUpdateStatus && (
                        <select 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          value={check.status}
                          onChange={(e) => onUpdateStatus(check.id, e.target.value as any)}
                          title={t('status')}
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="paid">{t('paid')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
                        </select>
                      )}
                    </div>
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(check)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title={t('edit')}
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(check.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title={t('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
