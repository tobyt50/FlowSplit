'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, Inbox } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AppNotification, getUserNotifications, markNotificationRead } from '../../../lib/notificationService';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { cn } from '../../../lib/utils';

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    const data = await getUserNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    event?.preventDefault();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await markNotificationRead(id);
  };

  const handleLinkClick = (notification: AppNotification) => {
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      markNotificationRead(notification.id);
    }
    setIsOpen(false);
  };

  const NotificationItemContent = ({ notification }: { notification: AppNotification }) => (
    <div
      className={cn(
        'group flex items-start gap-3 border-b border-border p-4 text-sm last:border-0 transition-colors',
        notification.read 
          ? 'opacity-60 hover:opacity-100 hover:bg-muted/30' 
          : 'bg-primary/5 hover:bg-primary/10',
        notification.actionUrl && 'cursor-pointer'
      )}
    >
      <div className="flex-1 space-y-1">
        <p className={cn("font-medium leading-none", !notification.read && "text-primary")}>
          {notification.title}
        </p>
        <p className="text-muted-foreground leading-snug">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide pt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => handleMarkAsRead(notification.id, e)}
          title="Mark as read"
        >
          <Check className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-xl border-border bg-background/50 hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ring-2 ring-background" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border-border" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
          <h4 className="font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs h-5 px-1.5">{unreadCount} new</Badge>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-20" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="grid">
              {notifications.map((notification) =>
                notification.actionUrl ? (
                  <Link
                    key={notification.id}
                    href={notification.actionUrl}
                    onClick={() => handleLinkClick(notification)}
                    className="block outline-none"
                  >
                    <NotificationItemContent notification={notification} />
                  </Link>
                ) : (
                  <NotificationItemContent key={notification.id} notification={notification} />
                )
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}