export default function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
