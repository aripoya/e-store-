import { Link } from 'react-router-dom';

export default function PaymentPending() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Payment Pending
      </h1>
      
      <p className="text-gray-600 mb-8">
        Your payment is being processed. We'll send you a confirmation email once the payment is complete.
      </p>

      <div className="space-x-4">
        <Link
          to="/products"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
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
