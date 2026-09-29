import type { HTMLAttributes } from "react";

export type MachineCategory =
  | "mill"
  | "smt"
  | "press"
  | "robot"
  | "laser"
  | "forging"
  | "lathe"
  | "welder"
  | "oven"
  | "inspection"
  | "fan"
  | "generic";

interface EquipmentSchematicIconProps extends HTMLAttributes<HTMLDivElement> {
  machineId?: string;
  name?: string;
  type?: string;
  /** Accepted for call-site compatibility; status is shown beside the thumbnail, not in it. */
  status?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function resolveMachineCategory(id = "", name = "", type = ""): MachineCategory {
  const combined = `${id} ${name} ${type}`.toLowerCase();
  if (combined.includes("mill") || combined.includes("cnc mill")) return "mill";
  if (combined.includes("ysm") || combined.includes("pick-and-place") || combined.includes("smt")) return "smt";
  if (combined.includes("hydropress") || (combined.includes("press") && !combined.includes("titan"))) return "press";
  if (combined.includes("titan") || combined.includes("forging")) return "forging";
  if (combined.includes("roboarm") || (combined.includes("robot") && !combined.includes("weld"))) return "robot";
  if (combined.includes("laser") || combined.includes("cut")) return "laser";
  if (combined.includes("lathe")) return "lathe";
  if (combined.includes("weld")) return "welder";
  if (combined.includes("heller") || combined.includes("reflow") || combined.includes("oven")) return "oven";
  if (combined.includes("kohyoung") || combined.includes("aoi") || combined.includes("inspection")) return "inspection";
  if (combined.includes("fan") || combined.includes("cleanfan") || combined.includes("air handler")) return "fan";
  return "generic";
}

/** Line-drawn machine thumbnail by equipment category. Decorative: the machine name sits beside it. */
export function EquipmentSchematicIcon({
  machineId = "",
  name = "",
  type = "",
  size = "md",
  className = "",
  status: _status,
  ...rest
}: EquipmentSchematicIconProps) {
  const category = resolveMachineCategory(machineId, name, type);

  const dimensions = {
    sm: "w-11 h-11 min-w-[44px]",
    md: "w-14 h-14 min-w-[56px]",
    lg: "w-18 h-18 min-w-[72px]",
    xl: "w-28 h-28 min-w-[112px] sm:w-32 sm:h-32 sm:min-w-[128px] p-2.5"
  }[size];

  const strokeColor = "currentColor";

  return (
    <div
      className={`relative flex items-center justify-center rounded-[var(--radius-control)] border border-line bg-sunken p-1.5 overflow-hidden shrink-0 text-body ${dimensions} ${className}`}
      aria-hidden="true"
      {...rest}
    >
      {/* Vector Schematics tailored per machine category */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full p-0.5"
      >
        {category === "mill" && (
          /* 5-Axis CNC Mill: Column, Gantry, Spindle Head, Endmill, Trunnion Rotary Table, Enclosure */
          <g>
            {/* Machine Enclosure */}
            <rect x="7" y="6" width="34" height="36" rx="3" strokeWidth="1.6" />
            <path d="M12 6v6h24V6" strokeDasharray="2 2" strokeWidth="1" />
            {/* Viewing Window */}
            <rect x="12" y="14" width="24" height="20" rx="1.5" strokeWidth="1.3" opacity="0.85" />
            {/* Spindle Column & Carriage */}
            <path d="M21 14h6v6h-6z" fill="currentColor" fillOpacity="0.15" />
            <line x1="24" y1="20" x2="24" y2="25" strokeWidth="2.2" />
            {/* Endmill tool */}
            <polygon points="22.5,25 25.5,25 24,28" fill="currentColor" />
            {/* Trunnion 5-Axis Table */}
            <path d="M16 30h16v3H16z" fill="currentColor" fillOpacity="0.2" />
            <line x1="19" y1="33" x2="17" y2="36" />
            <line x1="29" y1="33" x2="31" y2="36" />
            {/* Digital Display & Status */}
            <circle cx="37" cy="10" r="1.5" fill="currentColor" />
            <line x1="33" y1="10" x2="35" y2="10" strokeWidth="1.2" />
          </g>
        )}

        {category === "smt" && (
          /* SMT Pick-and-Place: Dual-rail conveyor, high-speed dual gantry head, tape reels */
          <g>
            <rect x="6" y="8" width="36" height="32" rx="2.5" strokeWidth="1.6" />
            {/* PCB Conveyor Rail */}
            <line x1="6" y1="26" x2="42" y2="26" strokeWidth="2" />
            <line x1="6" y1="30" x2="42" y2="30" strokeWidth="1" strokeDasharray="3 2" />
            {/* Dual Gantry Beams */}
            <line x1="14" y1="11" x2="14" y2="23" strokeWidth="1.5" />
            <line x1="34" y1="11" x2="34" y2="23" strokeWidth="1.5" />
            <rect x="18" y="13" width="12" height="7" rx="1" fill="currentColor" fillOpacity="0.15" />
            {/* Vacuum Nozzle Heads */}
            <line x1="21" y1="20" x2="21" y2="24" strokeWidth="1.8" />
            <line x1="27" y1="20" x2="27" y2="24" strokeWidth="1.8" />
            {/* Feeder Tape Reels */}
            <circle cx="11" cy="35" r="2.5" strokeWidth="1.2" />
            <circle cx="17" cy="35" r="2.5" strokeWidth="1.2" />
            <circle cx="31" cy="35" r="2.5" strokeWidth="1.2" />
            <circle cx="37" cy="35" r="2.5" strokeWidth="1.2" />
          </g>
        )}

        {category === "press" && (
          /* Hydraulic Stamping Press: Tie rods, crown, hydraulic cylinder, ram, bolster */
          <g>
            {/* Crown Top & Bed Base */}
            <rect x="8" y="6" width="32" height="6" rx="1.5" fill="currentColor" fillOpacity="0.2" />
            <rect x="7" y="36" width="34" height="6" rx="1.5" fill="currentColor" fillOpacity="0.2" />
            {/* Vertical 4-Tie Columns */}
            <line x1="12" y1="12" x2="12" y2="36" strokeWidth="2" />
            <line x1="36" y1="12" x2="36" y2="36" strokeWidth="2" />
            {/* Hydraulic Cylinder */}
            <rect x="20" y="12" width="8" height="9" rx="1" fill="currentColor" fillOpacity="0.15" />
            {/* Ram Piston & Slide */}
            <line x1="24" y1="21" x2="24" y2="25" strokeWidth="2.5" />
            <rect x="14" y="25" width="20" height="6" rx="1" fill="currentColor" fillOpacity="0.3" strokeWidth="1.4" />
            {/* Pressure Gauge */}
            <circle cx="30" cy="9" r="2" fill="currentColor" />
          </g>
        )}

        {category === "robot" && (
          /* 6-Axis Articulated Robot: Base turntable, shoulder, articulated arm, 2-finger gripper */
          <g>
            {/* Base Flange & Turntable */}
            <rect x="8" y="38" width="14" height="4" rx="1" fill="currentColor" fillOpacity="0.25" />
            <circle cx="15" cy="35" r="3" strokeWidth="1.8" />
            {/* Lower Arm & Shoulder */}
            <line x1="15" y1="32" x2="21" y2="20" strokeWidth="2.4" />
            <circle cx="21" cy="20" r="3.2" fill="currentColor" fillOpacity="0.15" strokeWidth="1.8" />
            {/* Forearm */}
            <line x1="21" y1="20" x2="33" y2="15" strokeWidth="2.2" />
            {/* Wrist */}
            <circle cx="33" cy="15" r="2.2" strokeWidth="1.6" />
            <line x1="33" y1="15" x2="38" y2="19" strokeWidth="2" />
            {/* Parallel Gripper */}
            <path d="M37 17l4 3m-5 4l4-3" strokeWidth="2" />
            <line x1="41" y1="18" x2="41" y2="22" strokeWidth="1.8" />
          </g>
        )}

        {category === "laser" && (
          /* Fiber Laser Cutter: Enclosed table, gantry beam, conical laser cutting nozzle with beam */
          <g>
            <rect x="6" y="9" width="36" height="30" rx="3" strokeWidth="1.6" />
            {/* Window */}
            <rect x="10" y="13" width="28" height="15" rx="1.5" strokeDasharray="3 2" opacity="0.8" />
            {/* Overhead Bridge Beam */}
            <line x1="10" y1="18" x2="38" y2="18" strokeWidth="1.6" />
            {/* Laser Carriage & Conical Cutting Head */}
            <rect x="21" y="16" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
            <polygon points="22.5,21 25.5,21 24,25" fill="currentColor" />
            {/* Cutting Table Grate */}
            <line x1="10" y1="32" x2="38" y2="32" strokeWidth="2" />
            <line x1="14" y1="29" x2="14" y2="35" strokeWidth="1" />
            <line x1="20" y1="29" x2="20" y2="35" strokeWidth="1" />
            <line x1="26" y1="29" x2="26" y2="35" strokeWidth="1" />
            <line x1="32" y1="29" x2="32" y2="35" strokeWidth="1" />
            {/* Spark point */}
            <circle cx="24" cy="27" r="1" fill="currentColor" />
          </g>
        )}

        {category === "forging" && (
          /* Heavy Forging Hydraulic Press: Massive arch frame, accumulator, anvil */
          <g>
            <path d="M8 42V10a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v32" strokeWidth="2" />
            <rect x="14" y="6" width="20" height="8" rx="1" fill="currentColor" fillOpacity="0.25" />
            {/* Heavy Hydraulic Ram Slider */}
            <rect x="17" y="17" width="14" height="11" rx="1.5" fill="currentColor" fillOpacity="0.3" strokeWidth="1.5" />
            {/* Guide keyways */}
            <line x1="14" y1="14" x2="14" y2="38" strokeWidth="1.4" strokeDasharray="2 2" />
            <line x1="34" y1="14" x2="34" y2="38" strokeWidth="1.4" strokeDasharray="2 2" />
            {/* Lower Forging Anvil Die */}
            <polygon points="12,42 36,42 32,34 16,34" fill="currentColor" fillOpacity="0.2" />
          </g>
        )}

        {category === "lathe" && (
          /* CNC Lathe: Slant bed, chuck headstock, Z-ways, tool turret, tailstock */
          <g>
            {/* Slant Bed Frame */}
            <path d="M6 38l6-24h28l2 24z" fill="currentColor" fillOpacity="0.08" strokeWidth="1.6" />
            {/* Headstock & Chuck */}
            <rect x="9" y="17" width="7" height="15" rx="1" fill="currentColor" fillOpacity="0.3" strokeWidth="1.4" />
            <line x1="16" y1="20" x2="19" y2="20" strokeWidth="2" />
            <line x1="16" y1="29" x2="19" y2="29" strokeWidth="2" />
            {/* Workpiece */}
            <rect x="19" y="22" width="13" height="5" fill="currentColor" fillOpacity="0.15" />
            {/* Tool Turret */}
            <polygon points="26,17 31,17 32,22 25,22" fill="currentColor" fillOpacity="0.3" strokeWidth="1.4" />
            <line x1="26" y1="22" x2="24" y2="24" strokeWidth="1.8" />
            {/* Tailstock Quill */}
            <polygon points="34,22 38,20 38,29 34,27" fill="currentColor" fillOpacity="0.25" />
            <line x1="38" y1="24.5" x2="41" y2="24.5" strokeWidth="2" />
          </g>
        )}

        {category === "welder" && (
          /* Robotic Welding Cell: Robot arm with MIG welding torch, arc nozzle, ground clamp */
          <g>
            <rect x="7" y="36" width="12" height="6" rx="1" fill="currentColor" fillOpacity="0.25" />
            <circle cx="13" cy="33" r="3" strokeWidth="1.6" />
            {/* Main Joint & Arm */}
            <line x1="13" y1="30" x2="18" y2="18" strokeWidth="2.4" />
            <circle cx="18" cy="18" r="2.8" fill="currentColor" fillOpacity="0.2" />
            <line x1="18" y1="18" x2="31" y2="14" strokeWidth="2.2" />
            {/* Torch Head & Wire Conduit */}
            <path d="M31 14l6 8-4 3-6-8" fill="currentColor" fillOpacity="0.25" strokeWidth="1.4" />
            <line x1="37" y1="22" x2="42" y2="27" strokeWidth="2.2" />
            {/* Welding Arc Ray Burst */}
            <circle cx="43" cy="28" r="1.5" fill="currentColor" />
            <line x1="43" y1="25" x2="43" y2="23" strokeWidth="1" />
            <line x1="46" y1="28" x2="48" y2="28" strokeWidth="1" />
            <line x1="45" y1="30" x2="47" y2="32" strokeWidth="1" />
          </g>
        )}

        {category === "oven" && (
          /* Reflow Soldering Oven: Multi-zone heated tunnel, exhaust stacks, beacon tower */
          <g>
            <rect x="6" y="16" width="36" height="22" rx="2" strokeWidth="1.6" />
            {/* Conveyor slot */}
            <line x1="6" y1="28" x2="42" y2="28" strokeWidth="1.8" strokeDasharray="3 1.5" />
            {/* Heating Zone Portals */}
            <rect x="10" y="20" width="6" height="5" rx="0.5" fill="currentColor" fillOpacity="0.15" />
            <rect x="18" y="20" width="6" height="5" rx="0.5" fill="currentColor" fillOpacity="0.15" />
            <rect x="26" y="20" width="6" height="5" rx="0.5" fill="currentColor" fillOpacity="0.15" />
            <rect x="34" y="20" width="6" height="5" rx="0.5" fill="currentColor" fillOpacity="0.15" />
            {/* Exhaust Stacks */}
            <rect x="14" y="10" width="4" height="6" strokeWidth="1.2" />
            <rect x="30" y="10" width="4" height="6" strokeWidth="1.2" />
            {/* 3-Tier Status Tower */}
            <line x1="39" y1="16" x2="39" y2="6" strokeWidth="1.4" />
            <circle cx="39" cy="6" r="1.5" fill="currentColor" />
            <circle cx="39" cy="10" r="1.5" fill="currentColor" fillOpacity="0.5" />
          </g>
        )}

        {category === "inspection" && (
          /* 3D AOI Inspection: Optical hood, telecentric zoom lens, ring light, X-Y table */
          <g>
            <path d="M10 40V14a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v26" strokeWidth="1.6" />
            {/* Top Optical Sensor Mount */}
            <rect x="18" y="8" width="12" height="6" rx="1" fill="currentColor" fillOpacity="0.25" strokeWidth="1.4" />
            {/* Telecentric Camera Tube */}
            <rect x="21" y="14" width="6" height="9" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
            {/* Structured Light Ring */}
            <ellipse cx="24" cy="25" rx="7" ry="2.5" strokeWidth="1.6" />
            {/* Inspection Projection Area */}
            <path d="M17 26l-3 8h20l-3-8" strokeDasharray="2 2" strokeWidth="1" opacity="0.75" />
            {/* Inspection Stage Bed */}
            <rect x="12" y="34" width="24" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
          </g>
        )}

        {category === "fan" && (
          /* Cleanroom Air Handler: Centrifugal fan scroll, impeller blades, HEPA filter plenum */
          <g>
            {/* Fan Housing & Plenum */}
            <rect x="8" y="8" width="32" height="32" rx="3" strokeWidth="1.6" />
            {/* Centrifugal Blower Circle */}
            <circle cx="24" cy="24" r="10" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />
            {/* Impeller Blades */}
            <path d="M24 14a10 10 0 0 1 7 3" strokeWidth="1.6" />
            <path d="M34 24a10 10 0 0 1-3 7" strokeWidth="1.6" />
            <path d="M24 34a10 10 0 0 1-7-3" strokeWidth="1.6" />
            <path d="M14 24a10 10 0 0 1 3-7" strokeWidth="1.6" />
            {/* Air Flow Pleats */}
            <line x1="12" y1="12" x2="16" y2="12" strokeWidth="1.2" />
            <line x1="32" y1="36" x2="36" y2="36" strokeWidth="1.2" />
          </g>
        )}

        {category === "generic" && (
          /* Industrial telemetry controller */
          <g>
            <rect x="8" y="10" width="32" height="28" rx="2" strokeWidth="1.6" />
            <rect x="13" y="15" width="22" height="12" rx="1" fill="currentColor" fillOpacity="0.15" />
            <line x1="13" y1="32" x2="21" y2="32" strokeWidth="1.8" />
            <circle cx="27" cy="32" r="1.5" fill="currentColor" />
            <circle cx="32" cy="32" r="1.5" fill="currentColor" />
          </g>
        )}
      </svg>

    </div>
  );
}
