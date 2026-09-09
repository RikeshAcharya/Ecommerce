import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  company_name: string | null;
  phone_number: string;
  created_at: string;     // from Django
  date_joined: string;    // from Django – added to serializer
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const resetPage = useCallback(() => setPage(1), []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      resetPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, resetPage]);

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [userTypeFilter, staffFilter, resetPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/users/?page=${page}`;
      if (debouncedSearch) url += `&search=${debouncedSearch}`;
      if (userTypeFilter) url += `&user_type=${userTypeFilter}`;
      if (staffFilter !== '') url += `&is_staff=${staffFilter}`;
      const res = await apiClient.get(url);
      setUsers(res.data.results || res.data);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 20));
    } catch (err) {
      setError('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, userTypeFilter, staffFilter]);

  const toggleUserActive = async (userId: number, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}/`, { is_active: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update user status.';
      alert(msg);
      console.error(err);
    }
  };

  const toggleUserStaff = async (userId: number, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}/`, { is_staff: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update staff status.';
      alert(msg);
      console.error(err);
    }
  };

  const toggleUserVerified = async (userId: number, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}/`, { is_verified: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update verification status.';
      alert(msg);
      console.error(err);
    }
  };

  // --- Inline styles ---
  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' },
    heading: { fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      marginBottom: '2rem',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '0.75rem 0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' },
    td: { padding: '0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9' },
    badge: (active: boolean) => ({
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: active ? '#d1fae5' : '#fee2e2',
      color: active ? '#065f46' : '#991b1b',
    }),
    button: {
      padding: '0.25rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      background: '#2563eb',
      color: '#fff',
      marginRight: '0.5rem',
    },
    buttonDanger: {
      padding: '0.25rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      background: '#dc2626',
      color: '#fff',
      marginRight: '0.5rem',
    },
    buttonSuccess: {
      padding: '0.25rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      background: '#16a34a',
      color: '#fff',
      marginRight: '0.5rem',
    },
    filterRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap' as const,
    },
    input: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      flex: 1,
      minWidth: '200px',
    },
    select: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '1.5rem',
    },
    pageButton: (active: boolean) => ({
      padding: '0.5rem 1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#1e293b',
      cursor: 'pointer',
    }),
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modalBox: {
      background: '#fff',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto' as const,
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>User Management</h1>

      <div style={styles.card}>
        {/* Filters */}
        <div style={styles.filterRow}>
          <input
            type="text"
            placeholder="Search username or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Types</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Staff</option>
            <option value="true">Staff</option>
            <option value="false">Non-Staff</option>
          </select>
        </div>

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Staff</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Verified</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>{user.id}</td>
                <td style={styles.td}>{user.username}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.user_type.toUpperCase()}</td>
                <td style={styles.td}>
                  <span style={styles.badge(user.is_staff)}>{user.is_staff ? 'Yes' : 'No'}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(user.is_active)}>{user.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(user.is_verified)}>{user.is_verified ? 'Yes' : 'No'}</span>
                </td>
                <td style={styles.td}>
                  {new Date(user.date_joined || user.created_at).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setModalOpen(true);
                    }}
                    style={styles.button}
                  >
                    View
                  </button>
                  <button
                    onClick={() => toggleUserActive(user.id, user.is_active)}
                    style={user.is_active ? styles.buttonDanger : styles.buttonSuccess}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => toggleUserStaff(user.id, user.is_staff)}
                    style={user.is_staff ? styles.buttonDanger : styles.buttonSuccess}
                  >
                    {user.is_staff ? 'Remove Staff' : 'Make Staff'}
                  </button>
                  <button
                    onClick={() => toggleUserVerified(user.id, user.is_verified)}
                    style={user.is_verified ? styles.buttonDanger : styles.buttonSuccess}
                  >
                    {user.is_verified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={styles.pageButton(p === page)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      {modalOpen && selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2>User Details</h2>
            <p><strong>ID:</strong> {selectedUser.id}</p>
            <p><strong>Username:</strong> {selectedUser.username}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>First Name:</strong> {selectedUser.first_name || '—'}</p>
            <p><strong>Last Name:</strong> {selectedUser.last_name || '—'}</p>
            <p><strong>User Type:</strong> {selectedUser.user_type.toUpperCase()}</p>
            <p><strong>Company:</strong> {selectedUser.company_name || '—'}</p>
            <p><strong>Phone:</strong> {selectedUser.phone_number}</p>
            <p><strong>Staff:</strong> {selectedUser.is_staff ? 'Yes' : 'No'}</p>
            <p><strong>Active:</strong> {selectedUser.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Verified:</strong> {selectedUser.is_verified ? 'Yes' : 'No'}</p>
            <p><strong>Joined:</strong> {new Date(selectedUser.date_joined || selectedUser.created_at).toLocaleString()}</p>
            <button onClick={() => setModalOpen(false)} style={styles.button}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};