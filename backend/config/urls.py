from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core import views as core_views
from core.views import RegisterView, EmployeeBulkUploadAPIView  # ✅ add this
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register("assets", core_views.AssetViewSet, basename="assets")
router.register("assigned-services", core_views.AssignedServiceViewSet, basename="assigned-services")
router.register("clients", core_views.ClientViewSet)
router.register("employees", core_views.EmployeeViewSet, basename="employees")
router.register("rigs", core_views.RigViewSet)
router.register("field", core_views.FieldViewSet)
router.register("equipment-type", core_views.EquipmentTypeViewSet)
router.register("resources", core_views.ResourceViewSet)
router.register("callouts", core_views.CalloutViewSet)
router.register("sros", core_views.SroViewSet)
router.register("jobs", core_views.JobViewSet)
router.register("execution-logs", core_views.ExecutionLogEntryViewSet)
router.register("service-types", core_views.ServiceTypeViewSet)
router.register("customers", core_views.CustomerViewSet)
router.register("wells", core_views.WellViewSet)
router.register("hole-sections", core_views.HoleSectionViewSet)
router.register("schedules", core_views.ScheduleViewSet, basename="schedule")

urlpatterns = [
    path("admin/", admin.site.urls),
     path("api/employees/bulk-upload/", EmployeeBulkUploadAPIView.as_view(), name="employee-bulk-upload"),
    path("api/", include(router.urls)),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api-auth/", include("rest_framework.urls")),
]
