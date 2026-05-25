// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'tenant' | 'leaseholder' | 'property_manager' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  householdId?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
}

// ─── Household ────────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  monthlyRent: number;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseholderId: string;
  propertyManagerId?: string;
  maxOccupants: number;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'leaseholder' | 'tenant' | 'co_tenant';
export type MemberStatus = 'active' | 'invited' | 'removed';

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  user: User;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  rentShare: number; // percentage 0–100
  invitedBy: string;
  invitedAt: string;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type SplitRule = 'equal' | 'percentage' | 'custom';
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'groceries'
  | 'internet'
  | 'cleaning'
  | 'repairs'
  | 'insurance'
  | 'other';
export type ExpenseStatus = 'pending' | 'partially_paid' | 'settled';

export interface ExpenseSplit {
  memberId: string;
  userId: string;
  userName: string;
  amount: number;
  percentage: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Expense {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  splitRule: SplitRule;
  splits: ExpenseSplit[];
  status: ExpenseStatus;
  createdBy: string;
  dueDate: string;
  settledAt?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'venmo' | 'zelle' | 'check' | 'other';

export interface Payment {
  id: string;
  householdId: string;
  expenseId: string;
  expenseTitle: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  amount: number;
  amountDue: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'submitted' | 'in_progress' | 'resolved' | 'closed';
export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'structural'
  | 'pest_control'
  | 'cleaning'
  | 'other';

export interface MaintenanceStatusUpdate {
  status: MaintenanceStatus;
  note: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  householdId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  submittedBy: string;
  submittedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  images?: string[];
  statusHistory: MaintenanceStatusUpdate[];
  resolvedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'lease_agreement'
  | 'addendum'
  | 'inspection_report'
  | 'insurance'
  | 'utility_bill'
  | 'receipt'
  | 'notice'
  | 'other';

export type DocumentAccess = 'all_members' | 'leaseholder_only' | 'admin_only';

export interface Document {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  access: DocumentAccess;
  uploadedBy: string;
  uploadedByName: string;
  version: number;
  tags?: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'payment_due'
  | 'payment_received'
  | 'payment_overdue'
  | 'expense_created'
  | 'maintenance_update'
  | 'member_joined'
  | 'member_removed'
  | 'document_uploaded'
  | 'reminder'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export type ActivityAction =
  | 'user_login'
  | 'user_logout'
  | 'household_created'
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'role_changed'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'expense_settled'
  | 'payment_marked_paid'
  | 'payment_reminder_sent'
  | 'maintenance_submitted'
  | 'maintenance_updated'
  | 'maintenance_resolved'
  | 'document_uploaded'
  | 'document_deleted';

export interface ActivityLog {
  id: string;
  householdId?: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface TenantDashboardStats {
  totalOwed: number;
  totalPaid: number;
  pendingPayments: number;
  overduePayments: number;
  openMaintenanceRequests: number;
  upcomingDueDate?: string;
}

export interface LeaseholderDashboardStats {
  totalMembers: number;
  totalRentExpected: number;
  totalRentCollected: number;
  pendingPayments: number;
  overduePayments: number;
  openMaintenanceRequests: number;
  totalExpensesThisMonth: number;
}

export interface PropertyManagerDashboardStats {
  totalProperties: number;
  totalTenants: number;
  openMaintenanceTickets: number;
  resolvedThisMonth: number;
  urgentTickets: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalHouseholds: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalMaintenanceRequests: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}
