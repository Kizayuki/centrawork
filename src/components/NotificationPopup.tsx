import React, { useState, useEffect, useCallback } from "react";
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons,
} from "@ionic/react";
import { closeOutline, notificationsCircle } from "ionicons/icons";
import { useLocation, useHistory } from "react-router-dom";
import api from "../api";

interface UnreadNotif {
  id: string;
  is_read: boolean;
  notification: {
    judul_notifikasi: string;
    isi_pesan: string;
    created_at: string;
  } | null;
}

const NotificationPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadList, setUnreadList] = useState<UnreadNotif[]>([]);
  const location = useLocation();
  const history = useHistory();

  const checkUnreadNotifications = useCallback(async () => {
    if (location.pathname === "/login" || location.pathname === "/") return;
    try {
      const response = await api.get<UnreadNotif[]>("/notifications");
      const unread = response.data.filter((n) => !n.is_read);
      if (unread.length > 0) {
        setUnreadList(unread);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch {
      console.error("Gagal mengecek notifikasi");
    }
  }, [location.pathname]);

  useEffect(() => {
    checkUnreadNotifications();
  }, [checkUnreadNotifications]);

  const markAsRead = async (notifId: string) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setUnreadList((prev) => prev.filter((n) => n.id !== notifId));
      if (unreadList.length <= 1) setIsOpen(false);
    } catch {
      console.error("Gagal update status baca");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadList([]);
      setIsOpen(false);
    } catch {
      console.error("Gagal update massal");
    }
  };

  const handleLihatSemua = () => {
    setIsOpen(false);
    history.push("/tab/notifications");
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => setIsOpen(false)}>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle>Ada Notifikasi Baru!</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setIsOpen(false)}>
              <IonIcon icon={closeOutline} size="large" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <IonList style={{ background: "transparent" }} lines="none">
          {unreadList.map((notif) => (
            <IonItem
              key={notif.id}
              style={{
                marginBottom: "10px",
                borderRadius: "8px",
                "--background": "#ffffff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <IonIcon
                icon={notificationsCircle}
                slot="start"
                color="primary"
              />
              <IonLabel className="ion-text-wrap">
                <h4 style={{ fontWeight: "bold" }}>
                  {notif.notification?.judul_notifikasi}
                </h4>
                <p style={{ fontSize: "0.85rem" }}>
                  {notif.notification?.isi_pesan}
                </p>
              </IonLabel>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => markAsRead(notif.id)}
              >
                Dibaca
              </IonButton>
            </IonItem>
          ))}
        </IonList>
        <IonButton
          expand="block"
          color="primary"
          onClick={handleLihatSemua}
          style={{
            marginTop: "20px",
            "--border-radius": "10px",
            height: "50px",
          }}
        >
          Lihat Semua
        </IonButton>
        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          onClick={markAllAsRead}
        >
          Tandai Semua Dibaca
        </IonButton>
      </IonContent>
    </IonModal>
  );
};
export default NotificationPopup;
