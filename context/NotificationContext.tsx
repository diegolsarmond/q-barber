
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToNewAppointments, subscribeToCancellations, getProfessionals, simulateRealTimeAppointment, getWaitingList } from '../services/mockData';
import { Appointment, UserRole, WaitingListEntry } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  latestNotification: Appointment | null;
  clearNotifications: () => void;
  clearLatestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user) return;

    // Trigger simulation after 10 seconds for Demo purposes
    const simulationTimer = setTimeout(() => {
        if (user.role === UserRole.ADMIN || user.role === UserRole.PROFESSIONAL) {
            simulateRealTimeAppointment();
        }
    }, 10000);

    // Functions to handle subscription setup
    let unsubscribeNewAppt: (() => void) | undefined;
    let unsubscribeCancel: (() => void) | undefined;

    const setupSubscription = async () => {
        let myProfessionalId: string | null = null;

        // If user is a professional, we need their Professional ID (not User ID) to filter appointments
        if (user.role === UserRole.PROFESSIONAL) {
            const profs = await getProfessionals();
            const me = profs.find(p => p.userId === user.id);
            if (me) myProfessionalId = me.id;
        }

        // 1. Subscribe to New Appointments
        unsubscribeNewAppt = subscribeToNewAppointments((appt) => {
            let shouldNotify = false;

            if (user.role === UserRole.ADMIN) {
                shouldNotify = true;
            } else if (user.role === UserRole.PROFESSIONAL && myProfessionalId) {
                if (appt.professionalId === myProfessionalId) {
                    shouldNotify = true;
                }
            }

            if (shouldNotify) {
                setUnreadCount(prev => prev + 1);
                setLatestNotification(appt);
                playNotificationSound();
            }
        });

        // 2. Subscribe to Cancellations (For Waiting List Logic)
        unsubscribeCancel = subscribeToCancellations(async (appt) => {
            const waitingList = await getWaitingList();
            
            // Check if there are people waiting for THIS day
            const interestedEntries = waitingList.filter(w => 
                w.date === appt.date && 
                w.status === 'AGUARDANDO' &&
                (!w.professionalId || w.professionalId === appt.professionalId) // Either any prof or specific prof
            );

            if (interestedEntries.length > 0) {
                // If ADMIN, notify about the opportunity to fit someone in
                if (user.role === UserRole.ADMIN) {
                    // Create a fake "appointment" object just to trigger the toast format used in Layout
                    // In a real app, we'd have a separate notification type
                    const notificationObj: any = {
                        ...appt,
                        clientName: `⚠️ Oportunidade de Encaixe!`,
                        time: `${appt.time} (Cancelado)`,
                        date: appt.date,
                        status: 'CANCELLED'
                    };
                    // Hack: Hijack the notification system to show alert
                    setLatestNotification(notificationObj);
                    setUnreadCount(prev => prev + 1);
                    playNotificationSound();
                }
                
                // If CLIENT and this client IS on the waiting list
                if (user.role === UserRole.CLIENT) {
                    const isMeWaiting = interestedEntries.some(w => w.clientId === user.id);
                    if (isMeWaiting) {
                         const notificationObj: any = {
                            ...appt,
                            clientName: `🎉 Vaga Disponível!`,
                            time: `Surgiu um horário às ${appt.time}`,
                            date: appt.date,
                            status: 'PENDING'
                        };
                        setLatestNotification(notificationObj);
                        setUnreadCount(prev => prev + 1);
                        playNotificationSound();
                    }
                }
            }
        });
    };

    setupSubscription();

    return () => {
      clearTimeout(simulationTimer);
      if (unsubscribeNewAppt) unsubscribeNewAppt();
      if (unsubscribeCancel) unsubscribeCancel();
    };
  }, [user]); // Re-subscribe if user changes

  const playNotificationSound = () => {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play blocked'));
      } catch (e) {}
  };

  const clearNotifications = () => {
    setUnreadCount(0);
  };

  const clearLatestNotification = () => {
    setLatestNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, latestNotification, clearNotifications, clearLatestNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};