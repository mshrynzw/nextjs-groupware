interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message = 'ローディング中...' }: LoadingSpinnerProps) => {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='flex flex-col items-center space-y-4 min-h-full justify-center'>
        <div className='relative'>
          <div className='w-12 h-12 border-4 border-blue-200 rounded-full animate-spin'></div>
          <div className='absolute inset-0 w-12 h-12 border-b-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
        </div>
        <p className='text-gray-700 font-medium animate-pulse'>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
