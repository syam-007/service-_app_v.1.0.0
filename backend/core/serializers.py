from rest_framework import serializers
from decimal import Decimal
from django.contrib.auth.models import User
from .models import (Client,Customer, Rig, ServiceType, Callout, SRO,Schedule, Job,
                      HoleSection,Well,EquipmentType,Resource, ExecutionLogEntry,Asset,
                      EmployeeMaster, AssignedService,Field)

from rest_framework.validators import UniqueValidator
from django.db import transaction

class RegisterSerializer(serializers.ModelSerializer):
    # we explicitly handle password confirmation
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "first_name", "last_name"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # remove password2 – not part of User model
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"

class EquipmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentType
        fields = "__all__"

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"


class RigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rig
        fields = ["id", "rig_number"]
class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = "__all__"

class HoleSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoleSection
        fields = ['id', 'name', 'description']


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ['id', 'name', 'description']

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = "__all__"

class WellSerializer(serializers.ModelSerializer):
    class Meta:
        model = Well
        fields = [
            'id', 'name', 'well_id', 
            'well_center_lat_deg', 'well_center_lat_min', 'well_center_lat_sec',
            'well_center_lng_deg', 'well_center_lng_min', 'well_center_lng_sec',
            'utm_northing', 'utm_easting'
        ]

class CalloutSerializer(serializers.ModelSerializer):
    
    has_sro = serializers.SerializerMethodField()
    sro_number = serializers.SerializerMethodField()
    sro_id = serializers.SerializerMethodField()
    schedule_id = serializers.SerializerMethodField()
    schedule_number = serializers.SerializerMethodField()

    rig_number_display = serializers.CharField(source="rig_number.rig_number", read_only=True)
    field_name_display = serializers.CharField(source="field_name.field_name", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    field_name_display = serializers.CharField(source="field_name.field_name", read_only=True)

    

    class Meta:
        model = Callout
        fields = "__all__"
        read_only_fields = ("created_at", "created_by", "callout_sequence", "callout_number")

    def validate(self, attrs):
        pipe_type = attrs.get("pipe_selection_type") or getattr(self.instance, "pipe_selection_type", None)
        well_profile = attrs.get("well_profile") or getattr(self.instance, "well_profile", "")
        allowed = {"vertical", "S-shape", "J-shape", "horizontal", ""}

        casing = attrs.get("casing_size_inch")
        drillpipe = attrs.get("drillpipe_size_inch")
        if well_profile not in allowed:
          raise serializers.ValidationError({"well_profile": "Invalid well profile."})

        # enforce mutual exclusivity + required selection
        if pipe_type == "casing":
            if casing is None:
                raise serializers.ValidationError({"casing_size_inch": "Required when pipe type is casing."})
            attrs["drillpipe_size_inch"] = None

        if pipe_type == "drillpipe":
            if drillpipe is None:
                raise serializers.ValidationError({"drillpipe_size_inch": "Required when pipe type is drillpipe."})
            attrs["casing_size_inch"] = None

        # auto minimum id = 2.0 when any size chosen
        if (casing is not None) or (drillpipe is not None):
            attrs["minimum_id_inch"] = Decimal("2.0")

        return attrs

    # your existing get_* methods unchanged...
    def get_has_sro(self, obj):
        return hasattr(obj, "sro") and obj.sro is not None

    def get_sro_id(self, obj):
        sro = getattr(obj, "sro", None)
        return sro.id if sro else None

    def get_sro_number(self, obj):
        return getattr(getattr(obj, "sro", None), "sro_number", None)

    def get_schedule_id(self, obj):
        sro = getattr(obj, "sro", None)
        schedule = getattr(sro, "schedule", None) if sro else None
        return schedule.id if schedule else None

    def get_schedule_number(self, obj):
        sro = getattr(obj, "sro", None)
        schedule = getattr(sro, "schedule", None) if sro else None
        return getattr(schedule, "schedule_number", None) if schedule else None


class SroSerializer(serializers.ModelSerializer):
    callout_id = serializers.IntegerField(source="callout.id", read_only=True)
    callout_number = serializers.CharField(source="callout.callout_number", read_only=True)
    customer_name = serializers.CharField(source="callout.customer.name", read_only=True)

    schedule_id = serializers.SerializerMethodField()
    schedule_number = serializers.SerializerMethodField()
    class Meta:
        model = SRO
        fields = "__all__"

    def get_schedule_id(self, obj):
        sch = getattr(obj, "schedule", None)
        return sch.id if sch else None

    def get_schedule_number(self, obj):
        sch = getattr(obj, "schedule", None)
        return getattr(sch, "schedule_number", None) if sch else None
        
class ScheduleSerializer(serializers.ModelSerializer):
    sro_number = serializers.CharField(
        source="sro.sro_number", read_only=True
    )
    type_of_equipment_name = serializers.CharField(source="type_of_equipment.equipment_name", read_only=True)
    resource_name = serializers.CharField(source="resource.resource_name", read_only=True)
    
    class Meta:
        model = Schedule
        fields = "__all__"
        read_only_fields = (
            "schedule_sequence",
            "schedule_number",
            "average_priority",
            "created_at",
            "created_by",
        )


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"


class ExecutionLogEntrySerializer(serializers.ModelSerializer):
    duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = ExecutionLogEntry
        fields = "__all__"
        read_only_fields = ["created_at", "created_by", "duration_minutes"]
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeMaster
        fields = "__all__"

    def validate_emp_number(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Emp # is required.")
        return value

    def validate_place_of_birth(self, value):
        if value is None:
            return value
        # remove hashes
        return value.replace("#", "").strip()


from rest_framework import serializers
from django.db import transaction

class AssignedServiceCreateSerializer(serializers.ModelSerializer):
    schedule = serializers.PrimaryKeyRelatedField(queryset=Schedule.objects.all())

    # ✅ NEW: multiple employees
    employees = serializers.PrimaryKeyRelatedField(
        queryset=EmployeeMaster.objects.all(),
        many=True,
        allow_empty=False,
        required=True,
    )

    cost_centers = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    status = serializers.ChoiceField(choices=AssignedService.STATUS_CHOICES, required=True)

    equipment_required_at = serializers.DateTimeField(required=False, allow_null=True)
    crew_required_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = AssignedService
        fields = [
            "id",
            "schedule",
            "employees",
            "cost_centers",
            "status",
            "note",
            "equipment_required_at",
            "crew_required_at",
            "assigned_at",
        ]
        read_only_fields = ["id", "assigned_at"]

    def validate_cost_centers(self, value):
        cleaned = [v.strip() for v in value if v and v.strip()]
        if not cleaned:
            raise serializers.ValidationError("Select at least one cost center.")
        return cleaned

    def validate_schedule(self, schedule: Schedule):
        allowed = {"planned", "approved"}
        if schedule.status not in allowed:
            raise serializers.ValidationError(
                f"Schedule must be in {sorted(list(allowed))} before assigning. Current: {schedule.status}"
            )

        if hasattr(schedule, "assigned_service") and schedule.assigned_service is not None:
            raise serializers.ValidationError("This schedule is already assigned.")

        return schedule

    @transaction.atomic
    def create(self, validated_data):
        schedule = validated_data["schedule"]
        employees = validated_data["employees"]  # ✅ list of Employee objects
        cost_centers = validated_data["cost_centers"]
        assigned_status = validated_data["status"]

        assets_qs = Asset.objects.select_for_update().filter(cost_center__in=cost_centers)
        if not assets_qs.exists():
            raise serializers.ValidationError({"detail": "No assets found for selected cost centers."})

        assigned_service = AssignedService.objects.create(
            schedule=schedule,
            cost_centers=cost_centers,
            status=assigned_status,
            note=validated_data.get("note"),
            equipment_required_at=validated_data.get("equipment_required_at"),
            crew_required_at=validated_data.get("crew_required_at"),
        )

        # ✅ set employees
        assigned_service.employees.set(employees)

        # existing behavior
        assigned_service.assets.set(list(assets_qs))
        assets_qs.update(status="on_duty")

        schedule.status = "assigned"
        schedule.save(update_fields=["status"])

        return assigned_service

class AssignedServiceListSerializer(serializers.ModelSerializer):
    employee_ids = serializers.SerializerMethodField()
    employee_names = serializers.SerializerMethodField()

    asset_codes = serializers.SerializerMethodField()
    schedule_number = serializers.CharField(source="schedule.schedule_number", read_only=True)

    class Meta:
        model = AssignedService
        fields = [
            "id",
            "schedule",
            "schedule_number",
            "employee_ids",
            "employee_names",
            "status",
            "cost_centers",
            "asset_codes",
            "note",
            "equipment_required_at",
            "crew_required_at",
            "assigned_at",
            "created_at",
        ]

    def get_employee_ids(self, obj):
        return list(obj.employees.values_list("id", flat=True))

    def get_employee_names(self, obj):
        return list(obj.employees.values_list("name", flat=True))

    def get_asset_codes(self, obj):
        return list(obj.assets.values_list("asset_code", flat=True))

class AssignedServiceUpdateSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(
        queryset=EmployeeMaster.objects.all(),
        many=True,
        required=False,
        allow_empty=False,
    )

    cost_centers = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=False
    )

    equipment_required_at = serializers.DateTimeField(required=False, allow_null=True)
    crew_required_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = AssignedService
        fields = [
            "employees",
            "cost_centers",
            "status",
            "note",
            "equipment_required_at",
            "crew_required_at",
        ]

    def validate_cost_centers(self, value):
        cleaned = [v.strip() for v in value if v and v.strip()]
        if not cleaned:
            raise serializers.ValidationError("Select at least one cost center.")
        return cleaned

    @transaction.atomic
    def update(self, instance, validated_data):
        employees = validated_data.pop("employees", None)
        cost_centers = validated_data.pop("cost_centers", None)

        # basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # employees m2m
        if employees is not None:
            instance.employees.set(employees)

        # ✅ cost centers affect assets assignment:
        if cost_centers is not None:
            # 1) set cost centers on assigned service
            instance.cost_centers = cost_centers
            instance.save()

            # 2) restore previous assets -> (optional) set them back to green if needed
            old_assets = instance.assets.all()
            old_assets.update(status="green")   # adjust if your "available" status is different

            # 3) assign new assets from the new cost centers
            new_assets_qs = Asset.objects.select_for_update().filter(cost_center__in=cost_centers)
            if not new_assets_qs.exists():
                raise serializers.ValidationError({"detail": "No assets found for selected cost centers."})

            instance.assets.set(list(new_assets_qs))
            new_assets_qs.update(status="on_duty")
        else:
            instance.save()

        return instance
