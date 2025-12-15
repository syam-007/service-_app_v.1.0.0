# core/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Client, Customer, Rig, ServiceType, Well, HoleSection, Callout, SRO, Job, ExecutionLogEntry,Schedule
from .serializers import (
    ClientSerializer,
    CustomerSerializer,
    RigSerializer,
    CalloutSerializer,
    SroSerializer,
    JobSerializer,
    ExecutionLogEntrySerializer,
    RegisterSerializer,
    HoleSectionSerializer,
    ServiceTypeSerializer,
    WellSerializer,
    ScheduleSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # OPTIONAL: automatically issue JWT tokens on registration
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Base viewset with authentication
class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

# All your viewset classes
class ClientViewSet(BaseViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class CustomerViewSet(BaseViewSet):  # Added BaseViewSet inheritance
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class RigViewSet(BaseViewSet):
    queryset = Rig.objects.all()
    serializer_class = RigSerializer

    
class WellViewSet(BaseViewSet):  # Added BaseViewSet inheritance
    queryset = Well.objects.all()
    serializer_class = WellSerializer

class ServiceTypeViewSet(BaseViewSet):  # Added BaseViewSet inheritance
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer

class HoleSectionViewSet(BaseViewSet):  # Added BaseViewSet inheritance
    queryset = HoleSection.objects.all()
    serializer_class = HoleSectionSerializer

class CalloutViewSet(BaseViewSet):
    queryset = Callout.objects.all()
    serializer_class = CalloutSerializer
    permission_classes = [IsAuthenticated] 
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="generate-sro")
    def generate_sro(self, request, pk=None):
        """
        POST /callouts/{id}/generate-sro/
        """
        callout = self.get_object()

        # Already has SRO?
        if hasattr(callout, "sro"):
            return Response(
                {"detail": "SRO already exists for this callout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optional: add some validations here (e.g. callout must be locked)

        sro = SRO.objects.create(
            callout=callout,
            created_by=request.user if request.user.is_authenticated else None,
        )

        # update callout status → SRO Activated
        callout.status = "sro_activated"
        callout.save(update_fields=["status"])

        serializer = SroSerializer(sro)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SroViewSet(BaseViewSet):
    queryset = SRO.objects.all().select_related("callout")
    serializer_class = SroSerializer

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        POST /sros/{id}/approve/

        ✅ Only APPROVES the SRO (no schedule creation here).
        Frontend will then show "Schedule Service".
        Schedule creation will later switch SRO -> scheduled.
        """
        sro = self.get_object()

        # If already scheduled, keep it as is
        if sro.status == "scheduled":
            return Response(self.get_serializer(sro).data, status=status.HTTP_200_OK)

        # If already approved, keep it as is
        if sro.status == "approved":
            return Response(self.get_serializer(sro).data, status=status.HTTP_200_OK)

        # ✅ Approve here (NOT scheduled)
        sro.status = "approved"
        sro.save(update_fields=["status"])

        # ✅ Optional: update callout status when SRO approved
        # (only if you want this behavior)
        if sro.callout and sro.callout.status != "sro_activated":
            sro.callout.status = "sro_activated"
            sro.callout.save(update_fields=["status"])

        return Response(self.get_serializer(sro).data, status=status.HTTP_200_OK)
class ScheduleViewSet(BaseViewSet):
    queryset = Schedule.objects.select_related("sro", "sro__callout").all()
    serializer_class = ScheduleSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_create(self, serializer):
        schedule = serializer.save(created_by=self.request.user)

        # ✅ When schedule is created -> mark Callout as scheduled
        callout = schedule.sro.callout
        callout.status = "scheduled"
        callout.save(update_fields=["status"])

class JobViewSet(BaseViewSet):
    queryset = Job.objects.select_related("sro").all()
    serializer_class = JobSerializer

class ExecutionLogEntryViewSet(BaseViewSet):
    queryset = ExecutionLogEntry.objects.select_related("job").all()
    serializer_class = ExecutionLogEntrySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)