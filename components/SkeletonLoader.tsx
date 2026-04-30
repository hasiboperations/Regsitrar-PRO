import React from 'react';

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 border-l-4 border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4 animate-pulse">
                <div className="flex-grow min-w-0 w-full">
                    <div className="h-6 bg-gray-200 rounded-md w-24 mb-3"></div>
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 mt-3 sm:mt-0 self-end sm:self-center">
                    <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                </div>
            </div>
        ))}
        <div className="text-center text-gray-500 py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-3 font-semibold">Generating Documents...</p>
            <p className="text-sm">The AI is working its magic. This may take a few moments.</p>
        </div>
    </div>
);

export default SkeletonLoader;
