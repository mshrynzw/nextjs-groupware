'use client';

import { useState, useEffect } from 'react';
import { Lock, MessageSquare, Eye, EyeOff } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  getChatSendKeySetting,
  updateChatSendKeySetting,
  getUserProfile,
  updateUserProfile,
} from '@/lib/actions/user-settings';

import { changeUserPassword, logoutUser } from '@/lib/auth';
// import { useAuth } from '@/contexts/auth-context';

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  // パスワード変更用state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  // パスワード可視化用state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // パスワードバリデーション
  const validatePasswordForm = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      return 'すべての項目を入力してください';
    }
    if (passwordForm.new !== passwordForm.confirm) {
      return '新しいパスワードが一致しません';
    }
    if (passwordForm.current === passwordForm.new) {
      return '新しいパスワードは現在のパスワードと異なるものにしてください';
    }
    if (passwordForm.new.length < 8) {
      return '新しいパスワードは8文字以上で入力してください';
    }
    // 追加認証や強度チェックはここに拡張可能
    return '';
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    const err = validatePasswordForm();
    if (err) {
      setPasswordError(err);
      toast({
        title: 'エラー',
        description: err,
        variant: 'destructive',
      });
      return;
    }
    setShowPasswordDialog(true);
  };

  // 実際のパスワード変更処理
  const doPasswordChange = async () => {
    setShowPasswordDialog(false);
    setIsPasswordChanging(true);
    const result = await changeUserPassword(passwordForm.current, passwordForm.new);
    setIsPasswordChanging(false);
    if (result.success) {
      setPasswordChanged(true);
      toast({
        title: '成功',
        description: 'パスワードが変更されました。再ログインが必要です。',
        variant: 'default',
      });
      setTimeout(() => {
        (async () => {
          await logoutUser();
          window.location.href = '/login?password_changed=1';
        })();
      }, 3000);
    } else {
      setPasswordError(result.message);
      toast({
        title: 'エラー',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const [chatSendKeyShiftEnter, setChatSendKeyShiftEnter] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false);

  // 初期設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        const setting = await getChatSendKeySetting(user.id);
        setChatSendKeyShiftEnter(setting);
        setIsSettingsLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
        setIsSettingsLoaded(true);
        toast({
          title: 'エラー',
          description: '設定の読み込みに失敗しました',
          variant: 'destructive',
        });
      }
    };
    loadSettings();
  }, [user?.id, toast]);

  // チャット送信キー設定を更新
  const handleChatSendKeyChange = async (useShiftEnter: boolean) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await updateChatSendKeySetting(user.id, useShiftEnter);
      if (result.success) {
        setChatSendKeyShiftEnter(useShiftEnter);
        toast({
          title: '設定を更新しました',
          description: 'チャット送信キーの設定が保存されました',
        });
      } else {
        toast({
          title: 'エラー',
          description: result.error || '設定の更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating chat send key setting:', error);
      toast({
        title: 'エラー',
        description: '設定の更新に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ダッシュボード通知件数
  const [dashboardNotificationCount, setDashboardNotificationCount] = useState<number>(3);
  const [dashboardCountInput, setDashboardCountInput] = useState<string>('3');
  const [isDashboardSaving, setIsDashboardSaving] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  // 初期値取得
  useEffect(() => {
    if (!user?.id) return;
    getUserProfile(user.id).then((profile) => {
      if (profile && typeof profile.dashboard_notification_count === 'number') {
        setDashboardNotificationCount(profile.dashboard_notification_count);
        setDashboardCountInput(String(profile.dashboard_notification_count));
      }
    });
  }, [user?.id]);

  const handleDashboardCountSave = async () => {
    setDashboardError('');
    const value = Number(dashboardCountInput);
    if (isNaN(value) || value < 3) {
      setDashboardError('3以上の数字を入力してください');
      return;
    }
    setIsDashboardSaving(true);
    if (!user?.id) {
      setIsDashboardSaving(false);
      return;
    }
    const result = await updateUserProfile(user.id, { dashboard_notification_count: value });
    setIsDashboardSaving(false);
    if (result.success) {
      setDashboardNotificationCount(value);
      toast({ title: '保存しました', description: 'お知らせの表示件数を更新しました' });
    } else {
      setDashboardError(result.message || '保存に失敗しました');
      toast({
        title: 'エラー',
        description: result.message || '保存に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Tabs defaultValue='auth' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='auth' className='flex items-center space-x-2'>
            認証
          </TabsTrigger>
          <TabsTrigger value='chat' className='flex items-center space-x-2'>
            チャット
          </TabsTrigger>
          <TabsTrigger value='dashboard' className='flex items-center space-x-2'>
            ダッシュボード
          </TabsTrigger>
        </TabsList>
        <TabsContent value='auth'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Lock className='w-5 h-5' />
                <span>認証</span>
              </CardTitle>
            </CardHeader>
            {/* --- パスワード変更フォーム --- */}
            <CardContent>
              <div className='border rounded-md p-4 space-y-3'>
                <div className='font-semibold text-gray-900 mb-2'>パスワード変更</div>
                {passwordChanged ? (
                  <div className='text-green-600 font-bold mb-2'>
                    パスワードが変更されました。再ログインが必要です。
                    <br />
                    3秒後にログイン画面へ移動します。
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePasswordChange();
                    }}
                    className='space-y-3'
                  >
                    <div>
                      <Label htmlFor='current-password'>現在のパスワード</Label>
                      <div className='relative'>
                        <Input
                          id='current-password'
                          type={showPassword.current ? 'text' : 'password'}
                          autoComplete='current-password'
                          value={passwordForm.current}
                          onChange={(e) =>
                            setPasswordForm((f) => ({ ...f, current: e.target.value }))
                          }
                          disabled={isPasswordChanging}
                        />
                        <button
                          type='button'
                          className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'
                          tabIndex={-1}
                          onClick={() => setShowPassword((s) => ({ ...s, current: !s.current }))}
                        >
                          {showPassword.current ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor='new-password'>新しいパスワード</Label>
                      <div className='relative'>
                        <Input
                          id='new-password'
                          type={showPassword.new ? 'text' : 'password'}
                          autoComplete='new-password'
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm((f) => ({ ...f, new: e.target.value }))}
                          disabled={isPasswordChanging}
                        />
                        <button
                          type='button'
                          className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'
                          tabIndex={-1}
                          onClick={() => setShowPassword((s) => ({ ...s, new: !s.new }))}
                        >
                          {showPassword.new ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor='confirm-password'>新しいパスワード（確認）</Label>
                      <div className='relative'>
                        <Input
                          id='confirm-password'
                          type={showPassword.confirm ? 'text' : 'password'}
                          autoComplete='new-password'
                          value={passwordForm.confirm}
                          onChange={(e) =>
                            setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                          }
                          disabled={isPasswordChanging}
                        />
                        <button
                          type='button'
                          className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'
                          tabIndex={-1}
                          onClick={() => setShowPassword((s) => ({ ...s, confirm: !s.confirm }))}
                        >
                          {showPassword.confirm ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>
                    {passwordError && (
                      <div className='text-red-600 text-sm font-bold'>{passwordError}</div>
                    )}
                    <div className='flex justify-end'>
                      <Button
                        type='submit'
                        className='bg-blue-600 hover:bg-blue-700 text-white'
                        disabled={isPasswordChanging}
                      >
                        {isPasswordChanging ? '変更中...' : 'パスワードを変更'}
                      </Button>
                    </div>
                  </form>
                )}
                {/* 確認ダイアログ */}
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>パスワードを変更しますか？</DialogTitle>
                    </DialogHeader>
                    <div className='text-sm text-gray-700 mb-4'>
                      パスワード変更後は自動的にログアウトされ、再ログインが必要です。
                      <br />
                      今後、追加認証（メール認証や2段階認証）が導入される場合があります。
                    </div>
                    <DialogFooter>
                      <Button variant='outline' onClick={() => setShowPasswordDialog(false)}>
                        キャンセル
                      </Button>
                      <Button
                        className='bg-blue-600 hover:bg-blue-700 text-white'
                        onClick={doPasswordChange}
                      >
                        パスワードを変更
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='chat'>
          {/* --- チャット設定 --- */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <MessageSquare className='w-5 h-5' />
                <span>チャット</span>
              </CardTitle>
            </CardHeader>
            {/* --- パスワード変更フォーム --- */}
            <CardContent>
              <div className='border rounded-md p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm'>メッセージ送信キー</Label>
                  {!isSettingsLoaded ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin'></div>
                      <span className='text-xs text-gray-500'>読み込み中...</span>
                    </div>
                  ) : (
                    <Switch
                      checked={chatSendKeyShiftEnter}
                      onCheckedChange={handleChatSendKeyChange}
                      disabled={isLoading}
                    />
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {!isSettingsLoaded
                    ? '設定を読み込み中...'
                    : chatSendKeyShiftEnter
                      ? 'Shift + Enter でメッセージを送信し、Enter で改行します'
                      : 'Enter でメッセージを送信し、Shift + Enter で改行します'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='dashboard'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <span>ダッシュボード</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='border rounded-md p-4 space-y-3'>
                <div className='font-semibold text-gray-900 mb-2'>お知らせの表示件数</div>
                <div className='flex items-center gap-4'>
                  <Input
                    type='number'
                    min={3}
                    value={dashboardCountInput}
                    onChange={(e) => setDashboardCountInput(e.target.value)}
                    className='w-24'
                  />
                </div>
                {dashboardError && (
                  <div className='text-red-600 text-sm font-bold'>{dashboardError}</div>
                )}
                <div className='text-xs text-gray-500 mt-2'>3以上の数字を入力してください</div>
              </div>
              <div className='flex justify-end space-x-2 mt-6'>
                <Button
                  onClick={handleDashboardCountSave}
                  disabled={isDashboardSaving}
                  className='bg-blue-600 hover:bg-blue-700 text-white w-full'
                >
                  {isDashboardSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
