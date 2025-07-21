import React, { useState } from 'react';
import { Mail, Send, AlertCircle, Copy, Trash2, FileText } from 'lucide-react';
import { copyToClipboard } from '../utils/validation';
import toast from 'react-hot-toast';

interface EmailInputProps {
  onProcessEmail: (emailText: string) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
  onClearError: () => void;
}

const SAMPLE_EMAIL = `From: Software Support <SoftwareSupport@hepl.com>
Sent: Tuesday, July 15, 2025 3:25 PM
To: Arun Prasad S/IT/HEPL <arun.se@hepl.com>
Cc: Ganagavathy K G V/IT/HEPL <ganaga.v@hepl.com>; Kaviya M/IT/HEPL <kaviya.m@hepl.com>
Subject: Fw: REPLACE THE PO NUMBER, VENDOR CODE, VENDOR NAME , GRN NUMBER

Dear Arun,
Greetings of the day!
As per the user request, kindly Update the PO number, Vendor code, Vendor name and GRN number for the below-mentioned ticket in the I-View CKPL portal.
Ticket Number: 0725/02742
PO NUMBER: 4500188097
VENDOR CODE: 3712404
VENDOR NAME: B B S R AND ASSOCIATES LLP
GRN: 5000761020

Once the update has been completed, Kindly Provide an update accordingly.
Thanks and Regards,
Pavithra B
Software Support
04142 350036`;

export const EmailInput: React.FC<EmailInputProps> = ({
  onProcessEmail,
  isProcessing,
  error,
  onClearError,
}) => {
  const [emailText, setEmailText] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEmailText(text);
    setCharCount(text.length);
    
    // Clear error when user starts typing
    if (error) {
      onClearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailText.trim()) {
      toast.error('Please enter email content to process');
      return;
    }

    await onProcessEmail(emailText);
  };

  const handleClearText = () => {
    setEmailText('');
    setCharCount(0);
    onClearError();
  };

  const handleUseSample = () => {
    setEmailText(SAMPLE_EMAIL);
    setCharCount(SAMPLE_EMAIL.length);
    onClearError();
    toast.success('Sample email loaded');
  };

  const handleCopyText = async () => {
    if (!emailText.trim()) {
      toast.error('No text to copy');
      return;
    }

    const success = await copyToClipboard(emailText);
    if (success) {
      toast.success('Text copied to clipboard');
    } else {
      toast.error('Failed to copy text');
    }
  };

  const getCharCountColor = () => {
    if (charCount > 10000) return 'text-red-600';
    if (charCount > 5000) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
            <Mail className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>
            <p className="text-sm text-gray-600">
              Paste your email content below to extract ticket information
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="space-y-2">
            <label htmlFor="email-text" className="block text-sm font-medium text-gray-700">
              Email Content *
            </label>
            <div className="relative">
              <textarea
                id="email-text"
                value={emailText}
                onChange={handleTextChange}
                placeholder="Paste your email content here..."
                className="input-field min-h-[300px] resize-y scrollbar-thin"
                disabled={isProcessing}
                rows={12}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className={`text-xs font-medium ${getCharCountColor()}`}>
                  {charCount.toLocaleString()} characters
                </span>
                {emailText && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy text"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isProcessing || !emailText.trim()}
              className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Process Email
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseSample}
                disabled={isProcessing}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                Use Sample
              </button>

              <button
                type="button"
                onClick={handleClearText}
                disabled={isProcessing || !emailText}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>


        </form>
      </div>
    </div>
  );
};