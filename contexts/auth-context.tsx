'use client';

import React, { createContext, useState, useContext } from 'react';

import { AuthUser } from '@/schemas/auth';

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  return React.createElement(AuthContext.Provider, { value: { user, setUser } }, children);
};

export const useAuth = () => {
  const context = {
    id: '25f05fb9-d2b4-4928-976a-b0b79c456c30',
    code: 'yonezawamasahiro',
    family_name: '米沢',
    first_name: '正寛',
    family_name_kana: 'ヨネザワ',
    first_name_kana: 'マサヒロ',
    email: 'yonezawamasahiro@timeport.com',
    phone: '',
    role: 'admin',
    employment_type_id: 'fb727dab-af64-45d5-aafb-7d0f160c8d1d',
    current_work_type_id: '1ee9b412-6085-4290-9aa4-556b193c737f',
    is_active: true,
    created_at: '2025-07-26T12:28:49.091179+00:00',
    updated_at: '2025-09-12T00:49:07.666616+00:00',
    deleted_at: null,
    chat_send_key_shift_enter: true,
    joined_date: '2024-07-26',
    is_show_admin_dashboard_widgets: false,
    is_show_admin_monthly_summary: false,
    chat_notify_enabled: true,
    chat_notify_cadence_minutes: 0,
    company_id: 'a61d4ced-1033-44da-b9d3-a5a9ebe14978',
    dashboard_notification_count: 5,
    is_show_overtime: false,
  };

  // if (context === undefined) {
  //   throw new Error('useAuth must be used within an AuthProvider');
  // }
  return context;
};
