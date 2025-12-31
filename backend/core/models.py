from django.db import models
from decimal import Decimal
from django.db.models import Max
from django.core.validators import MinValueValidator, MaxValueValidator
# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import RegexValidator
from django.core.validators import EmailValidator
from django.utils import timezone
from datetime import date
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

class EquipmentType(models.Model):
    equipment_name = models.CharField(max_length=255)

    def __str__(self):
        return self.equipment_name

class Resource(models.Model):
    resource_name = models.CharField(max_length=255)

    def __str__(self):
        return self.resouce_name


class Field(models.Model):
    field_name = models.CharField(max_length=255)
    def __str__(self):
        return self.field_name


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
    
    
    def __str__(self):
        return f"{self.name} - {self.well_id}"


class HoleSection(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
class CasingSize(models.Model):
    size = models.DecimalField(max_digits=6, decimal_places=3, unique=True)
    display_name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.display_name

class DrillpipeSize(models.Model):
    size = models.DecimalField(max_digits=6, decimal_places=3, unique=True)
    display_name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.display_name

class MinimumIdSize(models.Model):
    size = models.DecimalField(max_digits=6, decimal_places=3, unique=True)
    display_name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.display_name

class HoleSectionRelationship(models.Model):
    hole_section = models.ForeignKey(HoleSection, on_delete=models.CASCADE, related_name="relationships")
    
    # Allowable casing sizes for this hole section
    allowed_casing_sizes = models.ManyToManyField(
        CasingSize,
        blank=True,
        related_name="hole_sections"
    )
    
    # Allowable drillpipe sizes for this hole section
    allowed_drillpipe_sizes = models.ManyToManyField(
        DrillpipeSize,
        blank=True,
        related_name="hole_sections"
    )
    
    class Meta:
        unique_together = ['hole_section']
    
    def __str__(self):
        return f"Relationships for {self.hole_section.name}"


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
        ("scheduled", "Scheduled"),
        ("assigned", "Assigned")
    ]
    GROUND_ELEVATION_REF_CHOICES = [
        ("MSL", "MSL (Mean Sea Level)"),
        ("GL", "GL (Ground Level)"),
        ("KB", "KB (Kelly Bushing)"),
        ("DF", "DF (Derrick Floor)"),
    ]
    H2S_LEVEL_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    SERVICE_CATEGORY_CHOICES = [
        ("wireline_gyro", "Wireline Gyro Surveys"),
        ("memory_gyro", "Memory Gyro Surveys"),
    ]
    PIPE_SELECTION_TYPE_CHOICES = [
        ("casing", "Casing"),
        ("drillpipe", "Drillpipe"),
    ]
    
    WELL_PROFILE_CHOICES = [
    ("vertical", "Vertical"),
    ("S-shape", "S-shape"),
    ("J-shape", "J-shape"),
    ("horizontal", "Horizontal"),
    ]

    # 🔹 NEW: numeric sequence and formatted callout number
    callout_sequence = models.PositiveIntegerField(
        unique=True, null=True, blank=True
    )
    callout_number = models.CharField(
        max_length=255, unique=True, blank=True
    )

    # --- references ---
    rig_number = models.ForeignKey('Rig', on_delete=models.PROTECT, related_name="callouts", null=True, blank=True)
    field_name = models.ForeignKey(
    "Field",
    on_delete=models.PROTECT,
    related_name="callouts",
    null=True,
    blank=True,)

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

    casing_size_inch = models.ForeignKey(
        CasingSize, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name="callouts"
    )
    drillpipe_size_inch = models.ForeignKey(
        DrillpipeSize, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name="callouts"
    )
    minimum_id_inch = models.ForeignKey(
        MinimumIdSize, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        related_name="callouts"
    )
    ground_elevation_ref = models.CharField(
        max_length=10,
        choices=GROUND_ELEVATION_REF_CHOICES,
        blank=True,
        default="",
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
    well_profile = models.CharField(
    max_length=20,
    choices=WELL_PROFILE_CHOICES,
    blank=True,
    default="",)
    max_downhole_temp_c = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    h2s_level = models.CharField(
        max_length=10,
        choices=H2S_LEVEL_CHOICES,
        blank=True,
        default="",
    )
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

    pipe_selection_type = models.CharField(
        max_length=20,
        choices=PIPE_SELECTION_TYPE_CHOICES,
        null=True,
        blank=True,
    )

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

        if self.pipe_selection_type == "casing":
            self.drillpipe_size_inch = None
        elif self.pipe_selection_type == "drillpipe":
            self.casing_size_inch = None

        # 2) Auto-set minimum_id to 2" if any size is selected
        if (self.casing_size_inch is not None or self.drillpipe_size_inch is not None) and not self.minimum_id_inch:
            try:
                # Get the MinimumIdSize with size=2.0
                min_id_2 = MinimumIdSize.objects.get(size=Decimal("2.0"))
                self.minimum_id_inch = min_id_2
            except MinimumIdSize.DoesNotExist:
                # Create it if it doesn't exist
                min_id_2 = MinimumIdSize.objects.create(
                    size=Decimal("2.0"),
                    display_name='2"'
                )
                self.minimum_id_inch = min_id_2
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        
        # Validate pipe selections based on hole section
        if self.hole_section and self.hole_section.relationships.exists():
            relationship = self.hole_section.relationships.first()
            
            # Validate casing size
            if self.pipe_selection_type == 'casing' and self.casing_size_inch:
                if self.casing_size_inch not in relationship.allowed_casing_sizes.all():
                    raise ValidationError({
                        'casing_size_inch': f'Casing size {self.casing_size_inch.display_name} is not valid for {self.hole_section.name} hole section.'
                    })
            
            # Validate drillpipe size
            elif self.pipe_selection_type == 'drillpipe' and self.drillpipe_size_inch:
                if self.drillpipe_size_inch not in relationship.allowed_drillpipe_sizes.all():
                    raise ValidationError({
                        'drillpipe_size_inch': f'Drillpipe size {self.drillpipe_size_inch.display_name} is not valid for {self.hole_section.name} hole section.'
                    })
            
            # Validate minimum ID is smaller than selected pipe
            if self.minimum_id_inch:
                selected_pipe = self.casing_size_inch or self.drillpipe_size_inch
                if selected_pipe and self.minimum_id_inch.size >= selected_pipe.size:
                    raise ValidationError({
                        'minimum_id_inch': f'Minimum ID ({self.minimum_id_inch.display_name}) must be smaller than selected pipe size ({selected_pipe.display_name})'
                        })

        

        

    
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
        ("assigned", "Assigned"),
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

    type_of_equipment = models.ForeignKey(
        EquipmentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="schedules",
    )

    resource = models.ForeignKey(
        Resource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="schedules",
    )
    scheduled_date = models.DateTimeField()

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

class Asset(models.Model):
    STATUS_CHOICES = [
        ("on_duty", "On Duty"),
        ("yellow", "Yellow"),
        ("green", "Green"),
        ("upgraded", "Upgraded"),
        ("off_duty", "Off Duty"),
        ("maintenance", "Maintenance"),
        ("breakdown", "Breakdown"),
    ]

    account_code = models.CharField(max_length=100, blank=True, null=True)

    # ✅ UNIQUE
    asset_code = models.CharField(max_length=100, unique=True)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="on_duty")

    cost_center = models.CharField(max_length=150, blank=True, null=True)
    department = models.CharField(max_length=150, blank=True, null=True)
    asset_group = models.CharField(max_length=150, blank=True, null=True)
    physical_location = models.CharField(max_length=200, blank=True, null=True)
    asset_main_category = models.CharField(max_length=150, blank=True, null=True)
    asset_sub_category = models.CharField(max_length=150, blank=True, null=True)
    asset_description = models.TextField(blank=True, null=True)

    serial_no = models.CharField(max_length=200, blank=True, null=True)
    part_no = models.CharField(max_length=200, blank=True, null=True)
    mfg_serial = models.CharField(max_length=200, blank=True, null=True)
    manufacturer = models.CharField(max_length=200, blank=True, null=True)

    comments = models.TextField(blank=True, null=True)
    certificate = models.CharField(max_length=255, blank=True, null=True)

    last_regular_inspection_date = models.DateField(blank=True, null=True)
    next_due_date_regular_inspection = models.DateField(blank=True, null=True)

    last_minor_service_date = models.DateField(blank=True, null=True)
    next_due_date_minor_service = models.DateField(blank=True, null=True)

    last_major_service_date = models.DateField(blank=True, null=True)
    next_due_date_major_service = models.DateField(blank=True, null=True)

    last_regular_inspection_km = models.FloatField(blank=True, null=True)
    last_regular_inspection_hours = models.FloatField(blank=True, null=True)
    last_regular_inspection_jobs = models.FloatField(blank=True, null=True)

    last_minor_service_km = models.FloatField(blank=True, null=True)
    last_minor_service_hours = models.FloatField(blank=True, null=True)
    last_minor_service_jobs = models.FloatField(blank=True, null=True)

    last_major_service_km = models.FloatField(blank=True, null=True)
    last_major_service_hours = models.FloatField(blank=True, null=True)
    last_major_service_jobs = models.FloatField(blank=True, null=True)

    next_regular_inspection_km = models.FloatField(blank=True, null=True)
    next_regular_inspection_jobs = models.FloatField(blank=True, null=True)
    next_regular_inspection_hour = models.FloatField(blank=True, null=True)

    next_minor_service_km = models.FloatField(blank=True, null=True)
    next_minor_service_jobs = models.FloatField(blank=True, null=True)
    next_minor_service_hours = models.FloatField(blank=True, null=True)

    next_major_service_jobs = models.FloatField(blank=True, null=True)
    next_major_service_km = models.FloatField(blank=True, null=True)
    next_major_service_hours = models.FloatField(blank=True, null=True)

    third_party_comment = models.TextField(blank=True, null=True)
    third_party_service_date = models.DateField(blank=True, null=True)

    attachments1 = models.TextField(blank=True, null=True)

    breakdown_maintenance_comment = models.TextField(blank=True, null=True)
    next_third_party_service_date = models.DateField(blank=True, null=True)

    maintenance_type = models.CharField(max_length=150, blank=True, null=True)
    ncr_no = models.CharField(max_length=150, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.asset_code


class EmployeeMaster(models.Model):
    # Core
    emp_number = models.CharField(max_length=50, unique=True)  # Emp #
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255, blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    date_of_joining = models.DateField(blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True, null=True)

    # IDs & expiry
    civil_id_number = models.CharField(max_length=100, blank=True, null=True)
    civil_id_expiry_date = models.DateField(blank=True, null=True)

    passport_number = models.CharField(max_length=100, blank=True, null=True)
    passport_expiry_date = models.DateField(blank=True, null=True)

    visa_number = models.CharField(max_length=100, blank=True, null=True)
    visa_issue_date = models.DateField(blank=True, null=True)
    visa_expiry_date = models.DateField(blank=True, null=True)

    # Personal
    date_of_birth = models.DateField(blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)  # can be auto-calculated
    blood_group = models.CharField(max_length=20, blank=True, null=True)

    # License
    driving_license = models.CharField(max_length=100, blank=True, null=True)
    dl_expiry_date = models.DateField(blank=True, null=True)

    # Contact
    tel_number = models.CharField(max_length=50, blank=True, null=True)  # Tel #
    email_id = models.EmailField(blank=True, null=True, validators=[EmailValidator()])
    address = models.TextField(blank=True, null=True)

    # Bank
    registered_bank_details = models.CharField(max_length=255, blank=True, null=True)
    acc_number = models.CharField(max_length=100, blank=True, null=True)

    # Employment
    employee_type = models.CharField(max_length=100, blank=True, null=True)
    contract_type = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    leave_schedule = models.CharField(max_length=100, blank=True, null=True)
    last_appraisal = models.DateField(blank=True, null=True)
    benefits = models.TextField(blank=True, null=True)

    # Education
    graduation = models.CharField(max_length=255, blank=True, null=True)
    specialization = models.CharField(max_length=255, blank=True, null=True)
    year_of_passing = models.PositiveIntegerField(blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)

    # Family
    GENDER_CHOICES = (("Male", "Male"), ("Female", "Female"), ("Other", "Other"))
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)

    MARITAL_CHOICES = (("Single", "Single"), ("Married", "Married"), ("Divorced", "Divorced"), ("Widowed", "Widowed"))
    marital_status = models.CharField(max_length=20, choices=MARITAL_CHOICES, blank=True, null=True)

    name_of_spouse = models.CharField(max_length=255, blank=True, null=True)
    number_of_kids = models.PositiveIntegerField(blank=True, null=True)
    name_kid_1 = models.CharField(max_length=255, blank=True, null=True)
    name_kid_2 = models.CharField(max_length=255, blank=True, null=True)

    # Emergency
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_tel = models.CharField(max_length=50, blank=True, null=True)

    # Place of Birth
    place_of_birth = models.CharField(max_length=255, blank=True, null=True)

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _calc_age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        years = today.year - self.date_of_birth.year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            years -= 1
        return max(years, 0)

    def save(self, *args, **kwargs):
        # auto-calc age if DOB present
        if self.date_of_birth:
            self.age = self._calc_age()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.emp_number} - {self.name}"

        
class AssignedService(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("assigned", "Assigned"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    schedule = models.OneToOneField(
        "Schedule",
        on_delete=models.PROTECT,          # schedule must exist first, cannot delete schedule if assigned exists
        related_name="assigned_service"
    )

    employees = models.ManyToManyField(
        "EmployeeMaster",
        related_name="assigned_services",
        blank=False,
    )

    assets = models.ManyToManyField(
        "Asset",
        related_name="assigned_services",
        blank=False,
      
    )

    cost_centers = models.JSONField(default=list, blank=True)

    # ✅ NEW
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="assigned")
    equipment_required_at = models.DateTimeField(null=True, blank=True)
    crew_required_at = models.DateTimeField(null=True, blank=True)

    note = models.TextField(blank=True, null=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AssignedService #{self.pk} [{self.status}] -> {self.employee}"






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