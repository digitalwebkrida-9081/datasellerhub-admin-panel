'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdDelete, MdRefresh, MdSearch, MdFilterList, MdStorage, MdFileDownload, MdContentCopy, MdCheckCircle, MdTimeline, MdTrendingUp, MdChevronLeft, MdChevronRight, MdEdit, MdSave, MdClose } from 'react-icons/md';
import { FaShoppingCart, FaFileAlt, FaDatabase, FaUsers } from 'react-icons/fa';

const LEADS_PER_PAGE = 15;
const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed'];

// Soothing, premium status styles
const STATUS_STYLES = {
    new: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10',
    contacted: 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/10',
    converted: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10',
    closed: 'bg-slate-50 text-slate-600 ring-1 ring-slate-600/10',
};

// Premium type icons and colors
const TYPE_CONFIG = {
    purchase_attempt: { label: 'Purchase', color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-600/10', icon: FaShoppingCart },
    sample_request: { label: 'Sample', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-600/10', icon: FaFileAlt },
    custom_database: { label: 'Custom DB', color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-600/10', icon: FaDatabase },
};

const TYPE_FILTERS = [
    { key: 'all', label: 'All Leads', icon: FaUsers },
    { key: 'purchase_attempt', label: 'Purchases', icon: FaShoppingCart },
    { key: 'sample_request', label: 'Samples', icon: FaFileAlt },
    { key: 'custom_database', label: 'Custom DB', icon: FaDatabase },
];

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [copiedEmail, setCopiedEmail] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [userRole, setUserRole] = useState('admin');
    const router = useRouter();

    useEffect(() => {
        // Default show timeline on large screens (xl breakpoint)
        if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
            setShowTimeline(true);
        }

        const role = localStorage.getItem('user_role') || 'admin';
        setUserRole(role);

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        setDeletingId(id);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.filter(lead => lead._id !== id));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            }
        } catch (error) {
            console.error("Error deleting lead:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Delete ${selectedIds.size} selected leads? This cannot be undone.`)) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.filter(l => !selectedIds.has(l._id)));
                setSelectedIds(new Set());
            }
        } catch (error) {
            console.error("Error bulk deleting:", error);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSaveNote = async () => {
        if (!editingNoteId) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${editingNoteId}/note`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteText })
            });
            const data = await res.json();
            if (data.success) {
                setLeads(prev => prev.map(l => l._id === editingNoteId ? { ...l, note: noteText } : l));
                setEditingNoteId(null);
                setNoteText('');
            } else {
                alert('Failed to save note');
            }
        } catch (error) {
            console.error("Error saving note:", error);
            alert('Error saving note');
        }
    };

    const startEditingNote = (lead) => {
        setEditingNoteId(lead._id);
        setNoteText(lead.note || '');
    };

    const cancelEditingNote = () => {
        setEditingNoteId(null);
        setNoteText('');
    };

    const copyEmail = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    // --- Computed Data ---
    const toTitle = (s) => (s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const parseDatasetInfo = (d) => {
        if (!d) return { category: '', location: '' };
        let category = d.category ? toTitle(d.category) : '';
        let location = d.location ? toTitle(d.location) : '';
        if (d.id && d.id.includes('-in-')) {
            const [catPart, locPart] = d.id.split('-in-');
            if (!category) category = toTitle(catPart);
            if (!location) location = toTitle(locPart);
        }
        return { category, location };
    };

    const convertedEmails = useMemo(() => {
        const sampleEmails = new Set(leads.filter(l => l.type === 'sample_request').map(l => l.email));
        const purchaseEmails = new Set(leads.filter(l => l.type === 'purchase_attempt').map(l => l.email));
        return new Set([...sampleEmails].filter(e => purchaseEmails.has(e)));
    }, [leads]);

    const stats = useMemo(() => {
        const today = new Date().toDateString();
        return {
            total: leads.length,
            purchases: leads.filter(l => l.type === 'purchase_attempt').length,
            samples: leads.filter(l => l.type === 'sample_request').length,
            today: leads.filter(l => new Date(l.createdAt).toDateString() === today).length,
        };
    }, [leads]);

    const popularDatasets = useMemo(() => {
        const counts = {};
        leads.forEach(l => {
            if (l.datasetDetails) {
                const { category, location } = parseDatasetInfo(l.datasetDetails);
                if (category) {
                    const key = `${category}|${location}`;
                    counts[key] = (counts[key] || 0) + 1;
                }
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([key, count]) => {
                const [category, location] = key.split('|');
                return { category, location, count };
            });
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesType = activeFilter === 'all' || lead.type === activeFilter;
            const matchesSearch = !searchTerm ||
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.type?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [leads, activeFilter, searchTerm]);

    const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
    const paginatedLeads = filteredLeads.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [activeFilter, searchTerm]);

    const allOnPageSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l._id));
    const toggleSelectAll = () => {
        if (allOnPageSelected) {
            setSelectedIds(prev => { const n = new Set(prev); paginatedLeads.forEach(l => n.delete(l._id)); return n; });
        } else {
            setSelectedIds(prev => { const n = new Set(prev); paginatedLeads.forEach(l => n.add(l._id)); return n; });
        }
    };

    const exportCSV = () => {
        const rows = filteredLeads.map(l => {
            const { category, location } = parseDatasetInfo(l.datasetDetails);
            return {
                Date: new Date(l.createdAt).toLocaleString(),
                Type: l.type,
                Name: l.name || '',
                Email: l.email,
                Phone: l.phone || '',
                Status: l.status || 'new',
                Category: category,
                Location: location,
                Message: l.message || '',
            };
        });
        const headers = Object.keys(rows[0] || {});
        const csvContent = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    function getTimeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    }

    if (loading && leads.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leads</h1>
                        <p className="text-slate-500 mt-1.5 ml-0.5">Track and manage your potential customers with ease.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-64 bg-white shadow-sm transition-all text-sm"
                            />
                            <MdSearch className="absolute left-3.5 top-3 text-slate-400" size={18} />
                        </div>
                        <button onClick={() => setShowTimeline(!showTimeline)} className={`border px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium text-sm transition ${showTimeline ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'} cursor-pointer`}>
                            <MdTimeline size={18} /> <span className="hidden sm:inline">Timeline</span>
                        </button>
                        <button onClick={exportCSV} disabled={filteredLeads.length === 0} className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 font-medium text-sm shadow-sm disabled:opacity-50 cursor-pointer">
                            <MdFileDownload size={18} /> <span className="hidden sm:inline">Export</span>
                        </button>
                        <button onClick={fetchLeads} className="bg-white border border-slate-200 text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 font-medium text-sm shadow-sm group cursor-pointer">
                            <MdRefresh size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {[
                        { label: 'Total Leads', value: stats.total, icon: FaUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Purchases', value: stats.purchases, icon: FaShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Samples', value: stats.samples, icon: FaFileAlt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Today', value: stats.today, icon: MdTrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className={stat.color} size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    {/* Main Table Area */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Filter Tabs & Bulk Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-5 gap-4">
                            <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-xl self-start">
                                {TYPE_FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setActiveFilter(f.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeFilter === f.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <f.icon size={14} className={activeFilter === f.key ? 'text-indigo-500' : 'text-slate-400'} />
                                        {f.label}
                                        {f.key !== 'all' && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${activeFilter === f.key ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                                {leads.filter(l => l.type === f.key).length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-2">
                                    <span className="text-sm font-semibold text-indigo-700">{selectedIds.size} selected</span>
                                    <div className="h-4 w-px bg-indigo-200"></div>
                                    {userRole === 'admin' && (
                                        <button onClick={handleBulkDelete} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 transition">
                                            <MdDelete size={16} /> <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    )}
                                    <button onClick={() => {
                                        const emails = leads.filter(l => selectedIds.has(l._id)).map(l => l.email).join(', ');
                                        navigator.clipboard.writeText(emails);
                                        alert('Emails copied!');
                                    }} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition">
                                        <MdContentCopy size={16} /> <span className="hidden sm:inline">Copy Emails</span>
                                    </button>
                                    <button onClick={() => setSelectedIds(new Set())} className="text-sm text-slate-400 hover:text-slate-600 ml-auto sm:ml-2">
                                        <MdClose size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden border border-slate-100">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className={`w-full text-left text-sm text-slate-600 ${showTimeline ? 'min-w-[1200px]' : ''}`}>
                                    <thead className="bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-5 w-12">
                                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                                            </th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Details</th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Inquiry Info</th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Internal Notes</th>
                                            <th className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-5 text-end text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedLeads.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-16 text-center text-slate-400 bg-slate-50/30">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                            <MdFilterList size={30} className="text-slate-300" />
                                                        </div>
                                                        <p className="font-medium text-slate-500">No leads found matching your criteria</p>
                                                        <p className="text-xs mt-1 text-slate-400">Try adjusting your filters or search terms</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedLeads.map((lead) => {
                                                const { category, location } = parseDatasetInfo(lead.datasetDetails);
                                                const isConverted = convertedEmails.has(lead.email);
                                                // Default type config if missing
                                                const typeConfig = TYPE_CONFIG[lead.type] || { label: lead.type, color: 'text-slate-600', bg: 'bg-slate-100', ring: 'ring-slate-500/10' };
                                                
                                                return (
                                                    <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                                                        <td className="px-6 py-4">
                                                            <input type="checkbox" checked={selectedIds.has(lead._id)} onChange={() => {
                                                                setSelectedIds(prev => { const n = new Set(prev); n.has(lead._id) ? n.delete(lead._id) : n.add(lead._id); return n; });
                                                            }} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20" />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-700 text-sm">{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                <span className="text-xs text-slate-400 font-medium">{new Date(lead.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col items-start gap-1.5">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.color} ${typeConfig.ring} ring-1 inset-0`}>
                                                                    {typeConfig.icon && <typeConfig.icon size={10} />}
                                                                    {typeConfig.label || lead.type.replace(/_/g, ' ')}
                                                                </span>
                                                                {isConverted && lead.type === 'sample_request' && (
                                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start border border-emerald-100">
                                                                        <MdCheckCircle size={10} /> Contacted
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-semibold text-slate-800 text-sm">{lead.name || 'Unknown User'}</span>
                                                                <div className="flex items-center gap-1.5 group/email cursor-pointer w-fit" onClick={() => copyEmail(lead.email)}>
                                                                    <span className="text-xs text-slate-500 group-hover/email:text-indigo-600 transition-colors">{lead.email}</span>
                                                                    {copiedEmail === lead.email ? <MdCheckCircle size={12} className="text-emerald-500" /> : <MdContentCopy size={12} className="text-slate-300 opacity-0 group-hover/email:opacity-100 transition-opacity" />}
                                                                </div>
                                                                {lead.phone && <span className="text-[11px] text-slate-400">{lead.phone}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 max-w-xs">
                                                            <div className="flex flex-col gap-1.5">
                                                                {lead.datasetDetails ? (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {category && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">{category}</span>}
                                                                        {location && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">📍 {location}</span>}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs italic">No dataset info</span>
                                                                )}
                                                                {lead.message && (
                                                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/50 p-1.5 rounded-md border border-slate-100/50">
                                                                        "{lead.message}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 min-w-[200px]">
                                                            {editingNoteId === lead._id ? (
                                                                <div className="bg-white p-2 border border-indigo-200 shadow-sm rounded-lg relative animate-in zoom-in-95 duration-200">
                                                                    <textarea
                                                                        value={noteText}
                                                                        onChange={(e) => setNoteText(e.target.value)}
                                                                        className="w-full text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none resize-none bg-transparent"
                                                                        rows="3"
                                                                        placeholder="Add a note..."
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-100">
                                                                        <button onClick={cancelEditingNote} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100 transition">
                                                                            <MdClose size={14} />
                                                                        </button>
                                                                        <button onClick={handleSaveNote} className="p-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm shadow-indigo-200 transition">
                                                                            <MdSave size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="group/note relative min-h-[2.5rem] hover:bg-yellow-50/50 p-2 -ml-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-yellow-100/50 flex flex-col justify-center" onClick={() => startEditingNote(lead)}>
                                                                    {lead.note ? (
                                                                        <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">{lead.note}</p>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-300 italic flex items-center gap-1"><MdEdit size={12} /> Add note</span>
                                                                    )}
                                                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                                        <MdEdit className="text-slate-400 hover:text-indigo-600" size={14} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="relative">
                                                                <select
                                                                    value={lead.status || 'new'}
                                                                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                                    className={`appearance-none text-xs font-bold px-3 py-1.5 pr-8 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500/30 transition-shadow ${STATUS_STYLES[lead.status || 'new']}`}
                                                                >
                                                                    {STATUS_OPTIONS.map(s => (
                                                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-end">
                                                            {userRole === 'admin' && (
                                                                <button
                                                                    onClick={() => handleDelete(lead._id)}
                                                                    disabled={deletingId === lead._id}
                                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 disabled:opacity-50"
                                                                    title="Delete Lead"
                                                                >
                                                                    {deletingId === lead._id ? (
                                                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <MdDelete size={18} />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Showing <span className="text-slate-700">{(currentPage - 1) * LEADS_PER_PAGE + 1}</span> - <span className="text-slate-700">{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)}</span> of <span className="text-slate-700">{filteredLeads.length}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-500">
                                            <MdChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                let page;
                                                if (totalPages <= 5) page = i + 1;
                                                else if (currentPage <= 3) page = i + 1;
                                                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                                else page = currentPage - 2 + i;
                                                return (
                                                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 transition-all text-slate-500">
                                            <MdChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Timeline + Popular Datasets */}
                    <div className={`xl:w-80 space-y-6 transition-all duration-500 ease-in-out flex-shrink-0 ${showTimeline ? 'translate-x-0 opacity-100 w-80' : 'translate-x-10 opacity-0 hidden w-0'}`}>
                        {/* Popular Datasets */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-5">
                            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><MdTrendingUp className="text-indigo-600" /></span> Popular Today
                            </h3>
                            {popularDatasets.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2"><MdTimeline className="text-slate-300" /></div>
                                    <p className="text-xs text-slate-400">No trending data yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {popularDatasets.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3 group cursor-default">
                                            <span className="text-md font-bold text-slate-200 group-hover:text-indigo-200 transition-colors w-6">#{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{d.category}</p>
                                                {d.location && <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300"></span> {d.location}</p>}
                                            </div>
                                            <span className="bg-slate-50 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 transition-colors text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-100 group-hover:border-indigo-100">{d.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-5">
                            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><MdTimeline className="text-blue-600" /></span> Live Activity
                            </h3>
                            <div className="relative pl-2">
                                <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-100"></div>
                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {leads.slice(0, 10).map((lead) => {
                                        const { category, location } = parseDatasetInfo(lead.datasetDetails);
                                        const timeAgo = getTimeAgo(lead.createdAt);
                                        const typeColor = lead.type === 'purchase_attempt' ? 'bg-indigo-500' : lead.type === 'sample_request' ? 'bg-emerald-500' : 'bg-violet-500';
                                        
                                        return (
                                            <div key={lead._id} className="relative pl-6 group">
                                                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white ring-1 ring-slate-100 ${typeColor} z-10`}></div>
                                                <div className="">
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        <span className="font-bold text-slate-800">{lead.name || 'Anonymous'}</span>
                                                        <span className="text-slate-400"> {lead.type === 'purchase_attempt' ? 'purchased' : lead.type === 'sample_request' ? 'requested sample' : 'inquired about'} </span>
                                                        {category && <span className="font-medium text-indigo-600 bg-indigo-50 px-1.5 rounded text-[10px]">{category}</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeAgo}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
