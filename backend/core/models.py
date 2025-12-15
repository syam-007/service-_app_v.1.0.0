from django.db import models
from django.db.models import Max
from django.core.validators import MinValueValidator, MaxValueValidator
# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
User = get_user_model()


class Client(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
class Customer(models.Model):
    name = models.CharField(max_length=255)
    

    def __str__(self):
        return f"{self.name} ({self.code})"

class Rig(models.Model):
    name = models.CharField(max_length=255)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="rigs")

    def __str__(self):
        return f"{self.name} ({self.client.code})"


class ServiceType(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Well(models.Model):
    name = models.CharField(max_length=255, unique=True)
    well_id = models.CharField(max_length=100, unique=True)
    
    
    # Coordinate fields
    well_center_lat_deg = models.IntegerField(null=True, blank=True)
    well_center_lat_min = models.IntegerField(null=True, blank=True)
    well_center_lat_sec = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    well_center_lng_deg = models.IntegerField(null=True, blank=True)
    well_center_lng_min = models.IntegerField(null=True, blank=True)
    well_center_lng_sec = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    
    utm_northing = models.CharField(max_length=50, blank=True)
    utm_easting = models.CharField(max_length=50, blank=True)
    ground_elevation_m = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    
    def __str__(self):
        return f"{self.name} - {self.well_id}"


class HoleSection(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    
    def __str__(self):
        return self.name

class Rig(models.Model):
    
    rig_number = models.CharField(max_length= 255)

    def __str__(self):
        return f"{self.rig_number}"


class ServiceType(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Callout(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("locked", "Locked"),
        ("sro_activated", "SRO Activated"),
        ("scheduled", "Scheduled")
    ]

    SERVICE_CATEGORY_CHOICES = [
        ("wireline_gyro", "Wireline Gyro Surveys"),
        ("memory_gyro", "Memory Gyro Surveys"),
    ]

    # 🔹 NEW: numeric sequence and formatted callout number
    callout_sequence = models.PositiveIntegerField(
        unique=True, null=True, blank=True
    )
    callout_number = models.CharField(
        max_length=255, unique=True, blank=True
    )

    # --- references ---
    rig_number = models.CharField(max_length=255)
    field_name = models.CharField(max_length=255, blank=True)
    customer = models.ForeignKey(
        "Customer", on_delete=models.PROTECT, related_name="callouts", null=True, blank=True
    )
    well = models.ForeignKey(
        "Well", on_delete=models.PROTECT, related_name="callouts", null=True, blank=True
    )
    hole_section = models.ForeignKey(
        "HoleSection", on_delete=models.PROTECT, related_name="callouts", null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="callouts_created",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="draft"
    )

    # ------------------------------------------------------------------
    # 1. GENERAL INFORMATION (display fields)
    # ------------------------------------------------------------------
    well_name_display = models.CharField(max_length=255, blank=True)
    hole_section_display = models.CharField(max_length=255, blank=True)
    well_id_display = models.CharField(max_length=100, blank=True)

    # ------------------------------------------------------------------
    # 2. TYPE OF SERVICE REQUIRED
    # ------------------------------------------------------------------
    service_category = models.CharField(
        max_length=20,
        choices=SERVICE_CATEGORY_CHOICES,
        blank=True,
    )

    # Wireline Gyro Surveys
    wireline_casing_survey = models.BooleanField(default=False)
    wireline_orientation_survey = models.BooleanField(default=False)
    wireline_drillpipe_survey = models.BooleanField(default=False)
    wireline_pumpdown_survey = models.BooleanField(default=False)
    wireline_orientation_multishot_survey = models.BooleanField(default=False)

    # Memory Gyro Surveys
    memory_casing_slickline = models.BooleanField(default=False)
    memory_drillpipe_slickline = models.BooleanField(default=False)
    memory_pumpdown_survey = models.BooleanField(default=False)
    drop_gyro_lt_20 = models.BooleanField(default=False)
    drop_gyro_gt_20 = models.BooleanField(default=False)
    dry_hole_drop_gyro_system = models.BooleanField(default=False)

    # ------------------------------------------------------------------
    # 3. WELL INFORMATION (overrides)
    # ------------------------------------------------------------------
    well_center_lat_deg = models.IntegerField(null=True, blank=True)
    well_center_lat_min = models.IntegerField(null=True, blank=True)
    well_center_lat_sec = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    well_center_lng_deg = models.IntegerField(null=True, blank=True)
    well_center_lng_min = models.IntegerField(null=True, blank=True)
    well_center_lng_sec = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    utm_northing = models.CharField(max_length=50, blank=True)
    utm_easting = models.CharField(max_length=50, blank=True)

    casing_size_inch = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    drillpipe_size_inch = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    minimum_id_inch = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    ground_elevation_m = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    rig_floor_elevation_m = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    maximum_inclination_deg = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    well_profile = models.CharField(max_length=100, blank=True)
    max_downhole_temp_c = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    h2s_level = models.CharField(max_length=100, blank=True)

    # ------------------------------------------------------------------
    # 4. SURVEY INFORMATION
    # ------------------------------------------------------------------
    survey_start_depth_m = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    survey_end_depth_m = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    survey_interval_m = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    whipstock_orientation_depth_m = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    motor_orientation_depth_m = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )

    ubho_sub_size = models.CharField(max_length=50, blank=True)
    ubho_sub_connection_size = models.CharField(max_length=50, blank=True)
    ubho_sub_date_required = models.DateField(null=True, blank=True)

    side_entry_sub_size = models.CharField(max_length=50, blank=True)
    side_entry_sub_connection_size = models.CharField(max_length=50, blank=True)
    side_entry_sub_date_required = models.DateField(null=True, blank=True)

    equipment_required_date = models.DateField(null=True, blank=True)
    equipment_required_time = models.TimeField(null=True, blank=True)
    crew_required_date = models.DateField(null=True, blank=True)
    crew_required_time = models.TimeField(null=True, blank=True)

    # ------------------------------------------------------------------
    # 5. CONTACT INFORMATION & COMMENTS
    # ------------------------------------------------------------------
    callout_completed_by = models.CharField(max_length=255, blank=True)
    completed_by_designation = models.CharField(max_length=255, blank=True)
    contact_number = models.CharField(max_length=50, blank=True)
    authorization = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        # Auto-populate display fields from related models
        if self.well:
            self.well_name_display = self.well.name
            self.well_id_display = self.well.well_id

        if self.hole_section:
            self.hole_section_display = self.hole_section.name

        # 🔹 Only assign a new sequence on first save
        if is_new and self.callout_sequence is None:
            last = Callout.objects.aggregate(max_seq=Max("callout_sequence"))["max_seq"]
            if last is None or last < 1101:
                self.callout_sequence = 1101
            else:
                self.callout_sequence = last + 1

        # 🔹 Build the callout_number using the pattern:
        #     CALL_OUT_<sequence>_(Customer name)
        customer_name = ""
        if self.customer:
            customer_name = self.customer.name or ""
        # replace spaces with underscores to keep it tidy
        safe_customer = customer_name.replace(" ", "_") if customer_name else "UNKNOWN"

        if self.callout_sequence:
            self.callout_number = f"CALL_OUT_{self.callout_sequence}_{safe_customer}"

        super().save(*args, **kwargs)

    def __str__(self):
        # Show the nice callout number if available
        if self.callout_number:
            return self.callout_number
        return f"Callout #{self.pk}"


class SRO(models.Model):
    STATUS_CHOICES = [
        ("created", "Created"),
        ("approved", "Approved"),
        ("ready_for_scheduling", "Ready for Scheduling"),
        ("scheduled", "Scheduled"),
        ("assigned", "Assigned"),
        ("active", "Active"),
        ("executed", "Executed"),
        ("qc_approved", "QC Approved"),
        ("closed", "Closed"),
        ("cancelled", "Cancelled"),
    ]

    callout = models.OneToOneField(
        "Callout",
        on_delete=models.PROTECT,
        related_name="sro",
    )

    # 🔹 Per-customer sequence (hidden technical field)
    sro_sequence = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False,
    )

    # 🔹 Human-friendly SRO number (what you display)
    # Format: SRO-<CUSTOMER>-<SEQ>, e.g. SRO-PDO-1101
    sro_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="created",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.sro_number

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        # Only generate number + status on first save
        if is_new:
            # 🔹 When an SRO is generated, force it to "active"
            self.status = "active"

            customer = None
            customer_name = "GEN"

            if self.callout and self.callout.customer:
                customer = self.callout.customer
                if getattr(customer, "name", None):
                    # Example: "Petroleum Development Oman" -> "PETROLEUMDEVELOPMENTOMAN"
                    customer_name = customer.name.upper().replace(" ", "")
            
            # 🔹 Determine next sequence for this customer
            #     For PDO: 1101, 1102, 1103, ...
            #     For BP:  1101, 1102, ...
            if self.sro_sequence is None:
                qs = SRO.objects.all()
                if customer is not None:
                    qs = qs.filter(callout__customer=customer)

                last = qs.aggregate(max_seq=Max("sro_sequence"))["max_seq"]

                if last is None or last < 1101:
                    self.sro_sequence = 1101
                else:
                    self.sro_sequence = last + 1

            # 🔹 Build SRO number string
            # Example: SRO-PDO-1101
            self.sro_number = f"SRO-{customer_name}-{self.sro_sequence}"

        super().save(*args, **kwargs)

class Schedule(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("planned", "Planned"),
        ("approved", "Approved"),
        ("cancelled", "Cancelled"),
    ]

    sro = models.OneToOneField(
        "SRO",
        on_delete=models.CASCADE,
        related_name="schedule",
    )

    schedule_sequence = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False,
        unique=True,
    )

    schedule_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    finance_priority = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )
    operations_priority = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )
    qa_priority = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )

    average_priority = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        editable=False,
    )

    high_temp = models.BooleanField(null=True, blank=True)
    pressure_risk = models.BooleanField(null=True, blank=True)
    difficulty_score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
    )
    hse_risk = models.BooleanField(null=True, blank=True)

    type_of_equipment = models.CharField(max_length=255, blank=True)
    resource = models.CharField(max_length=255, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="schedules_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    def __str__(self):
        return self.schedule_number

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        # 🔹 Generate schedule number once
        if is_new and self.schedule_sequence is None:
            last = Schedule.objects.aggregate(
                max_seq=Max("schedule_sequence")
            )["max_seq"]

            self.schedule_sequence = 1101 if not last or last < 1101 else last + 1
            self.schedule_number = f"SCHDL_{self.schedule_sequence}"

        # 🔹 Average priority
        priorities = [
            p for p in [
                self.finance_priority,
                self.operations_priority,
                self.qa_priority,
            ]
            if p is not None
        ]

        self.average_priority = round(sum(priorities) / len(priorities), 1) if priorities else None

        super().save(*args, **kwargs)

        # =====================================================
        # 🔥 CRITICAL PART — SYNC STATUSES
        # =====================================================

        # 1️⃣ Update SRO status
        if is_new and self.sro:
            if self.sro.status != "scheduled":
                self.sro.status = "scheduled"
                self.sro.save(update_fields=["status"])

            if self.sro.callout and self.sro.callout.status != "scheduled":
                callout = self.sro.callout
                callout.status = "scheduled"
                callout.save(update_fields=["status"])

        
class Job(models.Model):
    sro = models.ForeignKey(SRO, on_delete=models.CASCADE, related_name="jobs")
    job_number = models.CharField(max_length=50, unique=True)
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    status = models.CharField(max_length=30, default="scheduled")

    def __str__(self):
        return self.job_number


class ExecutionLogEntry(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="logs")
    action = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def duration_minutes(self):
        return (self.end_time - self.start_time).total_seconds() / 60
