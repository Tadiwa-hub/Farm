import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Wheat, Egg, Menu, X, Trash2, Activity } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

const Dashboard = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => { loadData(); }, []);
  
  const loadData = () => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error);
  };

  if (!data) return <div className="text-center p-10 text-amber-500">Loading metrics...</div>;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-amber-500">Farm Overview</h1>
      
      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700"><h3 className="text-slate-400 font-medium">Active Batches</h3><p className="text-3xl md:text-4xl font-bold mt-2 text-white">{data.activeBatches}</p></div>
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700"><h3 className="text-slate-400 font-medium">Total Chickens</h3><p className="text-3xl md:text-4xl font-bold mt-2 text-white">{data.totalChickens}</p></div>
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700"><h3 className="text-slate-400 font-medium">Feed Consumed (Kg)</h3><p className="text-3xl md:text-4xl font-bold mt-2 text-white">{data.totalFeedConsumed}</p></div>
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700"><h3 className="text-slate-400 font-medium">Total Eggs</h3><p className="text-3xl md:text-4xl font-bold mt-2 text-white">{data.totalEggsCollected}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg shadow border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity className="text-amber-500"/> Production & Feed Trends</h3>
          {data.chartData && data.chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#f59e0b" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} itemStyle={{color: '#fff'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}}/>
                  <Line yAxisId="left" type="monotone" dataKey="eggs" name="Eggs Laid" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line yAxisId="right" type="monotone" dataKey="feed" name="Feed (Kg)" stroke="#38bdf8" strokeWidth={3} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
              Not enough data to chart yet. Log feed or eggs!
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-slate-800 p-0 rounded-lg shadow border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-800/80">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          </div>
          <div className="flex flex-col">
            {data.recentActivity && data.recentActivity.map((act, i) => (
              <div key={i} className="p-4 border-b border-slate-700/50 flex items-center gap-3">
                <div className={`p-2 rounded-full ${act.type === 'feed' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {act.type === 'feed' ? <Wheat size={16} /> : <Egg size={16}/>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{act.type === 'feed' ? `Logged ${act.amount} Kg of Feed` : `Collected ${act.amount} Eggs`}</p>
                  <p className="text-xs text-slate-400">{new Date(act.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!data.recentActivity || data.recentActivity.length === 0) && (
              <div className="p-6 text-center text-slate-500 text-sm">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ entryDate: '', initialBirdCount: '' });

  useEffect(() => { loadBatches(); }, []);
  const loadBatches = () => api.get('/batches').then(res => setBatches(res.data)).catch(console.error);

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/batches', form).then(() => {
      setForm({ entryDate: '', initialBirdCount: '' });
      loadBatches();
    });
  };

  const handleDelete = (id) => {
    if(window.confirm("WARNING: Deleting a batch will permanently delete ALL feed and egg records attached to it. Are you absolutely sure?")) {
      api.delete(`/batches/${id}`).then(() => loadBatches());
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-amber-500">Batch Management</h1>
      <form onSubmit={handleSubmit} className="bg-slate-800 p-4 md:p-6 rounded-lg mb-8 flex flex-col sm:flex-row gap-4 sm:items-end border border-slate-700">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm mb-1 text-slate-400 font-medium">Entry Date</label>
          <input type="date" required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.entryDate} onChange={e => setForm({...form, entryDate: e.target.value})} />
        </div>
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-sm mb-1 text-slate-400 font-medium">Initial Bird Count</label>
          <input type="number" required min="1" className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.initialBirdCount} onChange={e => setForm({...form, initialBirdCount: e.target.value})} />
        </div>
        <button className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded sm:px-8 transition-colors font-semibold w-full sm:w-auto shadow-md">Add Batch</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {batches.map(b => (
          <div key={b.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 relative overflow-hidden shadow group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${b.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-white">Batch {b.id.substring(0,6).toUpperCase()}</h3>
              <button onClick={() => handleDelete(b.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Batch">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex justify-between items-center text-slate-300 mb-1">
              <span>Current Birds:</span>
              <span className="font-medium text-white">{b.currentBirdCount} / {b.initialBirdCount}</span>
            </div>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-500"></span>
              Entered: {new Date(b.entryDate).toLocaleDateString()}
            </p>
          </div>
        ))}
        {batches.length === 0 && <div className="col-span-full text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg border border-slate-700/50 border-dashed">No batches found. Add your first batch above.</div>}
      </div>
    </div>
  );
};

const Feed = () => {
  const [feedLogs, setFeedLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ date: '', amountKg: '', batchId: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = () => {
    api.get('/feed').then(res => setFeedLogs(res.data));
    api.get('/batches').then(res => setBatches(res.data));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/feed', form).then(() => {
      setForm({ date: '', amountKg: '', batchId: form.batchId });
      loadData();
    });
  };

  const handleDelete = (id) => {
    if(window.confirm("Delete this feed record?")) {
      api.delete(`/feed/${id}`).then(() => loadData());
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-amber-500">Feed Consumption</h1>
      <form onSubmit={handleSubmit} className="bg-slate-800 p-4 md:p-6 rounded-lg mb-8 flex flex-col sm:flex-row gap-4 sm:items-end border border-slate-700 align-bottom">
        <div className="w-full sm:flex-1"><label className="block text-sm mb-1 text-slate-400 font-medium">Date</label><input type="date" required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
        <div className="w-full sm:flex-1"><label className="block text-sm mb-1 text-slate-400 font-medium">Amount (Kg)</label><input type="number" step="0.1" required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.amountKg} onChange={e => setForm({...form, amountKg: e.target.value})} /></div>
        <div className="w-full sm:flex-1">
          <label className="block text-sm mb-1 text-slate-400 font-medium">Batch</label>
          <select required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.batchId} onChange={e => setForm({...form, batchId: e.target.value})}>
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.id.substring(0,6).toUpperCase()}</option>)}
          </select>
        </div>
        <button className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded sm:px-6 transition-colors font-semibold w-full sm:w-auto shadow-md">Log Feed</button>
      </form>
      <div className="bg-slate-800 rounded-lg p-0 border border-slate-700 overflow-hidden shadow">
        <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800/80"><h3 className="font-bold text-white text-lg">Recent Feed Logs</h3></div>
        <div className="flex flex-col">
          {feedLogs.map((log, i) => (
            <div key={log.id} className={`p-4 md:p-6 flex justify-between items-center ${i !== feedLogs.length - 1 ? 'border-b border-slate-700' : ''} hover:bg-slate-750 transition-colors group`}>
              <div>
                <span className="font-medium text-white block md:inline mr-3">{new Date(log.date).toLocaleDateString()}</span>
                <span className="text-sm text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">Batch {log.batch?.id?.substring(0,6).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full">{log.amountKg} Kg</span>
                <button onClick={() => handleDelete(log.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Delete"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
          {feedLogs.length === 0 && <div className="p-8 text-center text-slate-500">No logs recorded yet.</div>}
        </div>
      </div>
    </div>
  );
};

const Eggs = () => {
    const [eggLogs, setEggLogs] = useState([]);
    const [batches, setBatches] = useState([]);
    const [form, setForm] = useState({ date: '', count: '', batchId: '' });
  
    useEffect(() => { loadData(); }, []);
    const loadData = () => {
      api.get('/eggs').then(res => setEggLogs(res.data));
      api.get('/batches').then(res => setBatches(res.data));
    }
  
    const handleSubmit = (e) => {
      e.preventDefault();
      api.post('/eggs', form).then(() => {
        setForm({ date: '', count: '', batchId: form.batchId });
        loadData();
      });
    };

    const handleDelete = (id) => {
      if(window.confirm("Delete this egg record?")) {
        api.delete(`/eggs/${id}`).then(() => loadData());
      }
    };
  
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-amber-500">Egg Production</h1>
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 md:p-6 rounded-lg mb-8 flex flex-col sm:flex-row gap-4 sm:items-end border border-slate-700">
          <div className="w-full sm:flex-1"><label className="block text-sm mb-1 text-slate-400 font-medium">Date</label><input type="date" required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          <div className="w-full sm:flex-1"><label className="block text-sm mb-1 text-slate-400 font-medium">Egg Count</label><input type="number" required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.count} onChange={e => setForm({...form, count: e.target.value})} /></div>
          <div className="w-full sm:flex-1">
            <label className="block text-sm mb-1 text-slate-400 font-medium">Batch</label>
            <select required className="bg-slate-900 p-2.5 rounded w-full border border-slate-600 focus:border-amber-500 outline-none text-white" value={form.batchId} onChange={e => setForm({...form, batchId: e.target.value})}>
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.id.substring(0,6).toUpperCase()}</option>)}
            </select>
          </div>
          <button className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded sm:px-6 transition-colors font-semibold w-full sm:w-auto shadow-md">Log Eggs</button>
        </form>
        <div className="bg-slate-800 rounded-lg p-0 border border-slate-700 overflow-hidden shadow">
          <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800/80"><h3 className="font-bold text-white text-lg">Daily Egg Records</h3></div>
          <div className="flex flex-col">
            {eggLogs.map((log, i) => (
              <div key={log.id} className={`p-4 md:p-6 flex justify-between items-center ${i !== eggLogs.length - 1 ? 'border-b border-slate-700' : ''} hover:bg-slate-750 transition-colors group`}>
                <div>
                  <span className="font-medium text-white block md:inline mr-3">{new Date(log.date).toLocaleDateString()}</span>
                  <span className="text-sm text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">Batch {log.batch?.id?.substring(0,6).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">{log.count} eggs</span>
                  <button onClick={() => handleDelete(log.id)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Delete"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
            {eggLogs.length === 0 && <div className="p-8 text-center text-slate-500">No records found.</div>}
          </div>
        </div>
      </div>
    );
};

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/batches", icon: <Package size={20} />, label: "Batches" },
    { to: "/feed", icon: <Wheat size={20} />, label: "Feed Mgmt" },
    { to: "/eggs", icon: <Egg size={20} />, label: "Egg Tracking" }
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-50 font-sans overflow-hidden">
      <div className="md:hidden fixed top-0 w-full bg-slate-800 border-b border-slate-700 z-20 flex justify-between items-center p-4 shadow-sm">
        <div className="text-lg font-bold text-amber-500 flex items-center gap-2"><Egg className="w-5 h-5 text-amber-500" /> FarmTracker</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white transition p-1">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-10 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}/>}
      <aside className={`fixed md:relative top-0 left-0 h-full z-20 w-64 bg-slate-800 p-6 flex flex-col space-y-2 shrink-0 border-r border-slate-700 shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="text-xl font-bold mb-10 text-amber-500 hidden md:flex items-center gap-2 border-b border-slate-700 pb-4 shadow-sm pt-2"><Egg className="w-6 h-6 text-amber-500 drop-shadow-sm" /> FarmTracker</div>
        <div className="md:hidden text-lg font-bold text-slate-300 mb-6 border-b border-slate-700 pb-4 mt-2">Menu</div>
        <nav className="flex-1 space-y-2 font-medium text-slate-300">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border border-transparent ${location.pathname === link.to ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm' : 'hover:bg-slate-700 hover:text-white hover:border-slate-600'}`}>
              <span className={location.pathname === link.to ? 'text-amber-500' : 'text-slate-400'}>{link.icon}</span>{link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto w-full pt-20 md:pt-0 bg-slate-900">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router><Layout><Routes><Route path="/" element={<Dashboard />} /><Route path="/batches" element={<Batches />} /><Route path="/feed" element={<Feed />} /><Route path="/eggs" element={<Eggs />} /></Routes></Layout></Router>
  );
}

export default App;
