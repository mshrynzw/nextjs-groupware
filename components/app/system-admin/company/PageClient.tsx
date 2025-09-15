import CompanyTableList from '@/components/app/system-admin/company/CompanyTableList';
import type { Company } from '@/schemas/company';
import type { UserProfile } from '@/schemas/user_profile';

export default async function PageClient({
  user,
  companies,
  activeCount,
  deletedCount,
}: {
  user: UserProfile;
  companies: Company[];
  activeCount: number;
  deletedCount: number;
}) {
  return (
    <div className='space-y-4 m-4'>
      <CompanyTableList
        user={user}
        companies={companies}
        activeCompanyCount={activeCount}
        deletedCompanyCount={deletedCount}
      />
    </div>
  );
}
