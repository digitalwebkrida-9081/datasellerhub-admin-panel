'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdSearch, MdFilterList, MdClear, MdStorage, MdDashboard, MdEdit, MdChevronLeft, MdChevronRight } from 'react-icons/md';



export default function B2BDataPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        country: '',
        city: '',
        state: '',
        category: ''
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 15;
    
    const [stats, setStats] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedDatasetName, setSelectedDatasetName] = useState("");
    
    // Edit Price State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ id: '', price: '', previousPrice: '' });

    // Dropdown Options State
    const [countryOptions, setCountryOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.country) params.append('country', filters.country);
            if (filters.city) params.append('city', filters.city);
            if (filters.state) params.append('state', filters.state);
            if (filters.category) params.append('category', filters.category);
            
            params.append('page', page);
            params.append('limit', limit);

            const res = await fetch(`${API_URL}/api/scraper/admin/datasets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalRecords(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Error fetching B2B data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async (scope, parentParams = {}) => {
        try {
            const params = new URLSearchParams({ scope, ...parentParams });
            const res = await fetch(`${API_URL}/api/scraper/admin/filter-options?${params.toString()}`);
            const data = await res.json();
            if (data.success) return data.data;
            return [];
        } catch (error) {
            console.error(`Error fetching ${scope} options:`, error);
            return [];
        }
    };

    const fetchStats = async () => {
        // console.log("Fetching stats from:", `${API_URL}/api/scraper/admin/stats`); // DEBUG
        try {
            const res = await fetch(`${API_URL}/api/scraper/admin/stats`);
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        if (role !== 'admin') {
            router.push('/sales-dashboard'); // Redirect sales away from here
            return;
        }

        const loadCountries = async () => {
            const options = await fetchOptions('country');
            setCountryOptions(options);
        };
        
        loadCountries();
        fetchLeads();
        fetchStats();
    }, []);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    // Fetch on page or filter change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, filters]);

    useEffect(() => {
        if (filters.country) {
            fetchOptions('state', { country: filters.country }).then(setStateOptions);
            setCityOptions([]);
            // setCategoryOptions([]); // Managed by dedicated effect
        } else {
            setStateOptions([]);
            setCityOptions([]);
            // setCategoryOptions([]); // Managed by dedicated effect
        }
    }, [filters.country]);

    useEffect(() => {
        if (filters.state) {
            fetchOptions('city', { country: filters.country, state: filters.state }).then(setCityOptions);
        } else {
            setCityOptions([]);
        }
    }, [filters.state]);

    // Dedicated Effect for Categories
    useEffect(() => {
        if (filters.country) {
            const params = { country: filters.country };
            if (filters.state) params.state = filters.state;
            if (filters.city) params.city = filters.city;
            
            fetchOptions('category', params).then(setCategoryOptions);
        } else {
            setCategoryOptions([]);
        }
    }, [filters.country, filters.state, filters.city]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        let newFilters = { ...filters, [name]: value };
        
        if (name === 'country') {
            newFilters.state = '';
            newFilters.city = '';
            newFilters.category = '';
        } else if (name === 'state') {
            newFilters.city = '';
            newFilters.category = '';
        } else if (name === 'city') {
            newFilters.category = '';
        }

        setFilters(newFilters);
    };

    const clearFilters = () => {
        setFilters({
            country: '',
            city: '',
            state: '',
            category: ''
        });
    };

    const handlePreview = async (pathId, category) => {
        setSelectedDatasetName(category);
        setIsPreviewOpen(true);
        setPreviewData(null); 
        
        try {
            const res = await fetch(`${API_URL}/api/scraper/admin/dataset-preview?pathId=${encodeURIComponent(pathId)}`);
            const data = await res.json();
            if (data.success) {
                setPreviewData(data.data);
            }
        } catch (error) {
            console.error("Error fetching preview:", error);
        }
    };

    const handleEditPrice = (lead) => {
        setEditData({ 
            id: lead._id, 
            price: lead.price ? lead.price.replace('$', '') : '', 
            previousPrice: '' 
        });
        setEditModalOpen(true);
    };

    const savePrice = async () => {
        try {
            const res = await fetch(`${API_URL}/api/scraper/dataset/update-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: editData.id, // Backend expects 'filePath' for direct path access
                    price: `$${editData.price}`,
                    previousPrice: editData.previousPrice ? `$${editData.previousPrice}` : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setEditModalOpen(false);
                fetchLeads(); // Refresh table
            } else {
                alert("Failed to update price: " + data.message);
            }
        } catch (error) {
            console.error("Error updating price:", error);
            alert("Error updating price");
        }
    };

    // Bulk Update State
    const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
    const [bulkUpdateData, setBulkUpdateData] = useState({ price: '', previousPrice: '' });

    // ... existing handleEditPrice ...
    
    const handleBulkUpdate = () => {
        setBulkUpdateData({ price: '', previousPrice: '' });
        setBulkUpdateModalOpen(true);
    };

    const saveBulkPrice = async () => {
        if (!filters.country || !filters.category) {
            alert("Please select at least a Country and a Category.");
            return;
        }

        if (!confirm(`Are you sure you want to update the price for ALL ${filters.category} datasets in ${filters.city || filters.state || filters.country}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/scraper/dataset/bulk-update-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: filters.country,
                    state: filters.state,
                    city: filters.city,
                    category: filters.category,
                    price: `$${bulkUpdateData.price}`,
                    previousPrice: bulkUpdateData.previousPrice ? `$${bulkUpdateData.previousPrice}` : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setBulkUpdateModalOpen(false);
                fetchLeads();
            } else {
                alert("Failed to bulk update: " + data.message);
            }
        } catch (error) {
            console.error("Error bulk updating price:", error);
            alert("Error bulk updating price");
        }
    };

    const SelectInput = ({ label, name, value, options, disabled, placeholder }) => (
        <div className="relative">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{label}</label>
             <select 
                name={name}
                value={value}
                onChange={handleFilterChange}
                disabled={disabled}
                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none disabled:bg-slate-100 disabled:text-slate-400"
             >
                <option value="">{placeholder || `Select ${label}...`}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
             <div className="absolute right-3 top-[2.1rem] pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
        </div>
    );

    // ... existing filter logic ...

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">B2B Database</h1>
                    <p className="text-slate-500 mt-1">Browse and filter B2B datasets (File System)</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchLeads} 
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer"
                    >
                        <MdRefresh size={20} />
                        Refresh
                    </button>
                    {(filters.country || filters.city || filters.state || filters.category) && (
                        <button 
                            onClick={clearFilters} 
                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition flex items-center gap-2 font-medium"
                        >
                            <MdClear size={20} />
                            Clear Filters
                        </button>
                    )}
                    {filters.country && filters.category && (
                        <button 
                            onClick={handleBulkUpdate}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium shadow-sm cursor-pointer"
                        >
                            <MdEdit size={20} />
                            Bulk Update Price
                        </button>
                    )}
                </div>
            </div>
            
            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard 
                        title="Total Datasets" 
                        value={stats.totalDatasets} 
                        icon={<MdStorage size={24} />} 
                    />
                    <StatsCard 
                        title="Total Records" 
                        value={stats.totalRecords.toLocaleString()} 
                        icon={<MdFilterList size={24} />} 
                    />
                     <StatsCard 
                        title="Top Category" 
                        value={stats.topCategories?.[0]?.name || "N/A"} 
                        subtext={stats.topCategories?.[0]?.count ? `${stats.topCategories[0].count} datasets` : ''}
                        icon={<MdDashboard size={24} />} 
                    />
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <SelectInput 
                    label="Country" 
                    name="country" 
                    value={filters.country} 
                    options={countryOptions} 
                />
                <SelectInput 
                    label="State" 
                    name="state" 
                    value={filters.state} 
                    options={stateOptions} 
                    disabled={!filters.country}
                />
                <SelectInput 
                    label="City" 
                    name="city" 
                    value={filters.city} 
                    options={cityOptions} 
                    disabled={!filters.state}
                />
                <SelectInput 
                    label="Category" 
                    name="category" 
                    value={filters.category} 
                    options={categoryOptions} 
                    disabled={!filters.country}
                />
            </div>

            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">Business Name (Location / Category)</th>
                                <th className="px-6 py-4">Total Records</th>
                                <th className="px-6 py-4">Last Update</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        <div className="flex flex-col items-center">
                                            <MdFilterList size={40} className="mb-2 opacity-50" />
                                            <p>No data found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-blue-50/30 transition duration-150 group">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-900 block">{lead.category}</span>
                                            <span className="text-xs text-slate-500">{lead.location}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-700">{lead.totalRecords} Records</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(lead.lastUpdate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-emerald-600">{lead.price}</span>
                                                <button onClick={() => handleEditPrice(lead)} className="text-slate-400 hover:text-blue-600 transition p-1 hover:bg-slate-100 rounded">
                                                    <MdEdit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handlePreview(lead._id, lead.category)}
                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                                            >
                                                Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">
                         Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalRecords)} of {totalRecords}
                    </p>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1} 
                            className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                        >
                            <MdChevronLeft size={20} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (page <= 3) pageNum = i + 1;
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i; // Center current page
                            return (
                                <button 
                                    key={pageNum} 
                                    onClick={() => setPage(pageNum)} 
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition ${page === pageNum ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages} 
                            className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
            
            <PreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                name={selectedDatasetName} 
                data={previewData} 
            />
            <EditPriceModal 
                isOpen={editModalOpen} 
                onClose={() => setEditModalOpen(false)} 
                data={editData} 
                setData={setEditData} 
                onSave={savePrice} 
            />
            <EditPriceModal 
                isOpen={bulkUpdateModalOpen} 
                onClose={() => setBulkUpdateModalOpen(false)} 
                data={bulkUpdateData} 
                setData={setBulkUpdateData} 
                onSave={saveBulkPrice}
                title={`Bulk Update Price`} 
            />
        </AdminLayout>
    );
}

const PreviewModal = ({ isOpen, onClose, name, data }) => {
    // ... existing PreviewModal ...
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Preview: {name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <MdClear size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6">
                    {!data ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                         <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0">
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Website</th>
                                    <th className="px-4 py-3">Address</th>
                                    <th className="px-4 py-3">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-800">{row.name}</td>
                                        <td className="px-4 py-2">{row.phone_number || '-'}</td>
                                        <td className="px-4 py-2 truncate max-w-[200px]">
                                            {row.website ? <a href={row.website} target="_blank" className="text-blue-600 hover:underline">Link</a> : '-'}
                                        </td>
                                        <td className="px-4 py-2 truncate max-w-[300px]">{row.full_address}</td>
                                        <td className="px-4 py-2">{row.rating || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const EditPriceModal = ({ isOpen, onClose, data, setData, onSave, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{title || "Edit Price"}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                        <input 
                            type="number" 
                            value={data.price} 
                            onChange={e => setData({...data, price: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Previous Price ($) <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input 
                            type="number" 
                            value={data.previousPrice} 
                            onChange={e => setData({...data, previousPrice: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                    <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);
