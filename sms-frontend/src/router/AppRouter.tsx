import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { LoginPage } from "../pages/Auth/LoginPage";

import { CalloutListPage } from "../pages/Callouts/CalloutListPage";
import { CreateCalloutPage } from "../pages/Callouts/CreateCalloutPage";
import { CalloutDetailPage } from "../pages/Callouts/CalloutDetailPage";
import { CalloutEditPage } from "../pages/Callouts/CalloutEditPage";

import { SroListPage } from "../pages/Sros/SroListPage";
import { SroDetailPage } from "../pages/Sros/SroDetailPage";

import { ScheduleListPage } from "../pages/schedules/ScheduleListPage";
import { ScheduleDetailPage } from "../pages/schedules/ScheduleDetailPage";
import { ScheduleServicePage } from "../pages/schedules/ScheduleServicePage";
import { ScheduleEditPage } from "../pages/schedules/ScheduleEditPage";

import { AssignedServiceCreatePage } from "../pages/assinged/assignedcreate";
import { AssignedServiceListPage } from "../pages/assinged/assignedlist";
import { AssignedServiceViewPage } from "../pages/assinged/assignedview";
import { AssignedServiceEditPage } from "../pages/assinged/assignededit";

import { AssetImportPage } from "../pages/config/AssetImportPage";
import { EmployeeImportPage } from "../pages/config/EmployeeImportPage";
import WellsPage from "../pages/config/WellsPage";
import RigsPage from "../pages/config/RigsPage";

// IMPORTANT: must match what you store in loginUser()
function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function ProtectedLayout({ children }: { children: JSX.Element }) {
  return (
    <PrivateRoute>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        {/* ✅ Service section */}
        <Route path="/service">
          <Route index element={<Navigate to="callouts" replace />} />

          {/* Callouts */}
          <Route
            path="callouts"
            element={
              <ProtectedLayout>
                <CalloutListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="callouts/new"
            element={
              <ProtectedLayout>
                <CreateCalloutPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="callouts/:id"
            element={
              <ProtectedLayout>
                <CalloutDetailPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="callouts/:id/edit"
            element={
              <ProtectedLayout>
                <CalloutEditPage />
              </ProtectedLayout>
            }
          />

          {/* SRO */}
          <Route
            path="sros"
            element={
              <ProtectedLayout>
                <SroListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="sros/:id"
            element={
              <ProtectedLayout>
                <SroDetailPage />
              </ProtectedLayout>
            }
          />

          {/* Schedules */}
          <Route
            path="schedules"
            element={
              <ProtectedLayout>
                <ScheduleListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="schedules/new"
            element={
              <ProtectedLayout>
                <ScheduleServicePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="schedules/:id"
            element={
              <ProtectedLayout>
                <ScheduleDetailPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="schedules/:id/edit"
            element={
              <ProtectedLayout>
                <ScheduleEditPage />
              </ProtectedLayout>
            }
          />

          {/* Assigned Services */}
          <Route
            path="assigned-services"
            element={
              <ProtectedLayout>
                <AssignedServiceListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="assigned-services/new"
            element={
              <ProtectedLayout>
                <AssignedServiceCreatePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="assigned-services/:id"
            element={
              <ProtectedLayout>
                <AssignedServiceViewPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="assigned-services/:id/edit"
            element={
              <ProtectedLayout>
                <AssignedServiceEditPage />
              </ProtectedLayout>
            }
          />
        </Route>

        {/* ✅ Keep old URLs working (optional but recommended) */}
        <Route path="/callouts" element={<Navigate to="/service/callouts" replace />} />
        <Route path="/callouts/new" element={<Navigate to="/service/callouts/new" replace />} />
        <Route path="/callouts/:id" element={<Navigate to="/service/callouts/:id" replace />} />
        <Route path="/callouts/:id/edit" element={<Navigate to="/service/callouts/:id/edit" replace />} />

        <Route path="/sros" element={<Navigate to="/service/sros" replace />} />
        <Route path="/sros/:id" element={<Navigate to="/service/sros/:id" replace />} />

        <Route path="/schedules" element={<Navigate to="/service/schedules" replace />} />
        <Route path="/schedules/new" element={<Navigate to="/service/schedules/new" replace />} />
        <Route path="/schedules/:id" element={<Navigate to="/service/schedules/:id" replace />} />
        <Route path="/schedules/:id/edit" element={<Navigate to="/service/schedules/:id/edit" replace />} />

        <Route path="/assigned-services" element={<Navigate to="/service/assigned-services" replace />} />
        <Route path="/assigned-services/new" element={<Navigate to="/service/assigned-services/new" replace />} />
        <Route path="/assigned-services/:id" element={<Navigate to="/service/assigned-services/:id" replace />} />
        <Route path="/assigned-services/:id/edit" element={<Navigate to="/service/assigned-services/:id/edit" replace />} />

        {/* Configuration */}
        <Route
          path="/config/assets-import"
          element={
            <ProtectedLayout>
              <AssetImportPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/config/employees-import"
          element={
            <ProtectedLayout>
              <EmployeeImportPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/config/wells"
          element={
            <ProtectedLayout>
              <WellsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/config/rigs"
          element={
            <ProtectedLayout>
              <RigsPage />
            </ProtectedLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
