'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { CreateWorkTypeFormData, BreakTime } from '@/schemas/work-types';
import { createWorkType } from '@/lib/actions/admin/work-types';

import BreakTimesInput from './BreakTimesInput';

const createWorkTypeSchema = z
  .object({
    code: z.string().min(1, 'コードは必須です').max(50, 'コードは50文字以内で入力してください'),
    name: z
      .string()
      .min(1, '勤務形態名は必須です')
      .max(255, '勤務形態名は255文字以内で入力してください'),
    work_start_time: z.string().min(1, '勤務開始時刻は必須です'),
    work_end_time: z.string().min(1, '勤務終了時刻は必須です'),
    break_times: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1, '休息名は必須です'),
          start_time: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '正しい時刻形式で入力してください（HH:MM）'),
          end_time: z
            .string()
            .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, '正しい時刻形式で入力してください（HH:MM）'),
          order: z.number().int().min(0, '順番は0以上の整数で入力してください'),
        })
      )
      .default([]),
    is_flexible: z.boolean(),
    flex_start_time: z.string().optional(),
    flex_end_time: z.string().optional(),
    core_start_time: z.string().optional(),
    core_end_time: z.string().optional(),
    overtime_threshold_minutes: z.number().min(0, '残業開始閾値は0分以上で入力してください'),
    late_threshold_minutes: z.number().min(0, '遅刻許容時間は0分以上で入力してください'),
    description: z.string().max(1000, '説明は1000文字以内で入力してください'),
  })
  .refine(
    (data) => {
      if (data.work_start_time >= data.work_end_time) {
        return false;
      }
      return true;
    },
    {
      message: '勤務開始時刻は勤務終了時刻より前である必要があります',
      path: ['work_end_time'],
    }
  )
  .refine(
    (data) => {
      if (data.is_flexible) {
        if (!data.flex_start_time || !data.flex_end_time) {
          return false;
        }
        if (data.flex_start_time >= data.flex_end_time) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'フレックス開始時刻はフレックス終了時刻より前である必要があります',
      path: ['flex_end_time'],
    }
  )
  .refine(
    (data) => {
      if (data.is_flexible && data.flex_start_time && data.flex_end_time) {
        if (data.core_start_time && data.core_end_time) {
          if (data.core_start_time >= data.core_end_time) {
            return false;
          }
          if (
            data.flex_start_time > data.core_start_time ||
            data.core_end_time > data.flex_end_time
          ) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'コアタイムはフレックス時間内に設定してください',
      path: ['core_end_time'],
    }
  );

interface WorkTypeCreateDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  companyId: string;
  onSuccessAction: () => void;
}

export default function WorkTypeCreateDialog({
  open,
  onOpenChangeAction,
  companyId,
  onSuccessAction,
}: WorkTypeCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(createWorkTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      work_start_time: '09:00',
      work_end_time: '18:00',
      break_times: [],
      is_flexible: false,
      flex_start_time: '',
      flex_end_time: '',
      core_start_time: '',
      core_end_time: '',
      overtime_threshold_minutes: 480,
      late_threshold_minutes: 15,
      description: '',
    },
  });

  const isFlexible = form.watch('is_flexible');
  const requireCoreTime = process.env.NEXT_PUBLIC_FLEX_WORK_REQUIRE_CORE_TIME === 'true';

  const onSubmit = async (data: CreateWorkTypeFormData) => {
    setIsLoading(true);
    try {
      const result = await createWorkType(data, companyId);

      if (result.success) {
        toast({
          title: '勤務形態を作成しました',
          description: `${data.name} が正常に作成されました`,
        });
        form.reset();
        onOpenChangeAction(false);
        onSuccessAction();
      } else {
        toast({
          title: 'エラーが発生しました',
          description: result.error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('勤務形態作成エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '勤務形態の作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>勤務形態を作成</DialogTitle>
          <DialogDescription>新しい勤務形態の情報を入力してください。</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* 基本情報 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>コード</FormLabel>
                    <FormControl>
                      <Input placeholder='WT001' {...field} />
                    </FormControl>
                    <FormDescription>勤務形態を識別するためのコード</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>勤務形態名 *</FormLabel>
                    <FormControl>
                      <Input placeholder='通常勤務' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 勤務時間 */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                勤務時間
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='work_start_time'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>勤務開始時刻 *</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='work_end_time'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>勤務終了時刻 *</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 休息時刻設定 */}
              <FormField
                control={form.control}
                name='break_times'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>休息時刻設定</FormLabel>
                    <FormControl>
                      <BreakTimesInput
                        value={field.value}
                        onChange={field.onChange}
                        workStartTime={form.watch('work_start_time')}
                        workEndTime={form.watch('work_end_time')}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* フレックス勤務設定 */}
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='is_flexible'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>フレックス勤務</FormLabel>
                      <FormDescription>
                        フレックス勤務を有効にする場合は、フレックス時間とコアタイムを設定してください
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isFlexible && (
                <div className='space-y-4 pl-6 border-l-2 border-gray-200'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='flex_start_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>フレックス開始時刻 *</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='flex_end_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>フレックス終了時刻 *</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='core_start_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            コアタイム開始時刻
                            {requireCoreTime && ' *'}
                          </FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormDescription>必ず出勤している必要がある時間帯</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='core_end_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            コアタイム終了時刻
                            {requireCoreTime && ' *'}
                          </FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormDescription>必ず出勤している必要がある時間帯</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {requireCoreTime && (
                    <Alert>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        フレックス勤務の場合は、コアタイムの設定が必須です。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* その他設定 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='overtime_threshold_minutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>残業開始閾値（分）</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>この時間を超えると残業として扱われます</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='late_threshold_minutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>遅刻許容時間（分）</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>この時間を超えると遅刻として扱われます</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 説明 */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='勤務形態の詳細な説明を入力してください'
                      className='resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChangeAction(false)}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? '作成中...' : '作成'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
