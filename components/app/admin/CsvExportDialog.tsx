'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Settings, Eye, Users, Building } from 'lucide-react';
import Encoding from 'encoding-japanese';
import * as XLSX from 'xlsx';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { CsvExportSetting as OriginalCsvExportSetting } from '@/schemas/setting';
import type { AttendanceData, AttendanceFilters } from '@/schemas/attendance';
import { useAuth } from '@/contexts/auth-context';

type ExportFormat = 'csv' | 'excel';
type CsvExportEncoding = 'UTF-8' | 'UTF-8-BOM' | 'Shift_JIS' | 'Shift_JIS-BOM';

interface CsvExportSetting extends Omit<OriginalCsvExportSetting, 'format'> {
  format: Omit<OriginalCsvExportSetting['format'], 'encoding'> & {
    encoding: CsvExportEncoding;
    exportFormat: ExportFormat;
  };
}

interface CsvExportDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  attendanceRecords: AttendanceData[];
  users: { id: string; name: string; code?: string }[];
  groups: { id: string; name: string; code?: string }[];
  attendanceFilters?: AttendanceFilters;
  selectedMonth?: string;
}

const AVAILABLE_COLUMNS = [
  { key: 'employee', label: '従業員' },
  { key: 'date', label: '日付' },
  { key: 'clock_in', label: '出勤時刻' },
  { key: 'clock_out', label: '退勤時刻' },
  { key: 'work_hours', label: '勤務時間' },
  { key: 'overtime', label: '残業時間' },
  { key: 'breakStart', label: '休憩開始' },
  { key: 'breakEnd', label: '休憩終了' },
  { key: 'break_time', label: '休憩時間' },
  { key: 'work_type', label: '勤務タイプ' },
  { key: 'late', label: '遅刻' },
  { key: 'early_leave', label: '早退' },
  { key: 'status', label: 'ステータス' },
  { key: 'approval_status', label: '承認状態' },
  { key: 'approver', label: '承認者' },
  { key: 'updated_at', label: '編集日時' },
  { key: 'notes', label: '備考' },
];

// 共通のデータ変換処理
const generateData = (
  records: AttendanceData[],
  setting: CsvExportSetting,
  users: { id: string; name: string; code?: string }[]
) => {
  // ヘッダー行を生成
  const headers = setting.columns.map((column) => {
    const headerMap: { [key: string]: string } = {
      employee: '従業員',
      date: '日付',
      clock_in: '出勤時刻',
      clock_out: '退勤時刻',
      work_hours: '勤務時間',
      overtime: '残業時間',
      breakStart: '休憩開始',
      breakEnd: '休憩終了',
      break_time: '休憩時間',
      work_type: '勤務タイプ',
      late: '遅刻',
      early_leave: '早退',
      status: 'ステータス',
      approval_status: '承認状態',
      approver: '承認者',
      updated_at: '編集日時',
      notes: '備考',
    };
    return headerMap[column] || column;
  });

  // データ行を生成
  const rows = records.map((record) => {
    return setting.columns.map((column) => {
      // 既存のgetColumnValue関数を再利用
      return getColumnValue(record, column, setting.format, users);
    });
  });

  return { headers, rows };
};

export default function AdminCsvExportDialog({
  open,
  onOpenChangeAction,
  attendanceRecords,
  users,
  groups,
  attendanceFilters,
  selectedMonth,
}: CsvExportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 当月の1日と月末を取得する関数
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start_date: firstDay.toISOString().slice(0, 10),
      end_date: lastDay.toISOString().slice(0, 10),
    };
  };

  // 設定状態
  const [setting, setSetting] = useState<CsvExportSetting>({
    name: 'デフォルト',
    period: {
      type: 'date_range',
      ...getCurrentMonthRange(),
    },
    columns:
      users.length > 0
        ? ['employee', 'date', 'clock_in', 'clock_out', 'work_hours', 'overtime', 'status']
        : ['date', 'clock_in', 'clock_out', 'work_hours', 'overtime', 'status'],
    format: {
      encoding: 'UTF-8-BOM', // デフォルト：BOM付きUTF-8
      delimiter: 'comma',
      date_format: 'YYYY/MM/DD',
      time_format: 'HH:MM',
      empty_value: 'blank',
      exportFormat: 'excel', // デフォルト：Excel
    },
  });

  // フィルター設定
  const [filters, setFilters] = useState({
    selectedUsers: [] as string[],
    selectedGroups: [] as string[],
  });

  // プレビューデータ
  const [previewData, setPreviewData] = useState<AttendanceData[]>([]);
  const [savedSettings, setSavedSettings] = useState<
    Array<{
      id: string;
      name: string;
      setting: CsvExportSetting;
      filters: typeof filters;
      createdAt: string;
    }>
  >([]);

  // デフォルト設定を読み込み
  const loadDefaultSetting = useCallback(async () => {
    if (!user) return;

    try {
      // 保存された設定を完全にクリア
      localStorage.removeItem('admin_csv_export_settings');
      setSavedSettings([]);

      // 常に当月の期間で新しい設定を作成
      const currentMonthSetting: CsvExportSetting = {
        name: 'デフォルト',
        period: {
          type: 'date_range',
          ...getCurrentMonthRange(),
        },
        columns:
          users.length > 0
            ? ['employee', 'date', 'clock_in', 'clock_out', 'work_hours', 'overtime', 'status']
            : ['date', 'clock_in', 'clock_out', 'work_hours', 'overtime', 'status'],
        format: {
          encoding: 'UTF-8-BOM',
          delimiter: 'comma',
          date_format: 'YYYY/MM/DD',
          time_format: 'HH:MM',
          empty_value: 'blank',
          exportFormat: 'excel',
        },
      };

      setSetting(currentMonthSetting);
      setFilters({
        selectedUsers: [],
        selectedGroups: [],
      });
      console.log('デフォルト設定を適用しました（期間: 当月）');
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  }, [user, users.length]);

  // 初期設定を読み込み
  useEffect(() => {
    if (open && user) {
      loadDefaultSetting();
    }
  }, [open, user, loadDefaultSetting]);

  // フィルタリングされたデータを取得
  const getFilteredRecords = (): AttendanceData[] => {
    return attendanceRecords.filter((record) => {
      // 日付範囲フィルター
      if (setting.period.start_date && record.work_date < setting.period.start_date) return false;
      if (setting.period.end_date && record.work_date > setting.period.end_date) return false;

      // ユーザーフィルター
      if (filters.selectedUsers.length > 0 && !filters.selectedUsers.includes(record.user_id)) {
        return false;
      }

      // グループフィルター（簡易実装）
      if (filters.selectedGroups.length > 0) {
        // TODO: 実際のグループフィルター実装
        // 現在は全ユーザーを対象とする
      }

      return true;
    });
  };

  // プレビューデータを生成
  const generatePreview = () => {
    const previewLimit = parseInt(process.env.NEXT_PUBLIC_CSV_PREVIEW_LIMIT || '30');
    const filteredRecords = getFilteredRecords().slice(0, previewLimit);

    setPreviewData(filteredRecords);
    setShowPreview(true);
  };

  // フィルター情報を含むファイル名を生成
  const generateFileName = (): string => {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    let fileName = `${timestamp}_admin_attendance`;

    // 期間情報を追加
    if (setting.period.start_date && setting.period.end_date) {
      fileName += `_${setting.period.start_date}-${setting.period.end_date}`;
    } else if (selectedMonth) {
      fileName += `_${selectedMonth}`;
    }

    // フィルター情報を追加
    const filterParts: string[] = [];

    if (attendanceFilters?.userId) {
      const selectedUser = users.find((u) => u.id === attendanceFilters.userId);
      if (selectedUser) {
        filterParts.push(`user_${selectedUser.name}`);
      }
    }

    if (attendanceFilters?.groupId) {
      const selectedGroup = groups.find((g) => g.id === attendanceFilters.groupId);
      if (selectedGroup) {
        filterParts.push(`group_${selectedGroup.name}`);
      }
    }

    if (attendanceFilters?.status && attendanceFilters.status.length > 0) {
      filterParts.push(`status_${attendanceFilters.status.join('_')}`);
    }

    if (attendanceFilters?.hasOvertime !== null && attendanceFilters?.hasOvertime !== undefined) {
      filterParts.push(`overtime_${attendanceFilters.hasOvertime ? 'yes' : 'no'}`);
    }

    if (attendanceFilters?.workTypeId) {
      filterParts.push(`worktype_${attendanceFilters.workTypeId}`);
    }

    if (attendanceFilters?.approvalStatus) {
      filterParts.push(`approval_${attendanceFilters.approvalStatus}`);
    }

    if (filterParts.length > 0) {
      fileName += `_filtered_${filterParts.join('_')}`;
    }

    return `${fileName}.csv`;
  };

  // Excel固有の処理
  const generateExcelData = (records: AttendanceData[], setting: CsvExportSetting): ArrayBuffer => {
    const { headers, rows } = generateData(records, setting, users);

    // ワークブックを作成
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // 列幅の自動調整
    const colWidths = headers.map((_, colIndex) => {
      const maxLength = Math.max(
        ...rows.map((row) => String(row[colIndex] || '').length),
        headers[colIndex].length
      );
      return { wch: Math.min(maxLength + 2, 50) }; // 最大50文字
    });
    ws['!cols'] = colWidths;

    // シートを追加
    XLSX.utils.book_append_sheet(wb, ws, '勤怠データ');

    // ArrayBufferに変換
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  };

  // 出力を実行
  const handleExport = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // フィルタリングされたデータを取得
      const filteredRecords = getFilteredRecords();

      // ファイル名を生成（拡張子を動的に変更）
      const baseFileName = generateFileName().replace('.csv', '');
      const fileName =
        setting.format.exportFormat === 'excel' ? `${baseFileName}.xlsx` : `${baseFileName}.csv`;

      let blob: Blob;

      if (setting.format.exportFormat === 'excel') {
        // Excel出力
        const excelData = generateExcelData(filteredRecords, setting);
        blob = new Blob([excelData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        // CSV出力（既存の処理を完全に保持）
        const csvData = generateSimpleCsvData(filteredRecords, setting, users);

        // エンコーディング処理（既存の処理を完全に保持）
        if (setting.format.encoding === 'UTF-8') {
          blob = new Blob([csvData], { type: 'text/csv; charset=utf-8' });
        } else if (setting.format.encoding === 'UTF-8-BOM') {
          blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv; charset=utf-8' });
        } else if (
          setting.format.encoding === 'Shift_JIS' ||
          setting.format.encoding === 'Shift_JIS-BOM'
        ) {
          // Shift_JISエンコード
          const sjisArray = Encoding.convert(Encoding.stringToCode(csvData), 'SJIS', 'UNICODE');
          let uint8Array = new Uint8Array(sjisArray);
          if (setting.format.encoding === 'Shift_JIS-BOM') {
            // Shift_JIS用BOM（Excel用）
            // ExcelはUTF-8のBOM（0xEF,0xBB,0xBF）をShift_JISでもBOMとして認識するため、同じものを付与
            const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
            const merged = new Uint8Array(bom.length + uint8Array.length);
            merged.set(bom, 0);
            merged.set(uint8Array, bom.length);
            uint8Array = merged;
          }
          blob = new Blob([uint8Array], { type: 'text/csv' });
        } else {
          // fallback
          blob = new Blob([csvData], { type: 'text/csv; charset=utf-8' });
        }
      }

      // ファイルダウンロード処理（既存の処理を完全に保持）
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 成功メッセージ（出力形式に応じて変更）
      const formatName = setting.format.exportFormat === 'excel' ? 'Excel' : 'CSV';
      toast({
        title: '成功',
        description: `${formatName}ファイルを出力しました`,
      });

      onOpenChangeAction(false);
    } catch (error) {
      console.error('出力エラー:', error);
      const formatName = setting.format.exportFormat === 'excel' ? 'Excel' : 'CSV';
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : `${formatName}出力に失敗しました`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 設定を保存
  const handleSaveSetting = async () => {
    if (!user) return;

    try {
      // ローカルストレージに設定を保存
      const savedSettings = JSON.parse(localStorage.getItem('admin_csv_export_settings') || '[]');
      const newSetting = {
        id: Date.now().toString(),
        name: setting.name,
        setting: setting,
        filters: filters,
        createdAt: new Date().toISOString(),
      };

      // 同じ名前の設定があれば更新、なければ追加
      const existingIndex = savedSettings.findIndex(
        (s: { name: string }) => s.name === setting.name
      );
      if (existingIndex >= 0) {
        savedSettings[existingIndex] = newSetting;
      } else {
        savedSettings.push(newSetting);
      }

      localStorage.setItem('admin_csv_export_settings', JSON.stringify(savedSettings));
      setSavedSettings(savedSettings);

      toast({
        title: '成功',
        description: '設定を保存しました',
      });
    } catch (error) {
      console.error('設定保存エラー:', error);
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto dialog-scrollbar'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='w-5 h-5' />
            CSV出力設定（管理者用）
          </DialogTitle>
          <DialogDescription>
            勤怠データのCSV出力設定を行います。期間、フィルター、出力項目を指定してカスタマイズできます。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* 基本設定 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='w-4 h-4' />
                基本設定
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='setting-name'>設定名</Label>
                  <Input
                    id='setting-name'
                    value={setting.name}
                    onChange={(e) => setSetting((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder='設定名を入力'
                  />
                </div>
                <div>
                  <Label>保存された設定</Label>
                  <div className='flex gap-2'>
                    <Select
                      onValueChange={(value) => {
                        const selectedSetting = savedSettings.find((s) => s.id === value);
                        if (selectedSetting) {
                          // 選択された設定の期間を当月に更新
                          const updatedSetting = {
                            ...selectedSetting.setting,
                            period: {
                              ...selectedSetting.setting.period,
                              ...getCurrentMonthRange(),
                            },
                          };
                          setSetting(updatedSetting);
                          setFilters(selectedSetting.filters);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='設定を選択' />
                      </SelectTrigger>
                      <SelectContent>
                        {savedSettings.map((savedSetting) => (
                          <SelectItem key={savedSetting.id} value={savedSetting.id}>
                            {savedSetting.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {savedSettings.length > 0 && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          localStorage.removeItem('admin_csv_export_settings');
                          setSavedSettings([]);
                          setSetting({
                            name: 'デフォルト',
                            period: {
                              type: 'date_range',
                              ...getCurrentMonthRange(),
                            },
                            columns:
                              users.length > 0
                                ? [
                                    'employee',
                                    'date',
                                    'clock_in',
                                    'clock_out',
                                    'work_hours',
                                    'overtime',
                                    'status',
                                  ]
                                : [
                                    'date',
                                    'clock_in',
                                    'clock_out',
                                    'work_hours',
                                    'overtime',
                                    'status',
                                  ],
                            format: {
                              encoding: 'UTF-8-BOM', // リセット時もBOM付きUTF-8
                              delimiter: 'comma',
                              date_format: 'YYYY/MM/DD',
                              time_format: 'HH:MM',
                              empty_value: 'blank',
                              exportFormat: 'csv', // リセット時もCSV
                            },
                          });
                          setFilters({
                            selectedUsers: [],
                            selectedGroups: [],
                          });
                          toast({
                            title: '設定リセット',
                            description: '保存された設定をクリアしました',
                          });
                        }}
                      >
                        リセット
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>対象期間</Label>
                  <div className='flex gap-2'>
                    <Input
                      type='date'
                      value={setting.period.start_date || ''}
                      onChange={(e) =>
                        setSetting((prev) => ({
                          ...prev,
                          period: { ...prev.period, start_date: e.target.value || null },
                        }))
                      }
                    />
                    <span className='flex items-center'>〜</span>
                    <Input
                      type='date'
                      value={setting.period.end_date || ''}
                      onChange={(e) =>
                        setSetting((prev) => ({
                          ...prev,
                          period: { ...prev.period, end_date: e.target.value || null },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* フィルター設定（管理者用のみ表示） */}
          {users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-4 h-4' />
                  フィルター設定
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <Label className='flex items-center gap-2'>
                        <Users className='w-4 h-4' />
                        従業員選択
                      </Label>
                      <div className='flex gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              selectedUsers: users.map((u) => u.id),
                            }));
                          }}
                        >
                          全選択
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              selectedUsers: [],
                            }));
                          }}
                        >
                          全解除
                        </Button>
                      </div>
                    </div>
                    <div className='max-h-40 overflow-y-auto border rounded-md p-2'>
                      {users.map((user) => (
                        <div key={user.id} className='flex items-center space-x-2'>
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={filters.selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({
                                  ...prev,
                                  selectedUsers: [...prev.selectedUsers, user.id],
                                }));
                              } else {
                                setFilters((prev) => ({
                                  ...prev,
                                  selectedUsers: prev.selectedUsers.filter((id) => id !== user.id),
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`user-${user.id}`} className='text-sm'>
                            {user.name} ({user.code || '-'})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <Label className='flex items-center gap-2'>
                        <Building className='w-4 h-4' />
                        グループ選択
                      </Label>
                      <div className='flex gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              selectedGroups: groups.map((g) => g.id),
                            }));
                          }}
                        >
                          全選択
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              selectedGroups: [],
                            }));
                          }}
                        >
                          全解除
                        </Button>
                      </div>
                    </div>
                    <div className='max-h-40 overflow-y-auto border rounded-md p-2'>
                      {groups.map((group) => (
                        <div key={group.id} className='flex items-center space-x-2'>
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={filters.selectedGroups.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters((prev) => ({
                                  ...prev,
                                  selectedGroups: [...prev.selectedGroups, group.id],
                                }));
                              } else {
                                setFilters((prev) => ({
                                  ...prev,
                                  selectedGroups: prev.selectedGroups.filter(
                                    (id) => id !== group.id
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`group-${group.id}`} className='text-sm'>
                            {group.name} ({group.code || '-'})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 出力項目 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                出力項目
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSetting((prev) => ({
                        ...prev,
                        columns: AVAILABLE_COLUMNS.map((col) => col.key),
                      }));
                    }}
                  >
                    全選択
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSetting((prev) => ({
                        ...prev,
                        columns: [],
                      }));
                    }}
                  >
                    全解除
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-3 gap-4'>
                {AVAILABLE_COLUMNS.map((column) => (
                  <div key={column.key} className='flex items-center space-x-2'>
                    <Checkbox
                      id={column.key}
                      checked={setting.columns.includes(column.key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSetting((prev) => ({
                            ...prev,
                            columns: [...prev.columns, column.key],
                          }));
                        } else {
                          setSetting((prev) => ({
                            ...prev,
                            columns: prev.columns.filter((col) => col !== column.key),
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={column.key}>{column.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* フォーマット設定 */}
          <Card>
            <CardHeader>
              <CardTitle>フォーマット設定</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>出力形式</Label>
                  <Select
                    value={setting.format.exportFormat}
                    onValueChange={(value) =>
                      setSetting((prev) => ({
                        ...prev,
                        format: {
                          ...prev.format,
                          exportFormat: value as 'csv' | 'excel',
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='csv'>CSV</SelectItem>
                      <SelectItem value='excel'>Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {setting.format.exportFormat === 'csv' && (
                  <div>
                    <Label>文字エンコーディング</Label>
                    <Select
                      value={setting.format.encoding}
                      onValueChange={(value) =>
                        setSetting((prev) => ({
                          ...prev,
                          format: {
                            ...prev.format,
                            encoding: value as
                              | 'UTF-8'
                              | 'UTF-8-BOM'
                              | 'Shift_JIS'
                              | 'Shift_JIS-BOM',
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='UTF-8'>UTF-8</SelectItem>
                        <SelectItem value='UTF-8-BOM'>UTF-8（BOM付き）</SelectItem>
                        <SelectItem value='Shift_JIS'>Shift_JIS</SelectItem>
                        <SelectItem value='Shift_JIS-BOM'>Shift_JIS（BOM付き）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {setting.format.exportFormat === 'csv' && (
                  <div>
                    <Label>区切り文字</Label>
                    <Select
                      value={setting.format.delimiter}
                      onValueChange={(value) =>
                        setSetting((prev) => ({
                          ...prev,
                          format: { ...prev.format, delimiter: value as 'comma' | 'tab' },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='comma'>カンマ</SelectItem>
                        <SelectItem value='tab'>タブ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {setting.format.exportFormat === 'csv' && (
                  <div>
                    <Label>空値の扱い</Label>
                    <Select
                      value={setting.format.empty_value}
                      onValueChange={(value) =>
                        setSetting((prev) => ({
                          ...prev,
                          format: { ...prev.format, empty_value: value as 'blank' | '--' },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='blank'>空白</SelectItem>
                        <SelectItem value='--'>--</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* プレビュー */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  プレビュー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='max-h-60 overflow-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {setting.columns.map((column) => {
                          const columnInfo = AVAILABLE_COLUMNS.find((col) => col.key === column);
                          return <TableHead key={column}>{columnInfo?.label || column}</TableHead>;
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((record, index) => (
                        <TableRow key={index}>
                          {setting.columns.map((column) => (
                            <TableCell key={column}>
                              {getColumnValue(record, column, setting.format, users)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={generatePreview} disabled={isLoading}>
            <Eye className='w-4 h-4 mr-2' />
            プレビュー
          </Button>
          <Button variant='outline' onClick={handleSaveSetting} disabled={isLoading}>
            <Settings className='w-4 h-4 mr-2' />
            設定保存
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            <Download className='w-4 h-4 mr-2' />
            {isLoading
              ? '出力中...'
              : setting.format.exportFormat === 'excel'
                ? 'Excel出力'
                : 'CSV出力'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// カラム値を取得する関数
const getColumnValue = (
  record: AttendanceData,
  column: string,
  format: CsvExportSetting['format'],
  users: { id: string; name: string; code?: string }[]
): string => {
  const emptyValue = format.empty_value === 'blank' ? '' : '--';

  switch (column) {
    case 'employee': {
      const user = users.find((u) => u.id === record.user_id);
      return user ? `${user.name} (${user.code || '-'})` : emptyValue;
    }
    case 'date':
      return record.work_date ? formatDate(record.work_date, format.date_format) : emptyValue;
    case 'clock_in': {
      const clockRecords = record.clock_records || [];
      const firstSession = clockRecords[0];
      return firstSession?.in_time
        ? formatTime(firstSession.in_time, format.time_format)
        : emptyValue;
    }
    case 'clock_out': {
      const clockRecords = record.clock_records || [];
      const lastSession = clockRecords[clockRecords.length - 1];
      return lastSession?.out_time
        ? formatTime(lastSession.out_time, format.time_format)
        : emptyValue;
    }
    case 'work_hours': {
      const clockRecords = record.clock_records || [];
      const totalWorkMinutes = clockRecords.reduce((total, session) => {
        if (session.in_time && session.out_time) {
          const inTime = new Date(session.in_time);
          const outTime = new Date(session.out_time);
          const sessionMinutes = Math.floor((outTime.getTime() - inTime.getTime()) / 60000);

          // 休憩時間を差し引く
          const breakMinutes =
            session.breaks?.reduce((breakTotal, br) => {
              if (br.break_start && br.break_end) {
                const breakStart = new Date(br.break_start);
                const breakEnd = new Date(br.break_end);
                return breakTotal + Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000);
              }
              return breakTotal;
            }, 0) || 0;

          return total + (sessionMinutes - breakMinutes);
        }
        return total;
      }, 0);
      return totalWorkMinutes > 0 ? formatMinutes(totalWorkMinutes) : emptyValue;
    }
    case 'overtime': {
      const clockRecords = record.clock_records || [];
      const totalWorkMinutes = clockRecords.reduce((total, session) => {
        if (session.in_time && session.out_time) {
          const inTime = new Date(session.in_time);
          const outTime = new Date(session.out_time);
          const sessionMinutes = Math.floor((outTime.getTime() - inTime.getTime()) / 60000);

          // 休憩時間を差し引く
          const breakMinutes =
            session.breaks?.reduce((breakTotal, br) => {
              if (br.break_start && br.break_end) {
                const breakStart = new Date(br.break_start);
                const breakEnd = new Date(br.break_end);
                return breakTotal + Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000);
              }
              return breakTotal;
            }, 0) || 0;

          return total + (sessionMinutes - breakMinutes);
        }
        return total;
      }, 0);
      const overtime = Math.max(0, totalWorkMinutes - 480);
      return overtime > 0 ? formatMinutes(overtime) : emptyValue;
    }
    case 'break_time': {
      const clockRecords = record.clock_records || [];
      const totalBreakMinutes = clockRecords.reduce((total, session) => {
        return (
          total +
          (session.breaks?.reduce((sessionBreakTotal, br) => {
            if (br.break_start && br.break_end) {
              const breakStart = new Date(br.break_start);
              const breakEnd = new Date(br.break_end);
              return (
                sessionBreakTotal + Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000)
              );
            }
            return sessionBreakTotal;
          }, 0) || 0)
        );
      }, 0);
      return totalBreakMinutes > 0 ? formatMinutes(totalBreakMinutes) : emptyValue;
    }
    case 'work_type':
      return record.work_type_name || emptyValue;
    case 'late': {
      const clockRecords = record.clock_records || [];
      const firstSession = clockRecords[0];
      if (firstSession?.in_time) {
        const clockIn = new Date(firstSession.in_time);
        const workStart = new Date(record.work_date);
        workStart.setHours(9, 0, 0, 0);
        const lateMinutes = Math.floor((clockIn.getTime() - workStart.getTime()) / (1000 * 60));
        return lateMinutes > 15 ? formatMinutes(lateMinutes) : emptyValue;
      }
      return emptyValue;
    }
    case 'early_leave': {
      const clockRecords = record.clock_records || [];
      const lastSession = clockRecords[clockRecords.length - 1];
      if (lastSession?.out_time) {
        const clockOut = new Date(lastSession.out_time);
        const workEnd = new Date(record.work_date);
        workEnd.setHours(18, 0, 0, 0);
        const earlyMinutes = Math.floor((workEnd.getTime() - clockOut.getTime()) / (1000 * 60));
        return earlyMinutes > 30 ? formatMinutes(earlyMinutes) : emptyValue;
      }
      return emptyValue;
    }
    case 'status':
      return '正常';
    case 'approval_status':
      return record.approved_by ? '承認済み' : '未承認';
    case 'approver':
      return record.approver_name || emptyValue;
    case 'updated_at':
      return record.updated_at
        ? formatDateTime(record.updated_at, format.date_format, format.time_format)
        : emptyValue;
    case 'notes':
      return record.description || emptyValue;
    default:
      return emptyValue;
  }
};

// フォーマット関数
const formatDate = (dateString: string, format: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
};

const formatTime = (timeString: string, format: string): string => {
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format.replace('HH', hours).replace('MM', minutes);
};

const formatDateTime = (dateTimeString: string, dateFormat: string, timeFormat: string): string => {
  const date = new Date(dateTimeString);
  const formattedDate = formatDate(date.toISOString().split('T')[0], dateFormat);
  const formattedTime = formatTime(dateTimeString, timeFormat);
  return `${formattedDate} ${formattedTime}`;
};

const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
};

// CSV固有の処理
const generateSimpleCsvData = (
  records: AttendanceData[],
  setting: CsvExportSetting,
  users: { id: string; name: string; code?: string }[]
): string => {
  const delimiter = setting.format.delimiter === 'comma' ? ',' : '\t';

  // 共通のデータ変換処理を使用
  const { headers, rows } = generateData(records, setting, users);

  // CSV文字列を生成
  const csvRows = [headers, ...rows];
  return csvRows.map((row) => row.map((cell) => `"${cell}"`).join(delimiter)).join('\n');
};
