'use client';

import { CheckCircle, Shield, Lock, Key, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const securityItems = [
  {
    title: 'Two-Factor Authentication',
    description: 'Enforce 2FA for all admin accounts',
    status: 'enabled',
    icon: <Shield className="w-5 h-5 text-emerald-600" />,
    bg: 'bg-emerald-100',
  },
  {
    title: 'Session Timeout',
    description: 'Auto-logout after 30 minutes of inactivity',
    status: 'enabled',
    icon: <Clock className="w-5 h-5 text-brand-600" />,
    bg: 'bg-brand-100',
  },
  {
    title: 'Password Complexity',
    description: 'Minimum 8 chars, uppercase, number required',
    status: 'enabled',
    icon: <Key className="w-5 h-5 text-amber-600" />,
    bg: 'bg-amber-100',
  },
  {
    title: 'Rate Limiting',
    description: 'API rate limiting per IP address',
    status: 'enabled',
    icon: <Lock className="w-5 h-5 text-sky-600" />,
    bg: 'bg-sky-100',
  },
];

const recentSecurityEvents = [
  { event: 'Admin login from new device', severity: 'warning', time: '2 hours ago', user: 'admin@rentright.com' },
  { event: 'Password reset requested', severity: 'info', time: '1 day ago', user: 'alex.tenant@example.com' },
  { event: 'Failed login attempt (3x)', severity: 'danger', time: '2 days ago', user: 'unknown@test.com' },
  { event: 'Role change: Tenant → Leaseholder', severity: 'warning', time: '3 days ago', user: 'sarah.leaseholder@example.com' },
];

export default function AdminSecurityPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security & Permissions</h1>
          <p className="page-subtitle">Monitor and configure platform security settings</p>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* System Health */}
        <motion.div variants={item}>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Security status: All clear</p>
              <p className="text-xs text-emerald-600">No active threats detected. Last scan: 5 minutes ago.</p>
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="outline">Run Scan</Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Security Policies */}
          <motion.div variants={item}>
            <Card>
              <CardHeader title="Security Policies" subtitle="Platform-wide security settings" />
              <div className="mt-4 space-y-4">
                {securityItems.map((s) => (
                  <div key={s.title} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-800">{s.title}</p>
                      <p className="text-xs text-surface-500">{s.description}</p>
                    </div>
                    <Badge variant="success" size="sm">Enabled</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Permission Matrix */}
          <motion.div variants={item}>
            <Card>
              <CardHeader title="Role Permissions" subtitle="What each role can access" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-surface-500 uppercase tracking-wide">
                      <th className="text-left pb-3 pr-4">Permission</th>
                      <th className="text-center pb-3 px-2">Tenant</th>
                      <th className="text-center pb-3 px-2">Leasehold</th>
                      <th className="text-center pb-3 px-2">PM</th>
                      <th className="text-center pb-3 px-2">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      { perm: 'View Expenses', tenant: true, lh: true, pm: false, admin: true },
                      { perm: 'Create Expenses', tenant: false, lh: true, pm: false, admin: true },
                      { perm: 'Manage Members', tenant: false, lh: true, pm: false, admin: true },
                      { perm: 'View Documents', tenant: true, lh: true, pm: true, admin: true },
                      { perm: 'Upload Documents', tenant: false, lh: true, pm: true, admin: true },
                      { perm: 'Manage Tickets', tenant: false, lh: false, pm: true, admin: true },
                      { perm: 'System Admin', tenant: false, lh: false, pm: false, admin: true },
                    ].map((row) => (
                      <tr key={row.perm} className="border-b border-surface-50 last:border-0">
                        <td className="py-2 pr-4 text-surface-700 font-medium">{row.perm}</td>
                        {[row.tenant, row.lh, row.pm, row.admin].map((allowed, i) => (
                          <td key={i} className="py-2 px-2 text-center">
                            {allowed ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-surface-200">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Security Events */}
        <motion.div variants={item}>
          <Card padding="none">
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-surface-900">Recent Security Events</h3>
            </div>
            <div className="divide-y divide-surface-100">
              {recentSecurityEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    event.severity === 'danger' ? 'bg-red-100' :
                    event.severity === 'warning' ? 'bg-amber-100' : 'bg-sky-100'
                  }`}>
                    {event.severity === 'danger' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : event.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Shield className="w-4 h-4 text-sky-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800">{event.event}</p>
                    <p className="text-xs text-surface-500 truncate">{event.user}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={event.severity === 'danger' ? 'danger' : event.severity === 'warning' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {event.severity}
                    </Badge>
                    <p className="text-xs text-surface-400 mt-0.5">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
