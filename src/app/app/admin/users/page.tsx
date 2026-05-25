'use client';

import { useState } from 'react';
import { Search, MoreVertical, Shield, UserX, Edit2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { mockUsers } from '@/data/mock';
import { formatDate, formatRole } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@/types';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{mockUsers.length} registered users</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Invite User</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search users..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'tenant', 'leaseholder', 'property_manager', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === r ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              {r === 'all' ? 'All' : formatRole(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card padding="none">
        <div className="divide-y divide-surface-100">
          {filtered.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/50 transition-colors">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-surface-500 truncate">{user.email}</p>
              </div>
              <div className="hidden sm:block text-xs text-surface-500">
                {user.phone ?? '—'}
              </div>
              <div className="hidden md:block text-xs text-surface-500">
                Joined {formatDate(user.createdAt, 'MMM yyyy')}
              </div>
              <Badge
                variant={user.role === 'admin' ? 'default' : 'muted'}
                size="sm"
              >
                {formatRole(user.role)}
              </Badge>
              <Badge
                variant={user.isVerified ? 'success' : 'warning'}
                size="sm"
              >
                {user.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <div className="relative">
                <button
                  onClick={() => setMenuUserId(menuUserId === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuUserId === user.id && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-surface-200 rounded-xl shadow-dropdown overflow-hidden z-10">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                      <Edit2 className="w-4 h-4 text-surface-400" />
                      Edit Role
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                      <Shield className="w-4 h-4 text-surface-400" />
                      Reset Password
                    </button>
                    <div className="border-t border-surface-100" />
                    <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <UserX className="w-4 h-4" />
                      Suspend User
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
