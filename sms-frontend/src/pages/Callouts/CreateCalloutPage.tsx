// src/pages/Callouts/CreateCalloutPage.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCallout } from "../../api/callout";
import { 
  
  useGetCustomers,
  useGetWells,
  useGetHoleSections 
} from "../../api/dropdowns";
import { CheckCircle2, Clock } from "lucide-react";

type ServiceCategory = "wireline_gyro" | "memory_gyro" | "";

function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  // If it's already a number, just validate it
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  // Fallback for strings
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

  // --- Create Well modal state ---


export function CreateCalloutPage() {
  const navigate = useNavigate();
  const createCallout = useCreateCallout();
  
  // Fetch dropdown data
  const { data: customers = [] } = useGetCustomers();
  const { data: wells = [] } = useGetWells();
  const { data: holeSections = [] } = useGetHoleSections();


  // --- core references ---
  const [customerId, setCustomerId] = useState("");
  const [rigNumber, setRigNumber] = useState("");
  const [fieldName, setFieldName] = useState(""); // New field

  // --- 1. General information ---
  const [wellId, setWellId] = useState("");
  const [holeSectionId, setHoleSectionId] = useState("");
  
  // Display fields that will be auto-populated
  const [wellName, setWellName] = useState("");
  const [wellIdentifier, setWellIdentifier] = useState("");
  
  // Auto-populated coordinates
  const [latDeg, setLatDeg] = useState("");
  const [latMin, setLatMin] = useState("");
  const [latSec, setLatSec] = useState("");
  const [lngDeg, setLngDeg] = useState("");
  const [lngMin, setLngMin] = useState("");
  const [lngSec, setLngSec] = useState("");
  const [utmNorthing, setUtmNorthing] = useState("");
  const [utmEasting, setUtmEasting] = useState("");

  // --- 2. Type of service required ---
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("");

  // Wireline services
  const [wirelineCasing, setWirelineCasing] = useState(false);
  const [wirelineOrientation, setWirelineOrientation] = useState(false);
  const [wirelineDrillpipe, setWirelineDrillpipe] = useState(false);
  const [wirelinePumpdown, setWirelinePumpdown] = useState(false);
  const [wirelineOrientationMultishot, setWirelineOrientationMultishot] =
    useState(false);

  // Memory services
  const [memoryCasing, setMemoryCasing] = useState(false);
  const [memoryDrillpipe, setMemoryDrillpipe] = useState(false);
  const [memoryPumpdown, setMemoryPumpdown] = useState(false);
  const [dropGyroLt20, setDropGyroLt20] = useState(false);
  const [dropGyroGt20, setDropGyroGt20] = useState(false);
  const [dryHoleDropSystem, setDryHoleDropSystem] = useState(false);

  // --- 3. Well information (remaining fields) ---
  const [casingSize, setCasingSize] = useState("");
  const [drillpipeSize, setDrillpipeSize] = useState("");
  const [minimumId, setMinimumId] = useState("");

  const [groundElevation, setGroundElevation] = useState("");
  const [rigFloorElevation, setRigFloorElevation] = useState("");
  const [maxInclination, setMaxInclination] = useState("");
  const [wellProfile, setWellProfile] = useState("");
  const [maxDownholeTemp, setMaxDownholeTemp] = useState("");
  const [h2sLevel, setH2sLevel] = useState("");

  // --- 4. Survey information ---
  const [surveyStartDepth, setSurveyStartDepth] = useState("");
  const [surveyEndDepth, setSurveyEndDepth] = useState("");
  const surveyInterval =
    (Number(surveyEndDepth) || 0) - (Number(surveyStartDepth) || 0);
  
  // Orientation & subs toggles
  const [hasWhipstockOrientation, setHasWhipstockOrientation] = useState(false);
  const [hasMotorOrientation, setHasMotorOrientation] = useState(false);
  const [hasUbhoSub, setHasUbhoSub] = useState(false);
  const [hasSideEntrySub, setHasSideEntrySub] = useState(false);
  
  const [whipstockDepth, setWhipstockDepth] = useState("");
  const [motorDepth, setMotorDepth] = useState("");
  
  const [ubhoSize, setUbhoSize] = useState("");
  const [ubhoConnSize, setUbhoConnSize] = useState("");
  const [ubhoDateRequired, setUbhoDateRequired] = useState("");
  
  const [sideEntrySize, setSideEntrySize] = useState("");
  const [sideEntryConnSize, setSideEntryConnSize] = useState("");
  const [sideEntryDateRequired, setSideEntryDateRequired] = useState("");

  const [equipmentDate, setEquipmentDate] = useState("");
  const [equipmentTime, setEquipmentTime] = useState("");
  const [crewDate, setCrewDate] = useState("");
  const [crewTime, setCrewTime] = useState("");

  // --- 5. Contact info & comments ---
  const [completedBy, setCompletedBy] = useState("");
  const [designation, setDesignation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [authorization, setAuthorization] = useState("");
  const [notes, setNotes] = useState("");

  // Effect to auto-populate well data when well is selected
  useEffect(() => {
    if (wellId) {
      const selectedWell = wells.find(w => w.id === Number(wellId));
      if (selectedWell) {
        setWellName(selectedWell.name);
        setWellIdentifier(selectedWell.well_id);
        // Auto-fill field name from well data
        
        
        // Populate coordinates
        setLatDeg(selectedWell.well_center_lat_deg?.toString() || "");
        setLatMin(selectedWell.well_center_lat_min?.toString() || "");
        setLatSec(selectedWell.well_center_lat_sec?.toString() || "");
        setLngDeg(selectedWell.well_center_lng_deg?.toString() || "");
        setLngMin(selectedWell.well_center_lng_min?.toString() || "");
        setLngSec(selectedWell.well_center_lng_sec?.toString() || "");
        setUtmNorthing(selectedWell.utm_northing || "");
        setUtmEasting(selectedWell.utm_easting || "");
      }
    } else {
      // Reset well data
      setWellName("");
      setWellIdentifier("");
      setFieldName(""); // Clear field name when no well selected
      setLatDeg("");
      setLatMin("");
      setLatSec("");
      setLngDeg("");
      setLngMin("");
      setLngSec("");
      setUtmNorthing("");
      setUtmEasting("");
    }
  }, [wellId, wells]);

  const isStep1Complete = () => {
    // Check all required fields
    return (
      customerId.trim() !== "" &&
      rigNumber.trim() !== "" &&
      fieldName.trim() !== "" &&
      wellName.trim()  !== "" &&
      holeSectionId.trim() !== "" 
    );
  };
  

  // ----------------------------------------------------------
  // Progress / step status
  // ----------------------------------------------------------
  const steps = useMemo(() => {
    const refsComplete = !!customerId &&  !!rigNumber && !!fieldName;

    const generalComplete = !!wellId || !!holeSectionId;

    const serviceComplete =
      !!serviceCategory ||
      wirelineCasing ||
      wirelineOrientation ||
      wirelineDrillpipe ||
      wirelinePumpdown ||
      wirelineOrientationMultishot ||
      memoryCasing ||
      memoryDrillpipe ||
      memoryPumpdown ||
      dropGyroLt20 ||
      dropGyroGt20 ||
      dryHoleDropSystem;

    const wellInfoComplete =
      !!casingSize ||
      !!drillpipeSize ||
      !!minimumId ||
      !!groundElevation ||
      !!rigFloorElevation ||
      !!maxInclination ||
      !!wellProfile ||
      !!maxDownholeTemp ||
      !!h2sLevel;

    const surveyComplete =
      !!surveyStartDepth || !!surveyEndDepth || !!surveyInterval;

    const contactComplete =
      !!completedBy || !!designation || !!contactNumber || !!authorization;

    return [
      {
        id: "refs",
        title: "General Information",
        detail: "Customer, Rig & Field Name",
        complete: refsComplete,
      },
      {
        id: "well",
        title: "Well Details",
        detail: "Well name, hole section and coordinates.",
        complete: generalComplete,
      },
      {
        id: "service",
        title: "Type of Service",
        detail: "Wireline / memory gyro and service options.",
        complete: serviceComplete,
      },
      {
        id: "survey",
        title: "Survey Information",
        detail: "Depth ranges, orientation points & subs.",
        complete: surveyComplete,
      },
      {
        id: "contact",
        title: "Contact & Comments",
        detail: "Callout owner, approvals and notes.",
        complete: contactComplete,
      },
    ];
  }, [
    customerId,
  
    fieldName,
    wellId,
    holeSectionId,
    serviceCategory,
    wirelineCasing,
    wirelineOrientation,
    wirelineDrillpipe,
    wirelinePumpdown,
    wirelineOrientationMultishot,
    memoryCasing,
    memoryDrillpipe,
    memoryPumpdown,
    dropGyroLt20,
    dropGyroGt20,
    dryHoleDropSystem,
    casingSize,
    drillpipeSize,
    minimumId,
    groundElevation,
    rigFloorElevation,
    maxInclination,
    wellProfile,
    maxDownholeTemp,
    h2sLevel,
    surveyStartDepth,
    surveyEndDepth,
    surveyInterval,
    completedBy,
    designation,
    contactNumber,
    authorization,
  ]);
  


  const activeIndex = useMemo(() => {
    const idx = steps.findIndex((s) => !s.complete);
    return idx === -1 ? steps.length - 1 : idx;
  }, [steps]);

  const overallProgress =
    (steps.filter((s) => s.complete).length / steps.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rigNumber || !customerId) return;

    createCallout.mutate(
      {
        // core - updated to match backend model
        rig_number: Number(rigNumber), // Changed from 'rig' to 'rig_number'
        customer: Number(customerId),
        field_name: fieldName, // New field
        well: wellId ? Number(wellId) : null,
        hole_section: holeSectionId ? Number(holeSectionId) : null,

        // service required
        service_category: serviceCategory || null,
        wireline_casing_survey: wirelineCasing,
        wireline_orientation_survey: wirelineOrientation,
        wireline_drillpipe_survey: wirelineDrillpipe,
        wireline_pumpdown_survey: wirelinePumpdown,
        wireline_orientation_multishot_survey: wirelineOrientationMultishot,
        memory_casing_slickline: memoryCasing,
        memory_drillpipe_slickline: memoryDrillpipe,
        memory_pumpdown_survey: memoryPumpdown,
        drop_gyro_lt_20: dropGyroLt20,
        drop_gyro_gt_20: dropGyroGt20,
        dry_hole_drop_gyro_system: dryHoleDropSystem,

        // well info - coordinates (keep as overrides if needed)
        well_center_lat_deg: toNumberOrNull(latDeg),
        well_center_lat_min: toNumberOrNull(latMin),
        well_center_lat_sec: toNumberOrNull(latSec),
        well_center_lng_deg: toNumberOrNull(lngDeg),
        well_center_lng_min: toNumberOrNull(lngMin),
        well_center_lng_sec: toNumberOrNull(lngSec),

        utm_northing: utmNorthing,
        utm_easting: utmEasting,
        casing_size_inch: toNumberOrNull(casingSize),
        drillpipe_size_inch: toNumberOrNull(drillpipeSize),
        minimum_id_inch: toNumberOrNull(minimumId),
        ground_elevation_m: toNumberOrNull(groundElevation),
        rig_floor_elevation_m: toNumberOrNull(rigFloorElevation),
        maximum_inclination_deg: toNumberOrNull(maxInclination),
        well_profile: wellProfile,
        max_downhole_temp_c: toNumberOrNull(maxDownholeTemp),
        h2s_level: h2sLevel,

        // survey info
        survey_start_depth_m: toNumberOrNull(surveyStartDepth),
        survey_end_depth_m: toNumberOrNull(surveyEndDepth),
        survey_interval_m: toNumberOrNull(surveyInterval),
        whipstock_orientation_depth_m: toNumberOrNull(whipstockDepth),
        motor_orientation_depth_m: toNumberOrNull(motorDepth),
        ubho_sub_size: ubhoSize,
        ubho_sub_connection_size: ubhoConnSize,
        ubho_sub_date_required: ubhoDateRequired || null,
        side_entry_sub_size: sideEntrySize,
        side_entry_sub_connection_size: sideEntryConnSize,
        side_entry_sub_date_required: sideEntryDateRequired || null,
        equipment_required_date: equipmentDate || null,
        equipment_required_time: equipmentTime || null,
        crew_required_date: crewDate || null,
        crew_required_time: crewTime || null,

        // contacts & comments
        callout_completed_by: completedBy,
        completed_by_designation: designation,
        contact_number: contactNumber,
        authorization,
        notes,
      } as any,
      {
        onSuccess: () => {
          navigate("/callouts");
        },
      }
    );
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            New Callout
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capture a detailed service request for wireline or memory gyro
            surveys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

      {/* Main layout: form + progress sidebar */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(0,1.3fr)]">
        {/* FORM COLUMN */}
        <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          // Webkit scrollbar styling
          scrollbarWidth: 'thin',
           scrollbarColor: 'rgb(0, 0, 0) transparent',
           
        }}
        >
          {/* General Information - Combined section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                General Information
              </h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isStep1Complete()
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                Step 1
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Customer dropdown */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} 
                    </option>
                  ))}
                </select>
              </div>

              {/* Rig dropdown */}
              <div className="space-y-1 text-xs">
              <label className="block text-slate-600 dark:text-slate-300">
                Rig Number *
              </label>
              <input
                value={rigNumber}
                onChange={(e) => setRigNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                placeholder="Enter rig number"
                required
              />
            </div>
            </div>

            

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Well dropdown */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Well Name
                </label>
                <select
                  value={wellId}
                  onChange={(e) => setWellId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select Well</option>
                  {wells.map((well) => (
                    <option key={well.id} value={well.id}>
                      {well.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div className="space-y-1"> */}
              {/* <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-500">
                  Well Name
                </label>
                <button
                  type="button"
                  onClick={() => setIsWellModalOpen(true)}
                  className="text-[10px] rounded-full border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  + Create Well
                </button>
              </div> */}
              {/* <select
                name="well"
                value={form.well}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select Well</option>
                {wells.map((well: any) => (
                  <option key={well.id} value={well.id}>
                    {well.name}
                  </option>
                ))}
              </select>
            </div> */}

              {/* Hole Section dropdown */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Hole Section
                </label>
                <select
                  value={holeSectionId}
                  onChange={(e) => setHoleSectionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select Hole Section</option>
                  {holeSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Auto-populated well details (read-only) */}
            {wellId && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <span className="text-slate-500">Well ID:</span>
                    <span className="ml-2 font-medium">{wellIdentifier}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="ml-2 font-medium">
                      {latDeg && latMin && latSec && `${latDeg}°${latMin}'${latSec}"`}
                      {lngDeg && lngMin && lngSec && `, ${lngDeg}°${lngMin}'${lngSec}"`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Well Name:</span>
                    <span className="ml-2 font-medium">{wellName}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Field Name input */}
            <div className="space-y-1 text-xs">
              <label className="block text-slate-600 dark:text-slate-300">
                Field Name *
              </label>
              <input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                placeholder="Enter field name"
                required
              />
            </div>

            
          </section>

          {/* 2. Type of service required */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Type of Service Required
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 2
              </span>
            </div>

            {/* category */}
            <div className="flex flex-wrap gap-3 text-xs">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={serviceCategory === "wireline_gyro"}
                  onChange={() => setServiceCategory("wireline_gyro")}
                />
                Wireline gyro survey
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  className="h-3 w-3"
                  checked={serviceCategory === "memory_gyro"}
                  onChange={() => setServiceCategory("memory_gyro")}
                />
                Memory gyro survey
              </label>
            </div>

            {/* wireline options */}
            {serviceCategory === "wireline_gyro" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Wireline gyro services
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wirelineCasing}
                      onChange={(e) => setWirelineCasing(e.target.checked)}
                    />
                    Casing gyro survey
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wirelineOrientation}
                      onChange={(e) => setWirelineOrientation(e.target.checked)}
                    />
                    Orientation survey
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wirelineDrillpipe}
                      onChange={(e) => setWirelineDrillpipe(e.target.checked)}
                    />
                    Drillpipe survey
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wirelinePumpdown}
                      onChange={(e) => setWirelinePumpdown(e.target.checked)}
                    />
                    Pump down survey
                  </label>
                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={wirelineOrientationMultishot}
                      onChange={(e) =>
                        setWirelineOrientationMultishot(e.target.checked)
                      }
                    />
                    Orientation / multishot survey
                  </label>
                </div>
              </div>
            )}

            {/* memory options */}
            {serviceCategory === "memory_gyro" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Memory gyro services
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={memoryCasing}
                      onChange={(e) => setMemoryCasing(e.target.checked)}
                    />
                    Casing (slickline / memory)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={memoryDrillpipe}
                      onChange={(e) => setMemoryDrillpipe(e.target.checked)}
                    />
                    Drillpipe (slickline / memory)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={memoryPumpdown}
                      onChange={(e) => setMemoryPumpdown(e.target.checked)}
                    />
                    Pump down survey
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dropGyroLt20}
                      onChange={(e) => setDropGyroLt20(e.target.checked)}
                    />
                    Drop gyro &lt; 20"
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dropGyroGt20}
                      onChange={(e) => setDropGyroGt20(e.target.checked)}
                    />
                    Drop gyro &gt; 20"
                  </label>
                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={dryHoleDropSystem}
                      onChange={(e) =>
                        setDryHoleDropSystem(e.target.checked)
                      }
                    />
                    Dry hole drop gyro system
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* 3. Well information (remaining fields) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Additional Well Information
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 3
              </span>
            </div>
            
            {/* Display coordinates (read-only when auto-populated) */}
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Latitude */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Well center latitude
                </label>
                <div className="flex gap-2">
                  {/* Deg */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={latDeg}
                      onChange={(e) => setLatDeg(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none read-only focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Deg"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      °
                    </span>
                  </div>
                  {/* Min */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={latMin}
                      onChange={(e) => setLatMin(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Min"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      ′
                    </span>
                  </div>
                  {/* Sec */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.001"
                      value={latSec}
                      onChange={(e) => setLatSec(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Sec"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      ″
                    </span>
                  </div>
                </div>
              </div>

              {/* Longitude */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Well center longitude
                </label>
                <div className="flex gap-2">
                  {/* Deg */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={lngDeg}
                      onChange={(e) => setLngDeg(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Deg"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      °
                    </span>
                  </div>
                  {/* Min */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={lngMin}
                      onChange={(e) => setLngMin(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Min"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      ′
                    </span>
                  </div>
                  {/* Sec */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.001"
                      value={lngSec}
                      onChange={(e) => setLngSec(e.target.value)}
                      className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 pr-6 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                      placeholder="Sec"
                      readOnly={!!wellId}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                      ″
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* UTM & sizes */}
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  UTM northing
                </label>
                <input
                  value={utmNorthing}
                  onChange={(e) => setUtmNorthing(e.target.value)}
                  className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                  readOnly={!!wellId}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  UTM easting
                </label>
                <input
                  value={utmEasting}
                  onChange={(e) => setUtmEasting(e.target.value)}
                  className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 ${wellId ? 'bg-slate-100 dark:bg-slate-900/60' : ''}`}
                  readOnly={!!wellId}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Casing size (in)
                </label>
                <input
                  value={casingSize}
                  onChange={(e) => setCasingSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Drillpipe size (in)
                </label>
                <input
                  value={drillpipeSize}
                  onChange={(e) => setDrillpipeSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Minimum ID (in)
                </label>
                <input
                  value={minimumId}
                  onChange={(e) => setMinimumId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Ground elevation (m)
                </label>
                <input
                  value={groundElevation}
                  onChange={(e) => setGroundElevation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Rig floor elevation (m)
                </label>
                <input
                  value={rigFloorElevation}
                  onChange={(e) => setRigFloorElevation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Max inclination (°)
                </label>
                <input
                  value={maxInclination}
                  onChange={(e) => setMaxInclination(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Well profile
                </label>
                <input
                  value={wellProfile}
                  onChange={(e) => setWellProfile(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Max downhole temp (°C)
                </label>
                <input
                  value={maxDownholeTemp}
                  onChange={(e) => setMaxDownholeTemp(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  H₂S level
                </label>
                <input
                  value={h2sLevel}
                  onChange={(e) => setH2sLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>
          </section>

          {/* 4. Survey information */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Survey Information
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 4
              </span>
            </div>

            {/* Start / End / Interval */}
            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Start depth (m)
                </label>
                <input
                  value={surveyStartDepth}
                  onChange={(e) => setSurveyStartDepth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  End depth (m)
                </label>
                <input
                  value={surveyEndDepth}
                  onChange={(e) => setSurveyEndDepth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Survey interval (m)
                </label>
                <input
                  value={
                    surveyStartDepth.trim() !== "" && surveyEndDepth.trim() !== ""
                      ? surveyInterval
                      : ""
                  }
                  readOnly
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 
                            text-sm text-slate-900 outline-none focus:border-slate-900 
                            dark:border-slate-700 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
            </div>

            {/* Whipstock & Motor orientation */}
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Whipstock */}
              <div className="space-y-1">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasWhipstockOrientation}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasWhipstockOrientation(checked);
                      if (!checked) setWhipstockDepth("");
                    }}
                  />
                  Whipstock orientation
                </label>
                {hasWhipstockOrientation && (
                  <input
                    placeholder="Orient depth (m)"
                    value={whipstockDepth}
                    onChange={(e) => setWhipstockDepth(e.target.value)}
                    required={hasWhipstockOrientation}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                )}
              </div>

              {/* Motor */}
              <div className="space-y-1">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasMotorOrientation}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasMotorOrientation(checked);
                      if (!checked) setMotorDepth("");
                    }}
                  />
                  Motor orientation
                </label>
                {hasMotorOrientation && (
                  <input
                    placeholder="Orient depth (m)"
                    value={motorDepth}
                    onChange={(e) => setMotorDepth(e.target.value)}
                    required={hasMotorOrientation}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                )}
              </div>
            </div>

            {/* UBHO sub */}
            <div className="space-y-1 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasUbhoSub}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasUbhoSub(checked);
                    if (!checked) {
                      setUbhoSize("");
                      setUbhoConnSize("");
                    }
                  }}
                />
                UBHO sub
              </label>
              {hasUbhoSub && (
                <div className="grid gap-3 md:grid-cols-3 mt-1">
                  <input
                    placeholder="UBHO sub size"
                    value={ubhoSize}
                    onChange={(e) => setUbhoSize(e.target.value)}
                    required={hasUbhoSub}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    placeholder="UBHO connection size"
                    value={ubhoConnSize}
                    onChange={(e) => setUbhoConnSize(e.target.value)}
                    required={hasUbhoSub}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    type="date"
                    value={ubhoDateRequired}
                    onChange={(e) => setUbhoDateRequired(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </div>
              )}
            </div>

            {/* Side-entry sub */}
            <div className="space-y-1 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasSideEntrySub}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasSideEntrySub(checked);
                    if (!checked) {
                      setSideEntrySize("");
                      setSideEntryConnSize("");
                    }
                  }}
                />
                Side-entry sub
              </label>
              {hasSideEntrySub && (
                <div className="grid gap-3 md:grid-cols-3 mt-1">
                  <input
                    placeholder="Side-entry sub size"
                    value={sideEntrySize}
                    onChange={(e) => setSideEntrySize(e.target.value)}
                    required={hasSideEntrySub}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    placeholder="Side-entry connection size"
                    value={sideEntryConnSize}
                    onChange={(e) => setSideEntryConnSize(e.target.value)}
                    required={hasSideEntrySub}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    type="date"
                    value={sideEntryDateRequired}
                    onChange={(e) => setSideEntryDateRequired(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </div>
              )}
            </div>


            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Equipment required (date / time)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={equipmentDate}
                    onChange={(e) => setEquipmentDate(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    type="time"
                    value={equipmentTime}
                    onChange={(e) => setEquipmentTime(e.target.value)}
                    className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Crew required (date / time)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={crewDate}
                    onChange={(e) => setCrewDate(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                  <input
                    type="time"
                    value={crewTime}
                    onChange={(e) => setCrewTime(e.target.value)}
                    className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 5. Contact info & comments */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Contact & Comments
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 5
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Callout completed by
                </label>
                <input
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Designation
                </label>
                <input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Contact number
                </label>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">
                  Authorization
                </label>
                <input
                  value={authorization}
                  onChange={(e) => setAuthorization(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-600 dark:text-slate-300">
                Comments / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                placeholder="Any additional information, constraints, or special instructions…"
              />
            </div>
          </section>

          {/* footer */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {createCallout.isError && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400">
                Failed to create callout. Please check the values.
              </div>
            )}

            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => navigate("/callouts")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back to list
              </button>
              <button
                type="submit"
                disabled={createCallout.isLoading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {createCallout.isLoading ? "Creating…" : "Create Callout"}
              </button>
            </div>
          </div>
        </form>

        {/* PROGRESS SIDEBAR */}
        <aside className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Callout Progress
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                See how far you are in the callout form.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-50 dark:bg-slate-100 dark:text-slate-900">
              <Clock size={10} />
              {Math.round(overallProgress)}%
            </span>
          </div>

          {/* horizontal bar for overall progress */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* vertical stepper */}
          <ol className="mt-4 space-y-3 text-xs">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isComplete = step.complete;
              const isActive = idx === activeIndex;

              return (
                <li key={step.id} className="relative pl-6">
                  {/* vertical line */}
                  {!isLast && (
                    <span className="absolute left-1.5 top-3 h-full w-px bg-slate-200 dark:bg-slate-700" />
                  )}

                  {/* dot */}
                  <span
                    className={`absolute left-0 top-2 flex h-3 w-3 items-center justify-center rounded-full border text-[8px] ${
                      isComplete
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : isActive
                        ? "border-slate-900 bg-slate-900 text-slate-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 size={9} /> : null}
                  </span>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-slate-900 dark:text-slate-50"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isComplete ? "Done" : isActive ? "In progress" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                    {step.detail}
                  </p>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}