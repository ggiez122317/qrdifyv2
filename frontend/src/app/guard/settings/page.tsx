'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { MessageSquare, Star, Info, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { SecuritySettings } from '@/components/settings/security-settings';

type Tab = 'feedback' | 'reviews' | 'about' | 'account';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('feedback');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab) {
        setTimeout(() => setActiveTab(tab as Tab), 0);
      }
    }
  }, []);

  const [feedbackForm, setFeedbackForm] = useState({ content: '' });
  const [reviewForm, setReviewForm] = useState({ content: '', rating: 5 });

  const submitMutation = useMutation({
    mutationFn: async (data: { type: string, content: string, rating?: number }) => {
      return api.post('/api/feedbacks', data);
    },
    onSuccess: () => {
      setIsSuccess(true);
      setFeedbackForm({ content: '' });
      setReviewForm({ content: '', rating: 5 });
      setTimeout(() => setIsSuccess(false), 3000);
      localStorage.setItem('toast_message', 'Feedback submitted successfully');
    }
  });

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({ type: 'feedback', content: feedbackForm.content });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({ type: 'review', content: reviewForm.content, rating: reviewForm.rating });
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          System Settings
        </h1>
        <p className="text-slate-500 font-medium mt-1">Configure your preferences and provide feedback.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden sticky top-6">
            <nav className="flex flex-col p-2 space-y-1">
              <button 
                onClick={() => setActiveTab('feedback')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${activeTab === 'feedback' ? 'bg-red-50 text-maroon-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <MessageSquare className={`w-5 h-5 ${activeTab === 'feedback' ? 'text-maroon-600' : 'text-slate-400'}`} />
                Report & Feedback
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${activeTab === 'reviews' ? 'bg-red-50 text-maroon-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Star className={`w-5 h-5 ${activeTab === 'reviews' ? 'text-maroon-600' : 'text-slate-400'}`} />
                Reviews
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${activeTab === 'about' ? 'bg-red-50 text-maroon-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Info className={`w-5 h-5 ${activeTab === 'about' ? 'text-maroon-600' : 'text-slate-400'}`} />
                About Qridify
              </button>
              <button 
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left ${activeTab === 'account' ? 'bg-red-50 text-maroon-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Shield className={`w-5 h-5 ${activeTab === 'account' ? 'text-maroon-600' : 'text-slate-400'}`} />
                Account Security
              </button>
            </nav>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8 min-h-[400px]">
            {isSuccess && (
              <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-bold text-sm">Successfully submitted! Thank you for your input.</p>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">Report & Feedback</h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Have you encountered a bug or have a suggestion? Let us know below.</p>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Message</label>
                    <textarea 
                      required
                      rows={5}
                      value={feedbackForm.content}
                      onChange={e => setFeedbackForm({ content: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400 resize-none"
                      placeholder="Please describe the issue or suggestion in detail..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-[#7a1315] hover:bg-[#5a0d0f] text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-70 min-w-[180px]"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : 'Submit Feedback'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">Write a Review</h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Rate your experience using the School Attendance System.</p>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1"
                        >
                          <Star 
                            className={`w-8 h-8 transition-colors ${reviewForm.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Review Details</label>
                    <textarea 
                      required
                      rows={4}
                      value={reviewForm.content}
                      onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-400 resize-none"
                      placeholder="What did you like or dislike?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-[#7a1315] hover:bg-[#5a0d0f] text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-70 min-w-[180px]"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10 text-maroon-700" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Qridify SAS</h2>
                  <p className="text-slate-500 font-medium mb-6">Version 2.0.1</p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-left w-full max-w-md">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      The School Attendance System (SAS) is a comprehensive solution for managing and tracking campus attendance in real-time. It integrates hardware scanners with an intuitive digital dashboard.
                    </p>
                    <ul className="text-sm font-medium text-slate-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Developed for optimized speed & security
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time syncing with WebSockets
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Role-based secure access control
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-400 mt-8 font-medium">
                    &copy; 2026 Qridify. All rights reserved.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Account Security</h2>
                <SecuritySettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
