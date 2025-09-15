'use client';

import { AlertCircle, BarChart3, CheckCircle, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LogsChart from '@/components/ui/logs-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatsCard from '@/components/ui/stats-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAuditLogsCount,
  getLogsDataForPeriod,
  getSystemErrorLogsCount,
} from '@/lib/actions/system-admin/stats';
import { OrganizationStats } from '@/types/organization';

interface PageClientProps {
  errorLogsCnt: number;
  errorLogsChn: number;
  auditLogsCnt: number;
  auditLogsChn: number;
  roleStats: { systemAdmin: number; admin: number; member: number; total: number };
  organizationStats: OrganizationStats[];
}
export default function PageClient({
  errorLogsCnt,
  errorLogsChn,
  auditLogsCnt,
  auditLogsChn,
  roleStats,
  organizationStats,
}: PageClientProps) {
  const [errorLogsCount, setErrorLogsCount] = useState(errorLogsCnt);
  const [errorLogsChange, setErrorLogsChange] = useState(errorLogsChn);
  const [auditLogsCount, setAuditLogsCount] = useState(auditLogsCnt);
  const [auditLogsChange, setAuditLogsChange] = useState(auditLogsChn);
  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [graphData, setGraphData] = useState<
    Array<{ date: string; errorLogs: number; auditLogs: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // ログ数を取得
  useEffect(() => {
    const fetchLogsCount = async () => {
      try {
        const [errorResult, auditResult] = await Promise.all([
          getSystemErrorLogsCount(selectedPeriod),
          getAuditLogsCount(selectedPeriod),
        ]);

        // エラーハンドリング: 結果がundefinedまたはnullの場合のデフォルト値
        const safeErrorResult = errorResult || { todayCount: 0, yesterdayCount: 0, change: 0 };
        const safeAuditResult = auditResult || { todayCount: 0, yesterdayCount: 0, change: 0 };

        setErrorLogsCount(safeErrorResult.todayCount);
        setErrorLogsChange(safeErrorResult.change);
        setAuditLogsCount(safeAuditResult.todayCount);
        setAuditLogsChange(safeAuditResult.change);
      } catch (error) {
        console.error('Error fetching logs count:', error);
        // エラー時のデフォルト値設定
        setErrorLogsCount(0);
        setErrorLogsChange(0);
        setAuditLogsCount(0);
        setAuditLogsChange(0);
      }
    };

    fetchLogsCount();
  }, [selectedPeriod]);

  // グラフデータを取得
  useEffect(() => {
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        const data = await getLogsDataForPeriod(selectedPeriod);
        setGraphData(data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
        setGraphData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <div className='space-y-4 m-4'>
      {/* Top Section with Graph and Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Large Graph Area */}
        <div className='lg:col-span-3'>
          <Card className='relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <BarChart3 className='w-5 h-5' />
                  <span>ログ推移</span>
                </div>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1month'>1か月</SelectItem>
                    <SelectItem value='3months'>3か月</SelectItem>
                    <SelectItem value='6months'>半年</SelectItem>
                    <SelectItem value='1year'>1年</SelectItem>
                    <SelectItem value='3years'>3年</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center h-[350px]'>
                  <div className='text-center text-gray-500'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                    <p>データを読み込み中...</p>
                  </div>
                </div>
              ) : graphData.length > 0 ? (
                <LogsChart data={graphData} selectedPeriod={selectedPeriod} />
              ) : (
                <div className='flex items-center justify-center h-[350px]'>
                  <div className='text-center text-gray-500'>
                    <BarChart3 className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                    <p>データがありません</p>
                    <p className='text-sm'>選択した期間にログデータが存在しません</p>
                  </div>
                </div>
              )}
            </CardContent>
            {/* Bottom border with gradient */}
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400'></div>
          </Card>
        </div>

        {/* Right Side Stats */}
        <div className='h-full flex flex-col space-y-6'>
          {/* Latest Day's Error Count */}
          <div className='h-full'>
            <StatsCard
              title='最新日のシステムエラーログ'
              value={errorLogsCount}
              change={Math.round(errorLogsChange / 100)}
              icon={<AlertCircle className='w-6 h-6' />}
              comparisonText='前日比較'
            />
          </div>

          {/* Latest Day's Audit Log Count */}
          <div className='h-full'>
            <StatsCard
              title='最新日の監査ログ'
              value={auditLogsCount}
              change={Math.round(auditLogsChange / 100)}
              icon={<Settings className='w-6 h-6' />}
              comparisonText='前日比較'
            />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Role Distribution */}
        <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Users className='w-5 h-5' />
              <span>ロール別ユーザー数</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-3 h-3 rounded-full bg-purple-500' />
                  <span className='text-sm font-medium'>システム管理者</span>
                </div>
                <Badge variant='outline'>{roleStats.systemAdmin}名</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-3 h-3 rounded-full bg-blue-500' />
                  <span className='text-sm font-medium'>管理者</span>
                </div>
                <Badge variant='outline'>{roleStats.admin}名</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-3 h-3 rounded-full bg-green-500' />
                  <span className='text-sm font-medium'>メンバー</span>
                </div>
                <Badge variant='outline'>{roleStats.member}名</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Settings className='w-5 h-5' />
              <span>システム状態</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {errorLogsChange > 0 ? (
                <div className='flex items-center space-x-3 p-3 bg-red-50 rounded-lg'>
                  <AlertCircle className='w-5 h-5 text-red-600' />
                  <div>
                    <div className='font-medium text-sm text-red-800'>システム異常稼働中</div>
                    <div className='text-xs text-red-700'>システムエラーログが増加しています。</div>
                  </div>
                </div>
              ) : (
                <div className='flex items-center space-x-3 p-3 bg-green-50 rounded-lg'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  <div>
                    <div className='font-medium text-sm text-green-800'>システム正常稼働中</div>
                    <div className='text-xs text-green-700'>全サービスが正常に動作しています</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Overview */}
      <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
        <CardHeader>
          <CardTitle>組織概要</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>勤務地</TableHead>
                <TableHead>グループ数</TableHead>
                <TableHead>従業員数</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationStats.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell className='font-medium'>{organization.name}</TableCell>
                  <TableCell>{organization.groupCount}</TableCell>
                  <TableCell>{organization.employeeCount}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{organization.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
