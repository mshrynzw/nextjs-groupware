'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  GripVertical,
  Trash2,
  Settings,
  Copy,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type {
  FormFieldConfig,
  FormFieldType,
  ValidationRule,
  ConditionalLogic,
  CalculationConfig,
} from '@/schemas/request';

// import { useAuth } from '@/contexts/auth-context';
import {
  getPaidLeavePolicyInfo,
  generatePaidLeaveFormConfig,
  getCompanyLeaveTypes,
  getLeavePoliciesByType,
} from '@/lib/actions/leave-policies';
import { getCurrentUserCompanyId } from '@/lib/actions/user-company';

interface FormBuilderProps {
  formConfig: FormFieldConfig[];
  onFormConfigChangeAction: (config: FormFieldConfig[]) => void;
  onObjectTypeSettingsOpen?: (fieldId?: string) => void;
  onAddObjectField?: (field: FormFieldConfig) => void;
  onTempFieldChange?: (field: FormFieldConfig | null) => void;
}

const FIELD_TYPES: { value: FormFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'テキスト', icon: '📝' },
  { value: 'textarea', label: 'テキストエリア', icon: '📄' },
  { value: 'number', label: '数値', icon: '🔢' },
  { value: 'date', label: '日付', icon: '📅' },
  { value: 'time', label: '時刻', icon: '🕐' },
  { value: 'datetime-local', label: '日時', icon: '📅🕐' },
  { value: 'email', label: 'メール', icon: '📧' },
  { value: 'tel', label: '電話番号', icon: '📞' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'select', label: 'セレクト', icon: '📋' },
  { value: 'radio', label: 'ラジオ', icon: '🔘' },
  { value: 'checkbox', label: 'チェックボックス', icon: '☑️' },
  { value: 'file', label: 'ファイル', icon: '📎' },
  { value: 'hidden', label: '隠しフィールド', icon: '👻' },
];

// 定型フォームの定義
const TEMPLATE_FORMS = [
  {
    id: 'attendance_correction',
    name: '勤怠修正',
    description: '出勤・退勤時刻の修正申請',
    icon: Clock,
  },
  {
    id: 'overtime',
    name: '残業',
    description: '残業時間の申請',
    icon: Clock,
  },
  {
    id: 'leave',
    name: '休暇',
    description: '休暇の申請',
    icon: Calendar,
  },
];

const VALIDATION_TYPES = [
  { value: 'required', label: '必須' },
  { value: 'minLength', label: '最小文字数' },
  { value: 'maxLength', label: '最大文字数' },
  { value: 'min', label: '最小値' },
  { value: 'max', label: '最大値' },
  { value: 'pattern', label: '正規表現' },
  { value: 'email', label: 'メール形式' },
  { value: 'tel', label: '電話番号形式' },
  { value: 'url', label: 'URL形式' },
  { value: 'custom', label: 'カスタム' },
];

const WIDTH_OPTIONS = [
  { value: 'full', label: '全幅' },
  { value: 'half', label: '半幅' },
  { value: 'third', label: '1/3幅' },
  { value: 'quarter', label: '1/4幅' },
];

export default function FormBuilder({
  formConfig,
  onFormConfigChangeAction,
  onObjectTypeSettingsOpen,
  onAddObjectField,
  onTempFieldChange,
}: FormBuilderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedField, setSelectedField] = useState<FormFieldConfig | null>(null);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(false);
  const [calculationSettingsOpen, setCalculationSettingsOpen] = useState(false);

  // フィールド追加用の一時的なフィールド
  const [tempField, setTempField] = useState<FormFieldConfig | null>(null);

  // 休暇タイプ選択用の状態
  const [isLeaveTypeDialogOpen, setIsLeaveTypeDialogOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<
    Array<{ id: string; name: string; description: string | null }>
  >([]);
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false);

  // フィールド追加ダイアログを開く
  const openFieldDialog = useCallback(
    (type: FormFieldType) => {
      const newField: FormFieldConfig = {
        id: `field_${Date.now()}`,
        name: '',
        type,
        label: '',
        required: false,
        validation_rules: [],
        order: formConfig.length + 1,
        width: 'full',
      };

      // オブジェクトタイプの場合はオブジェクトタイプ設定ダイアログを開く
      if (type === 'object' && onObjectTypeSettingsOpen) {
        setTempField(newField);
        onTempFieldChange?.(newField);
        onObjectTypeSettingsOpen(newField.id);
        // オブジェクトフィールドの場合はselectedFieldを設定しない
      } else {
        // オブジェクト以外の場合は通常のフィールド設定ダイアログを開く
        setSelectedField(newField);
        setTempField(newField);
        // 少し遅延を入れてダイアログを開く
        setTimeout(() => {
          setFieldSettingsOpen(true);
        }, 10);
      }
    },
    [formConfig.length, onObjectTypeSettingsOpen]
  );

  // フィールドを実際に追加
  const addField = useCallback(
    (field: FormFieldConfig) => {
      const newConfig = [...formConfig, field];
      onFormConfigChangeAction(newConfig);
      setTempField(null);
      onTempFieldChange?.(null);
    },
    [formConfig, onFormConfigChangeAction, onTempFieldChange]
  );

  // フィールドを削除
  const removeField = useCallback(
    (fieldId: string) => {
      const newConfig = formConfig.filter((field) => field.id !== fieldId);
      newConfig.forEach((field, index) => {
        field.order = index + 1;
      });
      onFormConfigChangeAction(newConfig);
      if (selectedField && selectedField.id === fieldId) {
        setSelectedField(null);
        setFieldSettingsOpen(false);
      }
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  // フィールドを複製
  const duplicateField = useCallback(
    (field: FormFieldConfig) => {
      const newField: FormFieldConfig = {
        ...field,
        id: `field_${Date.now()}`,
        name: `${field.name}_copy`,
        label: `${field.label} (コピー)`,
        order: formConfig.length + 1,
      };
      const newConfig = [...formConfig, newField];
      onFormConfigChangeAction(newConfig);
    },
    [formConfig.length, onFormConfigChangeAction]
  );

  // 休暇タイプを取得
  const loadLeaveTypes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingLeaveTypes(true);
      const companyId = await getCurrentUserCompanyId(user.id);
      if (!companyId) {
        toast({
          title: 'エラー',
          description: '会社情報が取得できません',
          variant: 'destructive',
        });
        return;
      }

      const { leaveTypes: types, error } = await getCompanyLeaveTypes(companyId);
      if (error) {
        toast({
          title: 'エラー',
          description: '休暇タイプの取得に失敗しました',
          variant: 'destructive',
        });
        return;
      }

      setLeaveTypes(types);
    } catch (error) {
      console.error('休暇タイプ取得エラー:', error);
      toast({
        title: 'エラー',
        description: '休暇タイプの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLeaveTypes(false);
    }
  }, [user?.id, toast]);

  // 休暇タイプを選択してフォームを生成
  const handleLeaveTypeSelect = useCallback(
    async (leaveTypeId: string) => {
      if (!user?.id) return;

      try {
        const companyId = await getCurrentUserCompanyId(user.id);
        if (!companyId) {
          toast({
            title: 'エラー',
            description: '会社情報が取得できません',
            variant: 'destructive',
          });
          return;
        }

        // 選択されたleave_typeに基づいてleave_policiesを取得
        console.log('getLeavePoliciesByType呼び出し前:', { companyId, leaveTypeId });
        const { policies, error } = await getLeavePoliciesByType(companyId, leaveTypeId);

        if (error) {
          console.error('休暇ポリシー取得エラー:', error);
          console.error('エラー詳細:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: 'エラー',
            description: `休暇ポリシーの取得に失敗しました: ${error.message}`,
            variant: 'destructive',
          });
          return;
        }

        console.log('取得されたポリシー:', policies);

        // 選択されたleave_typeの情報を取得
        const selectedLeaveType = leaveTypes.find((lt) => lt.id === leaveTypeId);
        if (!selectedLeaveType) {
          toast({
            title: 'エラー',
            description: '選択された休暇タイプが見つかりません',
            variant: 'destructive',
          });
          return;
        }

        // ポリシーに基づいてフォーム設定を生成
        const policyData = policies.length > 0 ? policies[0] : null;

        // LeavePolicyInfoの型に合わせてデータを構築
        const policy = policyData
          ? {
              id: policyData.id,
              company_id: companyId,
              leave_type_id: policyData.leave_type_id,
              name: policyData.name || '',
              description: policyData.description || '',
              business_day_only: policyData.business_day_only || false,
              blackout_dates: policyData.blackout_dates || [],
              day_hours: policyData.day_hours || 8,
              min_booking_unit_minutes: policyData.min_booking_unit_minutes || 60,
              rounding_minutes: policyData.rounding_minutes || null,
              allowed_units: policyData.allowed_units || ['day'],
              half_day_mode: policyData.half_day_mode || 'am_pm',
              allow_multi_day: true,
              accrual_method: 'anniversary' as const,
              base_days_by_service: {},
              carryover_max_days: null,
              expire_months: null,
              allow_negative: false,
              hold_on_apply: false,
              deduction_timing: 'apply' as const,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null;

        const newFields = await generatePaidLeaveFormConfig(policy, {
          id: selectedLeaveType.id,
          company_id: companyId,
          code: 'leave',
          name: selectedLeaveType.name,
          description: selectedLeaveType.description,
          color: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        console.log('休暇フォーム生成完了:', newFields);
        onFormConfigChangeAction(newFields);
        setIsLeaveTypeDialogOpen(false);

        if (policy) {
          toast({
            title: '休暇フォームが追加されました',
            description: `${selectedLeaveType.name}のポリシーに基づいてフォームが生成されました`,
          });
        } else {
          toast({
            title: '休暇フォームが追加されました',
            description: `${selectedLeaveType.name}の基本フォームが生成されました（ポリシーは設定されていません）`,
          });
        }
      } catch (error) {
        console.error('休暇フォーム生成エラー:', error);
        toast({
          title: 'エラー',
          description: '休暇フォームの生成に失敗しました',
          variant: 'destructive',
        });
      }
    },
    [user?.id, leaveTypes, onFormConfigChangeAction, toast]
  );

  // フィールド設定を更新
  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormFieldConfig>) => {
      // 新しいフィールドの場合はselectedFieldを更新
      if (selectedField && selectedField.id === fieldId) {
        setSelectedField({ ...selectedField, ...updates });
        return;
      }

      // 既存フィールドの場合はformConfigを更新
      const newConfig = formConfig.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      );
      onFormConfigChangeAction(newConfig);
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  // ドラッグ&ドロップで順序を変更
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(formConfig);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // 順序を再設定
      items.forEach((item, index) => {
        item.order = index + 1;
      });

      onFormConfigChangeAction(items);
    },
    [onFormConfigChangeAction]
  );

  // バリデーションルールを追加
  const addValidationRule = useCallback(
    (fieldId: string) => {
      const newRule: ValidationRule = {
        type: 'required',
        value: '',
        message: '',
      };

      // 新しいフィールドの場合はselectedFieldを更新
      if (selectedField && selectedField.id === fieldId) {
        const newRules = [...selectedField.validation_rules, newRule];
        setSelectedField({ ...selectedField, validation_rules: newRules });
        return;
      }

      // 既存フィールドの場合はformConfigを更新
      const field = formConfig.find((f) => f.id === fieldId);
      if (field) {
        const newRules = [...field.validation_rules, newRule];
        const newConfig = formConfig.map((f) =>
          f.id === fieldId ? { ...f, validation_rules: newRules } : f
        );
        onFormConfigChangeAction(newConfig);
      }
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  // バリデーションルールを削除
  const removeValidationRule = useCallback(
    (fieldId: string, ruleIndex: number) => {
      // 新しいフィールドの場合はselectedFieldを更新
      if (selectedField && selectedField.id === fieldId) {
        const newRules = selectedField.validation_rules.filter((_, index) => index !== ruleIndex);
        setSelectedField({ ...selectedField, validation_rules: newRules });
        return;
      }

      // 既存フィールドの場合はformConfigを更新
      const field = formConfig.find((f) => f.id === fieldId);
      if (field) {
        const newRules = field.validation_rules.filter((_, index) => index !== ruleIndex);
        const newConfig = formConfig.map((f) =>
          f.id === fieldId ? { ...f, validation_rules: newRules } : f
        );
        onFormConfigChangeAction(newConfig);
      }
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  // 条件表示ロジックを追加
  const addConditionalLogic = useCallback(
    (fieldId: string) => {
      const newLogic: ConditionalLogic = {
        field: '',
        operator: 'equals',
        value: '',
        action: 'show',
      };

      // 新しいフィールドの場合はselectedFieldを更新
      if (selectedField && selectedField.id === fieldId) {
        const newLogicList = [...(selectedField.conditional_logic || []), newLogic];
        setSelectedField({ ...selectedField, conditional_logic: newLogicList });
        return;
      }

      // 既存フィールドの場合はformConfigを更新
      const field = formConfig.find((f) => f.id === fieldId);
      if (field) {
        const newLogicList = [...(field.conditional_logic || []), newLogic];
        const newConfig = formConfig.map((f) =>
          f.id === fieldId ? { ...f, conditional_logic: newLogicList } : f
        );
        onFormConfigChangeAction(newConfig);
      }
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  // 条件表示ロジックを削除
  const removeConditionalLogic = useCallback(
    (fieldId: string, logicIndex: number) => {
      // 新しいフィールドの場合はselectedFieldを更新
      if (selectedField && selectedField.id === fieldId) {
        const newLogicList = (selectedField.conditional_logic || []).filter(
          (_, index) => index !== logicIndex
        );
        setSelectedField({ ...selectedField, conditional_logic: newLogicList });
        return;
      }

      // 既存フィールドの場合はformConfigを更新
      const field = formConfig.find((f) => f.id === fieldId);
      if (field && field.conditional_logic) {
        const newLogicList = field.conditional_logic.filter((_, index) => index !== logicIndex);
        const newConfig = formConfig.map((f) =>
          f.id === fieldId ? { ...f, conditional_logic: newLogicList } : f
        );
        onFormConfigChangeAction(newConfig);
      }
    },
    [formConfig, selectedField, onFormConfigChangeAction]
  );

  return (
    <div className='space-y-6'>
      {/* フィールドタイプ選択 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Plus className='w-5 h-5' />
            <span>フィールドを追加</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3'>
            {FIELD_TYPES.map((fieldType) => (
              <Button
                key={fieldType.value}
                variant='outline'
                className='h-20 flex flex-col items-center justify-center space-y-1'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openFieldDialog(fieldType.value);
                }}
              >
                <span className='text-lg'>{fieldType.icon}</span>
                <span className='text-xs'>{fieldType.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 定型フォーム選択 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <FileText className='w-5 h-5' />
            <span>定型フォーム</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {TEMPLATE_FORMS.map((template) => (
              <Button
                key={template.id}
                variant='outline'
                className='h-20 flex flex-col items-center justify-center space-y-1'
                onClick={async (event) => {
                  // フォームの自動送信を防ぐため、イベントの伝播を停止
                  event.preventDefault();
                  event.stopPropagation();

                  console.log('定型フォーム選択:', template.id);
                  if (template.id === 'attendance_correction') {
                    // 勤怠修正の定型フォーム
                    const newFields: FormFieldConfig[] = [
                      {
                        id: `field_${Date.now()}_1`,
                        name: 'work_date',
                        type: 'date',
                        label: '勤務日',
                        required: true,
                        validation_rules: [],
                        order: 1,
                        width: 'full',
                      },
                      {
                        id: `field_${Date.now()}_2`,
                        name: 'clock_records',
                        type: 'object',
                        label: '勤務記録',
                        required: true,
                        validation_rules: [],
                        order: 2,
                        width: 'full',
                        metadata: {
                          object_type: 'attendance',
                        },
                      },
                    ];
                    console.log('勤怠修正フィールド追加:', newFields);
                    onFormConfigChangeAction(newFields);
                  } else if (template.id === 'overtime') {
                    // 残業の定型フォーム
                    const newFields: FormFieldConfig[] = [
                      {
                        id: `field_${Date.now()}_1`,
                        name: 'overtime_date',
                        type: 'date',
                        label: '残業日',
                        required: true,
                        validation_rules: [],
                        order: 1,
                        width: 'full',
                      },
                      {
                        id: `field_${Date.now()}_2`,
                        name: 'start_time',
                        type: 'time',
                        label: '開始時刻',
                        required: true,
                        validation_rules: [],
                        order: 2,
                        width: 'half',
                      },
                      {
                        id: `field_${Date.now()}_3`,
                        name: 'end_time',
                        type: 'time',
                        label: '終了時刻',
                        required: true,
                        validation_rules: [],
                        order: 3,
                        width: 'half',
                      },
                      {
                        id: `field_${Date.now()}_4`,
                        name: 'reason',
                        type: 'textarea',
                        label: '残業理由',
                        required: true,
                        validation_rules: [],
                        order: 4,
                        width: 'full',
                      },
                    ];
                    console.log('残業フィールド追加:', newFields);
                    onFormConfigChangeAction(newFields);
                  } else if (template.id === 'leave') {
                    // 休暇の定型フォーム - leave_typesの選択ダイアログを表示
                    try {
                      if (!user?.id) {
                        toast({
                          title: 'エラー',
                          description: 'ユーザー情報が取得できません',
                          variant: 'destructive',
                        });
                        return;
                      }

                      // 休暇タイプを取得してダイアログを表示
                      await loadLeaveTypes();
                      setIsLeaveTypeDialogOpen(true);
                    } catch (error) {
                      console.error('休暇タイプ取得エラー:', error);
                      toast({
                        title: 'エラー',
                        description: '休暇タイプの取得に失敗しました',
                        variant: 'destructive',
                      });
                    }
                  }
                  console.log('定型フォーム選択完了');

                  // 定型フォーム選択完了後にユーザーにガイダンスを提供（休暇以外の場合）
                  if (template.id !== 'leave') {
                    toast({
                      title: '定型フォームが追加されました',
                      description:
                        'フィールドの設定を確認し、「次へ」ボタンで承認フロー設定に進んでください',
                    });
                  }

                  // フォームの自動送信を防ぐため、イベントの伝播を停止
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <template.icon className='w-6 h-6' />
                <span className='text-xs'>{template.name}</span>
                <p className='text-xs text-gray-500'>{template.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 休暇タイプ選択ダイアログ */}
      <Dialog open={isLeaveTypeDialogOpen} onOpenChange={setIsLeaveTypeDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>休暇タイプを選択</DialogTitle>
            <DialogDescription>
              適用する休暇タイプを選択してください。選択されたタイプのポリシーに基づいてフォームが自動生成されます。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {isLoadingLeaveTypes ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                <span className='ml-2 text-gray-500'>休暇タイプを読み込み中...</span>
              </div>
            ) : leaveTypes.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-gray-500'>利用可能な休暇タイプがありません</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {leaveTypes.map((leaveType) => (
                  <Button
                    key={leaveType.id}
                    variant='outline'
                    className='w-full justify-start h-auto py-3'
                    onClick={() => handleLeaveTypeSelect(leaveType.id)}
                  >
                    <div className='text-left'>
                      <div className='font-medium'>{leaveType.name}</div>
                      {leaveType.description && (
                        <div className='text-sm text-gray-500'>{leaveType.description}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <div className='flex justify-end space-x-2 pt-4'>
              <Button variant='outline' onClick={() => setIsLeaveTypeDialogOpen(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* フィールド一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>フォーム項目</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId='fields'>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className='space-y-3'>
                  {formConfig.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className='border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <div {...provided.dragHandleProps}>
                                <GripVertical className='w-4 h-4 text-gray-400 cursor-move' />
                              </div>
                              <div className='flex items-center space-x-2'>
                                <Badge variant='outline'>{field.type}</Badge>
                                <span className='font-medium'>{field.label || '未設定'}</span>
                                {field.required && (
                                  <Badge variant='destructive' className='text-xs'>
                                    必須
                                  </Badge>
                                )}
                                <Badge variant='secondary' className='text-xs'>
                                  {field.width}
                                </Badge>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // オブジェクトタイプの場合はオブジェクトタイプ設定ダイアログを開く
                                  if (field.type === 'object' && onObjectTypeSettingsOpen) {
                                    onObjectTypeSettingsOpen(field.id);
                                    // オブジェクトフィールドの場合はselectedFieldを設定しない
                                  } else {
                                    setSelectedField(field);
                                    setFieldSettingsOpen(true);
                                  }
                                }}
                              >
                                <Settings className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateField(field);
                                }}
                              >
                                <Copy className='w-4 h-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-600'
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeField(field.id);
                                }}
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {formConfig.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <p>
                フィールドがありません。上記からフィールドまたは定型フォームを追加してください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* フィールド設定ダイアログ */}
      <Dialog
        open={fieldSettingsOpen}
        onOpenChange={(open) => {
          // 意図しない閉じる動作を防ぐ
          if (!open && selectedField) {
            // フィールドが選択されている場合は、明示的に閉じる操作のみ許可
            setFieldSettingsOpen(false);
            setSelectedField(null);
            setTempField(null);
            onTempFieldChange?.(null);
          } else if (open) {
            // オブジェクトフィールドの場合はfieldSettingsOpenを開かない
            if (selectedField && selectedField.type === 'object') {
              setFieldSettingsOpen(false);
              setSelectedField(null);
              setTempField(null);
              onTempFieldChange?.(null);
              return;
            }
            setFieldSettingsOpen(true);
          }
        }}
      >
        <DialogContent
          className='max-w-2xl max-h-[90vh] overflow-y-auto'
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle>フィールド設定</DialogTitle>
            <DialogDescription>フォームフィールドの詳細設定を行います。</DialogDescription>
          </DialogHeader>

          {selectedField &&
            (() => {
              // 新しいフィールドの場合はselectedFieldを直接使用、既存フィールドの場合はformConfigから取得
              const currentField =
                formConfig.find((f) => f.id === selectedField.id) || selectedField;

              return (
                <>
                  <Tabs key={currentField.id} defaultValue='basic' className='w-full'>
                    <TabsList className='grid w-full grid-cols-4'>
                      <TabsTrigger value='basic'>基本設定</TabsTrigger>
                      <TabsTrigger value='validation'>バリデーション</TabsTrigger>
                      <TabsTrigger value='conditional'>条件表示</TabsTrigger>
                      <TabsTrigger value='calculation'>計算設定</TabsTrigger>
                    </TabsList>

                    <TabsContent value='basic' className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='fieldName'>フィールド名 *</Label>
                          <Input
                            id='fieldName'
                            value={currentField.name}
                            onChange={(e) => updateField(currentField.id, { name: e.target.value })}
                            placeholder='例: start_date'
                          />
                        </div>
                        <div>
                          <Label htmlFor='fieldLabel'>ラベル *</Label>
                          <Input
                            id='fieldLabel'
                            value={currentField.label}
                            onChange={(e) =>
                              updateField(currentField.id, { label: e.target.value })
                            }
                            placeholder='例: 開始日'
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor='fieldDescription'>説明</Label>
                        <Textarea
                          id='fieldDescription'
                          value={currentField.description || ''}
                          onChange={(e) =>
                            updateField(currentField.id, { description: e.target.value })
                          }
                          placeholder='フィールドの説明を入力'
                          rows={2}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='fieldWidth'>表示幅</Label>
                          <Select
                            value={currentField.width || 'full'}
                            onValueChange={(value) =>
                              updateField(currentField.id, {
                                width: value as 'full' | 'half' | 'third' | 'quarter',
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {WIDTH_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor='fieldOrder'>表示順序</Label>
                          <Input
                            id='fieldOrder'
                            type='number'
                            value={currentField.order}
                            onChange={(e) =>
                              updateField(currentField.id, { order: parseInt(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Switch
                          id='fieldRequired'
                          checked={currentField.required}
                          onCheckedChange={(checked) =>
                            updateField(currentField.id, { required: checked })
                          }
                        />
                        <Label htmlFor='fieldRequired'>必須フィールド</Label>
                      </div>

                      {/* 選択肢フィールドの場合 */}
                      {(currentField.type === 'select' ||
                        currentField.type === 'radio' ||
                        currentField.type === 'checkbox') && (
                        <div>
                          <Label htmlFor='fieldOptions'>選択肢</Label>
                          <Textarea
                            id='fieldOptions'
                            value={currentField.options?.join('\n') || ''}
                            onChange={(e) => {
                              const options = e.target.value
                                .split('\n')
                                .filter((option) => option !== ''); // 空行のみを削除
                              updateField(currentField.id, { options });
                            }}
                            onKeyDown={(e) => {
                              // Enterキーが押されたときの処理
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const textarea = e.target as HTMLTextAreaElement;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const value = textarea.value;

                                // カーソル位置に改行を挿入
                                const newValue =
                                  value.substring(0, start) + '\n' + value.substring(end);
                                textarea.value = newValue;

                                // カーソル位置を更新
                                textarea.selectionStart = textarea.selectionEnd = start + 1;

                                // onChangeイベントを手動で発火
                                const event = new Event('input', { bubbles: true });
                                textarea.dispatchEvent(event);
                              }
                            }}
                            placeholder='選択肢を1行に1つずつ入力'
                            rows={4}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value='validation' className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Label>バリデーションルール</Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addValidationRule(currentField.id)}
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          ルール追加
                        </Button>
                      </div>

                      <div className='space-y-3'>
                        {currentField.validation_rules.map((rule, index) => (
                          <div key={index} className='border rounded-lg p-3 space-y-3'>
                            <div className='flex items-center justify-between'>
                              <span className='text-sm font-medium'>ルール {index + 1}</span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='text-red-600'
                                onClick={() => removeValidationRule(currentField.id, index)}
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                              <div>
                                <Label>タイプ</Label>
                                <Select
                                  value={rule.type}
                                  onValueChange={(value) => {
                                    const newRules = [...currentField.validation_rules];
                                    newRules[index] = {
                                      ...rule,
                                      type: value as ValidationRule['type'],
                                    };
                                    updateField(currentField.id, { validation_rules: newRules });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VALIDATION_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>値</Label>
                                <Input
                                  value={rule.value || ''}
                                  onChange={(e) => {
                                    const newRules = [...currentField.validation_rules];
                                    newRules[index] = { ...rule, value: e.target.value };
                                    updateField(currentField.id, { validation_rules: newRules });
                                  }}
                                  placeholder='バリデーション値'
                                />
                              </div>
                            </div>

                            <div>
                              <Label>エラーメッセージ</Label>
                              <Input
                                value={rule.message || ''}
                                onChange={(e) => {
                                  const newRules = [...currentField.validation_rules];
                                  newRules[index] = { ...rule, message: e.target.value };
                                  updateField(currentField.id, { validation_rules: newRules });
                                }}
                                placeholder='エラーメッセージ'
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value='conditional' className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Label>条件表示ロジック</Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => addConditionalLogic(currentField.id)}
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          条件追加
                        </Button>
                      </div>

                      <div className='space-y-3'>
                        {currentField.conditional_logic?.map((logic, index) => (
                          <div key={index} className='border rounded-lg p-3 space-y-3'>
                            <div className='flex items-center justify-between'>
                              <span className='text-sm font-medium'>条件 {index + 1}</span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='text-red-600'
                                onClick={() => removeConditionalLogic(currentField.id, index)}
                              >
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>

                            <div className='grid grid-cols-4 gap-3'>
                              <div>
                                <Label>対象フィールド</Label>
                                <Select
                                  value={logic.field}
                                  onValueChange={(value) => {
                                    const newLogic = [...(currentField.conditional_logic || [])];
                                    newLogic[index] = { ...logic, field: value };
                                    updateField(currentField.id, { conditional_logic: newLogic });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder='フィールド選択' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {formConfig
                                      .filter((f) => f.id !== currentField.id)
                                      .map((field) => (
                                        <SelectItem key={field.id} value={field.id}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>演算子</Label>
                                <Select
                                  value={logic.operator}
                                  onValueChange={(value) => {
                                    const newLogic = [...(currentField.conditional_logic || [])];
                                    newLogic[index] = {
                                      ...logic,
                                      operator: value as ConditionalLogic['operator'],
                                    };
                                    updateField(currentField.id, { conditional_logic: newLogic });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='equals'>等しい</SelectItem>
                                    <SelectItem value='not_equals'>等しくない</SelectItem>
                                    <SelectItem value='contains'>含む</SelectItem>
                                    <SelectItem value='not_contains'>含まない</SelectItem>
                                    <SelectItem value='greater_than'>より大きい</SelectItem>
                                    <SelectItem value='less_than'>より小さい</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>値</Label>
                                <Input
                                  value={logic.value as string}
                                  onChange={(e) => {
                                    const newLogic = [...(currentField.conditional_logic || [])];
                                    newLogic[index] = { ...logic, value: e.target.value };
                                    updateField(currentField.id, { conditional_logic: newLogic });
                                  }}
                                  placeholder='条件値'
                                />
                              </div>

                              <div>
                                <Label>アクション</Label>
                                <Select
                                  value={logic.action}
                                  onValueChange={(value) => {
                                    const newLogic = [...(currentField.conditional_logic || [])];
                                    newLogic[index] = {
                                      ...logic,
                                      action: value as ConditionalLogic['action'],
                                    };
                                    updateField(currentField.id, { conditional_logic: newLogic });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='show'>表示</SelectItem>
                                    <SelectItem value='hide'>非表示</SelectItem>
                                    <SelectItem value='require'>必須化</SelectItem>
                                    <SelectItem value='disable'>無効化</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value='calculation' className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Label>計算設定</Label>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => setCalculationSettingsOpen(true)}
                        >
                          <Settings className='w-4 h-4 mr-2' />
                          計算設定
                        </Button>
                      </div>

                      {currentField.calculation_config ? (
                        <div className='border rounded-lg p-3 space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>
                              計算タイプ: {currentField.calculation_config.type}
                            </span>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='text-red-600'
                              onClick={() =>
                                updateField(currentField.id, { calculation_config: undefined })
                              }
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                          <p className='text-sm text-gray-600'>
                            対象フィールド:{' '}
                            {currentField.calculation_config.target_fields.join(', ')}
                          </p>
                          <p className='text-sm text-gray-600'>
                            結果フィールド: {currentField.calculation_config.result_field}
                          </p>
                        </div>
                      ) : (
                        <div className='text-center py-8 text-gray-500'>
                          <p>計算設定がありません</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* 操作ボタン */}
                  <div className='flex justify-end space-x-2 pt-4 border-t'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setFieldSettingsOpen(false);
                        setSelectedField(null);
                        setTempField(null);
                        onTempFieldChange?.(null);
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 必須フィールドのバリデーション
                        if (!currentField?.name.trim()) {
                          alert('フィールド名を入力してください');
                          return;
                        }
                        if (!currentField?.label.trim()) {
                          alert('ラベルを入力してください');
                          return;
                        }
                        // フィールドを実際に追加
                        addField(currentField);
                        setFieldSettingsOpen(false);
                        setSelectedField(null);
                        onTempFieldChange?.(null);
                      }}
                      disabled={!currentField?.name.trim() || !currentField?.label.trim()}
                    >
                      保存
                    </Button>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* 計算設定ダイアログ */}
      <Dialog open={calculationSettingsOpen} onOpenChange={setCalculationSettingsOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>計算設定</DialogTitle>
            <DialogDescription>フィールドの計算設定を行います。</DialogDescription>
          </DialogHeader>

          {selectedField && (
            <div className='space-y-4'>
              <div>
                <Label>計算タイプ</Label>
                <Select
                  value={selectedField.calculation_config?.type || 'sum'}
                  onValueChange={(value) => {
                    const newConfig: CalculationConfig = {
                      type: value as CalculationConfig['type'],
                      target_fields: selectedField.calculation_config?.target_fields || [],
                      result_field: selectedField.calculation_config?.result_field || '',
                    };
                    updateField(selectedField.id, { calculation_config: newConfig });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='sum'>合計</SelectItem>
                    <SelectItem value='multiply'>乗算</SelectItem>
                    <SelectItem value='divide'>除算</SelectItem>
                    <SelectItem value='subtract'>減算</SelectItem>
                    <SelectItem value='date_diff'>日数差</SelectItem>
                    <SelectItem value='time_diff'>時間差</SelectItem>
                    <SelectItem value='custom'>カスタム</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>対象フィールド</Label>
                <Select
                  value=''
                  onValueChange={(value) => {
                    const currentConfig = selectedField.calculation_config;
                    if (currentConfig) {
                      const newTargetFields = [...currentConfig.target_fields, value];
                      updateField(selectedField.id, {
                        calculation_config: { ...currentConfig, target_fields: newTargetFields },
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='フィールドを選択' />
                  </SelectTrigger>
                  <SelectContent>
                    {formConfig
                      .filter((f) => f.type === 'number' && f.id !== selectedField.id)
                      .map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedField.calculation_config?.target_fields.map((fieldId, index) => {
                  const field = formConfig.find((f) => f.id === fieldId);
                  return (
                    <div
                      key={index}
                      className='flex items-center justify-between mt-2 p-2 bg-gray-50 rounded'
                    >
                      <span className='text-sm'>{field?.label}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const currentConfig = selectedField.calculation_config;
                          if (currentConfig) {
                            const newTargetFields = currentConfig.target_fields.filter(
                              (_, i) => i !== index
                            );
                            updateField(selectedField.id, {
                              calculation_config: {
                                ...currentConfig,
                                target_fields: newTargetFields,
                              },
                            });
                          }
                        }}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div>
                <Label>結果フィールド</Label>
                <Select
                  value={selectedField.calculation_config?.result_field || ''}
                  onValueChange={(value) => {
                    const currentConfig = selectedField.calculation_config;
                    if (currentConfig) {
                      updateField(selectedField.id, {
                        calculation_config: { ...currentConfig, result_field: value },
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='結果を格納するフィールド' />
                  </SelectTrigger>
                  <SelectContent>
                    {formConfig
                      .filter((f) => f.type === 'number' && f.id !== selectedField.id)
                      .map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedField.calculation_config?.type === 'custom' && (
                <div>
                  <Label>計算式</Label>
                  <Textarea
                    value={selectedField.calculation_config?.formula || ''}
                    onChange={(e) => {
                      const currentConfig = selectedField.calculation_config;
                      if (currentConfig) {
                        updateField(selectedField.id, {
                          calculation_config: { ...currentConfig, formula: e.target.value },
                        });
                      }
                    }}
                    placeholder='例: field1 + field2 * 0.1'
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* 操作ボタン */}
          <div className='flex justify-end space-x-2 pt-4 border-t'>
            <Button variant='outline' onClick={() => setCalculationSettingsOpen(false)}>
              キャンセル
            </Button>
            <Button type='button' onClick={() => setCalculationSettingsOpen(false)}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
