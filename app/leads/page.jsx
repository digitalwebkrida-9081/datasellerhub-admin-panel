'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdDelete, MdRefresh, MdSearch, MdFilterList, MdStorage, MdFileDownload, MdContentCopy, MdCheckCircle, MdTimeline, MdTrendingUp, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { FaShoppingCart, FaFileAlt, FaDatabase, FaUsers } from 'react-icons/fa';

const LEADS_PER_PAGE = 15;
const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed'];
const STATUS_COLORS = {
    new: 'bg-sky-100 text-sky-700 border-sky-200',
    contacted: 'bg-amber-100 text-amber-700 border-amber-200',
    converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
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
    const router = useRouter();

    useEffect(() => {
        // Default show timeline on large screens
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setShowTimeline(true);
        }

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

    // Conversion tracking: emails that have both sample_request and purchase_attempt
    const convertedEmails = useMemo(() => {
        const sampleEmails = new Set(leads.filter(l => l.type === 'sample_request').map(l => l.email));
        const purchaseEmails = new Set(leads.filter(l => l.type === 'purchase_attempt').map(l => l.email));
        return new Set([...sampleEmails].filter(e => purchaseEmails.has(e)));
    }, [leads]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        return {
            total: leads.length,
            purchases: leads.filter(l => l.type === 'purchase_attempt').length,
            samples: leads.filter(l => l.type === 'sample_request').length,
            today: leads.filter(l => new Date(l.createdAt).toDateString() === today).length,
        };
    }, [leads]);

    // Popular datasets
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

    // Filtering & pagination
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

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [activeFilter, searchTerm]);

    // Select all on current page
    const allOnPageSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedIds.has(l._id));
    const toggleSelectAll = () => {
        if (allOnPageSelected) {
            setSelectedIds(prev => { const n = new Set(prev); paginatedLeads.forEach(l => n.delete(l._id)); return n; });
        } else {
            setSelectedIds(prev => { const n = new Set(prev); paginatedLeads.forEach(l => n.add(l._id)); return n; });
        }
    };

    // Export CSV
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

    if (loading && leads.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Leads Management</h1>
                    <p className="text-slate-500 mt-1">Manage, track, and analyze your leads</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                        />
                        <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    </div>
                    <button onClick={() => setShowTimeline(!showTimeline)} className={`border px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium text-sm transition ${showTimeline ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                        <MdTimeline size={18} /> Timeline
                    </button>
                    <button onClick={exportCSV} disabled={filteredLeads.length === 0} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 font-medium text-sm disabled:opacity-50">
                        <MdFileDownload size={18} /> Export CSV
                    </button>
                    <button onClick={fetchLeads} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 font-medium text-sm">
                        <MdRefresh size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FaUsers className="text-blue-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-xs text-slate-500 font-medium">Total Leads</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><FaShoppingCart className="text-indigo-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.purchases}</p>
                            <p className="text-xs text-slate-500 font-medium">Purchases</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FaFileAlt className="text-emerald-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.samples}</p>
                            <p className="text-xs text-slate-500 font-medium">Samples</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><MdTrendingUp className="text-amber-600" size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
                            <p className="text-xs text-slate-500 font-medium">Today</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Table Area */}
                <div className="flex-1 min-w-0">
                    {/* Filter Tabs */}
                    <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${activeFilter === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                            >
                                <f.icon size={14} />
                                {f.label}
                                {f.key !== 'all' && (
                                    <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded-full ml-1">
                                        {leads.filter(l => l.type === f.key).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                            <span className="text-sm font-medium text-blue-700">{selectedIds.size} selected</span>
                            <button onClick={handleBulkDelete} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                                <MdDelete size={16} /> Delete Selected
                            </button>
                            <button onClick={() => {
                                const emails = leads.filter(l => selectedIds.has(l._id)).map(l => l.email).join(', ');
                                navigator.clipboard.writeText(emails);
                                alert('Emails copied to clipboard!');
                            }} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <MdContentCopy size={14} /> Copy Emails
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="text-sm text-slate-500 hover:text-slate-700 ml-auto">Clear</button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-3 w-10">
                                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="rounded border-slate-300 accent-blue-600" />
                                        </th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                                <MdFilterList size={40} className="mx-auto mb-2 opacity-50" />
                                                <p>No leads found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedLeads.map((lead) => {
                                            const { category, location } = parseDatasetInfo(lead.datasetDetails);
                                            const isConverted = convertedEmails.has(lead.email);
                                            return (
                                                <tr key={lead._id} className="hover:bg-blue-50/30 transition duration-150 group">
                                                    <td className="px-4 py-3">
                                                        <input type="checkbox" checked={selectedIds.has(lead._id)} onChange={() => {
                                                            setSelectedIds(prev => { const n = new Set(prev); n.has(lead._id) ? n.delete(lead._id) : n.add(lead._id); return n; });
                                                        }} className="rounded border-slate-300 accent-blue-600" />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                                                        {new Date(lead.createdAt).toLocaleDateString()}
                                                        <div className="opacity-75">{new Date(lead.createdAt).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                                            lead.type === 'custom_database' ? 'bg-purple-100 text-purple-700' :
                                                            lead.type === 'sample_request' ? 'bg-emerald-100 text-emerald-700' :
                                                            lead.type === 'purchase_attempt' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                lead.type === 'custom_database' ? 'bg-purple-500' :
                                                                lead.type === 'sample_request' ? 'bg-emerald-500' :
                                                                lead.type === 'purchase_attempt' ? 'bg-blue-500' : 'bg-slate-400'
                                                            }`}></span>
                                                            {lead.type?.replace(/_/g, ' ').toUpperCase()}
                                                        </span>
                                                        {isConverted && lead.type === 'sample_request' && (
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    <MdCheckCircle size={10} /> CONTACTED
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900 text-sm">{lead.name || 'Unknown'}</span>
                                                            <span className="text-blue-600 text-xs flex items-center gap-1 cursor-pointer group/email" onClick={() => copyEmail(lead.email)}>
                                                                {lead.email}
                                                                {copiedEmail === lead.email ? (
                                                                    <MdCheckCircle size={12} className="text-emerald-500" />
                                                                ) : (
                                                                    <MdContentCopy size={10} className="opacity-0 group-hover/email:opacity-100 transition" />
                                                                )}
                                                            </span>
                                                            {lead.phone && <span className="text-xs text-slate-400 mt-0.5">{lead.phone}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs">
                                                        {lead.message && (
                                                            <p className="text-slate-600 truncate mb-1 text-xs" title={lead.message}>{lead.message}</p>
                                                        )}
                                                        {lead.datasetDetails && (
                                                            <div className="space-y-1">
                                                                {category && (
                                                                    <div className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-blue-700 font-medium mr-1">
                                                                        <MdStorage size={11} /> {category}
                                                                    </div>
                                                                )}
                                                                {location && (
                                                                    <div className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-700 font-medium">
                                                                        📍 {location}
                                                                    </div>
                                                                )}
                                                                {(lead.datasetDetails.name || (category && location)) && (
                                                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                                                        {lead.datasetDetails.name || `List Of ${category} in ${location}`}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={lead.status || 'new'}
                                                            onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none transition ${STATUS_COLORS[lead.status || 'new']}`}
                                                        >
                                                            {STATUS_OPTIONS.map(s => (
                                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleDelete(lead._id)}
                                                            disabled={deletingId === lead._id}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {deletingId === lead._id ? (
                                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <MdDelete size={18} />
                                                            )}
                                                        </button>
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
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs text-slate-500">
                                    Showing {(currentPage - 1) * LEADS_PER_PAGE + 1}-{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition">
                                        <MdChevronLeft size={20} />
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let page;
                                        if (totalPages <= 5) page = i + 1;
                                        else if (currentPage <= 3) page = i + 1;
                                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                        else page = currentPage - 2 + i;
                                        return (
                                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-md text-sm font-medium transition ${currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition">
                                        <MdChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Timeline + Popular Datasets */}
                <div className={`lg:w-80 space-y-4 transition-all duration-300 ${showTimeline ? 'block' : 'hidden'}`}>
                    {/* Popular Datasets */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <MdTrendingUp className="text-blue-600" /> Popular Datasets
                        </h3>
                        {popularDatasets.length === 0 ? (
                            <p className="text-xs text-slate-400">No dataset data yet</p>
                        ) : (
                            <div className="space-y-2.5">
                                {popularDatasets.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-300 w-5">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{d.category}</p>
                                            {d.location && <p className="text-[11px] text-slate-400 truncate">📍 {d.location}</p>}
                                        </div>
                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <MdTimeline className="text-indigo-600" /> Recent Activity
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {leads.slice(0, 10).map((lead) => {
                                const { category, location } = parseDatasetInfo(lead.datasetDetails);
                                const timeAgo = getTimeAgo(lead.createdAt);
                                return (
                                    <div key={lead._id} className="flex gap-3 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full mt-1 ${
                                                lead.type === 'purchase_attempt' ? 'bg-blue-500' :
                                                lead.type === 'sample_request' ? 'bg-emerald-500' : 'bg-purple-500'
                                            }`}></div>
                                            <div className="w-px h-full bg-slate-200 mt-1"></div>
                                        </div>
                                        <div className="pb-3 min-w-0">
                                            <p className="text-xs text-slate-700">
                                                <strong>{lead.name || 'Someone'}</strong>{' '}
                                                {lead.type === 'purchase_attempt' ? 'purchased' :
                                                 lead.type === 'sample_request' ? 'requested sample of' : 'requested custom DB'}
                                                {category && <span className="text-blue-600 font-medium"> {category}</span>}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

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
