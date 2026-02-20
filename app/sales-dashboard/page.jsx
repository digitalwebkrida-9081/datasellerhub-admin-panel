'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdDragIndicator, MdContentCopy, MdCheckCircle, MdEmail, MdPerson, MdSearch, MdFilterList, MdWarning, MdPhone, MdClose, MdEdit, MdSave, MdEventNote, MdTrendingUp } from 'react-icons/md';
import { FaShoppingCart, FaFileAlt, FaDatabase, FaUsers } from 'react-icons/fa';

const STATUS_CONFIG = {
    new: { title: 'New Leads', bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' },
    contacted: { title: 'Contacted', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    converted: { title: 'Converted (Won)', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
    closed: { title: 'Closed (Lost)', bg: 'bg-slate-50/50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-200 text-slate-600' },
};

const TYPE_FILTERS = [
    { key: 'all', label: 'All', icon: FaUsers },
    { key: 'purchase_attempt', label: 'Purchases', icon: FaShoppingCart },
    { key: 'sample_request', label: 'Samples', icon: FaFileAlt },
    { key: 'custom_database', label: 'Custom DB', icon: FaDatabase },
];

export default function SalesDashboard() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedLead, setSelectedLead] = useState(null);
    const [noteText, setNoteText] = useState('');
    const router = useRouter();

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        if (!isAuth) {
            router.push('/login');
        } else {
            fetchLeads();
        }
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/all`);
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
            
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!data.success) {
                fetchLeads();
            }
        } catch (error) {
            console.error("Error updating status:", error);
            fetchLeads();
        }
    };

    const handleDragStart = (e, id) => {
        setDraggingId(id);
        e.dataTransfer.setData('leadId', id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.target.classList.add('opacity-50'), 0);
    };

    const handleDragEnd = (e) => {
        setDraggingId(null);
        e.target.classList.remove('opacity-50');
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) {
            handleStatusUpdate(leadId, status);
        }
    };

    const copyEmail = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    function getTimeAgo(dateStr) {
        if (!dateStr) return 'Unknown';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateStr).toLocaleDateString();
    }

    const handleSaveNote = async () => {
        if (!selectedLead) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${selectedLead._id}/note`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteText })
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.map(l => l._id === selectedLead._id ? { ...l, note: noteText } : l));
                setSelectedLead(prev => ({ ...prev, note: noteText }));
            } else {
                alert('Failed to save note');
            }
        } catch (error) {
            console.error("Error saving note:", error);
            alert('Error saving note');
        }
    };

    if (loading && leads.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    const filteredLeads = leads.filter(lead => {
        const matchesType = activeFilter === 'all' || lead.type === activeFilter;
        const matchesSearch = !searchTerm || 
            lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getColumnLeads = (status) => filteredLeads.filter(l => (l.status || 'new') === status);

    const metrics = {
        totalActive: leads.filter(l => l.status !== 'closed').length,
        converted: leads.filter(l => l.status === 'converted').length,
    };
    const conversionRate = leads.length > 0 ? Math.round((metrics.converted / leads.length) * 100) : 0;

    return (
        <AdminLayout>
            <div className="max-w-400 mx-auto min-h-[calc(100vh-6rem)] flex flex-col p-4 md:p-6 lg:p-8 relative">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Sales Pipeline</h1>
                            {/* Metrics */}
                            <div className="hidden sm:flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm">
                                <span className="font-semibold text-indigo-700">{metrics.totalActive} Active</span>
                                <div className="w-px h-3 bg-indigo-200"></div>
                                <span className="font-semibold text-emerald-600">{conversionRate}% Won</span>
                            </div>
                        </div>
                        <p className="text-sm md:text-base text-slate-500 mt-1">Manage leads, track progress, and close deals.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full xl:w-64 bg-white shadow-sm transition-all text-sm h-10"
                            />
                            <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
                            {TYPE_FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setActiveFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${activeFilter === f.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <f.icon size={12} />
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchLeads} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2 font-medium shadow-sm h-10 sm:w-auto w-full">
                            <MdRefresh size={18} />
                        </button>
                    </div>
                </div>

                {/* Container: Stack on small screens, flex row on large screens without horizontal scroll */}
                <div className="flex flex-col lg:flex-row flex-1 gap-4 pb-4 lg:pb-0 overflow-hidden text-clip lg:h-full">
                    {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
                        const colLeads = getColumnLeads(statusKey);
                        return (
                            <div 
                                key={statusKey}
                                className={`flex-1 min-w-full lg:min-w-0 min-h-125 lg:min-h-0 rounded-2xl border ${config.border} ${config.bg} flex flex-col overflow-hidden transition-colors ${draggingId ? 'bg-opacity-100 border-dashed border-2' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, statusKey)}
                            >
                                <div className={`p-4 border-b ${config.border} flex justify-between items-center bg-white/50 backdrop-blur-sm`}>
                                    <h3 className={`font-bold text-sm ${config.text} flex items-center gap-2`}>
                                        <span className={`w-2 h-2 rounded-full ${config.icon.split(' ')[0]}`}></span>
                                        {config.title}
                                    </h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white shadow-sm ${config.text}`}>
                                        {colLeads.length}
                                    </span>
                                </div>
                                
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-50">
                                    {colLeads.length === 0 && (
                                        <div className="h-full min-h-25 flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-300/50 rounded-xl bg-white/30 italic">
                                            Drop leads here
                                        </div>
                                    )}
                                    {colLeads.map(lead => {
                                        const isStale = statusKey === 'new' && (Date.now() - new Date(lead.createdAt).getTime() > 24 * 60 * 60 * 1000);
                                        return (
                                            <div 
                                                key={lead._id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, lead._id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => { setSelectedLead(lead); setNoteText(lead.note || ''); }}
                                                className={`bg-white p-4 rounded-xl shadow-sm border cursor-grab hover:shadow-md transition-all group active:cursor-grabbing relative overflow-hidden ${isStale ? 'border-red-300 hover:border-red-400' : 'border-slate-100 hover:border-indigo-100'}`}
                                            >
                                                {isStale && <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-bl-full flex items-start justify-end p-1.5 border-l border-b border-red-500/20"><MdWarning className="text-red-500" size={12} /></div>}
                                                
                                                <div className="flex justify-between items-start mb-2 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <MdPerson className="text-slate-400" />
                                                        <span className="font-bold text-slate-800 text-sm truncate max-w-37.5" title={lead.name}>{lead.name || 'Unknown User'}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 group/email w-fit">
                                                    <MdEmail size={12} className="text-slate-400" /> 
                                                    <span className="truncate max-w-45" title={lead.email}>{lead.email}</span>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors border border-slate-100">
                                                        <MdEmail size={14} />
                                                    </a>
                                                    {lead.phone && (
                                                        <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors border border-slate-100">
                                                            <MdPhone size={14} />
                                                        </a>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); copyEmail(lead.email); }} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors border border-slate-100">
                                                        {copiedEmail === lead.email ? <MdCheckCircle size={14} className="text-emerald-500" /> : <MdContentCopy size={14} />}
                                                    </button>
                                                    
                                                    {lead.note && (
                                                        <div className="ml-auto p-1.5 text-amber-500 bg-amber-50 rounded-lg border border-amber-100" title="Has internal note">
                                                            <MdEventNote size={14} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-50">
                                                    <span className={`font-semibold px-2 py-0.5 rounded-md border ${lead.type === 'purchase_attempt' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : lead.type === 'sample_request' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-violet-50 border-violet-100 text-violet-700'}`}>
                                                        {lead.type ? lead.type.replace('_', ' ').charAt(0).toUpperCase() + lead.type.replace('_', ' ').slice(1) : 'Unknown'}
                                                    </span>
                                                    <span className={`font-semibold bg-slate-50 px-1.5 py-0.5 rounded border ${isStale ? 'text-red-500 border-red-100 bg-red-50' : 'text-slate-400 border-slate-100'}`}>
                                                        {getTimeAgo(lead.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Notes & Details Drawer */}
                {selectedLead && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedLead(null)}></div>
                        <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-100">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <MdPerson className="text-indigo-500" /> Lead Details
                                </h2>
                                <button onClick={() => setSelectedLead(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                                    <MdClose size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedLead.name || 'Unknown User'}</h3>
                                    <div className="space-y-2 mt-4 text-sm">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><MdEmail size={16} /></div>
                                            <a href={`mailto:${selectedLead.email}`} className="hover:text-indigo-600 hover:underline truncate">{selectedLead.email}</a>
                                        </div>
                                        {selectedLead.phone && (
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><MdPhone size={16} /></div>
                                                <a href={`tel:${selectedLead.phone}`} className="hover:text-emerald-600 hover:underline">{selectedLead.phone}</a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><MdTrendingUp size={16} /></div>
                                            <select 
                                                value={selectedLead.status || 'new'}
                                                onChange={(e) => {
                                                    handleStatusUpdate(selectedLead._id, e.target.value);
                                                    setSelectedLead(prev => ({ ...prev, status: e.target.value }));
                                                }}
                                                className="flex-1 py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium"
                                            >
                                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {selectedLead.message && (
                                    <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FaFileAlt size={10} /> Message</h4>
                                        <p className="text-sm text-slate-700 italic">"{selectedLead.message}"</p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MdEventNote size={14} /> Internal Notes</h4>
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Add notes about this lead here..."
                                        className="w-full text-sm text-slate-700 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[150px] resize-y bg-slate-50 focus:bg-white transition-colors"
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button 
                                            onClick={handleSaveNote}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                                        >
                                            <MdSave size={16} /> Save Notes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
