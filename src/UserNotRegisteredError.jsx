import React from 'react';

export default function UserNotRegisteredError() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-light text-slate-300">403</h1>
                    <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-medium text-slate-800">
                        User Not Registered
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                        Your account is not registered for this application. Please contact your administrator.
                    </p>
                </div>
                <div className="pt-6">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
