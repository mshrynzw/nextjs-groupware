'use client';

import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClockRecord, ClockBreakRecord, AttendanceData } from '@/schemas/attendance';
import { useToast } from '@/hooks/use-toast';
import {
  formatMinutes,
  formatDateTimeForDisplay,
  formatDateTimeForInput,
} from '@/lib/utils/common';
import { getAttendanceDetail, editAttendanceTime } from '@/lib/actions/attendance';
// import { useAuth } from '@/contexts/auth-context';

interface AttendanceTimeEditDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  attendanceId: string | null;
  onSuccessAction: () => void;
}

export const AttendanceTimeEditDialog = ({
  open,
  onOpenChangeAction,
  attendanceId,
  onSuccessAction,
}: AttendanceTimeEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [editData, setEditData] = useState<{
    clockRecords: ClockRecord[];
    editReason: string;
  }>({
    clockRecords: [],
    editReason: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && attendanceId) {
      fetchAttendanceDetail();
    }
  }, [open, attendanceId]);

  const fetchAttendanceDetail = async () => {
    if (!attendanceId) return;

    setLoading(true);
    try {
      const result = await getAttendanceDetail(attendanceId);

      if (result.success && result.attendance) {
        setAttendance(result.attendance);

        // 退勤時刻が空の場合は、attendance.clock_out_timeを使用
        const clockRecords = result.attendance.clock_records || [];
        if (
          clockRecords.length > 0 &&
          (clockRecords[0].out_time === '' || !clockRecords[0].out_time) &&
          result.attendance.clock_out_time
        ) {
          clockRecords[0].out_time = result.attendance.clock_out_time;
        }

        setEditData({
          clockRecords: clockRecords,
          editReason: '時刻修正', // デフォルト値を設定
        });
      } else {
        toast({
          title: 'エラー',
          description: result.error || '勤怠記録の取得に失敗しました',
          variant: 'destructive',
        });
        onOpenChangeAction(false);
      }
    } catch (error) {
      console.error('勤怠記録取得エラー:', error);
      toast({
        title: 'エラー',
        description: '勤怠記録の取得に失敗しました',
        variant: 'destructive',
      });
      onOpenChangeAction(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('handleSave 開始:', { attendanceId, editData });

    if (!attendanceId || !editData.editReason.trim()) {
      console.log('バリデーションエラー: 編集理由が空');
      toast({
        title: 'エラー',
        description: '編集理由を入力してください',
        variant: 'destructive',
      });
      return;
    }

    // 退勤時刻の必須チェック
    const hasEmptyOutTime = editData.clockRecords.some((session) => {
      console.log('退勤時刻チェック:', { session, out_time: session.out_time });
      return !session.out_time || session.out_time === '';
    });
    if (hasEmptyOutTime) {
      console.log('退勤時刻バリデーションエラー');
      toast({
        title: 'エラー',
        description: '退勤時刻を入力してください',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('editAttendanceTime 呼び出し開始');
    try {
      const result = await editAttendanceTime(
        attendanceId,
        editData.clockRecords,
        editData.editReason,
        user?.id || 'unknown-user'
      );

      if (result.success) {
        toast({
          title: '成功',
          description: '勤怠記録を編集しました',
        });
        onSuccessAction();
        onOpenChangeAction(false);
      } else {
        toast({
          title: 'エラー',
          description: result.error || '勤怠記録の編集に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('勤怠記録編集エラー:', error);
      toast({
        title: 'エラー',
        description: '勤怠記録の編集に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClockRecord = (index: number, field: keyof ClockRecord, value: string) => {
    console.log('updateClockRecord:', { index, field, value });
    const newClockRecords = [...editData.clockRecords];
    newClockRecords[index] = { ...newClockRecords[index], [field]: value };
    setEditData({ ...editData, clockRecords: newClockRecords });
  };

  const updateBreakRecord = (
    sessionIndex: number,
    breakIndex: number,
    field: keyof ClockBreakRecord,
    value: string
  ) => {
    const newClockRecords = [...editData.clockRecords];
    if (!newClockRecords[sessionIndex].breaks) {
      newClockRecords[sessionIndex].breaks = [];
    }
    newClockRecords[sessionIndex].breaks[breakIndex] = {
      ...newClockRecords[sessionIndex].breaks[breakIndex],
      [field]: value,
    };
    setEditData({ ...editData, clockRecords: newClockRecords });
  };

  const addBreak = (sessionIndex: number) => {
    const newClockRecords = [...editData.clockRecords];
    if (!newClockRecords[sessionIndex].breaks) {
      newClockRecords[sessionIndex].breaks = [];
    }
    newClockRecords[sessionIndex].breaks.push({
      break_start: '',
      break_end: '',
    });
    setEditData({ ...editData, clockRecords: newClockRecords });
  };

  const removeBreak = (sessionIndex: number, breakIndex: number) => {
    const newClockRecords = [...editData.clockRecords];
    newClockRecords[sessionIndex].breaks.splice(breakIndex, 1);
    setEditData({ ...editData, clockRecords: newClockRecords });
  };

  const formatDateTime = (dateTime: string) => {
    return formatDateTimeForDisplay(dateTime);
  };

  const formatDateTimeForInputLocal = (dateTime: string) => {
    return formatDateTimeForInput(dateTime);
  };

  const calculateWorkTime = () => {
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;

    editData.clockRecords.forEach((session) => {
      if (session.in_time && session.out_time) {
        const inTime = new Date(session.in_time);
        const outTime = new Date(session.out_time);
        const sessionMinutes = Math.floor((outTime.getTime() - inTime.getTime()) / 60000);

        // 休憩時間を差し引く
        const breakMinutes =
          session.breaks?.reduce((total, br) => {
            if (br.break_start && br.break_end) {
              const breakStart = new Date(br.break_start);
              const breakEnd = new Date(br.break_end);
              return total + Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000);
            }
            return total;
          }, 0) || 0;

        totalWorkMinutes += sessionMinutes - breakMinutes;
        totalBreakMinutes += breakMinutes;
      }
    });

    return {
      workMinutes: totalWorkMinutes,
      breakMinutes: totalBreakMinutes,
      overtimeMinutes: Math.max(0, totalWorkMinutes - 480), // 8時間 = 480分
    };
  };

  const { workMinutes, breakMinutes, overtimeMinutes } = calculateWorkTime();

  if (!attendance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>勤怠時刻編集</DialogTitle>
          <DialogDescription>勤怠記録の出勤・退勤時刻と休憩時間を編集できます。</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <div>
                <Label>ユーザー名</Label>
                <p className='text-sm text-muted-foreground'>{attendance.user_name}</p>
              </div>
              <div>
                <Label>勤務タイプ</Label>
                <p className='text-sm text-muted-foreground'>{attendance.work_type_name}</p>
              </div>
              <div>
                <Label>勤務日</Label>
                <p className='text-sm text-muted-foreground'>
                  {new Date(attendance.work_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div>
                <Label>ステータス</Label>
                <div>
                  <Badge variant='default'>正常</Badge>
                </div>
              </div>
              {/* 編集履歴情報 */}
              {attendance.source_id && (
                <div className='col-span-2'>
                  <Label>編集履歴</Label>
                  <div className='text-sm text-muted-foreground space-y-1'>
                    <p>編集理由: {attendance.edit_reason || '-'}</p>
                    <p>編集者: {attendance.edited_by || '-'}</p>
                    <p>元レコードID: {attendance.source_id}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 編集理由 */}
          <div className='space-y-2'>
            <Label htmlFor='edit-reason'>編集理由 *</Label>
            <Textarea
              id='edit-reason'
              placeholder='編集理由を入力してください'
              value={editData.editReason}
              onChange={(e) => setEditData({ ...editData, editReason: e.target.value })}
              rows={3}
            />
          </div>

          {/* 勤務セッション */}
          {editData.clockRecords.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>勤務セッション ({editData.clockRecords.length}回)</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {editData.clockRecords.map((session, sessionIndex) => (
                  <div key={sessionIndex} className='space-y-4 p-4 border rounded-lg'>
                    <h4 className='font-medium'>セッション{sessionIndex + 1}</h4>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor={`in-time-${sessionIndex}`}>出勤時刻 *</Label>
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            id={`in-date-${sessionIndex}`}
                            type='date'
                            value={formatDateTimeForInputLocal(session.in_time).split('T')[0]}
                            onChange={(e) => {
                              const currentTime = formatDateTimeForInputLocal(
                                session.in_time
                              ).split('T')[1];
                              const newDateTime = `${e.target.value}T${currentTime}`;
                              updateClockRecord(sessionIndex, 'in_time', newDateTime);
                            }}
                          />
                          <Input
                            id={`in-time-${sessionIndex}`}
                            type='time'
                            value={formatDateTimeForInputLocal(session.in_time).split('T')[1]}
                            onChange={(e) => {
                              const currentDate = formatDateTimeForInputLocal(
                                session.in_time
                              ).split('T')[0];
                              const newDateTime = `${currentDate}T${e.target.value}`;
                              updateClockRecord(sessionIndex, 'in_time', newDateTime);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`out-time-${sessionIndex}`}>退勤時刻 *</Label>
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            id={`out-date-${sessionIndex}`}
                            type='date'
                            value={
                              formatDateTimeForInputLocal(session.out_time || '').split('T')[0]
                            }
                            onChange={(e) => {
                              const currentTime = formatDateTimeForInputLocal(
                                session.out_time || ''
                              ).split('T')[1];
                              const newDateTime = `${e.target.value}T${currentTime}`;
                              updateClockRecord(sessionIndex, 'out_time', newDateTime);
                            }}
                          />
                          <Input
                            id={`out-time-${sessionIndex}`}
                            type='time'
                            value={
                              formatDateTimeForInputLocal(session.out_time || '').split('T')[1]
                            }
                            onChange={(e) => {
                              const currentDate = formatDateTimeForInputLocal(
                                session.out_time || ''
                              ).split('T')[0];
                              const newDateTime = `${currentDate}T${e.target.value}`;
                              updateClockRecord(sessionIndex, 'out_time', newDateTime);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 休憩時間 */}
                    <div className='space-y-2'>
                      <Label>休憩時間</Label>
                      {session.breaks?.map((breakRecord, breakIndex) => (
                        <div key={breakIndex} className='flex items-center gap-2'>
                          <div className='grid grid-cols-2 gap-1'>
                            <Input
                              type='date'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_start).split('T')[0]
                              }
                              onChange={(e) => {
                                const currentTime = formatDateTimeForInputLocal(
                                  breakRecord.break_start
                                ).split('T')[1];
                                const newDateTime = `${e.target.value}T${currentTime}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_start',
                                  newDateTime
                                );
                              }}
                              placeholder='開始日'
                            />
                            <Input
                              type='time'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_start).split('T')[1]
                              }
                              onChange={(e) => {
                                const currentDate = formatDateTimeForInputLocal(
                                  breakRecord.break_start
                                ).split('T')[0];
                                const newDateTime = `${currentDate}T${e.target.value}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_start',
                                  newDateTime
                                );
                              }}
                              placeholder='開始時刻'
                            />
                          </div>
                          <span>～</span>
                          <div className='grid grid-cols-2 gap-1'>
                            <Input
                              type='date'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_end).split('T')[0]
                              }
                              onChange={(e) => {
                                const currentTime = formatDateTimeForInputLocal(
                                  breakRecord.break_end
                                ).split('T')[1];
                                const newDateTime = `${e.target.value}T${currentTime}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_end',
                                  newDateTime
                                );
                              }}
                              placeholder='終了日'
                            />
                            <Input
                              type='time'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_end).split('T')[1]
                              }
                              onChange={(e) => {
                                const currentDate = formatDateTimeForInputLocal(
                                  breakRecord.break_end
                                ).split('T')[0];
                                const newDateTime = `${currentDate}T${e.target.value}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_end',
                                  newDateTime
                                );
                              }}
                              placeholder='終了時刻'
                            />
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => removeBreak(sessionIndex, breakIndex)}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => addBreak(sessionIndex)}
                      >
                        休憩追加
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            /* セッションが1回の場合 */
            <Card>
              <CardContent className='space-y-4'>
                {editData.clockRecords.map((session, sessionIndex) => (
                  <div key={sessionIndex} className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor={`in-time-${sessionIndex}`}>出勤時刻 *</Label>
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            id={`in-date-${sessionIndex}`}
                            type='date'
                            value={formatDateTimeForInputLocal(session.in_time).split('T')[0]}
                            onChange={(e) => {
                              const currentTime = formatDateTimeForInputLocal(
                                session.in_time
                              ).split('T')[1];
                              const newDateTime = `${e.target.value}T${currentTime}`;
                              updateClockRecord(sessionIndex, 'in_time', newDateTime);
                            }}
                          />
                          <Input
                            id={`in-time-${sessionIndex}`}
                            type='time'
                            value={formatDateTimeForInputLocal(session.in_time).split('T')[1]}
                            onChange={(e) => {
                              const currentDate = formatDateTimeForInputLocal(
                                session.in_time
                              ).split('T')[0];
                              const newDateTime = `${currentDate}T${e.target.value}`;
                              updateClockRecord(sessionIndex, 'in_time', newDateTime);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`out-time-${sessionIndex}`}>退勤時刻 *</Label>
                        <div className='grid grid-cols-2 gap-2'>
                          <Input
                            id={`out-date-${sessionIndex}`}
                            type='date'
                            value={
                              formatDateTimeForInputLocal(session.out_time || '').split('T')[0]
                            }
                            onChange={(e) => {
                              const currentTime = formatDateTimeForInputLocal(
                                session.out_time || ''
                              ).split('T')[1];
                              const newDateTime = `${e.target.value}T${currentTime}`;
                              updateClockRecord(sessionIndex, 'out_time', newDateTime);
                            }}
                          />
                          <Input
                            id={`out-time-${sessionIndex}`}
                            type='time'
                            value={
                              formatDateTimeForInputLocal(session.out_time || '').split('T')[1]
                            }
                            onChange={(e) => {
                              const currentDate = formatDateTimeForInputLocal(
                                session.out_time || ''
                              ).split('T')[0];
                              const newDateTime = `${currentDate}T${e.target.value}`;
                              updateClockRecord(sessionIndex, 'out_time', newDateTime);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 休憩時間 */}
                    <div className='space-y-2'>
                      <Label>休憩時間</Label>
                      {session.breaks?.map((breakRecord, breakIndex) => (
                        <div key={breakIndex} className='flex items-center gap-2'>
                          <div className='grid grid-cols-2 gap-1'>
                            <Input
                              type='date'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_start).split('T')[0]
                              }
                              onChange={(e) => {
                                const currentTime = formatDateTimeForInputLocal(
                                  breakRecord.break_start
                                ).split('T')[1];
                                const newDateTime = `${e.target.value}T${currentTime}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_start',
                                  newDateTime
                                );
                              }}
                              placeholder='開始日'
                            />
                            <Input
                              type='time'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_start).split('T')[1]
                              }
                              onChange={(e) => {
                                const currentDate = formatDateTimeForInputLocal(
                                  breakRecord.break_start
                                ).split('T')[0];
                                const newDateTime = `${currentDate}T${e.target.value}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_start',
                                  newDateTime
                                );
                              }}
                              placeholder='開始時刻'
                            />
                          </div>
                          <span>～</span>
                          <div className='grid grid-cols-2 gap-1'>
                            <Input
                              type='date'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_end).split('T')[0]
                              }
                              onChange={(e) => {
                                const currentTime = formatDateTimeForInputLocal(
                                  breakRecord.break_end
                                ).split('T')[1];
                                const newDateTime = `${e.target.value}T${currentTime}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_end',
                                  newDateTime
                                );
                              }}
                              placeholder='終了日'
                            />
                            <Input
                              type='time'
                              value={
                                formatDateTimeForInputLocal(breakRecord.break_end).split('T')[1]
                              }
                              onChange={(e) => {
                                const currentDate = formatDateTimeForInputLocal(
                                  breakRecord.break_end
                                ).split('T')[0];
                                const newDateTime = `${currentDate}T${e.target.value}`;
                                updateBreakRecord(
                                  sessionIndex,
                                  breakIndex,
                                  'break_end',
                                  newDateTime
                                );
                              }}
                              placeholder='終了時刻'
                            />
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => removeBreak(sessionIndex, breakIndex)}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => addBreak(sessionIndex)}
                      >
                        休憩追加
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 計算結果 */}
          <Card>
            <CardHeader>
              <CardTitle>計算結果</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-3 gap-4'>
              <div>
                <Label>実勤務時間</Label>
                <p className='text-lg font-semibold'>{formatMinutes(workMinutes)}</p>
              </div>
              <div>
                <Label>残業時間</Label>
                <p className='text-lg font-semibold'>{formatMinutes(overtimeMinutes)}</p>
              </div>
              <div>
                <Label>総休憩時間</Label>
                <p className='text-lg font-semibold'>{formatMinutes(breakMinutes)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChangeAction(false)}>
            キャンセル
          </Button>
          <Button type='button' onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
