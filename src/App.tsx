import React, { useState, useEffect } from "react";
import {
  IonApp,
  setupIonicReact,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonButtons,
  IonButton,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect, useLocation } from "react-router-dom";
import {
  homeOutline,
  documentTextOutline,
  notificationsOutline,
  personOutline,
  peopleOutline,
  settingsOutline,
  syncOutline,
  barChartOutline,
  paperPlaneOutline,
  arrowBackOutline,
} from "ionicons/icons";

/* Core CSS & Variables */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.class.css";
import "./theme/variables.css";

/* Impor Komponen & Halaman */
import NotificationPopup from "./components/NotificationPopup";
import DashboardTab from "./pages/DashboardTab";
import TasksTab from "./pages/TasksTab";
import NotificationsTab from "./pages/NotificationsTab";
import ProfileTab from "./pages/ProfileTab";
import Login from "./pages/Login";
import AddTask from "./pages/AddTask";
import UserManagement from "./pages/UserManagement";
import AddUser from "./pages/AddUser";
import DefaultTasks from "./pages/DefaultTasks";
import AddDefaultTask from "./pages/AddDefaultTask";
import Reports from "./pages/Reports";
import SendNotification from "./pages/SendNotification";
import AppSettings from "./pages/AppSettings";
import ChangePassword from "./pages/ChangePassword";

setupIonicReact();

// ==========================================
// SISTEM KEKEBALAN (AUTO-HEALER)
// Menghancurkan memori yang memicu White Screen
// ==========================================
try {
  const checkUser = localStorage.getItem("centrawork_user");
  if (checkUser) {
    JSON.parse(checkUser);
  }
} catch {
  console.warn("Memori JSON rusak terdeteksi! Memformat ulang memori...");
  localStorage.removeItem("centrawork_user");
  localStorage.removeItem("centrawork_token");
  window.location.href = "/login";
}

// ==========================================
// 1. KOMPONEN SIDEBAR DINAMIS
// ==========================================
const SidebarMenu: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("centrawork_user");
      if (userStr) setRole(JSON.parse(userStr).role);
      else setRole("");
    } catch {
      /* Diabaikan, sudah dihandle Auto-Healer */
    }
  }, [location.pathname]);

  if (location.pathname === "/login" || location.pathname === "/") return null;

  const isExecutive = role === "Super Admin" || role === "Super HR";
  const isMenuSelected = (path: string) => location.pathname === path;

  const getActiveStyle = (path: string) => {
    return isMenuSelected(path)
      ? {
          "--background": "rgba(56, 128, 255, 0.1)",
          borderRight: "4px solid #3880ff",
        }
      : {};
  };

  const getLabelStyle = (path: string) => {
    return {
      fontWeight: isMenuSelected(path) ? "bold" : "normal",
      color: isMenuSelected(path) ? "#3880ff" : "inherit",
    };
  };

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuToggle autoHide={false}>
              <IonButton>
                <IonIcon icon={arrowBackOutline} slot="icon-only" />
              </IonButton>
            </IonMenuToggle>
          </IonButtons>
          <IonTitle>Menu Utama</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList style={{ paddingTop: "10px" }}>
          <IonMenuToggle autoHide={true}>
            <IonItem
              routerLink="/tab/dashboard"
              routerDirection="root"
              lines="none"
              style={getActiveStyle("/tab/dashboard")}
            >
              <IonIcon
                slot="start"
                icon={homeOutline}
                color={isMenuSelected("/tab/dashboard") ? "primary" : "medium"}
              />
              <IonLabel style={getLabelStyle("/tab/dashboard")}>
                Dashboard
              </IonLabel>
            </IonItem>

            {isExecutive && (
              <>
                <IonItem
                  routerLink="/user-management"
                  routerDirection="forward"
                  lines="none"
                  style={getActiveStyle("/user-management")}
                >
                  <IonIcon
                    slot="start"
                    icon={peopleOutline}
                    color={
                      isMenuSelected("/user-management") ? "primary" : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/user-management")}>
                    Manajemen Pengguna
                  </IonLabel>
                </IonItem>

                <IonItem
                  routerLink="/default-tasks"
                  routerDirection="forward"
                  lines="none"
                  style={getActiveStyle("/default-tasks")}
                >
                  <IonIcon
                    slot="start"
                    icon={syncOutline}
                    color={
                      isMenuSelected("/default-tasks") ? "primary" : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/default-tasks")}>
                    Tugas Default
                  </IonLabel>
                </IonItem>

                <IonItem
                  routerLink="/send-notification"
                  routerDirection="forward"
                  lines="none"
                  style={getActiveStyle("/send-notification")}
                >
                  <IonIcon
                    slot="start"
                    icon={paperPlaneOutline}
                    color={
                      isMenuSelected("/send-notification")
                        ? "primary"
                        : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/send-notification")}>
                    Kirim Notifikasi
                  </IonLabel>
                </IonItem>
              </>
            )}

            <IonItem
              routerLink="/reports"
              routerDirection="forward"
              lines="none"
              style={getActiveStyle("/reports")}
            >
              <IonIcon
                slot="start"
                icon={barChartOutline}
                color={isMenuSelected("/reports") ? "primary" : "medium"}
              />
              <IonLabel style={getLabelStyle("/reports")}>
                Laporan & Ranking
              </IonLabel>
            </IonItem>

            <IonItem
              routerLink="/settings"
              routerDirection="forward"
              lines="none"
              style={getActiveStyle("/settings")}
            >
              <IonIcon
                slot="start"
                icon={settingsOutline}
                color={isMenuSelected("/settings") ? "primary" : "medium"}
              />
              <IonLabel style={getLabelStyle("/settings")}>
                Pengaturan Aplikasi
              </IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

// ==========================================
// 2. KERANGKA TABS BAWAH (MAIN LAYOUT)
// ==========================================
const MainLayout: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tab/dashboard" component={DashboardTab} />
        <Route exact path="/tab/tasks" component={TasksTab} />
        <Route exact path="/tab/notifications" component={NotificationsTab} />
        <Route exact path="/tab/profile" component={ProfileTab} />

        <Route exact path="/add-task" component={AddTask} />
        <Route exact path="/user-management" component={UserManagement} />
        <Route exact path="/add-user" component={AddUser} />
        <Route exact path="/default-tasks" component={DefaultTasks} />
        <Route exact path="/add-default-task" component={AddDefaultTask} />
        <Route exact path="/reports" component={Reports} />
        <Route exact path="/send-notification" component={SendNotification} />
        <Route exact path="/settings" component={AppSettings} />
        <Route exact path="/change-password" component={ChangePassword} />

        <Route exact path="/tab">
          <Redirect to="/tab/dashboard" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/tab/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel>Beranda</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tasks" href="/tab/tasks">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Tugas</IonLabel>
        </IonTabButton>
        <IonTabButton tab="notifications" href="/tab/notifications">
          <IonIcon icon={notificationsOutline} />
          <IonLabel>Notifikasi</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tab/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

// ==========================================
// 3. APLIKASI UTAMA (APP)
// ==========================================
const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <NotificationPopup />
        <SidebarMenu />

        <IonRouterOutlet id="main-content">
          <Route exact path="/login" component={Login} />
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>

          <Route path="/tab" component={MainLayout} />
          <Route path="/add-task" component={MainLayout} />
          <Route path="/user-management" component={MainLayout} />
          <Route path="/add-user" component={MainLayout} />
          <Route path="/default-tasks" component={MainLayout} />
          <Route path="/add-default-task" component={MainLayout} />
          <Route path="/reports" component={MainLayout} />
          <Route path="/send-notification" component={MainLayout} />
          <Route path="/settings" component={MainLayout} />
          <Route path="/change-password" component={MainLayout} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
