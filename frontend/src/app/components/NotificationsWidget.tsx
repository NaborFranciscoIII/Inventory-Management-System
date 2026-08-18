import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationsWidget() {
  const { notifications, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the popover when clicking anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* The Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-muted' : 'hover:bg-muted'}`}
      >
        <Bell size={18} className="text-muted-foreground" />
        
        {/* Red Unread Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-background" />
        )}
      </button>

      {/* The Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-[350px] overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                You are all caught up.
              </div>
            ) : (
              notifications.map((notify) => (
                <div key={notify.id} className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors items-start">
                  
                  {/* Dynamic Icon based on Alert Type */}
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    notify.type === 'critical' ? 'bg-red-100 text-red-600' :
                    notify.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notify.type === 'critical' && <AlertOctagon size={14} />}
                    {notify.type === 'warning' && <AlertTriangle size={14} />}
                    {notify.type === 'info' && <Info size={14} />}
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{notify.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notify.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">
                      {new Date(notify.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}