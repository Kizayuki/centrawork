import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  IonBadge,
  IonSpinner,
  useIonViewWillEnter,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonSearchbar,
} from "@ionic/react";
import { notificationsCircle, closeOutline } from "ionicons/icons";
import { io } from "socket.io-client";
import api from "../api";

interface NotificationItem {
  id: string;
  is_read: boolean;
  notification: {
    judul_notifikasi: string;
    isi_pesan: string;
    created_at: string;
  } | null;
}

const NotificationsTab: React.FC = () => {
  const [notificationsList, setNotificationsList] = useState<
    NotificationItem[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(
    null,
  );

  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("refresh_data", () => {
      fetchNotifications(false);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get<NotificationItem[]>("/notifications");
      setNotificationsList(response.data);
    } catch {
      console.error("Gagal menarik notifikasi");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchNotifications();
  });

  const markAsRead = async (notifId: string) => {
    setNotificationsList((prev) =>
      prev.map((notif) =>
        notif.id === notifId ? { ...notif, is_read: true } : notif,
      ),
    );
    try {
      await api.patch(`/notifications/${notifId}/read`);
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotificationsList((prev) =>
      prev.map((notif) => ({ ...notif, is_read: true })),
    );
    try {
      await api.patch("/notifications/read-all");
    } catch {
      fetchNotifications();
    }
  };

  const openDetail = (item: NotificationItem) => {
    setSelectedNotif(item);
    if (!item.is_read) markAsRead(item.id);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  const filteredNotifications = notificationsList.filter((item) => {
    const textTarget =
      `${item.notification?.judul_notifikasi} ${item.notification?.isi_pesan}`.toLowerCase();
    return textTarget.includes(searchQuery.toLowerCase());
  });

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Notifikasi</b>
          </IonTitle>
          {unreadCount > 0 && (
            <IonBadge color="danger" slot="end" style={{ marginRight: "15px" }}>
              {unreadCount} Baru
            </IonBadge>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ backgroundColor: "#f4f5f8" }}>
        <div style={{ backgroundColor: "white", padding: "10px 0" }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Cari pesan pengumuman..."
            animated={true}
          />
        </div>

        <div
          className="ion-padding-horizontal"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            marginTop: "10px",
          }}
        >
          <IonText color="dark">
            <h4 style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}>
              Aktivitas Terbaru
            </h4>
          </IonText>
          <IonButton
            fill="clear"
            size="small"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || isLoading}
          >
            Tandai Semua Dibaca
          </IonButton>
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div className="ion-padding-horizontal">
            <IonList style={{ background: "transparent" }} lines="none">
              {filteredNotifications.length === 0 ? (
                <p
                  style={{
                    color: "gray",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  Tidak ada notifikasi ditemukan.
                </p>
              ) : (
                filteredNotifications.map((item) => (
                  <IonItem
                    button
                    onClick={() => openDetail(item)}
                    key={item.id}
                    style={{
                      marginBottom: "10px",
                      borderRadius: "12px",
                      "--background": item.is_read ? "#ffffff" : "#e8f0fe",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <IonIcon
                      icon={notificationsCircle}
                      slot="start"
                      color={item.is_read ? "medium" : "primary"}
                      style={{
                        fontSize: "2.5rem",
                        marginTop: "10px",
                        alignSelf: "flex-start",
                      }}
                    />
                    <IonLabel
                      className="ion-text-wrap"
                      style={{ marginTop: "10px", marginBottom: "10px" }}
                    >
                      <h2
                        style={{
                          fontWeight: item.is_read ? "normal" : "bold",
                          color: "#1f1f1f",
                        }}
                      >
                        {item.notification?.judul_notifikasi}
                      </h2>
                      <p
                        style={{
                          color: "#444444",
                          fontSize: "0.9rem",
                          marginTop: "4px",
                        }}
                      >
                        {item.notification?.isi_pesan.substring(0, 40)}...
                      </p>
                      <p
                        style={{
                          color: "gray",
                          fontSize: "0.75rem",
                          marginTop: "6px",
                        }}
                      >
                        {item.notification?.created_at
                          ? formatDate(item.notification.created_at)
                          : ""}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))
              )}
            </IonList>
          </div>
        )}

        <IonModal
          isOpen={!!selectedNotif}
          onDidDismiss={() => setSelectedNotif(null)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Detail Notifikasi</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedNotif(null)}>
                  <IonIcon icon={closeOutline} size="large" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="ion-padding"
            style={{ backgroundColor: "#f4f5f8" }}
          >
            <div
              className="ion-text-center"
              style={{ marginBottom: "20px", marginTop: "20px" }}
            >
              <IonIcon
                icon={notificationsCircle}
                color="primary"
                style={{ fontSize: "5rem" }}
              />
              <h2 style={{ fontWeight: "bold", margin: "15px 0" }}>
                {selectedNotif?.notification?.judul_notifikasi}
              </h2>
              <p style={{ color: "gray", fontSize: "0.9rem", margin: 0 }}>
                {selectedNotif?.notification?.created_at
                  ? formatDate(selectedNotif.notification.created_at)
                  : ""}
              </p>
            </div>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                lineHeight: "1.6",
                fontSize: "1rem",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              {selectedNotif?.notification?.isi_pesan}
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};
export default NotificationsTab;
