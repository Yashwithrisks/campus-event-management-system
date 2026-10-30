import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Users, CalendarDays } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { LoadingState, EmptyState } from '../components/UiHelpers';
import { getUsers, toggleSuspendUser } from '../services/adminService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getUsers(roleFilter ? { role: roleFilter } : {});
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function handleToggle(id) {
    try {
      await toggleSuspendUser(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  }

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'approvals', label: 'Pending Approvals', icon: FileCheck },
    { key: 'events', label: 'All Events', icon: CalendarDays },
    { key: 'users', label: 'User Management', icon: Users },
  ];

  function handleTabChange(key) {
    if (key === 'dashboard') navigate('/admin');
    else navigate(`/admin/${key}`);
  }

  return (
    <DashboardLayout
      title="User Management"
      sidebarItems={sidebarItems}
      activeTab="users"
      onTabChange={handleTabChange}
    >
      <div className="mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 text-slate-700">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.role}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.department}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggle(u._id)}
                        className={`text-xs px-3 py-1.5 rounded border ${
                          u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}