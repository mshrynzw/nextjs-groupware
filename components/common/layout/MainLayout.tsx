import ShellClient from '@/components/common/layout/ShellClient';
import type { MenuItem } from '@/components/common/sidebar/Menu';
import type { User } from '@/types/user';

type Props = {
  children: React.ReactNode;
  user: User;
  menu: MenuItem[];
};

export default function MainLayout({ children, user, menu }: Props) {
  return (
    <ShellClient user={user} menu={menu}>
      {children}
    </ShellClient>
  );
}
