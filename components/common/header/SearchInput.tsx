'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';

export const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='relative flex-shrink-0'>
      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60' />
      <Input
        placeholder='検索...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='pl-10 w-48 lg:w-64 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm'
      />
    </div>
  );
};
