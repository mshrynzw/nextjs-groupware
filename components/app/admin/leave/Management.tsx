'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionButton } from '@/components/ui/action-button';
import type { BaseDaysByService } from '@/schemas/leave';
import { Skeleton } from '@/components/ui/skeleton';
import { updateLeavePolicyPartial } from '@/lib/actions/leave-policies';
import {
  createManualGrant,
  importGrantsCsv,
  runPolicyGrantFlat,
  previewPolicyGrantAdvanced,
} from '@/lib/actions/leave-grants';

import LeaveGrantEditDialog from './LeaveGrantEditDialog';
import LeaveGrantDeleteDialog from './LeaveGrantDeleteDialog';

import { setLocalStorage, getLocalStorage } from '@/lib/local-storage';
import { useData } from '@/contexts/data-context';
// import { useAuth } from '@/contexts/auth-context';

type LeaveHistoryFilters = {
  filterUser: string;
  filterLeaveType: string;
  filterSource: string;
};

export default function Management({ companyId }: { companyId: string }) {
  const defaultFilters: LeaveHistoryFilters = {
    filterUser: '',
    filterLeaveType: '',
    filterSource: '',
  };
  const savedFilters = getLocalStorage<LeaveHistoryFilters>(
    'leave-history-filters',
    defaultFilters
  );

  const { users } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [manual, setManual] = useState({
    userId: '',
    leaveTypeId: '',
    quantityMinutes: 480,
    grantedOn: '',
    expiresOn: '',
    note: '',
  });
  const [policy, setPolicy] = useState({
    leaveTypeId: '',
    grantDate: new Date().toISOString().split('T')[0],
  });
  const [isBusy, setIsBusy] = useState(false);
  const [recentGrants, setRecentGrants] = useState<
    Array<{
      id: string;
      user_id: string;
      leave_type_id: string;
      quantity_minutes: number;
      granted_on: string;
      expires_on: string | null;
      source: string;
      note: string | null;
      created_at: string;
    }>
  >([]);
  const [recentConsumptions, setRecentConsumptions] = useState<
    Array<{
      id: string;
      user_id: string;
      leave_type_id: string;
      quantity_minutes: number;
      consumed_on: string;
      status: string;
      start_date: string | null;
      end_date: string | null;
      request_id: string | null;
      created_at: string;
    }>
  >([]);
  const [fiscalStartMonth, setFiscalStartMonth] = useState<number>(4);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<
    Array<{
      userId: string;
      eligible: boolean;
      serviceYears: number;
      baseDays: number;
      quantityMinutes: number;
      reason?: string;
      duplicate?: boolean;
    }>
  >([]);
  const [previewAccrual, setPreviewAccrual] = useState<
    'anniversary' | 'fiscal_fixed' | 'monthly' | undefined
  >(undefined);
  const [postRunDiff, setPostRunDiff] = useState<
    Array<{ userId: string; expected: number; actual: number }>
  >([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [diffSort, setDiffSort] = useState<
    'delta_desc' | 'delta_asc' | 'expected_desc' | 'actual_desc'
  >('delta_desc');
  const [diffMinAbs, setDiffMinAbs] = useState<number>(0);
  const [policyForm, setPolicyForm] = useState({
    day_hours: 8,
    anniversary_offset_days: 0,
    monthly_proration: false,
    monthly_proration_basis: 'days' as 'days' | 'hours',
    monthly_min_attendance_rate: 0,
    carryover_max_days: '' as string | '',
    expire_months: 24 as number,
    allow_negative: false,
    min_booking_unit_minutes: 60 as number,
    rounding_minutes: 15 as number,
    hold_on_apply: true,
    deduction_timing: 'approve' as 'apply' | 'approve',
    business_day_only: true,
    base_days_by_service: {} as Record<string, number>,
    allowed_units: ['day', 'half', 'hour'] as Array<'day' | 'half' | 'hour'>,
    half_day_mode: 'fixed_hours' as 'fixed_hours' | 'am_pm',
    allow_multi_day: true,
    blackout_dates: [] as string[],
  });
  const [maxServiceYears, setMaxServiceYears] = useState(10);
  const [activeTab, setActiveTab] = useState<'付与' | '申請' | '一覧'>('付与');
  const [policyTab, setPolicyTab] = useState<'付与' | '申請'>('付与');
  const [historyTab, setHistoryTab] = useState<'付与' | '消費' | '残高'>('付与');
  const [filterUser, setFilterUser] = useState<string>(savedFilters.filterUser);
  const [filterLeaveType, setFilterLeaveType] = useState<string>(savedFilters.filterLeaveType);
  const [filterSource, setFilterSource] = useState<string>(savedFilters.filterSource);

  // 操作ダイアログの状態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLeaveGrantId, setSelectedLeaveGrantId] = useState<string | null>(null);

  // 一括削除の状態
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  const [isLoadingGrants, setIsLoadingGrants] = useState(false);
  const [isLoadingConsumptions, setIsLoadingConsumptions] = useState(false);

  // フィルタリングされた付与履歴
  const filteredGrants = recentGrants.filter((g) => {
    const u = users.find((x) => x.id === g.user_id);
    const userName = u ? `${u.family_name || ''} ${u.first_name || ''}`.trim() : '';

    // ユーザー名フィルター
    if (filterUser && !userName.toLowerCase().includes(filterUser.toLowerCase())) {
      return false;
    }

    // 休暇種別フィルター
    if (filterLeaveType && g.leave_type_id !== filterLeaveType) {
      return false;
    }

    // 付与方法フィルター
    if (filterSource && g.source !== filterSource) {
      return false;
    }

    return true;
  });

  // フィルタリングされた消費履歴
  const filteredConsumptions = recentConsumptions.filter((c) => {
    const u = users.find((x) => x.id === c.user_id);
    const userName = u ? `${u.family_name || ''} ${u.first_name || ''}`.trim() : '';

    // ユーザー名フィルター
    if (filterUser && !userName.toLowerCase().includes(filterUser.toLowerCase())) {
      return false;
    }

    // 休暇種別フィルター
    if (filterLeaveType && c.leave_type_id !== filterLeaveType) {
      return false;
    }

    return true;
  });

  const isIsoDateString = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v);

  const validatePolicy = (pf: typeof policyForm): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!(pf.day_hours > 0 && pf.day_hours <= 24)) errs.day_hours = '1〜24の範囲で入力してください';
    if (!(pf.anniversary_offset_days >= -366 && pf.anniversary_offset_days <= 366))
      errs.anniversary_offset_days = '-366〜366の整数で入力してください';
    if (!(pf.monthly_min_attendance_rate >= 0 && pf.monthly_min_attendance_rate <= 1))
      errs.monthly_min_attendance_rate = '0〜100%で入力してください';
    if (!(pf.expire_months >= 0 && pf.expire_months <= 120))
      errs.expire_months = '0〜120の範囲で入力してください';
    if (!(pf.min_booking_unit_minutes >= 1 && pf.min_booking_unit_minutes <= 1440))
      errs.min_booking_unit_minutes = '1〜1440の範囲で入力してください';
    if (!(pf.rounding_minutes >= 0 && pf.rounding_minutes <= 120))
      errs.rounding_minutes = '0〜120の範囲で入力してください';
    if (!pf.allowed_units || pf.allowed_units.length === 0)
      errs.allowed_units = '少なくとも1つの取得単位を選択してください';
    if (pf.blackout_dates.some((d) => !isIsoDateString(d)))
      errs.blackout_dates = 'YYYY-MM-DD をカンマ区切りで入力してください';
    return errs;
  };

  useEffect(() => {
    setValidationErrors(validatePolicy(policyForm));
  }, [policyForm]);

  const fetchRecentGrants = async () => {
    try {
      setIsLoadingGrants(true);
      console.log('[leave-grants] API取得開始', { companyId });
      if (!companyId) return;
      const res = await fetch(`/api/leave-grants?companyId=${encodeURIComponent(companyId)}`);
      const json = await res.json();
      if (!res.ok) {
        console.error('[leave-grants] API取得失敗', json.error);
        setRecentGrants([]);
        return;
      }
      console.log('[leave-grants] API取得内容', json.data);
      setRecentGrants((json.data || []).filter(Boolean));
      setIsLoadingGrants(false);
    } catch (e) {
      console.error('[leave-grants] API取得例外', e);
      setRecentGrants([]);
      setIsLoadingGrants(false);
    }
  };

  const fetchRecentConsumptions = async () => {
    try {
      setIsLoadingConsumptions(true);
      console.log('[leave-consumptions] API取得開始', { companyId });
      if (!companyId) return;
      const res = await fetch(`/api/leave-consumptions?companyId=${encodeURIComponent(companyId)}`);
      const json = await res.json();
      if (!res.ok) {
        console.error('[leave-consumptions] API取得失敗', json.error);
        setRecentConsumptions([]);
        return;
      }
      console.log('[leave-consumptions] API取得内容', json.data);
      setRecentConsumptions((json.data || []).filter(Boolean));
      setIsLoadingConsumptions(false);
    } catch (e) {
      console.error('[leave-consumptions] API取得例外', e);
      setRecentConsumptions([]);
      setIsLoadingConsumptions(false);
    }
  };

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from('leave_types')
          .select('id, name')
          .eq('company_id', companyId)
          .order('display_order')
          .is('deleted_at', null);
        setLeaveTypes(((data || []) as Array<{ id: string; name: string }>).filter(Boolean));
      } catch {
        setLeaveTypes([]);
      }
    };
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    fetchRecentGrants();
    fetchRecentConsumptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, companyId]);

  useEffect(() => {
    setLocalStorage('leave-history-filters', {
      filterUser,
      filterLeaveType,
      filterSource,
    });
  }, [filterUser, filterLeaveType, filterSource]);

  useEffect(() => {
    const loadFiscal = async () => {
      try {
        if (!companyId || !policy.leaveTypeId) return;
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from('leave_policies')
          .select(
            'fiscal_start_month, day_hours, anniversary_offset_days, monthly_proration, monthly_proration_basis, monthly_min_attendance_rate, carryover_max_days, expire_months, allow_negative, min_booking_unit_minutes, rounding_minutes, hold_on_apply, deduction_timing, business_day_only, base_days_by_service, grant_unit'
          )
          .eq('company_id', companyId)
          .eq('leave_type_id', policy.leaveTypeId)
          .is('deleted_at', null)
          .maybeSingle();
        setFiscalStartMonth(
          ((data || {}) as { fiscal_start_month?: number }).fiscal_start_month || 4
        );

        // 基準付与データの処理
        if (data) {
          const d = data as {
            day_hours?: number;
            anniversary_offset_days?: number;
            monthly_proration?: boolean;
            monthly_proration_basis?: 'days' | 'hours';
            monthly_min_attendance_rate?: number;
            base_days_by_service?:
              | Record<string, number>
              | { unit: string; data: Record<string, number> };
            carryover_max_days?: number | null;
            expire_months?: number;
            allow_negative?: boolean;
            min_booking_unit_minutes?: number;
            rounding_minutes?: number;
            hold_on_apply?: boolean;
            deduction_timing?: 'apply' | 'approve';
            business_day_only?: boolean;
            grant_unit?: 'year' | 'month' | 'day';
          };

          // 基準付与データの処理
          if (d.base_days_by_service) {
            if (
              typeof d.base_days_by_service === 'object' &&
              'unit' in d.base_days_by_service &&
              'data' in d.base_days_by_service
            ) {
              // 新しい構造
              const typedData = d.base_days_by_service as {
                unit: string;
                data: Record<string, number>;
              };
              setGrantUnit((typedData.unit as 'year' | 'month' | 'day') || 'year');
              setBaseGrantData({
                unit: (typedData.unit as 'year' | 'month' | 'day') || 'year',
                data: typedData.data || {},
              });
            } else {
              // 既存の年単位データ
              setGrantUnit('year');
              setBaseGrantData({
                unit: 'year',
                data: d.base_days_by_service as Record<string, number>,
              });
            }
          } else {
            setGrantUnit('year');
            setBaseGrantData({ unit: 'year', data: {} });
          }

          setPolicyForm((prev) => ({
            ...prev,
            day_hours: d.day_hours ?? 8,
            anniversary_offset_days: d.anniversary_offset_days ?? 0,
            monthly_proration: !!d.monthly_proration,
            monthly_proration_basis: d.monthly_proration_basis ?? 'days',
            monthly_min_attendance_rate: d.monthly_min_attendance_rate ?? 0,
            base_days_by_service: (() => {
              if (
                typeof d.base_days_by_service === 'object' &&
                d.base_days_by_service &&
                'unit' in d.base_days_by_service &&
                'data' in d.base_days_by_service
              ) {
                return (d.base_days_by_service as { data: Record<string, number> }).data || {};
              }
              return (d.base_days_by_service as Record<string, number>) || {};
            })(),
            carryover_max_days:
              d.carryover_max_days !== null && d.carryover_max_days !== undefined
                ? String(d.carryover_max_days)
                : '',
            expire_months: d.expire_months ?? 24,
            allow_negative: !!d.allow_negative,
            min_booking_unit_minutes: d.min_booking_unit_minutes ?? 60,
            rounding_minutes: d.rounding_minutes ?? 15,
            hold_on_apply: d.hold_on_apply ?? true,
            deduction_timing: (d.deduction_timing as 'apply' | 'approve') ?? 'approve',
            business_day_only: d.business_day_only ?? true,
            allowed_units: ['day', 'half', 'hour'],
            half_day_mode: 'fixed_hours',
            allow_multi_day: true,
            blackout_dates: [],
          }));
        } else {
          setGrantUnit('year');
          setBaseGrantData({ unit: 'year', data: {} });
          setPolicyForm((prev) => ({
            ...prev,
            day_hours: 8,
            anniversary_offset_days: 0,
            monthly_proration: false,
            monthly_proration_basis: 'days',
            monthly_min_attendance_rate: 0,
            base_days_by_service: {},
            carryover_max_days: '',
            expire_months: 24,
            allow_negative: false,
            min_booking_unit_minutes: 60,
            rounding_minutes: 15,
            hold_on_apply: true,
            deduction_timing: 'approve',
            business_day_only: true,
            allowed_units: ['day', 'half', 'hour'],
            half_day_mode: 'fixed_hours',
            allow_multi_day: true,
            blackout_dates: [],
          }));
        }
      } catch {
        setFiscalStartMonth(4);
        setGrantUnit('year');
        setBaseGrantData({ unit: 'year', data: {} });
      }
    };
    loadFiscal();
  }, [companyId, policy.leaveTypeId]);

  const downloadTemplate = () => {
    const header = 'user_id,leave_type_id,quantity_minutes,granted_on,expires_on,note\n';
    const example =
      '00000000-0000-0000-0000-000000000000,00000000-0000-0000-0000-000000000000,480,2025-04-01,2027-03-31,初期取込\n';
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave_grants_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitManual = async () => {
    if (!manual.userId || !manual.leaveTypeId || !manual.grantedOn) {
      toast({
        title: '入力エラー',
        description: 'ユーザー、休暇種別、付与日は必須です。',
        variant: 'destructive',
      });
      return;
    }
    setIsBusy(true);
    try {
      const res = await createManualGrant({
        userId: manual.userId,
        leaveTypeId: manual.leaveTypeId,
        quantityMinutes: Number(manual.quantityMinutes) || 0,
        grantedOn: manual.grantedOn,
        expiresOn: manual.expiresOn || null,
        source: 'manual',
        note: manual.note,
        createdBy: null,
      });
      if (!res.success) throw new Error(res.error || 'failed');
      toast({ title: '付与完了', description: '手動付与を登録しました。' });
      fetchRecentGrants();
    } catch (e) {
      toast({
        title: '付与失敗',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 操作ボタンのハンドラー
  const handleEditClick = (leaveGrantId: string) => {
    setSelectedLeaveGrantId(leaveGrantId);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (leaveGrantId: string) => {
    setSelectedLeaveGrantId(leaveGrantId);
    setDeleteDialogOpen(true);
  };

  const handleOperationSuccess = () => {
    // データを再取得
    fetchRecentGrants();
    // 選択状態をリセット
    setSelectedIds(new Set());
    setIsSelectAll(false);
  };

  // チェックボックス関連のハンドラー
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredGrants.map((g) => g.id));
      setSelectedIds(allIds);
      setIsSelectAll(true);
    } else {
      setSelectedIds(new Set());
      setIsSelectAll(false);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);

    // 全選択状態を更新
    const allIds = new Set(filteredGrants.map((g) => g.id));
    setIsSelectAll(newSelectedIds.size === allIds.size);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setSelectedLeaveGrantId(Array.from(selectedIds)[0]); // 最初のIDを設定（ダイアログ表示用）
    setDeleteDialogOpen(true);
  };

  const handleCsv = async (file: File) => {
    setIsBusy(true);
    try {
      const text = await file.text();
      const res = await importGrantsCsv(companyId, text, null);
      if (!res.success) throw new Error('CSV取り込みに失敗しました');
      toast({
        title: 'CSV取り込み',
        description: `追加:${res.inserted}件 / 既存:${res.skipped}件 / エラー:${res.errorRows}件`,
      });
      fetchRecentGrants();
    } catch (e) {
      toast({
        title: 'CSV取り込み失敗',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const submitPolicyGrant = async () => {
    if (!policy.leaveTypeId || !policy.grantDate) {
      toast({
        title: '入力エラー',
        description: '休暇種別と付与日を指定してください。',
        variant: 'destructive',
      });
    }
    setIsBusy(true);
    try {
      const res = await runPolicyGrantFlat({
        companyId,
        leaveTypeId: policy.leaveTypeId,
        grantDate: policy.grantDate,
      });
      if (!res.success) throw new Error(res.error || 'failed');
      toast({
        title: '一括付与完了',
        description: `付与:${res.granted} / スキップ:${res.skipped}`,
      });
      fetchRecentGrants();
    } catch (e) {
      toast({
        title: '一括付与失敗',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const saveFiscalStartMonth = async () => {
    if (!companyId || !policy.leaveTypeId) {
      toast({
        title: '入力エラー',
        description: '会社と休暇種別を選択してください。',
        variant: 'destructive',
      });
      return;
    }
    setIsBusy(true);
    try {
      const res = await updateLeavePolicyPartial({
        companyId,
        leaveTypeId: policy.leaveTypeId,
        patch: { fiscal_start_month: fiscalStartMonth },
      });
      if (!res.success) throw new Error(res.error || 'failed');
      toast({ title: '保存完了', description: `期首月を ${fiscalStartMonth} 月に保存しました。` });
    } catch (e) {
      toast({
        title: '保存失敗',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsBusy(false);
    }
  };

  // 基準付与の単位を追加
  const [grantUnit, setGrantUnit] = useState<'year' | 'month' | 'day'>('year');

  // 基準付与データの構造を変更
  const [baseGrantData, setBaseGrantData] = useState<{
    unit: 'year' | 'month' | 'day';
    data: Record<string, number | Record<string, number | Record<string, number>>>;
  }>({
    unit: 'year',
    data: {},
  });

  // 型安全なヘルパー関数を追加
  const getYearData = (yearIdx: number): Record<string, number> => {
    const yearData = baseGrantData.data[String(yearIdx)];
    if (typeof yearData === 'object' && yearData !== null && !Array.isArray(yearData)) {
      return yearData as Record<string, number>;
    }
    return {};
  };

  const getMonthData = (yearIdx: number, monthIdx: number): Record<string, number> => {
    const yearData = getYearData(yearIdx);
    const monthData = yearData[String(monthIdx)];
    if (typeof monthData === 'object' && monthData !== null && !Array.isArray(monthData)) {
      return monthData as Record<string, number>;
    }
    return {};
  };

  const getYearValue = (yearIdx: number): number | undefined => {
    const value = baseGrantData.data[String(yearIdx)];
    return typeof value === 'number' ? value : undefined;
  };

  const getMonthValue = (yearIdx: number, monthIdx: number): number | undefined => {
    const yearData = getYearData(yearIdx);
    const value = yearData[String(monthIdx)];
    return typeof value === 'number' ? value : undefined;
  };

  const getDayValue = (yearIdx: number, monthIdx: number, dayIdx: number): number | undefined => {
    const monthData = getMonthData(yearIdx, monthIdx);
    const value = monthData[String(dayIdx)];
    return typeof value === 'number' ? value : undefined;
  };

  // 付与日計算用の関数を追加
  function formatGrantDate(baseDate: string, yearOffset: number) {
    if (!baseDate) return '';
    const date = new Date(baseDate);
    date.setFullYear(date.getFullYear() + yearOffset);
    return date.toISOString().split('T')[0];
  }

  function formatGrantDateJP(baseDate: string, yearOffset: number) {
    if (!baseDate) return '';
    const date = new Date(baseDate);
    date.setFullYear(date.getFullYear() + yearOffset);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
  }

  function formatGrantDateJPWithMonth(baseDate: string, yearOffset: number, monthOffset: number) {
    if (!baseDate) return '';
    const date = new Date(baseDate);
    date.setFullYear(date.getFullYear() + yearOffset);
    date.setMonth(date.getMonth() + monthOffset);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
  }

  const handleResetFilters = () => {
    setFilterUser('');
    setFilterLeaveType('');
    setFilterSource('');
    setLocalStorage('leave-history-filters', defaultFilters);
  };

  return (
    <div className='space-y-6 flex flex-col'>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as '付与' | '一覧')}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='付与' className='flex items-center space-x-2'>
            <span>付与</span>
          </TabsTrigger>
          <TabsTrigger value='一覧' className='flex items-center space-x-2'>
            <span>一覧</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='付与' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>一括付与</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label>休暇種別</Label>
                  <select
                    className='w-full h-9 border rounded-md px-2'
                    value={policy.leaveTypeId}
                    onChange={(e) => setPolicy({ ...policy, leaveTypeId: e.target.value })}
                  >
                    <option value=''>選択してください</option>
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>付与日</Label>
                  <Input
                    type='date'
                    value={policy.grantDate}
                    onChange={(e) => setPolicy({ ...policy, grantDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>期首月（年度）</Label>
                  <Input
                    type='number'
                    min={1}
                    max={12}
                    value={fiscalStartMonth}
                    onChange={(e) =>
                      setFiscalStartMonth(Math.max(1, Math.min(12, Number(e.target.value || 4))))
                    }
                  />
                  <div className='text-xs text-gray-500 mt-1'>
                    ポリシーの設定に保存されている値を初期表示します。
                  </div>
                </div>
                <div className='mt-4 flex items-center gap-2'>
                  <Button onClick={submitPolicyGrant} disabled={isBusy}>
                    実行
                  </Button>
                  <Button
                    variant='outline'
                    onClick={saveFiscalStartMonth}
                    disabled={isBusy || !policy.leaveTypeId}
                  >
                    期首月を保存
                  </Button>
                  <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant='secondary' disabled={!policy.leaveTypeId}>
                        ポリシー編集
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                      <DialogHeader>
                        <DialogTitle>
                          ポリシー編集（
                          {leaveTypes.find((l) => l.id === policy.leaveTypeId)?.name || '未選択'}）
                        </DialogTitle>
                        <DialogDescription>
                          休暇ポリシーの設定を編集できます。基準付与の単位や日数、申請設定などを変更してください。
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='w-full border-b border-gray-200'>
                          <div className='flex w-full'>
                            <button
                              type='button'
                              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                                policyTab === '付与'
                                  ? 'bg-black text-white border-b-2 border-black'
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setPolicyTab('付与')}
                            >
                              付与
                            </button>
                            <button
                              type='button'
                              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                                policyTab === '申請'
                                  ? 'bg-black text-white border-b-2 border-black'
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setPolicyTab('申請')}
                            >
                              申請
                            </button>
                          </div>
                        </div>
                        {policyTab === '付与' && (
                          <>
                            <div>
                              <Label>基準付与の単位</Label>
                              <div className='flex items-center gap-4 mt-2'>
                                <label className='flex items-center gap-2 text-sm'>
                                  <input
                                    type='radio'
                                    name='grantUnit'
                                    value='year'
                                    checked={grantUnit === 'year'}
                                    onChange={(e) =>
                                      setGrantUnit(e.target.value as 'year' | 'month' | 'day')
                                    }
                                    className='h-4 w-4'
                                  />
                                  <span>年単位</span>
                                </label>
                                <label className='flex items-center gap-2 text-sm'>
                                  <input
                                    type='radio'
                                    name='grantUnit'
                                    value='month'
                                    checked={grantUnit === 'month'}
                                    onChange={(e) =>
                                      setGrantUnit(e.target.value as 'year' | 'month' | 'day')
                                    }
                                    className='h-4 w-4'
                                  />
                                  <span>月単位</span>
                                </label>
                                <label className='flex items-center gap-2 text-sm'>
                                  <input
                                    type='radio'
                                    name='grantUnit'
                                    value='day'
                                    checked={grantUnit === 'day'}
                                    onChange={(e) =>
                                      setGrantUnit(e.target.value as 'year' | 'month' | 'day')
                                    }
                                    className='h-4 w-4'
                                  />
                                  <span>日単位</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <Label>
                                基準付与（
                                {grantUnit === 'year'
                                  ? '年数→日数'
                                  : grantUnit === 'month'
                                    ? '年数・月数→日数'
                                    : '年数・月数・日数→日数'}
                                ）
                              </Label>
                              <div className='text-xs text-gray-500 mb-2'>
                                {grantUnit === 'year' &&
                                  '例: 0年=10, 1年=11, 2年=12 ...（空欄は未設定）'}
                                {grantUnit === 'month' &&
                                  '例: 0年0月=10, 0年1月=11, 1年0月=12 ...（空欄は未設定）'}
                                {grantUnit === 'day' &&
                                  '例: 0年0月1日=10, 0年0月2日=11, 1年0月1日=12 ...（空欄は未設定）'}
                              </div>

                              {/* 動的な入力フィールド表示 */}
                              {grantUnit === 'year' && (
                                <div className='space-y-2'>
                                  {Array.from({ length: maxServiceYears }, (_, idx) => (
                                    <div key={idx} className='grid grid-cols-3 gap-2 items-center'>
                                      <div className='col-span-1 text-sm text-gray-600'>
                                        {idx} 年目
                                        {policy.grantDate && (
                                          <span className='text-xs text-blue-600 ml-1'>
                                            （{formatGrantDateJP(policy.grantDate, idx)}付与）
                                          </span>
                                        )}
                                      </div>
                                      <div className='col-span-2'>
                                        <Input
                                          type='number'
                                          min={0}
                                          max={365}
                                          step={0.5}
                                          value={getYearValue(idx) ?? ''}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const num = v === '' ? undefined : Number(v);
                                            setBaseGrantData((prev) => {
                                              const next = { ...prev };
                                              const map = { ...next.data };
                                              if (v === '') delete map[String(idx)];
                                              else
                                                map[String(idx)] = Number.isFinite(num)
                                                  ? Number(num)
                                                  : 0;
                                              next.data = map;
                                              return next;
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {grantUnit === 'month' && (
                                <div className='space-y-2'>
                                  {Array.from({ length: maxServiceYears }, (_, yearIdx) => (
                                    <div key={yearIdx} className='border rounded p-3'>
                                      <div className='font-medium mb-2'>{yearIdx} 年目</div>
                                      <div className='grid grid-cols-6 gap-2'>
                                        {Array.from({ length: 12 }).map((_, monthIdx) => (
                                          <div key={monthIdx} className='text-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                              {monthIdx}月
                                            </div>
                                            <Input
                                              type='number'
                                              min={0}
                                              max={31}
                                              step={0.5}
                                              className='h-8 text-sm'
                                              value={getMonthValue(yearIdx, monthIdx) ?? ''}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                const num = v === '' ? undefined : Number(v);
                                                setBaseGrantData((prev) => {
                                                  const next = { ...prev };
                                                  const yearData = {
                                                    ...((next.data[String(yearIdx)] as Record<
                                                      string,
                                                      number
                                                    >) || {}),
                                                  };
                                                  if (v === '') delete yearData[String(monthIdx)];
                                                  else
                                                    yearData[String(monthIdx)] = Number.isFinite(
                                                      num
                                                    )
                                                      ? Number(num)
                                                      : 0;
                                                  next.data = {
                                                    ...next.data,
                                                    [String(yearIdx)]: yearData,
                                                  };
                                                  return next;
                                                });
                                              }}
                                            />
                                            {policy.grantDate && (
                                              <div className='text-xs text-blue-600 mt-1'>
                                                {formatGrantDateJPWithMonth(
                                                  policy.grantDate,
                                                  yearIdx,
                                                  monthIdx
                                                )}
                                                付与
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {grantUnit === 'day' && (
                                <div className='space-y-2'>
                                  {Array.from({ length: maxServiceYears }, (_, yearIdx) => (
                                    <div key={yearIdx} className='border rounded p-3'>
                                      <div className='font-medium mb-2'>{yearIdx} 年目</div>
                                      {Array.from({ length: 12 }).map((_, monthIdx) => (
                                        <div key={monthIdx} className='mb-3'>
                                          <div className='text-sm font-medium mb-2'>
                                            {monthIdx}月
                                          </div>
                                          <div className='grid grid-cols-7 gap-1'>
                                            {Array.from({ length: 31 }).map((_, dayIdx) => {
                                              const day = dayIdx + 1;
                                              return (
                                                <div
                                                  key={`${yearIdx}-${monthIdx}-${day}`}
                                                  className='text-center'
                                                >
                                                  <div className='text-xs text-gray-500 mb-1'>
                                                    {day}日
                                                  </div>
                                                  <Input
                                                    type='number'
                                                    min={0}
                                                    max={31}
                                                    step={0.5}
                                                    className='h-6 text-xs'
                                                    value={
                                                      getDayValue(yearIdx, monthIdx, day) ?? ''
                                                    }
                                                    onChange={(e) => {
                                                      const v = e.target.value;
                                                      const num = v === '' ? undefined : Number(v);
                                                      setBaseGrantData((prev) => {
                                                        const next = { ...prev };
                                                        const yearData = {
                                                          ...((next.data[String(yearIdx)] as Record<
                                                            string,
                                                            Record<string, number>
                                                          >) || {}),
                                                        };
                                                        const monthData = {
                                                          ...((yearData[String(monthIdx)] as Record<
                                                            string,
                                                            number
                                                          >) || {}),
                                                        };
                                                        if (v === '') delete monthData[String(day)];
                                                        else
                                                          monthData[String(day)] = Number.isFinite(
                                                            num
                                                          )
                                                            ? Number(num)
                                                            : 0;
                                                        yearData[String(monthIdx)] = monthData;
                                                        next.data = {
                                                          ...next.data,
                                                          [String(yearIdx)]: yearData,
                                                        };
                                                        return next;
                                                      });
                                                    }}
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-1 mb-2 justify-end'>
                              <span className='text-xs text-gray-600'>
                                最大 {maxServiceYears} 年
                              </span>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-7 px-2 text-xs bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:border-red-400'
                                onClick={() => setMaxServiceYears((prev) => Math.max(1, prev - 1))}
                                disabled={maxServiceYears <= 1}
                              >
                                -
                              </Button>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-7 px-2 text-xs bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:border-red-400'
                                onClick={() => setMaxServiceYears((prev) => prev + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </>
                        )}
                        {policyTab === '付与' && (
                          <>
                            <div>
                              <Label>1日の所定労働時間（hours）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                1営業日の換算時間。半日=この半分
                              </div>
                              <Input
                                type='number'
                                min={1}
                                max={24}
                                step={0.25}
                                value={policyForm.day_hours}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    day_hours: Number(e.target.value || 8),
                                  })
                                }
                              />
                              {validationErrors.day_hours && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.day_hours}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label>入社日 前倒し/後倒し（日）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                入社日の前後に付与日をずらす日数
                              </div>
                              <Input
                                type='number'
                                min={-366}
                                max={366}
                                step={1}
                                value={policyForm.anniversary_offset_days}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    anniversary_offset_days: Math.max(
                                      -366,
                                      Math.min(366, Math.floor(Number(e.target.value || 0)))
                                    ),
                                  })
                                }
                              />
                              {validationErrors.anniversary_offset_days && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.anniversary_offset_days}
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-3'>
                              <Switch
                                checked={policyForm.monthly_proration}
                                onCheckedChange={(v) =>
                                  setPolicyForm({ ...policyForm, monthly_proration: !!v })
                                }
                              />
                              <div>
                                <Label>月次付与を勤務日数に応じて有効化</Label>
                                <div className='text-xs text-gray-500'>
                                  対象月（前月）の勤怠・カレンダーで比例配分
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>勤務日数の基準</Label>
                              <select
                                className='w-full h-9 border rounded-md px-2'
                                value={policyForm.monthly_proration_basis}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    monthly_proration_basis: e.target.value as 'days' | 'hours',
                                  })
                                }
                              >
                                <option value='days'>日数ベース（出勤日/稼働日）</option>
                                <option value='hours'>時間ベース（実働時間/所定時間）</option>
                              </select>
                            </div>
                            <div>
                              <Label>最低出勤率（%）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                月稼働日・所定時間が下記なら未満なら付与しない
                              </div>
                              <Input
                                type='number'
                                min={0}
                                max={100}
                                step={1}
                                value={Math.round(policyForm.monthly_min_attendance_rate * 100)}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    monthly_min_attendance_rate:
                                      Math.max(0, Math.min(100, Number(e.target.value || 0))) / 100,
                                  })
                                }
                              />
                              {validationErrors.monthly_min_attendance_rate && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.monthly_min_attendance_rate}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label>繰越上限（日）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                上限を超えた場合、次期に繰越します
                              </div>
                              <Input
                                type='text'
                                placeholder='空欄で無制限'
                                value={policyForm.carryover_max_days}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    carryover_max_days: e.target.value,
                                  })
                                }
                              />
                              <div className='text-xs text-gray-500'>小数可。空欄は無制限</div>
                            </div>
                            <div>
                              <Label>失効（月）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                付与から何ヶ月後に失効するか
                              </div>
                              <Input
                                type='number'
                                min={0}
                                max={120}
                                step={1}
                                value={policyForm.expire_months}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    expire_months: Math.max(
                                      0,
                                      Math.min(120, Math.floor(Number(e.target.value || 0)))
                                    ),
                                  })
                                }
                              />
                              {validationErrors.expire_months && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.expire_months}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        {policyTab === '申請' && (
                          <>
                            <div className='flex items-center gap-3'>
                              <Switch
                                checked={policyForm.allow_negative}
                                onCheckedChange={(v) =>
                                  setPolicyForm({ ...policyForm, allow_negative: !!v })
                                }
                              />
                              <div>
                                <Label>マイナス残高を許容</Label>
                                <div className='text-xs text-gray-500'>
                                  有給休暇の残日数が0日未満（マイナス）になった場合でも、申請を許可するか
                                </div>
                              </div>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <Label>最小予約単位（分）</Label>
                                <div className='text-xs text-gray-500 mb-1'>
                                  申請時に切り上げる最小単位
                                </div>
                                <Input
                                  type='number'
                                  min={1}
                                  max={1440}
                                  step={1}
                                  value={policyForm.min_booking_unit_minutes}
                                  onChange={(e) =>
                                    setPolicyForm({
                                      ...policyForm,
                                      min_booking_unit_minutes: Math.max(
                                        1,
                                        Math.min(1440, Math.floor(Number(e.target.value || 0)))
                                      ),
                                    })
                                  }
                                />
                                {validationErrors.min_booking_unit_minutes && (
                                  <div className='text-xs text-red-600 mt-1'>
                                    {validationErrors.min_booking_unit_minutes}
                                  </div>
                                )}
                              </div>
                              <div>
                                <Label>丸め（分）</Label>
                                <div className='text-xs text-gray-500 mb-1'>
                                  申請時に近い単位へ丸める
                                </div>
                                <Input
                                  type='number'
                                  min={0}
                                  max={120}
                                  step={1}
                                  value={policyForm.rounding_minutes}
                                  onChange={(e) =>
                                    setPolicyForm({
                                      ...policyForm,
                                      rounding_minutes: Math.max(
                                        0,
                                        Math.min(120, Math.floor(Number(e.target.value || 0)))
                                      ),
                                    })
                                  }
                                />
                                {validationErrors.rounding_minutes && (
                                  <div className='text-xs text-red-600 mt-1'>
                                    {validationErrors.rounding_minutes}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className='flex items-center gap-3'>
                              <Switch
                                checked={policyForm.hold_on_apply}
                                onCheckedChange={(v) =>
                                  setPolicyForm({ ...policyForm, hold_on_apply: !!v })
                                }
                              />
                              <div>
                                <Label>申請時ホールド（申請の処理状態を制御）</Label>
                                <div className='text-xs text-gray-500 mb-1'>
                                  申請時に即座に残日数を控除せず、承認まで保留します
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>控除タイミング（残日数の計算タイミングを制御）</Label>
                              <div className='text-xs text-gray-500 mb-1'>
                                有給休暇の残日数を申請時または承認時に控除するかを選択します
                              </div>
                              <select
                                className='w-full h-9 border rounded-md px-2'
                                value={policyForm.deduction_timing}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    deduction_timing: e.target.value as 'apply' | 'approve',
                                  })
                                }
                              >
                                <option value='apply'>申請時</option>
                                <option value='approve'>承認時</option>
                              </select>
                            </div>
                            <div className='flex items-center gap-3'>
                              <Switch
                                checked={policyForm.business_day_only}
                                onCheckedChange={(v) =>
                                  setPolicyForm({ ...policyForm, business_day_only: !!v })
                                }
                              />
                              <div>
                                <Label>取得対象日を営業日のみに限定</Label>
                              </div>
                            </div>
                            <div>
                              <Label>許可する取得単位</Label>
                              <div className='flex items-center gap-4 mt-2'>
                                {(['day', 'half', 'hour'] as Array<'day' | 'half' | 'hour'>).map(
                                  (u) => (
                                    <label key={u} className='flex items-center gap-2 text-sm'>
                                      <input
                                        type='checkbox'
                                        className='h-4 w-4'
                                        checked={policyForm?.allowed_units?.includes(u) || false}
                                        onChange={(e) => {
                                          const currentUnits = policyForm?.allowed_units || ['day'];
                                          const set = new Set(currentUnits);
                                          if (e.target.checked) set.add(u);
                                          else set.delete(u);
                                          const next = Array.from(set) as Array<
                                            'day' | 'half' | 'hour'
                                          >;
                                          setPolicyForm({
                                            ...policyForm,
                                            allowed_units: next.length > 0 ? next : ['day'],
                                          });
                                        }}
                                      />
                                      <span>
                                        {u === 'day' ? '1日' : u === 'half' ? '半日' : '時間'}
                                      </span>
                                    </label>
                                  )
                                )}
                              </div>
                              {validationErrors.allowed_units && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.allowed_units}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label>半休モード</Label>
                              <select
                                className={`w-full h-9 border rounded-md px-2 mt-1 ${!policyForm?.allowed_units?.includes('half') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={policyForm?.half_day_mode || 'fixed_hours'}
                                disabled={!policyForm?.allowed_units?.includes('half')}
                                onChange={(e) =>
                                  setPolicyForm({
                                    ...policyForm,
                                    half_day_mode: e.target.value as 'fixed_hours' | 'am_pm',
                                  })
                                }
                              >
                                <option value='fixed_hours'>固定時間（例: 4時間）</option>
                                <option value='am_pm'>AM/PM 指定</option>
                              </select>
                              {!policyForm?.allowed_units?.includes('half') && (
                                <div className='text-xs text-gray-500 mt-1'>
                                  半日単位が許可されていないため設定できません。まず「許可する取得単位」で半日を有効にしてください。
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-3'>
                              <Switch
                                checked={policyForm.allow_multi_day}
                                onCheckedChange={(v) =>
                                  setPolicyForm({ ...policyForm, allow_multi_day: !!v })
                                }
                              />
                              <div>
                                <Label>複数日申請を許可</Label>
                              </div>
                            </div>
                            <div>
                              <Label>取得不可日（blackout_dates）</Label>
                              <div className='text-xs text-gray-500 mb-2'>
                                カレンダーから複数選択できます
                              </div>
                              <div className='p-2 border rounded'>
                                <Calendar
                                  mode='multiple'
                                  selected={policyForm.blackout_dates.map((d) => new Date(d))}
                                  onSelect={(dates) => {
                                    const arr = (dates || [])
                                      .map((dt) => {
                                        if (!(dt instanceof Date) || isNaN(dt.getTime()))
                                          return null;
                                        const y = dt.getFullYear();
                                        const m = String(dt.getMonth() + 1).padStart(2, '0');
                                        const d = String(dt.getDate()).padStart(2, '0');
                                        return `${y}-${m}-${d}`;
                                      })
                                      .filter((x): x is string => !!x);
                                    const uniq = Array.from(new Set(arr)).sort();
                                    setPolicyForm({ ...policyForm, blackout_dates: uniq });
                                  }}
                                />
                              </div>
                              {validationErrors.blackout_dates && (
                                <div className='text-xs text-red-600 mt-1'>
                                  {validationErrors.blackout_dates}
                                </div>
                              )}
                              <div className='text-xs text-gray-500 mt-2'>
                                選択済: {policyForm.blackout_dates.length}日
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={async () => {
                            if (!companyId || !policy.leaveTypeId) return;
                            setIsBusy(true);
                            try {
                              const errs = validatePolicy(policyForm);
                              setValidationErrors(errs);
                              if (Object.keys(errs).length > 0) {
                                toast({
                                  title: '入力エラー',
                                  description:
                                    '不正な入力があります。赤字の説明を確認してください。',
                                  variant: 'destructive',
                                });
                                setIsBusy(false);
                                return;
                              }
                              const res = await updateLeavePolicyPartial({
                                companyId,
                                leaveTypeId: policy.leaveTypeId,
                                patch: {
                                  day_hours: policyForm.day_hours,
                                  anniversary_offset_days: policyForm.anniversary_offset_days,
                                  monthly_proration: policyForm.monthly_proration,
                                  monthly_proration_basis: policyForm.monthly_proration_basis,
                                  monthly_min_attendance_rate:
                                    policyForm.monthly_min_attendance_rate,
                                  base_days_by_service: {
                                    unit: grantUnit,
                                    data: baseGrantData.data as Record<
                                      string,
                                      number | Record<string, number | Record<string, number>>
                                    >,
                                  } as BaseDaysByService,
                                  carryover_max_days:
                                    policyForm.carryover_max_days === ''
                                      ? null
                                      : Number(policyForm.carryover_max_days),
                                  expire_months: policyForm.expire_months,
                                  allow_negative: policyForm.allow_negative,
                                  min_booking_unit_minutes: policyForm.min_booking_unit_minutes,
                                  rounding_minutes: policyForm.rounding_minutes,
                                  hold_on_apply: policyForm.hold_on_apply,
                                  deduction_timing: policyForm.deduction_timing,
                                  business_day_only: policyForm.business_day_only,
                                  allowed_units: policyForm.allowed_units,
                                  half_day_mode: policyForm.half_day_mode,
                                  allow_multi_day: policyForm.allow_multi_day,
                                  blackout_dates: policyForm.blackout_dates,
                                  accrual_method: policyForm.monthly_proration
                                    ? policyForm.monthly_proration_basis === 'days'
                                      ? 'attendance_based'
                                      : 'hours_based'
                                    : 'fiscal_fixed',
                                },
                              });
                              if (!res.success) throw new Error(res.error || 'failed');
                              toast({ title: '保存完了', description: 'ポリシーを更新しました。' });
                              setPolicyDialogOpen(false);
                            } catch (e) {
                              toast({
                                title: '保存失敗',
                                description: e instanceof Error ? e.message : 'Unknown error',
                                variant: 'destructive',
                              });
                            } finally {
                              setIsBusy(false);
                            }
                          }}
                          disabled={isBusy}
                        >
                          保存
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className='ml-2'
                        variant='outline'
                        disabled={!policy.leaveTypeId || !policy.grantDate}
                        onClick={async () => {
                          if (!companyId || !policy.leaveTypeId || !policy.grantDate) return;
                          setIsBusy(true);
                          try {
                            const res = await previewPolicyGrantAdvanced({
                              companyId,
                              leaveTypeId: policy.leaveTypeId,
                              grantDate: policy.grantDate,
                            });
                            if (!res.success) throw new Error(res.error || 'failed');
                            setPreviewRows(res.results);
                            setPreviewAccrual(res.accrualMethod);
                            setPostRunDiff([]);
                            setPreviewDialogOpen(true);
                          } catch (e) {
                            toast({
                              title: 'プレビュー失敗',
                              description: e instanceof Error ? e.message : 'Unknown error',
                              variant: 'destructive',
                            });
                          } finally {
                            setIsBusy(false);
                          }
                        }}
                      >
                        付与プレビュー
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white'>
                      <DialogHeader>
                        <DialogTitle>付与プレビュー</DialogTitle>
                        <DialogDescription>
                          選択された条件での休暇付与のプレビューを表示します。実行前に結果を確認してください。
                        </DialogDescription>
                      </DialogHeader>
                      <div className='text-sm text-gray-600 mb-2'>
                        方式: {previewAccrual === 'fiscal_fixed' ? '年度' : '-'}
                        {previewAccrual === 'fiscal_fixed'
                          ? `（期首月: ${fiscalStartMonth}月）`
                          : ''}
                      </div>
                      <div className='max-h-[60vh] overflow-auto'>
                        <table className='min-w-full text-sm'>
                          <thead>
                            <tr className='text-left text-gray-600'>
                              <th className='py-2 pr-4'>ユーザー</th>
                              <th className='py-2 pr-4'>対象</th>
                              <th className='py-2 pr-4'>勤続年数</th>
                              <th className='py-2 pr-4'>基準日数</th>
                              <th className='py-2 pr-4'>付与分(分)</th>
                              <th className='py-2 pr-4'>重複</th>
                              <th className='py-2 pr-4'>理由</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((r, idx) => {
                              const u = users.find((x) => x.id === r.userId);
                              return (
                                <tr key={idx} className='border-t'>
                                  <td className='py-2 pr-4'>
                                    {u
                                      ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                      : r.userId}
                                  </td>
                                  <td className='py-2 pr-4'>{r.eligible ? '対象' : '対象外'}</td>
                                  <td className='py-2 pr-4'>{r.serviceYears}</td>
                                  <td className='py-2 pr-4'>{r.baseDays.toFixed(2)}</td>
                                  <td className='py-2 pr-4'>{r.quantityMinutes}</td>
                                  <td className='py-2 pr-4'>{r.duplicate ? '既存あり' : '-'}</td>
                                  <td className='py-2 pr-4'>{r.reason || '-'}</td>
                                </tr>
                              );
                            })}
                            {previewRows.length === 0 && (
                              <tr>
                                <td className='py-4 text-gray-500' colSpan={7}>
                                  表示するデータがありません
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {postRunDiff.length > 0 && (
                        <div className='mt-4 border rounded-md p-3 bg-amber-50'>
                          <div className='font-semibold mb-2'>実行結果の検証</div>
                          <div className='text-xs text-gray-600 mb-2'>
                            期待と実行結果に差分がありました（最大20件表示）。
                          </div>
                          <div className='flex items-center gap-3 mb-3 text-sm'>
                            <div>
                              <Label className='mr-2'>並び替え</Label>
                              <select
                                className='h-8 border rounded px-2'
                                value={diffSort}
                                onChange={(e) =>
                                  setDiffSort(
                                    e.target.value as
                                      | 'delta_desc'
                                      | 'delta_asc'
                                      | 'expected_desc'
                                      | 'actual_desc'
                                  )
                                }
                              >
                                <option value='delta_desc'>差分 大きい順</option>
                                <option value='delta_asc'>差分 小さい順</option>
                                <option value='expected_desc'>期待分 大きい順</option>
                                <option value='actual_desc'>実績分 大きい順</option>
                              </select>
                            </div>
                            <div>
                              <Label className='mr-2'>最小差分（分）</Label>
                              <Input
                                type='number'
                                className='h-8 w-28 inline-block'
                                min={0}
                                step={1}
                                value={diffMinAbs}
                                onChange={(e) =>
                                  setDiffMinAbs(
                                    Math.max(0, Math.floor(Number(e.target.value || 0)))
                                  )
                                }
                              />
                            </div>
                          </div>
                          {(() => {
                            const rows = [...postRunDiff]
                              .filter(
                                (r) => Math.abs((r.actual || 0) - (r.expected || 0)) >= diffMinAbs
                              )
                              .sort((a, b) => {
                                const da = (a.actual || 0) - (a.expected || 0);
                                const db = (b.actual || 0) - (b.expected || 0);
                                switch (diffSort) {
                                  case 'delta_asc':
                                    return Math.abs(da) - Math.abs(db);
                                  case 'expected_desc':
                                    return (b.expected || 0) - (a.expected || 0);
                                  case 'actual_desc':
                                    return (b.actual || 0) - (a.actual || 0);
                                  case 'delta_desc':
                                  default:
                                    return Math.abs(db) - Math.abs(da);
                                }
                              })
                              .slice(0, 20);
                            return (
                              <table className='min-w-full text-sm'>
                                <thead>
                                  <tr className='text-left text-gray-600'>
                                    <th className='py-2 pr-4'>ユーザー</th>
                                    <th className='py-2 pr-4'>期待(分)</th>
                                    <th className='py-2 pr-4'>実績(分)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, idx) => {
                                    const u = users.find((x) => x.id === r.userId);
                                    return (
                                      <tr key={idx} className='border-t'>
                                        <td className='py-2 pr-4'>
                                          {u
                                            ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                            : r.userId}
                                        </td>
                                        <td className='py-2 pr-4'>{r.expected}</td>
                                        <td className='py-2 pr-4'>{r.actual}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setPreviewDialogOpen(false);
                            setPostRunDiff([]);
                          }}
                        >
                          閉じる
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => {
                            const header = [
                              'user_id',
                              'name',
                              'eligible',
                              'service_years',
                              'base_days',
                              'quantity_minutes',
                              'duplicate',
                              'reason',
                            ];
                            const rows = previewRows.map((r) => {
                              const u = users.find((x) => x.id === r.userId);
                              const name = u
                                ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                : '';
                              return [
                                r.userId,
                                name,
                                r.eligible ? '1' : '0',
                                String(r.serviceYears),
                                r.baseDays.toFixed(2),
                                String(r.quantityMinutes),
                                r.duplicate ? '1' : '0',
                                r.reason || '',
                              ].join(',');
                            });
                            const blob = new Blob([[header.join(','), ...rows].join('\n')], {
                              type: 'text/csv;charset=utf-8;',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `leave_grant_preview_${policy.grantDate || 'date'}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          CSVダウンロード
                        </Button>
                        <Button
                          variant='outline'
                          disabled={postRunDiff.length === 0}
                          onClick={() => {
                            if (postRunDiff.length === 0) return;
                            const header = [
                              'user_id',
                              'name',
                              'expected_minutes',
                              'actual_minutes',
                              'delta_minutes',
                            ];
                            const rows = postRunDiff.map((r) => {
                              const u = users.find((x) => x.id === r.userId);
                              const name = u
                                ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                : '';
                              const delta = (r.actual || 0) - (r.expected || 0);
                              return [
                                r.userId,
                                name,
                                String(r.expected),
                                String(r.actual),
                                String(delta),
                              ].join(',');
                            });
                            const blob = new Blob([[header.join(','), ...rows].join('\n')], {
                              type: 'text/csv;charset=utf-8;',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `leave_grant_diff_${policy.grantDate || 'date'}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          差分CSVダウンロード
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!companyId || !policy.leaveTypeId || !policy.grantDate) return;
                            setIsBusy(true);
                            try {
                              const { runPolicyGrantAuto } = await import(
                                '@/lib/actions/leave-grants'
                              );
                              const res = await runPolicyGrantAuto({
                                companyId,
                                leaveTypeId: policy.leaveTypeId,
                                grantDate: policy.grantDate,
                                createdBy: user?.id || undefined,
                              });
                              if (!res.success) throw new Error(res.error || 'failed');
                              toast({
                                title: '付与実行',
                                description: `付与:${res.granted} / スキップ:${res.skipped}`,
                              });
                              try {
                                const supabase = createClient(
                                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                                );
                                const userIds = users.map((u) => u.id);
                                const { data: grants } = await supabase
                                  .from('leave_grants')
                                  .select('user_id, quantity_minutes')
                                  .in('user_id', userIds)
                                  .eq('leave_type_id', policy.leaveTypeId)
                                  .eq('granted_on', policy.grantDate)
                                  .eq('source', 'policy')
                                  .is('deleted_at', null);
                                const actualMap = new Map<string, number>();
                                (grants || []).forEach((g) => {
                                  const uid = (g as { user_id: string }).user_id;
                                  const qty =
                                    (g as { quantity_minutes: number }).quantity_minutes || 0;
                                  actualMap.set(uid, (actualMap.get(uid) || 0) + qty);
                                });
                                const expectedMap = new Map<string, number>();
                                previewRows
                                  .filter(
                                    (r) => r.eligible && r.quantityMinutes > 0 && !r.duplicate
                                  )
                                  .forEach((r) =>
                                    expectedMap.set(
                                      r.userId,
                                      (expectedMap.get(r.userId) || 0) + r.quantityMinutes
                                    )
                                  );
                                const diffs: Array<{
                                  userId: string;
                                  expected: number;
                                  actual: number;
                                }> = [];
                                const allIds = new Set<string>([
                                  ...Array.from(actualMap.keys()),
                                  ...Array.from(expectedMap.keys()),
                                ]);
                                allIds.forEach((uid) => {
                                  const ex = expectedMap.get(uid) || 0;
                                  const ac = actualMap.get(uid) || 0;
                                  if (ex !== ac)
                                    diffs.push({ userId: uid, expected: ex, actual: ac });
                                });
                                setPostRunDiff(diffs);
                                if (diffs.length > 0) {
                                  toast({
                                    title: '検証完了（差分あり）',
                                    description: `差分: ${diffs.length}件`,
                                  });
                                } else {
                                  toast({ title: '検証完了', description: '差分はありません。' });
                                }
                              } catch (e) {
                                toast({
                                  title: '検証エラー',
                                  description: e instanceof Error ? e.message : 'Unknown error',
                                  variant: 'destructive',
                                });
                              }
                            } catch (e) {
                              toast({
                                title: '付与実行失敗',
                                description: e instanceof Error ? e.message : 'Unknown error',
                                variant: 'destructive',
                              });
                            } finally {
                              setIsBusy(false);
                            }
                          }}
                          disabled={isBusy || previewRows.length === 0}
                        >
                          この内容で付与を実行
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className='mt-2 text-sm text-gray-600'>
                <p>※「休暇種別」と「付与日」を選択すると「ポリシー編集」ボタンが有効になります。</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSVインポート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-3 flex-wrap'>
                <label className='px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50'>
                  ファイルを選択
                  <input
                    type='file'
                    accept='.csv,text/csv'
                    className='hidden'
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCsv(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <Button variant='outline' onClick={downloadTemplate}>
                  テンプレDL
                </Button>
                <div className='text-sm text-gray-600'>
                  ヘッダ例: user_id,leave_type_id,quantity_minutes,granted_on,expires_on,note
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>手動付与</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label>ユーザー</Label>
                  <select
                    className='w-full h-9 border rounded-md px-2'
                    value={manual.userId}
                    onChange={(e) => setManual({ ...manual, userId: e.target.value })}
                  >
                    <option value=''>選択してください</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {`${u.family_name || ''} ${u.first_name || ''}`.trim() || u.email || u.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>休暇種別</Label>
                  <select
                    className='w-full h-9 border rounded-md px-2'
                    value={manual.leaveTypeId}
                    onChange={(e) => setManual({ ...manual, leaveTypeId: e.target.value })}
                  >
                    <option value=''>選択してください</option>
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>付与分（分）</Label>
                  <Input
                    type='number'
                    value={manual.quantityMinutes}
                    onChange={(e) =>
                      setManual({ ...manual, quantityMinutes: Number(e.target.value || 0) })
                    }
                  />
                </div>
                <div>
                  <Label>付与日</Label>
                  <Input
                    type='date'
                    value={manual.grantedOn}
                    onChange={(e) => setManual({ ...manual, grantedOn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>失効日（任意）</Label>
                  <Input
                    type='date'
                    value={manual.expiresOn}
                    onChange={(e) => setManual({ ...manual, expiresOn: e.target.value })}
                  />
                </div>
                <div className='md:col-span-3'>
                  <Label>メモ</Label>
                  <Input
                    value={manual.note}
                    onChange={(e) => setManual({ ...manual, note: e.target.value })}
                  />
                </div>
              </div>
              <div className='mt-4'>
                <Button onClick={submitManual} disabled={isBusy}>
                  手動付与を登録
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='一覧' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={historyTab}
                onValueChange={(value) => setHistoryTab(value as '付与' | '消費' | '残高')}
                className='space-y-4'
              >
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='付与'>付与</TabsTrigger>
                  <TabsTrigger value='消費'>消費</TabsTrigger>
                  <TabsTrigger value='残高'>残高</TabsTrigger>
                </TabsList>

                <TabsContent value='付与' className='space-y-4'>
                  {/* フィルター */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                    <div>
                      <Label>ユーザー</Label>
                      <Input
                        placeholder='名前で検索...'
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label>休暇種別</Label>
                      <select
                        className='w-full h-9 border rounded-md px-2 mt-1'
                        value={filterLeaveType}
                        onChange={(e) => setFilterLeaveType(e.target.value)}
                      >
                        <option value=''>すべて</option>
                        {leaveTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>付与方法</Label>
                      <select
                        className='w-full h-9 border rounded-md px-2 mt-1'
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                      >
                        <option value=''>すべて</option>
                        <option value='policy'>一括付与</option>
                        <option value='csv'>CSVインポート</option>
                        <option value='manual'>手動付与</option>
                      </select>
                    </div>
                  </div>

                  {/* 一括操作 */}
                  {selectedIds.size > 0 && (
                    <div className='flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-sm font-medium text-blue-800'>
                          {selectedIds.size}件が選択されています
                        </span>
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={handleBulkDelete}
                        className='bg-red-600 hover:bg-red-700'
                      >
                        選択した項目を削除
                      </Button>
                    </div>
                  )}

                  {activeTab === '一覧' && (isLoadingGrants || isLoadingConsumptions) ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4'></div>
                      <span className='text-gray-500'>データ取得中...</span>
                    </div>
                  ) : (
                    <div className='overflow-x-auto overflow-y-auto max-w-full max-h-[70vh]'>
                      <table className='min-w-full text-sm'>
                        <thead>
                          <tr className='text-left text-gray-600'>
                            <th className='py-2 pr-4 w-12'>
                              <input
                                type='checkbox'
                                checked={isSelectAll}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              />
                            </th>
                            <th className='py-2 pr-4'>ユーザー</th>
                            <th className='py-2 pr-4'>休暇種別</th>
                            <th className='py-2 pr-4'>付与時間</th>
                            <th className='py-2 pr-4'>付与日</th>
                            <th className='py-2 pr-4'>失効日</th>
                            <th className='py-2 pr-4'>付与方法</th>
                            <th className='py-2 pr-4'></th>
                            <th className='py-2 pr-4'>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGrants.map((g) => {
                            const u = users.find((x) => x.id === g.user_id);
                            const lt = leaveTypes.find((x) => x.id === g.leave_type_id);
                            return (
                              <tr key={g.id} className='border-t'>
                                <td className='py-2 pr-4 w-12'>
                                  <input
                                    type='checkbox'
                                    checked={selectedIds.has(g.id)}
                                    onChange={(e) => handleSelectRow(g.id, e.target.checked)}
                                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                  />
                                </td>
                                <td className='py-2 pr-4'>
                                  {u
                                    ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                    : g.user_id}
                                </td>
                                <td className='py-2 pr-4'>{lt ? lt.name : g.leave_type_id}</td>
                                <td className='py-2 pr-4'>
                                  {(() => {
                                    const totalMinutes = g.quantity_minutes;
                                    const days = Math.floor(totalMinutes / (8 * 60)); // 8時間を1日として計算
                                    const remainingMinutes = totalMinutes % (8 * 60);
                                    const hours = Math.floor(remainingMinutes / 60);
                                    const minutes = remainingMinutes % 60;

                                    let result = '';
                                    if (days > 0) result += `${days}日`;
                                    // 常に時間と分を表示（0の場合は00として表示）
                                    result += `${hours.toString().padStart(2, '0')}時間${minutes.toString().padStart(2, '0')}分`;
                                    return result;
                                  })()}
                                </td>
                                <td className='py-2 pr-4'>
                                  {(() => {
                                    const date = new Date(g.granted_on);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    return `${year}年${month}月${day}日`;
                                  })()}
                                </td>
                                <td className='py-2 pr-4'>
                                  {g.expires_on
                                    ? (() => {
                                        const date = new Date(g.expires_on);
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        return `${year}年${month}月${day}日`;
                                      })()
                                    : '-'}
                                </td>
                                <td className='py-2 pr-4'>
                                  {g.source === 'policy'
                                    ? '一括付与'
                                    : g.source === 'csv'
                                      ? 'CSVインポート'
                                      : g.source === 'manual'
                                        ? '手動付与'
                                        : g.source}
                                </td>
                                <td className='py-2 pr-4'></td>
                                <td className='py-2 pr-4'>
                                  <div className='flex items-center space-x-2'>
                                    <ActionButton
                                      action='edit'
                                      onClick={() => handleEditClick(g.id)}
                                    />
                                    <ActionButton
                                      action='delete'
                                      onClick={() => handleDeleteClick(g.id)}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredGrants.length === 0 && (
                            <tr>
                              <td className='py-2 pr-4 text-gray-500' colSpan={9}>
                                条件に一致する付与履歴がありません
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='消費' className='space-y-4'>
                  {/* フィルター */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                    <div>
                      <Label>ユーザー</Label>
                      <Input
                        placeholder='名前で検索...'
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label>休暇種別</Label>
                      <select
                        className='w-full h-9 border rounded-md px-2 mt-1'
                        value={filterLeaveType}
                        onChange={(e) => setFilterLeaveType(e.target.value)}
                      >
                        <option value=''>すべて</option>
                        {leaveTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isLoadingConsumptions ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4'></div>
                      <span className='text-gray-500'>データ取得中...</span>
                    </div>
                  ) : (
                    <div className='overflow-x-auto overflow-y-auto max-w-full max-h-[70vh]'>
                      <table className='min-w-full text-sm'>
                        <thead>
                          <tr className='text-left text-gray-600'>
                            <th className='py-2 pr-4'>ユーザー</th>
                            <th className='py-2 pr-4'>休暇種別</th>
                            <th className='py-2 pr-4'>消費時間</th>
                            <th className='py-2 pr-4'>消費日</th>
                            <th className='py-2 pr-4'>ステータス</th>
                            <th className='py-2 pr-4'>開始日</th>
                            <th className='py-2 pr-4'>終了日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredConsumptions.map((c) => {
                            const u = users.find((x) => x.id === c.user_id);
                            const lt = leaveTypes.find((x) => x.id === c.leave_type_id);
                            return (
                              <tr key={c.id} className='border-t'>
                                <td className='py-2 pr-4'>
                                  {u
                                    ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                    : c.user_id}
                                </td>
                                <td className='py-2 pr-4'>{lt ? lt.name : c.leave_type_id}</td>
                                <td className='py-2 pr-4'>
                                  {(() => {
                                    const totalMinutes = c.quantity_minutes;
                                    const days = Math.floor(totalMinutes / (8 * 60));
                                    const remainingMinutes = totalMinutes % (8 * 60);
                                    const hours = Math.floor(remainingMinutes / 60);
                                    const minutes = remainingMinutes % 60;
                                    let result = '';
                                    if (days > 0) result += `${days}日`;
                                    result += `${hours.toString().padStart(2, '0')}時間${minutes.toString().padStart(2, '0')}分`;
                                    return result;
                                  })()}
                                </td>
                                <td className='py-2 pr-4'>
                                  {c.consumed_on
                                    ? (() => {
                                        const date = new Date(c.consumed_on);
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        return `${year}年${month}月${day}日`;
                                      })()
                                    : '-'}
                                </td>
                                <td className='py-2 pr-4'>
                                  {(() => {
                                    const status = c.status;
                                    let label = '';
                                    let className = '';
                                    switch (status) {
                                      case 'pending':
                                        label = '申請中';
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-sky-600 border border-sky-300 bg-white rounded-full';
                                        break;
                                      case 'approved':
                                        label = '承認済';
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-300 bg-white rounded-full';
                                        break;
                                      case 'in_progress':
                                        label = '進行中';
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-purple-600 border border-purple-300 bg-white rounded-full';
                                        break;
                                      case 'completed':
                                        label = '完了';
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-orange-600 border border-orange-400 bg-orange-50 rounded-full';
                                        break;
                                      case 'cancelled':
                                        label = '取消';
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-red-600 border border-red-400 bg-red-50 rounded-full';
                                        break;
                                      default:
                                        label = status;
                                        className =
                                          'inline-block px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-300 bg-white rounded-full';
                                    }
                                    return <span className={className}>{label}</span>;
                                  })()}
                                </td>
                                <td className='py-2 pr-4'>{c.start_date}</td>
                                <td className='py-2 pr-4'>{c.end_date}</td>
                              </tr>
                            );
                          })}
                          {filteredConsumptions.length === 0 && (
                            <tr>
                              <td className='py-2 pr-4 text-gray-500' colSpan={9}>
                                条件に一致する消費履歴がありません
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='残高' className='space-y-4'>
                  <Card>
                    <CardContent>
                      {/* フィルター */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                        <div>
                          <Label>ユーザー</Label>
                          <Input
                            placeholder='名前で検索...'
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className='mt-1'
                          />
                        </div>
                        <div>
                          <Label>休暇種別</Label>
                          <select
                            className='w-full h-9 border rounded-md px-2 mt-1'
                            value={filterLeaveType}
                            onChange={(e) => setFilterLeaveType(e.target.value)}
                          >
                            <option value=''>すべて</option>
                            {leaveTypes.map((lt) => (
                              <option key={lt.id} value={lt.id}>
                                {lt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className='overflow-x-auto overflow-y-auto max-w-full max-h-[70vh]'>
                        {(() => {
                          const grants = recentGrants
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(a.granted_on).getTime() - new Date(b.granted_on).getTime()
                            );
                          const consumptions = recentConsumptions
                            .slice()
                            .sort(
                              (a, b) =>
                                new Date(a.consumed_on).getTime() -
                                new Date(b.consumed_on).getTime()
                            );
                          // 2. FIFO消費割当
                          const grantConsumptionMap: Record<string, number> = {};
                          const grantGroups: Record<string, typeof grants> = {};
                          grants.forEach((g) => {
                            const key = `${g.user_id}-${g.leave_type_id}`;
                            if (!grantGroups[key]) grantGroups[key] = [];
                            grantGroups[key].push(g);
                            grantConsumptionMap[g.id] = 0;
                          });
                          consumptions.forEach((c) => {
                            if (!c.user_id || !c.leave_type_id || !c.quantity_minutes) return;
                            let remain = c.quantity_minutes;
                            const key = `${c.user_id}-${c.leave_type_id}`;
                            const grantsForUserType = grantGroups[key] || [];
                            for (const g of grantsForUserType) {
                              const grantRemain = g.quantity_minutes - grantConsumptionMap[g.id];
                              if (grantRemain <= 0) continue;
                              const use = Math.min(grantRemain, remain);
                              grantConsumptionMap[g.id] += use;
                              remain -= use;
                              if (remain <= 0) break;
                            }
                          });
                          // フィルタリング
                          const filteredGrants = grants.filter((g) => {
                            const u = users.find((x) => x.id === g.user_id);
                            const userName = u
                              ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                              : '';
                            if (
                              filterUser &&
                              !userName.toLowerCase().includes(filterUser.toLowerCase())
                            ) {
                              return false;
                            }
                            if (filterLeaveType && g.leave_type_id !== filterLeaveType) {
                              return false;
                            }
                            return true;
                          });
                          // 3. 表示
                          return (
                            <table className='min-w-full text-sm'>
                              <thead>
                                <tr className='text-left text-gray-600'>
                                  <th className='py-2 pr-4'>ユーザー</th>
                                  <th className='py-2 pr-4'>休暇種別</th>
                                  <th className='py-2 pr-4'>付与時間</th>
                                  <th className='py-2 pr-4'>付与日</th>
                                  <th className='py-2 pr-4'>失効日</th>
                                  <th className='py-2 pr-4'>合計消費時間</th>
                                  <th className='py-2 pr-4'>残高</th>
                                  <th className='py-2 pr-4'>残高割合</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredGrants.map((g) => {
                                  const u = users.find((x) => x.id === g.user_id);
                                  const lt = leaveTypes.find((x) => x.id === g.leave_type_id);
                                  const consumed = grantConsumptionMap[g.id] || 0;
                                  const balance = g.quantity_minutes - consumed;
                                  const formatMinutes = (min: number) => {
                                    const days = Math.floor(min / (8 * 60));
                                    const remainingMinutes = min % (8 * 60);
                                    const hours = Math.floor(remainingMinutes / 60);
                                    const minutes = remainingMinutes % 60;
                                    let result = '';
                                    if (days > 0) result += `${days}日`;
                                    result += `${hours.toString().padStart(2, '0')}時間${minutes.toString().padStart(2, '0')}分`;
                                    return result;
                                  };
                                  return (
                                    <tr key={g.id} className='border-t'>
                                      <td className='py-2 pr-4'>
                                        {u
                                          ? `${u.family_name || ''} ${u.first_name || ''}`.trim()
                                          : g.user_id}
                                      </td>
                                      <td className='py-2 pr-4'>
                                        {lt ? lt.name : g.leave_type_id}
                                      </td>
                                      <td className='py-2 pr-4'>
                                        {formatMinutes(g.quantity_minutes)}
                                      </td>
                                      <td className='py-2 pr-4'>
                                        {(() => {
                                          const d = new Date(g.granted_on);
                                          return `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`;
                                        })()}
                                      </td>
                                      <td className='py-2 pr-4'>
                                        {g.expires_on
                                          ? (() => {
                                              const d = new Date(g.expires_on);
                                              return `${d.getFullYear()}年${(d.getMonth() + 1).toString().padStart(2, '0')}月${d.getDate().toString().padStart(2, '0')}日`;
                                            })()
                                          : '-'}
                                      </td>
                                      <td className='py-2 pr-4'>{formatMinutes(consumed)}</td>
                                      <td className='py-2 pr-4'>{formatMinutes(balance)}</td>
                                      <td className='py-2 pr-4'>
                                        {g.quantity_minutes > 0
                                          ? Math.round((balance / g.quantity_minutes) * 100)
                                          : 0}
                                        %
                                      </td>
                                    </tr>
                                  );
                                })}
                                {filteredGrants.length === 0 && (
                                  <tr>
                                    <td className='py-2 pr-4 text-gray-500' colSpan={7}>
                                      データがありません
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 編集ダイアログ */}
      <LeaveGrantEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        leaveGrantId={selectedLeaveGrantId}
        onSuccess={handleOperationSuccess}
        users={users}
        leaveTypes={leaveTypes}
      />

      {/* 削除ダイアログ */}
      <LeaveGrantDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        leaveGrantId={selectedLeaveGrantId}
        selectedIds={selectedIds}
        onSuccess={handleOperationSuccess}
      />
    </div>
  );
}
