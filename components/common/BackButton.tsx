import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface BackButtonProps {
  backPath: string;
}
export default function BackButton({ backPath }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => router.push(backPath)}
      className='mr-3 px-3 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 group'
    >
      <ArrowLeft className='w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform duration-200' />
    </Button>
  );
}
