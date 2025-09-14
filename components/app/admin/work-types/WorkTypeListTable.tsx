'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WorkType, WorkTypeSearchParams } from '@/schemas/employment-type';

interface WorkTypeListTableProps {
  workTypes: WorkType[];
  total: number;
  page: number;
  limit: number;
  onSearchAction: (params: WorkTypeSearchParams) => void;
  onCreateAction: () => void;
  onEditAction: (workType: WorkType) => void;
  onDeleteAction: (workType: WorkType) => void;
  onToggleStatusAction: (workType: WorkType) => void;
}

export default function WorkTypeListTable({
  workTypes,
  total,
  page,
  limit,
  onSearchAction,
  onCreateAction,
  onEditAction,
  onDeleteAction,
  onToggleStatusAction,
}: WorkTypeListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [flexibleFilter, setFlexibleFilter] = useState<'all' | 'flexible' | 'regular'>('all');

  const handleSearch = () => {
    onSearchAction({
      search: searchTerm,
      status: statusFilter,
      is_flexible: flexibleFilter === 'all' ? undefined : flexibleFilter === 'flexible',
      page: 1,
    });
  };

  const handleStatusFilterChange = (value: string) => {
    const newStatus = value as 'all' | 'active' | 'inactive';
    setStatusFilter(newStatus);
    onSearchAction({
      search: searchTerm,
      status: newStatus,
      is_flexible: flexibleFilter === 'all' ? undefined : flexibleFilter === 'flexible',
      page: 1,
    });
  };

  const handleFlexibleFilterChange = (value: string) => {
    const newFlexible = value as 'all' | 'flexible' | 'regular';
    setFlexibleFilter(newFlexible);
    onSearchAction({
      search: searchTerm,
      status: statusFilter,
      is_flexible: newFlexible === 'all' ? undefined : newFlexible === 'flexible',
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    onSearchAction({
      search: searchTerm,
      status: statusFilter,
      is_flexible: flexibleFilter === 'all' ? undefined : flexibleFilter === 'flexible',
      page: newPage,
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM形式で表示
  };

  const formatWorkHours = (startTime: string, endTime: string, breakMinutes: number) => {
    // UTC時刻をJST時刻に変換
    const jstStartTime = startTime;
    const jstEndTime = endTime;

    const start = new Date(`2000-01-01T${jstStartTime}`);
    const end = new Date(`2000-01-01T${jstEndTime}`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakMinutes;
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className='space-y-4'>
      {/* 検索・フィルター・作成ボタン */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex flex-col sm:flex-row gap-2 flex-1'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='勤務形態名・コードで検索...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className='pl-10'
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>すべて</SelectItem>
              <SelectItem value='active'>有効</SelectItem>
              <SelectItem value='inactive'>無効</SelectItem>
            </SelectContent>
          </Select>
          <Select value={flexibleFilter} onValueChange={handleFlexibleFilterChange}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>すべて</SelectItem>
              <SelectItem value='flexible'>フレックス</SelectItem>
              <SelectItem value='regular'>通常</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant='outline'>
            検索
          </Button>
        </div>
        <Button onClick={onCreateAction} className='shrink-0'>
          <Plus className='h-4 w-4 mr-2' />
          新規作成
        </Button>
      </div>

      {/* 結果件数 */}
      <div className='text-sm text-gray-600'>
        {total}件中 {(page - 1) * limit + 1}-{Math.min(page * limit, total)}件を表示
      </div>

      {/* テーブル */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[80px]'>コード</TableHead>
              <TableHead>勤務形態名</TableHead>
              <TableHead className='w-[120px]'>勤務時間</TableHead>
              <TableHead className='w-[80px]'>休憩</TableHead>
              <TableHead className='w-[100px]'>タイプ</TableHead>
              <TableHead className='w-[80px]'>ステータス</TableHead>
              <TableHead className='w-[100px]'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-gray-500'>
                  勤務形態が登録されていません
                </TableCell>
              </TableRow>
            ) : (
              workTypes.map((workType) => {
                const breakMinutes = workType.break_times.reduce((total, breakTime) => {
                  const start = new Date(`2000-01-01T${breakTime.start_time}:00`);
                  const end = new Date(`2000-01-01T${breakTime.end_time}:00`);
                  const diffMs = end.getTime() - start.getTime();
                  return total + Math.floor(diffMs / (1000 * 60));
                }, 0);
                return (
                  <TableRow key={workType.id}>
                    <TableCell className='font-mono text-sm'>{workType.code || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{workType.name}</div>
                        {workType.description && (
                          <div className='text-sm text-gray-500 mt-1'>{workType.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {workType.work_start_time} - {workType.work_end_time}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {formatWorkHours(
                            workType.work_start_time,
                            workType.work_end_time,
                            breakMinutes
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>{breakMinutes}分</TableCell>
                    <TableCell>
                      {workType.is_flexible ? (
                        <Badge variant='secondary' className='text-xs'>
                          フレックス
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-xs'>
                          通常
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={workType.is_active ? 'default' : 'secondary'}
                        className='text-xs'
                      >
                        {workType.is_active ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onEditAction(workType)}
                                className='h-8 w-8 p-0'
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>編集</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onToggleStatusAction(workType)}
                                className='h-8 w-8 p-0'
                              >
                                <Calendar className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {workType.is_active ? '無効化' : '有効化'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onDeleteAction(workType)}
                                disabled={workType.is_active}
                                className='h-8 w-8 p-0'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {workType.is_active ? '有効な勤務形態は削除できません' : '削除'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-600'>
            ページ {page} / {totalPages}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              前へ
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              次へ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
