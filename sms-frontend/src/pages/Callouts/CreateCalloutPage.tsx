// src/pages/Callouts/CreateCalloutPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCallout } from "../../api/callout";
import {
  useGetCustomers,
  useGetClients,
  useGetRigs,
  useCreateRig,
  useGetWells,
  useGetHoleSections,
  useCreateWell,
  useGetFields,
  useGetCasingSizes,
  useGetDrillpipeSizes,
  useGetMinimumIdSizes,
  useGetPipeOptionsByHoleSection,
} from "../../api/dropdowns";
import { CheckCircle2, Clock } from "lucide-react";

type ServiceCategory = "wireline_gyro" | "memory_gyro" | "";
type PipeSelectionType = "" | "casing" | "drillpipe";

function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;

  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Parse inch sizes safely
 * Handles:
 *  - "9.625"
 *  - "9 5/8"
 *  - "12 1/4"
 *  - "8 1/2"
 */
function parseInchSize(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;

  const s = String(value).trim();
  if (!s) return null;

  // direct numeric (e.g. "9.625")
  const direct = Number(s);
  if (!Number.isNaN(direct)) return direct;

  // whole + fraction (e.g. "9 5/8", "12 1/4")
  const wf = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (wf) {
    const whole = Number(wf[1]);
    const num = Number(wf[2]);
    const den = Number(wf[3]);
    if (!Number.isNaN(whole) && !Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return whole + num / den;
    }
  }

  // fraction only (e.g. "5/8")
  const fo = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fo) {
    const num = Number(fo[1]);
    const den = Number(fo[2]);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) return num / den;
  }

  return null;
}

// ✅ Well profile dropdown options
const WELL_PROFILE_OPTIONS = [
  { label: "Vertical", value: "vertical" },
  { label: "S-shape", value: "S-shape" },
  { label: "J-shape", value: "J-shape" },
  { label: "Horizontal", value: "horizontal" },
];

export function CreateCalloutPage() {
  const navigate = useNavigate();
  const createCallout = useCreateCallout();

  // Fetch dropdown data
  const { data: customers = [] } = useGetCustomers();
  const { data: clients = [] } = useGetClients();
  const { data: fields = [] } = useGetFields();
  const { data: rigs = [], refetch: refetchRigs } = useGetRigs();
  const { mutate: createRig, isPending: isCreatingRig } = useCreateRig();
  const { data: wells = [], refetch: refetchWells } = useGetWells();
  const { data: holeSections = [] } = useGetHoleSections();
  const { mutate: createWell, isPending: isCreatingWell } = useCreateWell();

  // ✅ Fetch all available sizes from backend
  const { data: allCasingSizes = [] } = useGetCasingSizes();
  const { data: allDrillpipeSizes = [] } = useGetDrillpipeSizes();
  const { data: allMinimumIdSizes = [] } = useGetMinimumIdSizes();

  // -----------------------------
  // Create Rig modal state
  // -----------------------------
  const [isRigModalOpen, setIsRigModalOpen] = useState(false);
  const [newRig, setNewRig] = useState({
    name: "",
    rig_number: "",
  });

  const handleNewRigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRig((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateRigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRig.name && !newRig.rig_number) return;

    createRig(
      {
        ...newRig,
      } as any,
      {
        onSuccess: (created: any) => {
          refetchRigs();
          setRigId(String(created.id));
          setIsRigModalOpen(false);
          setNewRig({ name: "", rig_number: "" });
        },
      }
    );
  };

  // -----------------------------
  // Create Well modal state
  // -----------------------------
  const [isWellModalOpen, setIsWellModalOpen] = useState(false);
  const [newWell, setNewWell] = useState({
    name: "",
    well_id: "",
    well_center_lat_deg: "",
    well_center_lat_min: "",
    well_center_lat_sec: "",
    well_center_lng_deg: "",
    well_center_lng_min: "",
    well_center_lng_sec: "",
    utm_northing: "",
    utm_easting: "",
    ground_elevation_m: "",
  });

  const handleNewWellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewWell((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateWellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWell.name || !newWell.well_id) return;

    createWell(
      {
        name: newWell.name,
        well_id: newWell.well_id,
        well_center_lat_deg: toNumberOrNull(newWell.well_center_lat_deg),
        well_center_lat_min: toNumberOrNull(newWell.well_center_lat_min),
        well_center_lat_sec: toNumberOrNull(newWell.well_center_lat_sec),
        well_center_lng_deg: toNumberOrNull(newWell.well_center_lng_deg),
        well_center_lng_min: toNumberOrNull(newWell.well_center_lng_min),
        well_center_lng_sec: toNumberOrNull(newWell.well_center_lng_sec),
        utm_northing: newWell.utm_northing,
        utm_easting: newWell.utm_easting,
        ground_elevation_m: toNumberOrNull(newWell.ground_elevation_m),
      } as any,
      {
        onSuccess: (created: any) => {
          refetchWells();
          setWellId(String(created.id));

          setIsWellModalOpen(false);
          setNewWell({
            name: "",
            well_id: "",
            well_center_lat_deg: "",
            well_center_lat_min: "",
            well_center_lat_sec: "",
            well_center_lng_deg: "",
            well_center_lng_min: "",
            well_center_lng_sec: "",
            utm_northing: "",
            utm_easting: "",
            ground_elevation_m: "",
          });
        },
      }
    );
  };

  // -----------------------------
  // Form state
  // -----------------------------
  const [customerId, setCustomerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [rigId, setRigId] = useState("");
  const [fieldName, setFieldName] = useState("");

  // Well selectors
  const [wellId, setWellId] = useState("");
  const [holeSectionId, setHoleSectionId] = useState("");

  // Display fields auto-populated
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

  // Type of service
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("");

  // Wireline services
  const [wirelineCasing, setWirelineCasing] = useState(false);
  const [wirelineOrientation, setWirelineOrientation] = useState(false);
  const [wirelineDrillpipe, setWirelineDrillpipe] = useState(false);
  const [wirelinePumpdown, setWirelinePumpdown] = useState(false);
  const [wirelineOrientationMultishot, setWirelineOrientationMultishot] = useState(false);

  // Memory services
  const [memoryCasing, setMemoryCasing] = useState(false);
  const [memoryDrillpipe, setMemoryDrillpipe] = useState(false);
  const [memoryPumpdown, setMemoryPumpdown] = useState(false);
  const [dropGyroLt20, setDropGyroLt20] = useState(false);
  const [dropGyroGt20, setDropGyroGt20] = useState(false);
  const [dryHoleDropSystem, setDryHoleDropSystem] = useState(false);

  // Well information
  const [pipeType, setPipeType] = useState<PipeSelectionType>("");
  const [casingSize, setCasingSize] = useState("");
  const [drillpipeSize, setDrillpipeSize] = useState("");
  const [minimumId, setMinimumId] = useState("");

  const [groundElevation, setGroundElevation] = useState("");
  const [groundElevationRef, setGroundElevationRef] = useState("MSL");
  const [rigFloorElevation, setRigFloorElevation] = useState("");
  const [maxInclination, setMaxInclination] = useState("");

  const [wellProfile, setWellProfile] = useState("");

  const [maxDownholeTemp, setMaxDownholeTemp] = useState("");
  const [h2sLevel, setH2sLevel] = useState("");

  // Survey information
  const [surveyStartDepth, setSurveyStartDepth] = useState("");
  const [surveyEndDepth, setSurveyEndDepth] = useState("");
  const surveyInterval = (Number(surveyEndDepth) || 0) - (Number(surveyStartDepth) || 0);

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

  // Contact info & comments
  const [completedBy, setCompletedBy] = useState("");
  const [designation, setDesignation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [authorization, setAuthorization] = useState("");
  const [notes, setNotes] = useState("");

  // ✅ Dynamic options
  const [availableCasings, setAvailableCasings] = useState<Array<{ label: string; value: string; id: number }>>([]);
  const [availableDrillpipes, setAvailableDrillpipes] = useState<Array<{ label: string; value: string; id: number }>>([]);
  const [availableMinimumIds, setAvailableMinimumIds] = useState<Array<{ label: string; value: string; id: number }>>([]);

  // ✅ Fetch pipe options based on selected hole section
  const { data: pipeOptions } = useGetPipeOptionsByHoleSection(holeSectionId ? Number(holeSectionId) : null);

  // -----------------------------
  // Derived UI rules
  // -----------------------------
  const isWireline = serviceCategory === "wireline_gyro";
  const isMemory = serviceCategory === "memory_gyro";

  const shouldHideSurveyOptionsBecauseCasing = isWireline && wirelineCasing;

  const showOrientationOptions =
    isWireline && !shouldHideSurveyOptionsBecauseCasing && (wirelineOrientation || wirelineOrientationMultishot);

  const showSideEntryOptions =
    isWireline && !shouldHideSurveyOptionsBecauseCasing && (wirelineDrillpipe || wirelinePumpdown);

  const shouldShowMinimumId =
    (pipeType === "casing" && !!casingSize) || (pipeType === "drillpipe" && !!drillpipeSize);

  // -----------------------------
  // Auto-populate well data when well is selected
  // -----------------------------
  useEffect(() => {
    if (wellId) {
      const selectedWell: any = wells.find((w: any) => w.id === Number(wellId));
      if (selectedWell) {
        setWellName(selectedWell.name);
        setWellIdentifier(selectedWell.well_id);

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
      setWellName("");
      setWellIdentifier("");
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

  // -----------------------------
  // ✅ Keep MASTER minimum IDs ALWAYS from /minimum-id-sizes/
  // (Do NOT overwrite from pipeOptions.available_minimum_ids)
  // -----------------------------
  useEffect(() => {
    const allMinIdOptions = allMinimumIdSizes.map((size: any) => ({
      label: size.display_name || `${size.size}"`,
      value: String(size.size),
      id: size.id,
    }));
    setAvailableMinimumIds(allMinIdOptions);
  }, [allMinimumIdSizes]);

  // -----------------------------
  // ✅ When hole section changes - clear pipe selections
  // -----------------------------
  useEffect(() => {
    if (holeSectionId) {
      setPipeType("");
      setCasingSize("");
      setDrillpipeSize("");
      setMinimumId("");
    }
  }, [holeSectionId]);

  // -----------------------------
  // ✅ When pipeOptions arrives - update casing/drillpipe ONLY
  // -----------------------------
  useEffect(() => {
    if (!pipeOptions) return;

    if (pipeOptions.available_casing_sizes && pipeOptions.available_casing_sizes.length > 0) {
      const casingOptions = pipeOptions.available_casing_sizes.map((cs: any) => ({
        label: cs.display_name || `${cs.size}"`,
        value: String(cs.size),
        id: cs.id,
      }));
      setAvailableCasings(casingOptions);
    } else {
      setAvailableCasings([]);
      if (pipeType === "casing") setPipeType("");
    }

    if (pipeOptions.available_drillpipe_sizes && pipeOptions.available_drillpipe_sizes.length > 0) {
      const drillpipeOptions = pipeOptions.available_drillpipe_sizes.map((dp: any) => ({
        label: dp.display_name || `${dp.size}"`,
        value: String(dp.size),
        id: dp.id,
      }));
      setAvailableDrillpipes(drillpipeOptions);
    } else {
      setAvailableDrillpipes([]);
      if (pipeType === "drillpipe") setPipeType("");
    }
  }, [pipeOptions, pipeType]);

  // -----------------------------
  // ✅ Fallback for casing/drillpipe when NO hole section selected (or while loading)
  // -----------------------------
  useEffect(() => {
    if (!holeSectionId) {
      const allCasingOptions = allCasingSizes.map((cs: any) => ({
        label: cs.display_name || `${cs.size}"`,
        value: String(cs.size),
        id: cs.id,
      }));
      const allDrillpipeOptions = allDrillpipeSizes.map((dp: any) => ({
        label: dp.display_name || `${dp.size}"`,
        value: String(dp.size),
        id: dp.id,
      }));

      setAvailableCasings(allCasingOptions);
      setAvailableDrillpipes(allDrillpipeOptions);
    } else if (holeSectionId && !pipeOptions) {
      setAvailableCasings([]);
      setAvailableDrillpipes([]);
    }
  }, [holeSectionId, pipeOptions, allCasingSizes, allDrillpipeSizes]);

  // -----------------------------
  // ✅ Pipe type change clears opposite dropdown and min id if none
  // -----------------------------
  useEffect(() => {
    if (pipeType === "casing") setDrillpipeSize("");
    if (pipeType === "drillpipe") setCasingSize("");
    if (pipeType === "") {
      setCasingSize("");
      setDrillpipeSize("");
      setMinimumId("");
    }
  }, [pipeType]);

  // -----------------------------
  // ✅ Selected pipe size & filtered min IDs (THIS FIXES 9 5/8 issue + shows 6 & 8.5)
  // -----------------------------
  const selectedPipeSize = useMemo(() => {
    if (pipeType === "casing") return parseInchSize(casingSize);
    if (pipeType === "drillpipe") return parseInchSize(drillpipeSize);
    return null;
  }, [pipeType, casingSize, drillpipeSize]);

  const filteredMinimumIds = useMemo(() => {
    if (!selectedPipeSize) return [];
    return availableMinimumIds
      .filter((m) => {
        const v = parseInchSize(m.value);
        return v !== null && v < selectedPipeSize;
      })
      .sort((a, b) => (parseInchSize(b.value) ?? 0) - (parseInchSize(a.value) ?? 0)); // biggest first
  }, [availableMinimumIds, selectedPipeSize]);

  // -----------------------------
  // ✅ Auto min id to 2" if allowed, otherwise pick the first valid one
  // -----------------------------
  useEffect(() => {
    if (!(casingSize || drillpipeSize)) {
      setMinimumId("");
      return;
    }

    // try to auto-set to 2.0 if it is valid for the selected pipe
    const two = filteredMinimumIds.find((m) => parseInchSize(m.value) === 2);
    if (two) {
      setMinimumId(two.value);
      return;
    }

    // otherwise pick the largest valid minimum id (first in sorted list)
    if (filteredMinimumIds[0]) {
      setMinimumId(filteredMinimumIds[0].value);
    } else {
      setMinimumId("");
    }
  }, [casingSize, drillpipeSize, filteredMinimumIds]);

  // -----------------------------
  // Existing conditional rules + auto selections
  // -----------------------------
  useEffect(() => {
    if (isMemory) {
      setHasWhipstockOrientation(false);
      setWhipstockDepth("");
      setHasMotorOrientation(false);
      setMotorDepth("");
      setHasUbhoSub(false);
      setUbhoSize("");
      setUbhoConnSize("");
      setUbhoDateRequired("");

      setHasSideEntrySub(false);
      setSideEntrySize("");
      setSideEntryConnSize("");
      setSideEntryDateRequired("");
    }
  }, [isMemory]);

  useEffect(() => {
    if (shouldHideSurveyOptionsBecauseCasing) {
      setHasWhipstockOrientation(false);
      setWhipstockDepth("");
      setHasMotorOrientation(false);
      setMotorDepth("");
      setHasUbhoSub(false);
      setUbhoSize("");
      setUbhoConnSize("");
      setUbhoDateRequired("");

      setHasSideEntrySub(false);
      setSideEntrySize("");
      setSideEntryConnSize("");
      setSideEntryDateRequired("");
    }
  }, [shouldHideSurveyOptionsBecauseCasing]);

  useEffect(() => {
    if (isWireline && !shouldHideSurveyOptionsBecauseCasing && (wirelineDrillpipe || wirelinePumpdown)) {
      setHasSideEntrySub(true);
    }
  }, [isWireline, shouldHideSurveyOptionsBecauseCasing, wirelineDrillpipe, wirelinePumpdown]);

  useEffect(() => {
    if (!showSideEntryOptions) {
      setHasSideEntrySub(false);
      setSideEntrySize("");
      setSideEntryConnSize("");
      setSideEntryDateRequired("");
    }
  }, [showSideEntryOptions]);

  useEffect(() => {
    if (!showOrientationOptions) {
      setHasWhipstockOrientation(false);
      setWhipstockDepth("");
      setHasMotorOrientation(false);
      setMotorDepth("");
      setHasUbhoSub(false);
      setUbhoSize("");
      setUbhoConnSize("");
      setUbhoDateRequired("");
    }
  }, [showOrientationOptions]);

  const isStep1Complete = () => customerId.trim() !== "" &&  clientId.trim() !== "" && rigId.trim() !== "" && fieldName.trim() !== "";

  // ----------------------------------------------------------
  // Progress / step status
  // ----------------------------------------------------------
  const steps = useMemo(() => {
    const refsComplete = !!customerId && !!rigId && !!fieldName;

    const wellGroupComplete =
      !!wellId ||
      !!holeSectionId ||
      !!pipeType ||
      !!casingSize ||
      !!drillpipeSize ||
      !!minimumId ||
      !!groundElevation ||
      !!groundElevationRef ||
      !!rigFloorElevation ||
      !!maxInclination ||
      !!wellProfile ||
      !!maxDownholeTemp ||
      !!h2sLevel ||
      !!latDeg ||
      !!lngDeg ||
      !!utmNorthing ||
      !!utmEasting;

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

    const surveyComplete = !!surveyStartDepth || !!surveyEndDepth || !!surveyInterval;

    const contactComplete = !!completedBy || !!designation || !!contactNumber || !!authorization;

    return [
      { id: "refs", title: "General Information", detail: "Customer, Rig & Field Name", complete: refsComplete },
      { id: "service", title: "Type of Service", detail: "Wireline / memory gyro and service options.", complete: serviceComplete },
      { id: "well", title: "Well Information", detail: "Well details, coordinates and well parameters.", complete: wellGroupComplete },
      { id: "survey", title: "Survey Information", detail: "Depth ranges, orientation points & subs.", complete: surveyComplete },
      { id: "contact", title: "Contact & Comments", detail: "Callout owner, approvals and notes.", complete: contactComplete },
    ];
  }, [
    customerId,
    rigId,
    fieldName,
    wellId,
    holeSectionId,
    pipeType,
    casingSize,
    drillpipeSize,
    minimumId,
    groundElevation,
    groundElevationRef,
    rigFloorElevation,
    maxInclination,
    wellProfile,
    maxDownholeTemp,
    h2sLevel,
    latDeg,
    lngDeg,
    utmNorthing,
    utmEasting,
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

  const overallProgress = (steps.filter((s) => s.complete).length / steps.length) * 100;

  // ✅ Helper function to find ID by size value
  const findIdBySize = (options: Array<{ value: string; id: number }>, sizeValue: string): number | null => {
    if (!sizeValue) return null;
    const option = options.find((opt) => opt.value === sizeValue);
    return option ? option.id : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rigId || !customerId) return;

    // Find IDs by size values
    const casingId = findIdBySize(availableCasings, casingSize);
    const drillpipeId = findIdBySize(availableDrillpipes, drillpipeSize);
    const minimumIdObj = availableMinimumIds.find((minIdOpt) => minIdOpt.value === minimumId);
    const minimumIdId = minimumIdObj ? minimumIdObj.id : null;

    createCallout.mutate(
      {
        rig_number: Number(rigId),
        customer: Number(customerId),
        client: clientId ? Number(clientId) : null,
        field_name: Number(fieldName),
        well: wellId ? Number(wellId) : null,
        hole_section: holeSectionId ? Number(holeSectionId) : null,

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

        well_center_lat_deg: toNumberOrNull(latDeg),
        well_center_lat_min: toNumberOrNull(latMin),
        well_center_lat_sec: toNumberOrNull(latSec),
        well_center_lng_deg: toNumberOrNull(lngDeg),
        well_center_lng_min: toNumberOrNull(lngMin),
        well_center_lng_sec: toNumberOrNull(lngSec),

        utm_northing: utmNorthing,
        utm_easting: utmEasting,

        pipe_selection_type: pipeType || null,

        // ✅ Send IDs from backend
        casing_size_inch: casingId,
        drillpipe_size_inch: drillpipeId,
        minimum_id_inch: minimumIdId,

        ground_elevation_m: toNumberOrNull(groundElevation),
        ground_elevation_ref: groundElevationRef || null,

        rig_floor_elevation_m: toNumberOrNull(rigFloorElevation),
        maximum_inclination_deg: toNumberOrNull(maxInclination),

        well_profile: wellProfile || "",

        max_downhole_temp_c: toNumberOrNull(maxDownholeTemp),
        h2s_level: h2sLevel,

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

        callout_completed_by: completedBy,
        completed_by_designation: designation,
        contact_number: contactNumber,
        authorization,
        notes,
      } as any,
      {
        onSuccess: () => navigate("/callouts"),
      }
    );
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">New Callout</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Capture a detailed service request for wireline or memory gyro surveys.
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
            maxHeight: "80vh",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(0, 0, 0) transparent",
          }}
        >
          {/* -------------------- Step 1: General Information -------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isStep1Complete()
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Step 1
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Customer */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="">Select Client</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Field Name */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Field Name *</label>
                <select
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Field</option>
                  {fields.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.field_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>



            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {/* Well dropdown + Create Well button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-600 dark:text-slate-300">Well Name *</label>
                  <button
                    type="button"
                    onClick={() => setIsWellModalOpen(true)}
                    className="text-[10px] rounded-full border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    + Create Well
                  </button>
                </div>

                <select
                  value={wellId}
                  onChange={(e) => setWellId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select Well</option>
                  {wells.map((well: any) => (
                    <option key={well.id} value={well.id}>
                      {well.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rig dropdown + create rig */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-600 dark:text-slate-300">Rig *</label>
                  <button
                    type="button"
                    onClick={() => setIsRigModalOpen(true)}
                    className="text-[10px] rounded-full border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    + Create Rig
                  </button>
                </div>

                <select
                  value={rigId}
                  onChange={(e) => setRigId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                  required
                >
                  <option value="">Select Rig</option>
                  {rigs.map((rig: any) => (
                    <option key={rig.id} value={rig.id}>
                      {rig.name || rig.rig_number || rig.number || `Rig #${rig.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Read-only selected well summary */}
            {wellId ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <span className="text-slate-500">Well Name:</span>
                    <span className="ml-2 font-medium">{wellName}</span>
                  </div>

                  <div>
                    <span className="text-slate-500">Well ID:</span>
                    <span className="ml-2 font-medium">{wellIdentifier}</span>
                  </div>

                  <div>
                    <span className="text-slate-500">Well center latitude:</span>
                    <span className="ml-2 font-medium">
                      {latDeg && latMin && latSec ? `${latDeg}° ${latMin}' ${latSec}"` : "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">Well center longitude:</span>
                    <span className="ml-2 font-medium">
                      {lngDeg && lngMin && lngSec ? `${lngDeg}° ${lngMin}' ${lngSec}"` : "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">UTM northing:</span>
                    <span className="ml-2 font-medium">{utmNorthing || "—"}</span>
                  </div>

                  <div>
                    <span className="text-slate-500">UTM easting:</span>
                    <span className="ml-2 font-medium">{utmEasting || "—"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Select a well to view well ID, coordinates, and UTM values.
              </div>
            )}

            {/* requested fields */}
            <div className="grid gap-4 md:grid-cols-3 text-xs mt-3">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Depth Reference</label>
                <select
                  value={groundElevationRef}
                  onChange={(e) => setGroundElevationRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select reference</option>
                  <option value="MSL">MSL (Mean Sea Level)</option>
                  <option value="GL">GL (Ground Level)</option>
                  <option value="KB">KB (Kelly Bushing)</option>
                  <option value="DF">DF (Derrick Floor)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Ground elevation (m)</label>
                <input
                  value={groundElevation}
                  onChange={(e) => setGroundElevation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Rig floor elevation (m)</label>
                <input
                  value={rigFloorElevation}
                  onChange={(e) => setRigFloorElevation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Max inclination (°)</label>
                <input
                  value={maxInclination}
                  onChange={(e) => setMaxInclination(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              {/* ✅ UPDATED: Well profile dropdown */}
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Well profile</label>
                <select
                  value={wellProfile}
                  onChange={(e) => setWellProfile(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select well profile</option>
                  {WELL_PROFILE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Max downhole temp (°C)</label>
                <input
                  value={maxDownholeTemp}
                  onChange={(e) => setMaxDownholeTemp(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">H₂S level</label>
                <select
                  value={h2sLevel}
                  onChange={(e) => setH2sLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select H₂S level</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </section>

          {/* -------------------- Step 2: Type of service required -------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 2
              </span>
            </div>

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

            {serviceCategory === "wireline_gyro" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">Wireline gyro services</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={wirelineCasing} onChange={(e) => setWirelineCasing(e.target.checked)} />
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
                    <input type="checkbox" checked={wirelinePumpdown} onChange={(e) => setWirelinePumpdown(e.target.checked)} />
                    Pump down survey
                  </label>

                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={wirelineOrientationMultishot}
                      onChange={(e) => setWirelineOrientationMultishot(e.target.checked)}
                    />
                    Orientation / multishot survey
                  </label>
                </div>

                {wirelineCasing && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Casing gyro survey selected: orientation/sub options are not required.
                  </p>
                )}
              </div>
            )}

            {serviceCategory === "memory_gyro" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">Memory gyro services</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={memoryCasing} onChange={(e) => setMemoryCasing(e.target.checked)} />
                    Casing (slickline / memory)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={memoryDrillpipe} onChange={(e) => setMemoryDrillpipe(e.target.checked)} />
                    Drillpipe (slickline / memory)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={memoryPumpdown} onChange={(e) => setMemoryPumpdown(e.target.checked)} />
                    Pump down survey
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={dropGyroLt20} onChange={(e) => setDropGyroLt20(e.target.checked)} />
                    Drop gyro &lt; 20"
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={dropGyroGt20} onChange={(e) => setDropGyroGt20(e.target.checked)} />
                    Drop gyro &gt; 20"
                  </label>
                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input type="checkbox" checked={dryHoleDropSystem} onChange={(e) => setDryHoleDropSystem(e.target.checked)} />
                    Dry hole drop gyro system
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* ✅ Orientation options ONLY when Wireline + Orientation/Multishot + NOT casing */}
          {showOrientationOptions && (
            <>
              <div className="grid gap-4 md:grid-cols-2 text-xs">
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
                        setUbhoDateRequired("");
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
                  </div>
                )}
              </div>
            </>
          )}

          {/* ✅ Side-entry options */}
          {showSideEntryOptions && (
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
                      setSideEntryDateRequired("");
                    }
                  }}
                />
                Side-entry sub
                {isWireline && wirelineDrillpipe && (
                  <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Auto-selected (Drillpipe)
                  </span>
                )}
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
                </div>
              )}
            </div>
          )}

          {/* -------------------- Step 3: Well Information -------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 3
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Hole Section</label>
                <select
                  value={holeSectionId}
                  onChange={(e) => setHoleSectionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                >
                  <option value="">Select Hole Section</option>

                  {[...holeSections]
                    .sort((a: any, b: any) => {
                      const numA = parseFloat(String(a.name).replace(",", "."));
                      const numB = parseFloat(String(b.name).replace(",", "."));

                      const aHasNum = Number.isFinite(numA);
                      const bHasNum = Number.isFinite(numB);

                      if (aHasNum && bHasNum) return numA - numB;
                      if (aHasNum && !bHasNum) return -1;
                      if (!aHasNum && bHasNum) return 1;

                      return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: "base" });
                    })
                    .map((section: any) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* ✅ Pipe type selection (exclusive checkboxes) */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300">Select Pipe Type</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pipeType === "casing"}
                      onChange={(e) => setPipeType(e.target.checked ? "casing" : "")}
                    />
                    Casing
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pipeType === "drillpipe"}
                      onChange={(e) => setPipeType(e.target.checked ? "drillpipe" : "")}
                    />
                    Drillpipe
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" />
                    tubing
                  </label>
                </div>
              </div>

              {/* ✅ Casing dropdown */}
              {pipeType === "casing" && (
                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-300">Casing size</label>
                  <select
                    value={casingSize}
                    onChange={(e) => setCasingSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    disabled={availableCasings.length === 0}
                  >
                    <option value="">
                      {availableCasings.length === 0 ? "No casing options for this hole section" : "Select casing size"}
                    </option>
                    {availableCasings.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {holeSectionId && availableCasings.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      No casing options available for this hole section. Consider selecting drillpipe instead.
                    </p>
                  )}
                </div>
              )}

              {/* ✅ Drillpipe dropdown */}
              {pipeType === "drillpipe" && (
                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-300">Drillpipe size</label>
                  <select
                    value={drillpipeSize}
                    onChange={(e) => setDrillpipeSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    disabled={availableDrillpipes.length === 0}
                  >
                    <option value="">
                      {availableDrillpipes.length === 0 ? "No drillpipe options for this hole section" : "Select drillpipe size"}
                    </option>
                    {availableDrillpipes.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {holeSectionId && availableDrillpipes.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      No drillpipe options available for this hole section. Consider selecting casing instead.
                    </p>
                  )}
                </div>
              )}

              {/* ✅ Minimum ID dropdown (FILTERED BY SELECTED PIPE SIZE) */}
              {shouldShowMinimumId && (
                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-300">Minimum ID</label>
                  <select
                    value={minimumId}
                    onChange={(e) => setMinimumId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    disabled={filteredMinimumIds.length === 0}
                  >
                    <option value="">
                      {filteredMinimumIds.length === 0 ? "No minimum IDs available for this pipe size" : "Select minimum ID"}
                    </option>
                    {filteredMinimumIds.map((minIdOpt) => (
                      <option key={minIdOpt.id ?? minIdOpt.value} value={minIdOpt.value}>
                        {minIdOpt.label}
                      </option>
                    ))}
                  </select>

                  {(casingSize || drillpipeSize) && parseInchSize(minimumId) === 2 && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Auto-set (prefers 2"). You can change if needed.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* -------------------- Step 4: Survey information -------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 4
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Start depth (m)</label>
                <input
                  value={surveyStartDepth}
                  onChange={(e) => setSurveyStartDepth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">End depth (m)</label>
                <input
                  value={surveyEndDepth}
                  onChange={(e) => setSurveyEndDepth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Survey interval (m)</label>
                <input
                  value={surveyStartDepth.trim() !== "" && surveyEndDepth.trim() !== "" ? surveyInterval : ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-700 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Equipment required (date / time)</label>
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
                <label className="block text-slate-600 dark:text-slate-300">Crew required (date / time)</label>
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

          {/* -------------------- Step 5: Contact info & comments -------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Step 5
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Callout completed by</label>
                <input
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Designation</label>
                <input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Contact number</label>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 dark:text-slate-300">Authorization</label>
                <input
                  value={authorization}
                  onChange={(e) => setAuthorization(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-600 dark:text-slate-300">Comments / Notes</label>
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
              <div className="text-[11px] text-rose-600 dark:text-rose-400">Failed to create callout. Please check the values.</div>
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Callout Progress</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">See how far you are in the callout form.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-50 dark:bg-slate-100 dark:text-slate-900">
              <Clock size={10} />
              {Math.round(overallProgress)}%
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100" style={{ width: `${overallProgress}%` }} />
          </div>

          <ol className="mt-4 space-y-3 text-xs">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isComplete = step.complete;
              const isActive = idx === activeIndex;

              return (
                <li key={step.id} className="relative pl-6">
                  {!isLast && <span className="absolute left-1.5 top-3 h-full w-px bg-slate-200 dark:bg-slate-700" />}

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
                    <span className={`text-xs font-semibold ${isActive ? "text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-200"}`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{isComplete ? "Done" : isActive ? "In progress" : "Pending"}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">{step.detail}</p>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {/* ✅ CREATE WELL MODAL */}
      {isWellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Create Well</h2>
              <button
                type="button"
                onClick={() => setIsWellModalOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleCreateWellSubmit}>
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">
                  Well Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  value={newWell.name}
                  onChange={handleNewWellChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">
                  Well ID <span className="text-rose-500">*</span>
                </label>
                <input
                  name="well_id"
                  value={newWell.well_id}
                  onChange={handleNewWellChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">Latitude (deg / min / sec)</label>
                  <div className="flex gap-2">
                    <input
                      name="well_center_lat_deg"
                      value={newWell.well_center_lat_deg}
                      onChange={handleNewWellChange}
                      placeholder="deg"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lat_min"
                      value={newWell.well_center_lat_min}
                      onChange={handleNewWellChange}
                      placeholder="min"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lat_sec"
                      value={newWell.well_center_lat_sec}
                      onChange={handleNewWellChange}
                      placeholder="sec"
                      type="number"
                      step="0.001"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">Longitude (deg / min / sec)</label>
                  <div className="flex gap-2">
                    <input
                      name="well_center_lng_deg"
                      value={newWell.well_center_lng_deg}
                      onChange={handleNewWellChange}
                      placeholder="deg"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lng_min"
                      value={newWell.well_center_lng_min}
                      onChange={handleNewWellChange}
                      placeholder="min"
                      type="number"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      name="well_center_lng_sec"
                      value={newWell.well_center_lng_sec}
                      onChange={handleNewWellChange}
                      placeholder="sec"
                      type="number"
                      step="0.001"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">UTM northing</label>
                  <input
                    name="utm_northing"
                    value={newWell.utm_northing}
                    onChange={handleNewWellChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">UTM easting</label>
                  <input
                    name="utm_easting"
                    value={newWell.utm_easting}
                    onChange={handleNewWellChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWellModalOpen(false)}
                  className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWell}
                  className="text-xs rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingWell ? "Creating…" : "Create Well"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ CREATE RIG MODAL */}
      {isRigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Create Rig</h2>
              <button
                type="button"
                onClick={() => setIsRigModalOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleCreateRigSubmit}>
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500">Rig Number</label>
                <input
                  name="rig_number"
                  value={newRig.rig_number}
                  onChange={handleNewRigChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  placeholder="e.g. 101"
                />
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRigModalOpen(false)}
                  className="text-xs rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRig}
                  className="text-xs rounded-full border border-emerald-500 bg-emerald-500 px-3 py-1.5 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingRig ? "Creating…" : "Create Rig"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
