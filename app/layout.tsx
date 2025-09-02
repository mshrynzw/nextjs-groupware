import '@/app/globals.css'; 

import MainLayout, { metadata, viewport } from '@/components/common/MainLayout';

export { metadata, viewport };

export default async function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
