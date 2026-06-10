import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function AccountSection({ user, setDirty }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  return (
    <>
      <div className="bg-white border border-surface-border rounded-[12px] shadow-sm mb-6">
        <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
          <User size={20} className="text-text-primary" />
          <h3 className="text-[16px] font-bold text-text-primary">Account Details</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-2">Display Name</label>
              <Input 
                defaultValue={user?.displayName || 'Hamza'} 
                onChange={() => setDirty(true)}
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-2">Email</label>
              <Input 
                defaultValue={user?.email || 'hamza@example.com'} 
                disabled 
                rightElement={<span className="text-[12px] font-medium text-brand-blue cursor-pointer hover:underline px-3 py-2">Change</span>}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-text-primary mb-2">Password</label>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-text-secondary">Last changed 3 months ago</span>
                  <Button variant="secondary" size="sm">Change Password</Button>
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-text-primary mb-2">Time Zone</label>
                <select 
                  className="w-full h-[40px] px-3 border border-surface-border rounded-[8px] bg-white text-[14px] text-text-primary outline-none focus:border-brand-blue"
                  onChange={() => setDirty(true)}
                  defaultValue="PKT"
                >
                  <option value="PKT">(UTC+5:00) Pakistan Standard Time</option>
                  <option value="UTC">(UTC+0:00) Coordinated Universal Time</option>
                  <option value="IST">(UTC+5:30) Indian Standard Time</option>
                  <option value="EST">(UTC-5:00) Eastern Standard Time</option>
                </select>
                <p className="text-[11px] text-text-secondary mt-1">PSX trading hours are shown in PKT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-signal-red/30 rounded-[12px] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary">Delete Account</h4>
          <p className="text-[13px] text-text-secondary">Permanently delete your account and all alert data.</p>
        </div>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Account?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This action cannot be undone. All your alerts, settings, and watchlist data will be permanently removed.
            </p>
            <label className="block text-[13px] font-semibold text-text-primary mb-2">
              Type "DELETE" to confirm
            </label>
            <Input 
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" disabled={deleteConfirmText !== 'DELETE'} onClick={() => setShowDeleteModal(false)}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
