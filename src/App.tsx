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
  briefcaseOutline,
  businessOutline,
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
import RoleManagement from "./pages/RoleManagement";
import CompanyManagement from "./pages/CompanyManagement";
import api from "./api";

setupIonicReact();

try {
  const checkUser = localStorage.getItem("centrawork_user");
  if (checkUser) JSON.parse(checkUser);
} catch {
  localStorage.removeItem("centrawork_user");
  localStorage.removeItem("centrawork_token");
  window.location.href = "/login";
}

const getActiveRole = () => {
  try {
    const userStr = localStorage.getItem("centrawork_user");
    return userStr ? JSON.parse(userStr).role : "";
  } catch {
    return "";
  }
};

const SidebarMenu: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState(getActiveRole());

  useEffect(() => {
    setRole(getActiveRole());
  }, [location.pathname]);

  if (location.pathname === "/login" || location.pathname === "/") return null;

  const isExecutive = role === "Super Admin" || role === "Super HR";
  const isManagement = role === "Manajemen";

  const isMenuSelected = (path: string) => location.pathname === path;

  const getActiveStyle = (path: string) =>
    isMenuSelected(path)
      ? {
          "--background": "rgba(56, 128, 255, 0.1)",
          borderRight: "4px solid #3880ff",
        }
      : {};
  const getLabelStyle = (path: string) => ({
    fontWeight: isMenuSelected(path) ? "bold" : "normal",
    color: isMenuSelected(path) ? "#3880ff" : "inherit",
  });

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
            {isManagement ? (
              <>
                <IonItem
                  key="menu-saas"
                  routerLink="/company-management"
                  routerDirection="root"
                  lines="none"
                  style={getActiveStyle("/company-management")}
                >
                  <IonIcon
                    slot="start"
                    icon={businessOutline}
                    color={
                      isMenuSelected("/company-management")
                        ? "primary"
                        : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/company-management")}>
                    Daftar Klien (SaaS)
                  </IonLabel>
                </IonItem>
                <IonItem
                  key="menu-profil-saas"
                  routerLink="/tab/profile"
                  routerDirection="forward"
                  lines="none"
                  style={getActiveStyle("/tab/profile")}
                >
                  <IonIcon
                    slot="start"
                    icon={personOutline}
                    color={
                      isMenuSelected("/tab/profile") ? "primary" : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/tab/profile")}>
                    Profil & Logout
                  </IonLabel>
                </IonItem>
              </>
            ) : (
              <>
                <IonItem
                  key="menu-dashboard"
                  routerLink="/tab/dashboard"
                  routerDirection="root"
                  lines="none"
                  style={getActiveStyle("/tab/dashboard")}
                >
                  <IonIcon
                    slot="start"
                    icon={homeOutline}
                    color={
                      isMenuSelected("/tab/dashboard") ? "primary" : "medium"
                    }
                  />
                  <IonLabel style={getLabelStyle("/tab/dashboard")}>
                    Dashboard
                  </IonLabel>
                </IonItem>

                {isExecutive && (
                  <>
                    <IonItem
                      key="menu-users"
                      routerLink="/user-management"
                      routerDirection="forward"
                      lines="none"
                      style={getActiveStyle("/user-management")}
                    >
                      <IonIcon
                        slot="start"
                        icon={peopleOutline}
                        color={
                          isMenuSelected("/user-management")
                            ? "primary"
                            : "medium"
                        }
                      />
                      <IonLabel style={getLabelStyle("/user-management")}>
                        Manajemen Pengguna
                      </IonLabel>
                    </IonItem>

                    {role === "Super Admin" && (
                      <IonItem
                        key="menu-roles"
                        routerLink="/role-management"
                        routerDirection="forward"
                        lines="none"
                        style={getActiveStyle("/role-management")}
                      >
                        <IonIcon
                          slot="start"
                          icon={briefcaseOutline}
                          color={
                            isMenuSelected("/role-management")
                              ? "primary"
                              : "medium"
                          }
                        />
                        <IonLabel style={getLabelStyle("/role-management")}>
                          Manajemen Divisi
                        </IonLabel>
                      </IonItem>
                    )}

                    <IonItem
                      key="menu-defaults"
                      routerLink="/default-tasks"
                      routerDirection="forward"
                      lines="none"
                      style={getActiveStyle("/default-tasks")}
                    >
                      <IonIcon
                        slot="start"
                        icon={syncOutline}
                        color={
                          isMenuSelected("/default-tasks")
                            ? "primary"
                            : "medium"
                        }
                      />
                      <IonLabel style={getLabelStyle("/default-tasks")}>
                        Tugas Default
                      </IonLabel>
                    </IonItem>

                    <IonItem
                      key="menu-notif"
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

                {isExecutive ? (
                  <IonItem
                    key="menu-reports-exec"
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
                      Laporan, Ranking & Log Sistem
                    </IonLabel>
                  </IonItem>
                ) : (
                  <IonItem
                    key="menu-reports-staff"
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
                      Ranking
                    </IonLabel>
                  </IonItem>
                )}

                <IonItem
                  key="menu-settings"
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
              </>
            )}
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState(getActiveRole());

  useEffect(() => {
    setRole(getActiveRole());
  }, [location.pathname]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const token = localStorage.getItem("centrawork_token");
        if (!token) return;

        const res = await api.get("/company/settings");
        if (res.data.app_name) {
          localStorage.setItem("centrawork_app_name", res.data.app_name);
          document.title = res.data.app_name;
        }
        if (res.data.app_icon) {
          localStorage.setItem("centrawork_app_icon", res.data.app_icon);
          let link = document.querySelector(
            "link[rel~='icon']",
          ) as HTMLLinkElement;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = res.data.app_icon;
        }
      } catch (error) {
        console.warn(
          "Pengaturan kustom perusahaan belum memuat sempurna:",
          error,
        );
      }
    };
    fetchGlobalSettings();
  }, []);

  const isManagement = role === "Manajemen";

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
        <Route exact path="/role-management" component={RoleManagement} />
        <Route exact path="/company-management" component={CompanyManagement} />
        <Route exact path="/tab">
          <Redirect to="/tab/dashboard" />
        </Route>
      </IonRouterOutlet>

      {!isManagement && (
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
      )}
    </IonTabs>
  );
};

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
          <Route path="/role-management" component={MainLayout} />
          <Route path="/company-management" component={MainLayout} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
