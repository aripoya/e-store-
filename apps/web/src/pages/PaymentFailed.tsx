import { Link } from 'react-router-dom';

export default function PaymentFailed() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Payment Failed
      </h1>
      
      <p className="text-gray-600 mb-8">
        Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.
      </p>

      <div className="space-x-4">
        <Link
          to="/cart"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </Link>
        <Link
          to="/"
          className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
