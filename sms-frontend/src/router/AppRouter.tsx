import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { CalloutListPage } from "../pages/Callouts/CalloutListPage";
import { LoginPage } from "../pages/Auth/LoginPage";
import { CreateCalloutPage } from "../pages/Callouts/CreateCalloutPage";
import { CalloutDetailPage } from "../pages/Callouts/CalloutDetailPage";
import { SroListPage } from "../pages/Sros/SroListPage";
import { SroDetailPage } from "../pages/Sros/SroDetailPage";
import { CalloutEditPage } from "../pages/Callouts/CalloutEditPage"
import { ScheduleListPage } from "../pages/schedules/ScheduleListPage";
import { ScheduleDetailPage} from "../pages/schedules/ScheduleDetailPage";
import { ScheduleServicePage } from "../pages/schedules/ScheduleServicePage"



function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/callouts"
          element={
            <PrivateRoute>
              <AppLayout>
                <CalloutListPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
        path="/callouts/new"
        element={
          <PrivateRoute>
            <AppLayout>
              <CreateCalloutPage />
            </AppLayout>
          </PrivateRoute>
        }>
        </Route>
        <Route
          path="/callouts/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <CalloutDetailPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sros"
          element={
            <PrivateRoute>
              <AppLayout>
                <SroListPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/sros/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <SroDetailPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route path="/callouts/:id/edit" 
        element={
           <PrivateRoute>
            <AppLayout>
            <CalloutEditPage />
              </AppLayout>
           </PrivateRoute>} />

           <Route path="/schedules" 
        element={
           <PrivateRoute>
            <AppLayout>
            <ScheduleListPage/>
              </AppLayout>
           </PrivateRoute>} />

           <Route path="/schedules/new" 
        element={
           <PrivateRoute>
            <AppLayout>
            <ScheduleServicePage />
              </AppLayout>
           </PrivateRoute>} />
           <Route path="/schedules/:id" 
        element={
           <PrivateRoute>
            <AppLayout>
            <ScheduleDetailPage />
              </AppLayout>
           </PrivateRoute>} />
      </Routes>
      
    </BrowserRouter>
  );
}
