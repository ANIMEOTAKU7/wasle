import { supabase } from './supabase';

export type NotificationType = 'follow' | 'message' | 'like' | 'match' | 'system' | 'comment';

export interface Notification {
  id: string;
  user_id: string;
  sender_id: string | null;
  type: NotificationType;
  content: string;
  metadata: any;
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string;
    display_name: string;
  };
}

export async function sendNotification(
  userId: string,
  type: NotificationType,
  content: string,
  senderId: string | null = null,
  metadata: any = {}
) {
  try {
    // Don't send notification to self
    if (senderId === userId) return { success: true };

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        sender_id: senderId,
        type,
        content,
        metadata,
        read: false
      });

    if (error) {
      console.error('Error sending notification:', error);
      return { error };
    }
    return { success: true };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return { error };
  }
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:sender_id (
        username,
        avatar_url,
        display_name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data as Notification[];
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) console.error('Error marking notification as read:', error);
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) console.error('Error marking all notifications as read:', error);
}
