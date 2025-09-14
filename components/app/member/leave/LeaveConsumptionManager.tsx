'use client';

import { useEffect, useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// import { useAuth } from '@/contexts/auth-context';
import {
  getLeaveGrantsByUser,
  getLeaveConsumptionsByUser,
  getLeaveTypes,
} from '@/lib/actions/leave-consumptions';

interface LeaveGrant {
  id: string;
  user_id: string;
  leave_type_id: string;
  quantity_minutes: number;
  granted_on: string;
  expires_on: string | null;
  source: string;
}

interface LeaveConsumption {
  id: string;
  user_id: string;
  leave_type_id: string;
  quantity_minutes: number;
  consumed_on: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

interface LeaveType {
  id: string;
  name: string;
}

export function LeaveConsumptionManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'付与' | '消費' | '残高'>('付与');
  const [leaveGrants, setLeaveGrants] = useState<LeaveGrant[]>([]);
  const [leaveConsumptions, setLeaveConsumptions] = useState<LeaveConsumption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [filterLeaveType, setFilterLeaveType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([
      getLeaveGrantsByUser(user.id),
      getLeaveConsumptionsByUser(user.id),
      getLeaveTypes(user.company_id || ''),
    ])
      .then(([grants, consumptions, types]) => {
        setLeaveGrants(grants as LeaveGrant[]);
        setLeaveConsumptions(consumptions as LeaveConsumption[]);
        setLeaveTypes(types as LeaveType[]);
      })
      .catch(() => {
        toast({ title: 'エラー', description: 'データ取得に失敗しました', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) return null;
  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center py-8'>
            <div className='w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
            <span className='ml-2 text-gray-500'>読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // フィルタ適用
  const filteredGrants = leaveGrants.filter(
    (g) => !filterLeaveType || g.leave_type_id === filterLeaveType
  );
  const filteredConsumptions = leaveConsumptions.filter(
    (c) => !filterLeaveType || c.leave_type_id === filterLeaveType
  );

  // 残高計算（FIFO）
  const grantConsumptionMap: Record<string, number> = {};
  const grantGroups: Record<string, LeaveGrant[]> = {};
  filteredGrants.forEach((g) => {
    const key = g.leave_type_id;
    if (!grantGroups[key]) grantGroups[key] = [];
    grantGroups[key].push(g);
    grantConsumptionMap[g.id] = 0;
  });
  filteredConsumptions.forEach((c) => {
    let remain = c.quantity_minutes;
    const key = c.leave_type_id;
    const grantsForType = grantGroups[key] || [];
    for (const g of grantsForType) {
      const grantRemain = g.quantity_minutes - grantConsumptionMap[g.id];
      if (grantRemain <= 0) continue;
      const use = Math.min(grantRemain, remain);
      grantConsumptionMap[g.id] += use;
      remain -= use;
      if (remain <= 0) break;
    }
  });

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
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-gray-900'>休暇管理</h1>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='付与'>付与</TabsTrigger>
          <TabsTrigger value='消費'>消費</TabsTrigger>
          <TabsTrigger value='残高'>残高</TabsTrigger>
        </TabsList>
        <TabsContent value='付与' className='space-y-4'>
          <div className='mb-4'>
            <select
              className='w-48 h-9 border rounded-md px-2'
              value={filterLeaveType}
              onChange={(e) => setFilterLeaveType(e.target.value)}
            >
              <option value=''>すべての休暇種別</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
          <div className='overflow-x-auto max-w-full'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-600'>
                  <th className='py-2 pr-4'>休暇種別</th>
                  <th className='py-2 pr-4'>付与時間</th>
                  <th className='py-2 pr-4'>付与日</th>
                  <th className='py-2 pr-4'>失効日</th>
                  <th className='py-2 pr-4'>付与方法</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map((g) => {
                  const lt = leaveTypes.find((x) => x.id === g.leave_type_id);
                  return (
                    <tr key={g.id} className='border-t'>
                      <td className='py-2 pr-4'>{lt ? lt.name : g.leave_type_id}</td>
                      <td className='py-2 pr-4'>{formatMinutes(g.quantity_minutes)}</td>
                      <td className='py-2 pr-4'>{g.granted_on}</td>
                      <td className='py-2 pr-4'>{g.expires_on || '-'}</td>
                      <td className='py-2 pr-4'>{g.source}</td>
                    </tr>
                  );
                })}
                {filteredGrants.length === 0 && (
                  <tr>
                    <td className='py-2 pr-4 text-gray-500' colSpan={5}>
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value='消費' className='space-y-4'>
          <div className='mb-4'>
            <select
              className='w-48 h-9 border rounded-md px-2'
              value={filterLeaveType}
              onChange={(e) => setFilterLeaveType(e.target.value)}
            >
              <option value=''>すべての休暇種別</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
          <div className='overflow-x-auto max-w-full'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-600'>
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
                  const lt = leaveTypes.find((x) => x.id === c.leave_type_id);
                  return (
                    <tr key={c.id} className='border-t'>
                      <td className='py-2 pr-4'>{lt ? lt.name : c.leave_type_id}</td>
                      <td className='py-2 pr-4'>{formatMinutes(c.quantity_minutes)}</td>
                      <td className='py-2 pr-4'>{c.consumed_on || '-'}</td>
                      <td className='py-2 pr-4'>{c.status}</td>
                      <td className='py-2 pr-4'>{c.start_date || '-'}</td>
                      <td className='py-2 pr-4'>{c.end_date || '-'}</td>
                    </tr>
                  );
                })}
                {filteredConsumptions.length === 0 && (
                  <tr>
                    <td className='py-2 pr-4 text-gray-500' colSpan={6}>
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value='残高' className='space-y-4'>
          <div className='mb-4'>
            <select
              className='w-48 h-9 border rounded-md px-2'
              value={filterLeaveType}
              onChange={(e) => setFilterLeaveType(e.target.value)}
            >
              <option value=''>すべての休暇種別</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
          <div className='overflow-x-auto max-w-full'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-600'>
                  <th className='py-2 pr-4'>休暇種別</th>
                  <th className='py-2 pr-4'>付与日</th>
                  <th className='py-2 pr-4'>失効日</th>
                  <th className='py-2 pr-4'>付与時間</th>
                  <th className='py-2 pr-4'>消費合計</th>
                  <th className='py-2 pr-4'>残高</th>
                  <th className='py-2 pr-4'>残高割合</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map((g) => {
                  const lt = leaveTypes.find((x) => x.id === g.leave_type_id);
                  const consumed = grantConsumptionMap[g.id] || 0;
                  const balance = g.quantity_minutes - consumed;
                  const ratio =
                    g.quantity_minutes > 0 ? Math.round((balance / g.quantity_minutes) * 100) : 0;
                  return (
                    <tr key={g.id} className='border-t'>
                      <td className='py-2 pr-4'>{lt ? lt.name : g.leave_type_id}</td>
                      <td className='py-2 pr-4'>{g.granted_on}</td>
                      <td className='py-2 pr-4'>{g.expires_on || '-'}</td>
                      <td className='py-2 pr-4'>{formatMinutes(g.quantity_minutes)}</td>
                      <td className='py-2 pr-4'>{formatMinutes(consumed)}</td>
                      <td className='py-2 pr-4'>{formatMinutes(balance)}</td>
                      <td className='py-2 pr-4'>{ratio}%</td>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
