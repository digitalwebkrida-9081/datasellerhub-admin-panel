'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdDelete, MdRefresh, MdSearch, MdFilterList } from 'react-icons/md';

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
        
        setDeletingId(id);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/forms/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            
            if (data.success) {
                setLeads(prev => prev.filter(lead => lead._id !== id));
            } else {
                alert("Failed to delete lead");
            }
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("Error deleting lead");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredLeads = leads.filter(lead => 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && leads.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Leads Management</h1>
                    <p className="text-slate-500 mt-1">Manage and track your form submissions</p>
                </div>
                <div className="flex gap-3">
                     <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search leads..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                        <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    </div>
                    <button 
                        onClick={fetchLeads} 
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium"
                    >
                        <MdRefresh size={20} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        <div className="flex flex-col items-center">
                                            <MdFilterList size={40} className="mb-2 opacity-50" />
                                            <p>No leads found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-blue-50/30 transition duration-150 group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                            <div className="text-xs opacity-75">{new Date(lead.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                                lead.type === 'custom_database' ? 'bg-purple-100 text-purple-700' :
                                                lead.type === 'sample_request' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    lead.type === 'custom_database' ? 'bg-purple-500' :
                                                    lead.type === 'sample_request' ? 'bg-emerald-500' :
                                                    'bg-blue-500'
                                                }`}></span>
                                                {lead.type?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{lead.name || 'Unknown'}</span>
                                                <span className="text-blue-600 hover:underline cursor-pointer text-xs">{lead.email}</span>
                                                {lead.phone && <span className="text-xs text-slate-400 mt-0.5">{lead.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm">
                                            {lead.message && (
                                                <p className="text-slate-600 truncate mb-1" title={lead.message}>
                                                    {lead.message}
                                                </p>
                                            )}
                                            {lead.datasetDetails && (
                                                <div className="inline-block text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-500">
                                                    Moving: <strong>{lead.datasetDetails.name}</strong>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(lead._id)}
                                                disabled={deletingId === lead._id}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all group-hover:opacity-100 opacity-0 transform scale-90 group-hover:scale-100 disabled:opacity-50"
                                                title="Delete Lead"
                                            >
                                                {deletingId === lead._id ? (
                                                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <MdDelete size={20} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
