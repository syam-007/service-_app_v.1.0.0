from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client,Customer, Rig, ServiceType, Callout, SRO,Schedule, Job,HoleSection,Well, ExecutionLogEntry
from rest_framework.validators import UniqueValidator

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


class RigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rig
        fields = "__all__"


class HoleSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoleSection
        fields = ['id', 'name', 'description']


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ['id', 'name', 'description']

class WellSerializer(serializers.ModelSerializer):
    class Meta:
        model = Well
        fields = [
            'id', 'name', 'well_id', 
            'well_center_lat_deg', 'well_center_lat_min', 'well_center_lat_sec',
            'well_center_lng_deg', 'well_center_lng_min', 'well_center_lng_sec',
            'utm_northing', 'utm_easting', 'ground_elevation_m'
        ]

class CalloutSerializer(serializers.ModelSerializer):
    has_sro = serializers.SerializerMethodField()
    sro_number = serializers.SerializerMethodField()
    sro_id = serializers.SerializerMethodField() 
    schedule_id = serializers.SerializerMethodField()
    schedule_number = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )
    customer_name = serializers.CharField(
        source="customer.name", read_only=True
    )
    class Meta:
        model = Callout
        fields = "__all__"
        read_only_fields = ("created_at", "created_by", "callout_sequence", "callout_number")
    def get_has_sro(self, obj):
        return hasattr(obj, "sro") and obj.sro is not None

    def get_sro_id(self, obj):            # 🔹 NEW
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
