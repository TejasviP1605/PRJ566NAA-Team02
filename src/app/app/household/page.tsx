'use client';

import { useQuery } from '@tanstack/react-query';
import { Home, Users, Edit, ArrowRight, CalendarDays, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { householdService } from '@/lib/api/household.service';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function HouseholdPage() {
  const { user } = useAuthStore();

  const { data: householdData, isLoading: hLoading } = useQuery({
    queryKey: ['household', user?.householdId],
    queryFn: () => householdService.getHousehold(user?.householdId ?? ''),
    enabled: !!user?.householdId,
  });

  const { data: membersData, isLoading: mLoading } = useQuery({
    queryKey: ['members', user?.householdId],
    queryFn: () => householdService.getMembers(user?.householdId ?? ''),
    enabled: !!user?.householdId,
  });

  const isLoading = hLoading || mLoading;
  const household = householdData?.data;
  const members = membersData?.data ?? [];
  const isLeaseholder = user?.role === 'leaseholder' || user?.role === 'admin';

  if (!user?.householdId) {
    return (
      <div className="page-container">
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-surface-900">No Household Yet</h2>
          <p className="text-surface-500 text-sm mt-2">
            {isLeaseholder
              ? "You haven't created a household yet. Create one to start managing your shared living space."
              : 'You haven\'t been added to a household yet. Ask your leaseholder to invite you.'}
          </p>
          {isLeaseholder && (
            <Button className="mt-6" leftIcon={<Home className="w-4 h-4" />}>
              Create Household
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;
  if (!household) return null;

  const leaseProgress = (() => {
    const start = new Date(household.leaseStartDate).getTime();
    const end = new Date(household.leaseEndDate).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  })();

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="page-header">
          <div>
            <h1 className="page-title">{household.name}</h1>
            <p className="page-subtitle flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {household.address}, {household.city}, {household.state} {household.zipCode}
            </p>
          </div>
          {isLeaseholder && (
            <Button leftIcon={<Edit className="w-4 h-4" />} variant="outline" size="sm">
              Edit Household
            </Button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Household Details */}
          <motion.div variants={item} className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader title="Lease Details" />
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <DetailItem label="Monthly Rent" value={formatCurrency(household.monthlyRent)} />
                <DetailItem label="Max Occupants" value={`${household.maxOccupants} people`} />
                <DetailItem label="Lease Start" value={formatDate(household.leaseStartDate)} />
                <DetailItem label="Lease End" value={formatDate(household.leaseEndDate)} />
              </div>
              {/* Lease progress */}
              <div className="mt-4 pt-4 border-t border-surface-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-surface-600">Lease Progress</span>
                  <span className="text-xs text-surface-500">{leaseProgress}% complete</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${leaseProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-brand-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-surface-400">{formatDate(household.leaseStartDate, 'MMM yyyy')}</span>
                  <span className="text-xs text-surface-400">{formatDate(household.leaseEndDate, 'MMM yyyy')}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Rent Split" subtitle="How monthly rent is distributed" />
              <div className="mt-4 space-y-3">
                {members.filter((m) => m.status === 'active').map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar firstName={member.user.firstName} lastName={member.user.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800">{member.user.firstName} {member.user.lastName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-900">
                        {formatCurrency((household.monthlyRent * member.rentShare) / 100)}
                      </p>
                      <p className="text-xs text-surface-500">{member.rentShare}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Members Side Panel */}
          <motion.div variants={item}>
            <Card className="sticky top-20">
              <CardHeader
                title={`Members (${members.length})`}
                action={
                  <Link href="/app/household/members" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar firstName={member.user.firstName} lastName={member.user.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-xs text-surface-500">{member.user.email}</p>
                    </div>
                    <Badge
                      variant={member.status === 'active' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {member.status === 'active' ? 'Active' : 'Invited'}
                    </Badge>
                  </div>
                ))}
              </div>
              {isLeaseholder && (
                <Link href="/app/household/members">
                  <Button variant="outline" className="w-full mt-4" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                    Manage Members
                  </Button>
                </Link>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-surface-900 mt-0.5">{value}</p>
    </div>
  );
}
