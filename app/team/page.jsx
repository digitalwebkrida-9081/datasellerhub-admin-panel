'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdPersonAdd, MdEdit, MdDelete, MdClose, MdAdminPanelSettings, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function TeamPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'sales' });
    const [showPassword, setShowPassword] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        if (role !== 'admin') {
            router.push('/sales-dashboard'); // Redirect sales away
            return;
        }

        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            setFormData({ username: user.username, password: '', role: user.role });
        } else {
            setFormData({ username: '', password: '', role: 'sales' });
        }
        setError('');
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setError('');
        setShowPassword(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');

        try {
            const endpoint = editingUser 
                ? `${API_URL}/api/users/${editingUser._id}`
                : `${API_URL}/api/users`;
            
            const method = editingUser ? 'PUT' : 'POST';

            // Only require password on creation, optional on edit
            if (!editingUser && !formData.password) {
                setError('Password is required for new users');
                setActionLoading(false);
                return;
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                handleCloseModal();
                fetchUsers();
            } else {
                setError(data.message || 'An error occurred');
            }
        } catch (err) {
            console.error("Error saving user:", err);
            setError('Could not connect to the server');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (username === 'admin') {
            alert('Cannot delete the primary admin account.');
            return;
        }

        if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
            } else {
                alert(data.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error("Error deleting user:", err);
            alert('Error deleting user');
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Team Settings</h1>
                    <p className="text-slate-500 mt-1">Manage admin and sales representatives</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchUsers} 
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium"
                    >
                        <MdRefresh size={20} />
                        Refresh
                    </button>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
                    >
                        <MdPersonAdd size={20} />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Created Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-blue-50/30 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {user.role === 'admin' ? <MdAdminPanelSettings size={20} /> : <MdPerson size={20} />}
                                                </div>
                                                <span className="font-semibold text-slate-900">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit User"
                                                >
                                                    <MdEdit size={18} />
                                                </button>
                                                {user.username !== 'admin' && (
                                                    <button 
                                                        onClick={() => handleDelete(user._id, user.username)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete User"
                                                    >
                                                        <MdDelete size={18} />
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
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {editingUser ? <MdEdit className="text-blue-600" /> : <MdPersonAdd className="text-blue-600" />}
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition">
                                <MdClose size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Username {editingUser && <span className="text-slate-400 font-normal">(Small-case only)</span>}
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    disabled={editingUser && editingUser.username === 'admin'}
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                                    placeholder="Enter username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Password {editingUser && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full pl-4 pr-12 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder={editingUser ? "Enter new password" : "Enter secure password"}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                                <select 
                                    value={formData.role}
                                    disabled={editingUser && editingUser.username === 'admin'}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 cursor-pointer appearance-none"
                                >
                                    <option value="sales">Sales Representative</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal} 
                                    className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm disabled:opacity-70 flex items-center gap-2"
                                >
                                    {actionLoading ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                                    ) : (
                                        'Save User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
