'use client';

import { Bell, Calendar, Clock, Coffee, FileText, Loader2, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

// import { useAuth } from '@/lib/utils/auth/client';
// import { createClientCS } from '@/lib/supabase/client';
import AdminCsvExportDialog from '@/components/app/admin/CsvExportDialog';
import ClockHistory from '@/components/app/member/dashboard/ClockHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/ui/stats-card';
import TimeDisplay from '@/components/ui/time-display';
import { useToast } from '@/hooks/use-toast';
import { clockIn, clockOut, endBreak, getUserWorkType, startBreak } from '@/lib/actions/attendance';
import { formatTime, getJSTDate } from '@/lib/utils/datetime';
import type { AttendanceData } from '@/schemas/attendance';
import type { RequestData as RequestItem } from '@/schemas/request';
import type { UserProfile } from '@/schemas/user_profile';

interface PageClientProps {
  user: UserProfile;
  attendanceResult: AttendanceData[];
  todayAttendanceResult: AttendanceData;
  requestsResult: RequestItem[];
}

export default function PageClient({
  user,
  attendanceResult,
  todayAttendanceResult,
  requestsResult,
}: PageClientProps) {
  const { toast } = useToast();

  // 状態管理
  const [todayAttendance, setTodayAttendance] = useState<AttendanceData | null>(
    todayAttendanceResult
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceData[]>(attendanceResult);
  const [isLoading, setIsLoading] = useState(false);

  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [csvExportOpen, setCsvExportOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    'clockIn' | 'clockOut' | 'startBreak' | 'endBreak' | null
  >(null);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date().toTimeString().slice(0, 5));
  }, []);

  // リアルタイム時刻更新
  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date().toTimeString().slice(0, 5));
    }, 1000);

    return () => clearInterval(timer);
  }, [isClient]);

  // 統計計算
  const thisMonth = isClient ? new Date().toISOString().slice(0, 7) : '';
  const thisMonthRecords = isClient
    ? attendanceRecords.filter((r) => r.work_date?.startsWith(thisMonth))
    : [];

  // 前月のデータを取得
  const getPreviousMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };
  const previousMonth = isClient ? getPreviousMonth() : '';
  const previousMonthRecords = isClient
    ? attendanceRecords.filter((r) => r.work_date?.startsWith(previousMonth))
    : [];

  // 変化率計算関数
  const calculateChangeRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  // 出勤日数：1日2回以上出勤している場合は1日としてカウント
  const uniqueWorkDays = new Set(thisMonthRecords.map((r) => r.work_date)).size;
  const previousUniqueWorkDays = new Set(previousMonthRecords.map((r) => r.work_date)).size;
  const workDaysChange = calculateChangeRate(uniqueWorkDays, previousUniqueWorkDays);

  // 残業時間：attendancesテーブルから取得
  const totalOvertimeMinutes = thisMonthRecords.reduce(
    (sum, r) => sum + (r.overtime_minutes || 0),
    0
  );
  // 残業時間を分単位で表示（1時間未満でも表示）
  const overtimeHoursValue = totalOvertimeMinutes > 0 ? totalOvertimeMinutes / 60 : 0;
  const overtimeHours = overtimeHoursValue.toFixed(1);

  // デバッグ用：残業時間の詳細ログ
  // console.log('残業時間計算デバッグ:', {
  //   thisMonthRecordsCount: thisMonthRecords.length,
  //   thisMonthRecords: thisMonthRecords.map((r) => ({
  //     id: r.id,
  //     work_date: r.work_date,
  //     overtime_minutes: r.overtime_minutes,
  //     actual_work_minutes: r.actual_work_minutes,
  //   })),
  //   totalOvertimeMinutes,
  //   overtimeHoursValue,
  //   overtimeHours,
  // });

  const previousTotalOvertimeMinutes = previousMonthRecords.reduce(
    (sum, r) => sum + (r.overtime_minutes || 0),
    0
  );
  const previousOvertimeHours = Math.round((previousTotalOvertimeMinutes / 60) * 10) / 10;
  const overtimeChange = calculateChangeRate(overtimeHoursValue, previousOvertimeHours);

  // 勤務時間：attendancesテーブルから取得・算出
  const totalWorkMinutes = thisMonthRecords.reduce(
    (sum, r) => sum + (r.actual_work_minutes || 0),
    0
  );
  const workHours = Math.round((totalWorkMinutes / 60) * 10) / 10;

  const previousTotalWorkMinutes = previousMonthRecords.reduce(
    (sum, r) => sum + (r.actual_work_minutes || 0),
    0
  );
  const previousWorkHours = Math.round((previousTotalWorkMinutes / 60) * 10) / 10;
  const workHoursChange = calculateChangeRate(workHours, previousWorkHours);

  const userRequests = requestsResult.filter((a) => a.user_id === user.id);
  const pendingRequests = userRequests.filter((a) => a.status_id === 'pending');
  // const userNotifications = notifications.filter((n) => n.user_id === user.id && !n.is_read);

  // 複数回出退勤対応の状態管理
  const today = getJSTDate();
  const todayRecords = attendanceRecords.filter((r) => r.work_date === today);

  // 日付でソートして最新のレコードを正確に取得
  const sortedTodayRecords = todayRecords.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // clock_recordsベースの状態管理
  const latestRecord = sortedTodayRecords[0] || null;
  const latestClockRecords = latestRecord?.clock_records || [];
  const latestSession =
    latestClockRecords.length > 0 ? latestClockRecords[latestClockRecords.length - 1] : null;

  // 出勤・退勤・休憩状態の判定
  const hasClockIn = !!latestSession?.in_time;
  const hasClockOut = !!latestSession?.out_time;

  // 休憩状態の詳細な判定
  const activeBreaks = latestSession?.breaks || [];
  const isOnBreak = activeBreaks.some((br) => {
    const hasBreakStart = !!br.break_start;
    const hasBreakEnd = !!br.break_end;
    return hasBreakStart && !hasBreakEnd;
  });

  // 現在の勤務状態を判定
  const isCurrentlyWorking = hasClockIn && !hasClockOut;
  const canStartNewSession = !hasClockIn || hasClockOut;

  // 打刻処理関数
  const handleClockIn = async () => {
    const startTime = performance.now();
    console.log('handleClockIn 開始');
    if (isLoading) {
      console.log('既に処理中です');
      return;
    }
    if (!user) {
      console.log('ユーザーが存在しません');
      return;
    }

    console.log('ユーザーID:', user.id);
    setIsLoading(true);
    setLoadingAction('clockIn');

    try {
      const timestamp = new Date().toISOString();
      console.log('打刻時刻:', timestamp);
      console.log('clockIn関数呼び出し開始');

      // ユーザーの勤務タイプを取得
      console.log('ユーザーの勤務タイプを取得中...');
      const workTypeId = await getUserWorkType(user.id);
      console.log('取得した勤務タイプID:', workTypeId);

      console.log('clockIn関数呼び出し直前');
      console.log('clockIn関数の引数:', { userId: user.id, timestamp, workTypeId });

      const result = await clockIn(user.id, timestamp, workTypeId);
      console.log('clockIn関数呼び出し完了');
      console.log('clockIn結果:', result);

      if (result.success) {
        toast({
          title: '成功',
          description: result.message,
        });
        // 即座にデータを更新
        if (result.attendance) {
          setTodayAttendance(result.attendance);
          // 既存の記録を更新
          setAttendanceRecords((prev) => {
            const today = getJSTDate();
            const filtered = prev.filter(
              (r) => r.work_date !== today || r.id !== result.attendance!.id
            );
            return [result.attendance!, ...filtered];
          });
        }

        const endTime = performance.now();
        console.log(`出勤処理完了: ${(endTime - startTime).toFixed(2)}ms`);
      } else {
        toast({
          title: 'エラー',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('打刻処理エラー:', error);
      toast({
        title: 'エラー',
        description: '打刻に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleClockOut = async () => {
    console.log('handleClockOut 開始');
    if (isLoading) {
      console.log('既に処理中です');
      return;
    }
    if (!user) {
      console.log('ユーザーが存在しません');
      return;
    }

    console.log('ユーザーID:', user.id);
    setIsLoading(true);
    setLoadingAction('clockOut');
    try {
      const timestamp = new Date().toISOString();
      console.log('退勤時刻:', timestamp);
      console.log('clockOut関数呼び出し開始');

      const result = await clockOut(user.id, timestamp);
      console.log('clockOut結果:', result);

      if (result.success) {
        toast({
          title: '成功',
          description: result.message,
        });
        // 即座にデータを更新
        if (result.attendance) {
          setTodayAttendance(result.attendance);
          // 既存の記録を更新
          setAttendanceRecords((prev) => {
            const today = new Date().toISOString().split('T')[0];
            const filtered = prev.filter(
              (r) => r.work_date !== today || r.id !== result.attendance!.id
            );
            return [result.attendance!, ...filtered];
          });
        }
      } else {
        toast({
          title: 'エラー',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('退勤処理エラー:', error);
      toast({
        title: 'エラー',
        description: '打刻に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleStartBreak = async () => {
    console.log('handleStartBreak 開始');
    if (isLoading) {
      console.log('既に処理中です');
      return;
    }
    if (!user) {
      console.log('ユーザーが存在しません');
      return;
    }
    console.log('ユーザーID:', user.id);
    setIsLoading(true);
    setLoadingAction('startBreak');
    try {
      const timestamp = new Date().toISOString();
      console.log('休憩開始時刻:', timestamp);
      console.log('startBreak関数呼び出し開始');
      const result = await startBreak(user.id, timestamp);
      console.log('startBreak結果:', result);
      if (result.success) {
        toast({
          title: '成功',
          description: result.message,
        });
        // 即座にデータを更新
        if (result.attendance) {
          setTodayAttendance(result.attendance);
          // 既存の記録を更新
          setAttendanceRecords((prev) => {
            const today = new Date().toISOString().split('T')[0];
            const filtered = prev.filter(
              (r) => r.work_date !== today || r.id !== result.attendance!.id
            );
            return [result.attendance!, ...filtered];
          });
        }
      } else {
        toast({
          title: 'エラー',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('休憩開始処理エラー:', error);
      toast({
        title: 'エラー',
        description: '休憩開始に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleEndBreak = async () => {
    console.log('handleEndBreak 開始');
    if (isLoading) {
      console.log('既に処理中です');
      return;
    }
    if (!user) {
      console.log('ユーザーが存在しません');
      return;
    }
    console.log('ユーザーID:', user.id);
    setIsLoading(true);
    setLoadingAction('endBreak');
    try {
      const timestamp = new Date().toISOString();
      console.log('休憩終了時刻:', timestamp);
      console.log('endBreak関数呼び出し開始');
      const result = await endBreak(user.id, timestamp);
      console.log('endBreak結果:', result);
      if (result.success) {
        toast({
          title: '成功',
          description: result.message,
        });
        // 即座にデータを更新
        if (result.attendance) {
          setTodayAttendance(result.attendance);
          // 既存の記録を更新
          setAttendanceRecords((prev) => {
            const today = new Date().toISOString().slice(0, 10);
            const filtered = prev.filter(
              (r) => r.work_date !== today || r.id !== result.attendance!.id
            );
            return [result.attendance!, ...filtered];
          });
        }
      } else {
        toast({
          title: 'エラー',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('休憩終了処理エラー:', error);
      toast({
        title: 'エラー',
        description: '休憩終了に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const notificationCount = user.dashboard_notification_count ?? 3;

  return (
    <div className='space-y-4 m-4'>
      {/* 統計カード - デスクトップのみ */}
      <div
        className={`hidden lg:grid gap-4 mb-6 ${user.is_show_overtime ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
      >
        <StatsCard
          title='出勤日数'
          value={`${uniqueWorkDays}日`}
          change={workDaysChange}
          icon={<Calendar className='w-6 h-6' />}
        />
        {user.is_show_overtime && (
          <StatsCard
            title='残業時間'
            value={overtimeHours}
            change={overtimeChange}
            icon={<Clock className='w-6 h-6' />}
          />
        )}
        <StatsCard
          title='申請中'
          value={`${pendingRequests.length}件`}
          icon={<FileText className='w-6 h-6' />}
        />
      </div>
      {/* モバイル用レイアウト: 打刻、打刻履歴、統計の順 */}
      <div className='block lg:hidden space-y-6'>
        {/* Time Clock */}
        <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Clock className='w-5 h-5' />
              <span>打刻</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <TimeDisplay />

            {/* 出勤ボタン - 新しいセッションを開始できる場合のみ表示 */}
            {/* canStartNewSession: 出勤していない OR 退勤済み */}
            {canStartNewSession && (
              <Button
                onClick={() => {
                  console.log('出勤ボタンがクリックされました');
                  console.log('handleClockIn関数を呼び出します');
                  handleClockIn();
                  console.log('handleClockIn関数呼び出し完了');
                }}
                disabled={isLoading}
                className={`w-full h-12 bg-green-600 hover:bg-green-700 relative overflow-hidden transition-all duration-200 ${
                  isLoading && loadingAction === 'clockIn' ? 'animate-pulse shadow-lg' : ''
                }`}
              >
                {isLoading && loadingAction === 'clockIn' ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    出勤中...
                  </>
                ) : (
                  <>
                    <LogIn className='w-5 h-5 mr-2' />
                    出勤
                  </>
                )}
              </Button>
            )}

            {/* 退勤・休憩ボタン - 現在勤務中の場合のみ表示 */}
            {/* isCurrentlyWorking: 出勤済み AND 退勤していない */}
            {isCurrentlyWorking && (
              <>
                {!isOnBreak ? (
                  <Button
                    onClick={handleStartBreak}
                    disabled={isLoading}
                    className={`w-full h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 border-orange-300 transition-all duration-200 ${
                      isLoading && loadingAction === 'startBreak' ? 'animate-pulse shadow-lg' : ''
                    }`}
                  >
                    {isLoading && loadingAction === 'startBreak' ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        休憩開始中...
                      </>
                    ) : (
                      <>
                        <Coffee className='w-5 h-5 mr-2' />
                        休憩開始
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndBreak}
                    disabled={isLoading}
                    className={`w-full h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 border-orange-300 transition-all duration-200 ${
                      isLoading && loadingAction === 'endBreak' ? 'animate-pulse shadow-lg' : ''
                    }`}
                  >
                    {isLoading && loadingAction === 'endBreak' ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        休憩終了中...
                      </>
                    ) : (
                      <>
                        <Coffee className='w-5 h-5 mr-2' />
                        休憩終了
                      </>
                    )}
                  </Button>
                )}

                {/* 退勤ボタン - 休憩中でも退勤可能 */}
                <Button
                  onClick={handleClockOut}
                  disabled={isLoading}
                  className={`w-full h-12 bg-red-600 hover:bg-red-700 transition-all duration-200 ${
                    isLoading && loadingAction === 'clockOut' ? 'animate-pulse shadow-lg' : ''
                  }`}
                >
                  {isLoading && loadingAction === 'clockOut' ? (
                    <>
                      <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                      退勤中...
                    </>
                  ) : (
                    <>
                      <LogOut className='w-5 h-5 mr-2' />
                      退勤
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Clock History */}
        <ClockHistory
          todayAttendance={todayAttendance}
          attendanceRecords={attendanceRecords}
          onCsvExport={() => setCsvExportOpen(true)}
        />

        {/* 統計カード - モバイル用 */}
        <div className='grid grid-cols-1 gap-4'>
          <StatsCard
            title='出勤日数'
            value={`${uniqueWorkDays}日`}
            change={workDaysChange}
            icon={<Calendar className='w-6 h-6' />}
          />
          <StatsCard
            title='残業時間'
            value={overtimeHours}
            change={overtimeChange}
            icon={<Clock className='w-6 h-6' />}
          />
          <StatsCard
            title='申請中'
            value={`${pendingRequests.length}件`}
            icon={<FileText className='w-6 h-6' />}
          />
        </div>
      </div>
      {/* デスクトップ用レイアウト: 従来通りの2カラム */}
      <div className='hidden lg:grid lg:grid-cols-2 gap-6'>
        {/* Time Clock */}
        <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Clock className='w-5 h-5' />
              <span>打刻</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <TimeDisplay />

            {/* 出勤ボタン - 新しいセッションを開始できる場合のみ表示 */}
            {/* canStartNewSession: 出勤していない OR 退勤済み */}
            {canStartNewSession && (
              <Button
                onClick={() => {
                  console.log('出勤ボタンがクリックされました');
                  console.log('handleClockIn関数を呼び出します');
                  handleClockIn();
                  console.log('handleClockIn関数呼び出し完了');
                }}
                disabled={isLoading}
                className={`w-full h-12 bg-green-600 hover:bg-green-700 relative overflow-hidden transition-all duration-200 ${
                  isLoading && loadingAction === 'clockIn' ? 'animate-pulse shadow-lg' : ''
                }`}
              >
                {isLoading && loadingAction === 'clockIn' ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    出勤中...
                  </>
                ) : (
                  <>
                    <LogIn className='w-5 h-5 mr-2' />
                    出勤
                  </>
                )}
              </Button>
            )}

            {/* 退勤・休憩ボタン - 現在勤務中の場合のみ表示 */}
            {/* isCurrentlyWorking: 出勤済み AND 退勤していない */}
            {isCurrentlyWorking && (
              <>
                {!isOnBreak ? (
                  <Button
                    onClick={handleStartBreak}
                    disabled={isLoading}
                    className={`w-full h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 border-orange-300 transition-all duration-200 ${
                      isLoading && loadingAction === 'startBreak' ? 'animate-pulse shadow-lg' : ''
                    }`}
                  >
                    {isLoading && loadingAction === 'startBreak' ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        休憩開始中...
                      </>
                    ) : (
                      <>
                        <Coffee className='w-5 h-5 mr-2' />
                        休憩開始
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndBreak}
                    disabled={isLoading}
                    className={`w-full h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 border-orange-300 transition-all duration-200 ${
                      isLoading && loadingAction === 'endBreak' ? 'animate-pulse shadow-lg' : ''
                    }`}
                  >
                    {isLoading && loadingAction === 'endBreak' ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        休憩終了中...
                      </>
                    ) : (
                      <>
                        <Coffee className='w-5 h-5 mr-2' />
                        休憩終了
                      </>
                    )}
                  </Button>
                )}

                {/* 退勤ボタン - 休憩中でも退勤可能 */}
                <Button
                  onClick={handleClockOut}
                  disabled={isLoading}
                  className={`w-full h-12 bg-red-600 hover:bg-red-700 transition-all duration-200 ${
                    isLoading && loadingAction === 'clockOut' ? 'animate-pulse shadow-lg' : ''
                  }`}
                >
                  {isLoading && loadingAction === 'clockOut' ? (
                    <>
                      <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                      退勤中...
                    </>
                  ) : (
                    <>
                      <LogOut className='w-5 h-5 mr-2' />
                      退勤
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Clock History */}
        <ClockHistory
          todayAttendance={todayAttendance}
          attendanceRecords={attendanceRecords}
          onCsvExport={() => setCsvExportOpen(true)}
        />
      </div>
      {/* Notifications */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='block lg:hidden h-full'>
          <Card className='h-full flex flex-col bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
            <CardHeader>
              <CardTitle>新着チャット</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='p-4 text-center'>
                  <Bell className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>通知はありません</p>
                </div>
              </div>
            </CardContent>
            {/* Bottom border with gradient */}
            <div className='bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-b-lg'></div>
          </Card>
        </div>

        <Card className='h-full flex flex-col bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
          <CardHeader>
            <CardTitle>お知らせ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {/* {notifications.length > 0 ? (
                notifications.slice(0, notificationCount).map((notification) => (
                  <div key={notification.id} className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-sm text-blue-900">{notification.title}</div>
                    <div className="text-xs text-blue-700 mt-1">{notification.message}</div>
                    <div className="text-xs text-blue-700 mt-1 text-right">
                      {formatDateTime(notification.created_at)}
                    </div>
                  </div>
                ))
              ) : (*/}
              <div className='p-4 text-center'>
                <Bell className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-muted-foreground'>通知はありません</p>
              </div>
              {/* )} */}
            </div>
          </CardContent>
          {/* Bottom border with gradient */}
          <div className='bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-b-lg'></div>
        </Card>

        <div className='hidden lg:block h-full'>
          <Card className='h-full flex flex-col bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
            <CardHeader>
              <CardTitle>新着チャット</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='p-4 text-center'>
                  <Bell className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>通知はありません</p>
                </div>
              </div>
            </CardContent>
            {/* Bottom border with gradient */}
            <div className='bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-b-lg'></div>
          </Card>
        </div>
      </div>
      {/* Today's Status */}
      <Card className='bg-white/5 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30'>
        <CardHeader>
          <CardTitle>今日の勤務状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${user.is_show_overtime ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-sm text-blue-600 font-medium'>出勤時刻</div>
              <div className='text-lg font-bold text-blue-900'>
                {latestSession?.in_time ? formatTime(latestSession.in_time) : '--:--'}
              </div>
            </div>

            <div className='text-center p-4 bg-red-50 rounded-lg'>
              <div className='text-sm text-red-600 font-medium'>退勤時刻</div>
              <div className='text-lg font-bold text-red-900'>
                {latestSession?.out_time ? formatTime(latestSession.out_time) : '--:--'}
              </div>
            </div>

            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-sm text-green-600 font-medium'>勤務時間</div>
              <div className='text-lg font-bold text-green-900'>
                {(() => {
                  // clock_recordsから総勤務時間を計算
                  const totalWorkMinutes = latestClockRecords.reduce((total, session) => {
                    if (session.in_time && session.out_time) {
                      const inTime = new Date(session.in_time);
                      const outTime = new Date(session.out_time);
                      const sessionMinutes = Math.floor(
                        (outTime.getTime() - inTime.getTime()) / 60000
                      );

                      // 休憩時間を差し引く
                      const breakMinutes =
                        session.breaks?.reduce((breakTotal, br) => {
                          if (br.break_start && br.break_end) {
                            const breakStart = new Date(br.break_start);
                            const breakEnd = new Date(br.break_end);
                            return (
                              breakTotal +
                              Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000)
                            );
                          }
                          return breakTotal;
                        }, 0) || 0;

                      return total + (sessionMinutes - breakMinutes);
                    }
                    return total;
                  }, 0);

                  if (totalWorkMinutes > 0) {
                    const hours = Math.floor(totalWorkMinutes / 60);
                    const minutes = totalWorkMinutes % 60;
                    return `${hours}:${minutes.toString().padStart(2, '0')}`;
                  }
                  return '--:--';
                })()}
              </div>
            </div>

            {user.is_show_overtime && (
              <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                <div className='text-sm text-yellow-600 font-medium'>残業時間</div>
                <div className='text-lg font-bold text-yellow-900'>
                  {(() => {
                    // データベースの残業時間を使用
                    const overtimeMinutes = latestRecord?.overtime_minutes || 0;

                    if (overtimeMinutes > 0) {
                      const hours = Math.floor(overtimeMinutes / 60);
                      const minutes = overtimeMinutes % 60;
                      return `${hours}:${minutes.toString().padStart(2, '0')}`;
                    }
                    return '--:--';
                  })()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* CSV出力ダイアログ */}
      <AdminCsvExportDialog
        open={csvExportOpen}
        onOpenChangeAction={setCsvExportOpen}
        attendanceRecords={attendanceRecords}
        users={[]}
        groups={[]}
      />
      {/* 機能無効化メッセージ */}
      {/* features && !features.chat && ( */}
      {/* <Card> */}
      {/* <CardContent className="p-4"> */}
      {/* <div className="text-center text-gray-500"> */}
      {/* <MessageSquare className="w-8 h-8 mx-auto mb-2" /> */}
      {/* <p>チャット機能は現在無効化されています</p> */}
      {/* </div> */}
      {/* </CardContent> */}
      {/* </Card> */}
      {/* ) */}
      {/* features && !features.report && ( */}
      {/* <Card> */}
      {/* <CardContent className="p-4"> */}
      {/* <div className="text-center text-gray-500"> */}
      {/* <FileText className="w-8 h-8 mx-auto mb-2" /> */}
      {/* <p>レポート機能は現在無効化されています</p> */}
      {/* </div> */}
      {/* </CardContent> */}
      {/* </Card> */}
      {/* ) */}
      {/* features && !features.schedule && ( */}
      {/* <Card> */}
      {/* <CardContent className="p-4"> */}
      {/* <div className="text-center text-gray-500"> */}
      {/* <Calendar className="w-8 h-8 mx-auto mb-2" /> */}
      {/* <p>スケジュール機能は現在無効化されています</p> */}
      {/* </div> */}
      {/* </CardContent> */}
      {/* </Card> */}
      {/* ) */}
    </div>
  );
}
