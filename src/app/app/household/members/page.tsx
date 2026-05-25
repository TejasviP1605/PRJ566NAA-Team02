'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, MoreVertical, Trash2, Shield, UserX, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { householdService } from '@/lib/api/household.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { inviteMemberSchema, type InviteMemberFormData } from '@/lib/validations';
import { formatRole, formatDate, formatRelativeDate } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { HouseholdMember } from '@/types';

const ROLE_OPTIONS = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'co_tenant', label: 'Co-Tenant' },
  { value: 'leaseholder', label: 'Leaseholder' },
];

export default function MembersPage() {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['members', user?.householdId],
    queryFn: () => householdService.getMembers(user?.householdId ?? ''),
    enabled: !!user?.householdId,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: InviteMemberFormData) =>
      householdService.inviteMember(user?.householdId ?? '', email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      success('Invitation sent', 'The member will receive an email invite.');
      setInviteOpen(false);
      reset();
    },
    onError: () => error('Failed to send invite', 'Please try again.'),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => householdService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      success('Member removed');
    },
    onError: () => error('Failed to remove member'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberFormData>({ resolver: zodResolver(inviteMemberSchema), defaultValues: { role: 'tenant' } });

  const members = data?.data ?? [];
  const isLeaseholder = user?.role === 'leaseholder' || user?.role === 'admin';

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Household Members</h1>
          <p className="page-subtitle">{members.filter((m) => m.status === 'active').length} active · {members.filter((m) => m.status === 'invited').length} pending</p>
        </div>
        {isLeaseholder && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setInviteOpen(true)}>
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isOwner={isLeaseholder}
            isCurrentUser={member.userId === user?.id}
            onRemove={(id) => removeMutation.mutate(id)}
            menuOpen={menuMemberId === member.id}
            onMenuToggle={(id) => setMenuMemberId(menuMemberId === id ? null : id)}
          />
        ))}
        {members.length === 0 && (
          <EmptyState
            icon={<Mail className="w-6 h-6" />}
            title="No members yet"
            description="Invite roommates to join your household."
            action={isLeaseholder ? <Button onClick={() => setInviteOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>Invite Member</Button> : undefined}
          />
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => { setInviteOpen(false); reset(); }}
        title="Invite Member"
        description="Send an invitation to join your household"
        size="sm"
      >
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="roommate@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            {...register('role')}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setInviteOpen(false); reset(); }} type="button">
              Cancel
            </Button>
            <Button className="flex-1" type="submit" isLoading={inviteMutation.isPending}>
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MemberRow({
  member,
  isOwner,
  isCurrentUser,
  onRemove,
  menuOpen,
  onMenuToggle,
}: {
  member: HouseholdMember;
  isOwner: boolean;
  isCurrentUser: boolean;
  onRemove: (id: string) => void;
  menuOpen: boolean;
  onMenuToggle: (id: string) => void;
}) {
  return (
    <Card className="flex items-center gap-4">
      <Avatar firstName={member.user.firstName} lastName={member.user.lastName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-surface-900">
            {member.user.firstName} {member.user.lastName}
            {isCurrentUser && <span className="text-xs text-surface-400 ml-1">(you)</span>}
          </p>
          <Badge variant={member.status === 'active' ? 'success' : 'warning'} size="sm">
            {member.status === 'active' ? 'Active' : 'Invited'}
          </Badge>
        </div>
        <p className="text-xs text-surface-500 mt-0.5">{member.user.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <Badge variant="muted" size="sm">{formatRole(member.role)}</Badge>
          {member.rentShare > 0 && (
            <span className="text-xs text-surface-500">{member.rentShare}% rent share</span>
          )}
          {member.joinedAt && (
            <span className="text-xs text-surface-400">Joined {formatDate(member.joinedAt, 'MMM yyyy')}</span>
          )}
        </div>
      </div>

      {isOwner && !isCurrentUser && (
        <div className="relative">
          <button
            onClick={() => onMenuToggle(member.id)}
            className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-surface-200 rounded-xl shadow-dropdown overflow-hidden z-10">
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                <Edit2 className="w-4 h-4 text-surface-400" />
                Edit Role
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50">
                <Shield className="w-4 h-4 text-surface-400" />
                Adjust Rent Share
              </button>
              <div className="border-t border-surface-100" />
              <button
                onClick={() => onRemove(member.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <UserX className="w-4 h-4" />
                Remove Member
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
