// Equipment database per clinic type
// Each item includes utility requirements for the equipment matrix

interface EquipmentTemplate {
  id: string;
  name: string;
  room: string;
  quantity: number;
  hot_water: boolean;
  cold_water: boolean;
  drain: boolean;
  gas: boolean;
  dedicated_circuit: boolean;
  standard_outlet: boolean;
  data: boolean;
  mechanical_vent: boolean;
  notes: string;
}

export const EQUIPMENT_DATABASE: Record<string, EquipmentTemplate[]> = {
  dental: [
    { id: 'EQ-D01', name: 'Dental Chair w/ Delivery System', room: 'Operatory', quantity: 3, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Rear delivery preferred. 120V/20A dedicated per chair.' },
    { id: 'EQ-D02', name: 'Panoramic X-Ray (OPG)', room: 'X-Ray / Pano Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Lead-lined walls req. 208V/30A dedicated circuit.' },
    { id: 'EQ-D03', name: 'Intraoral X-Ray Sensor', room: 'Operatory', quantity: 3, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'USB connection to operatory workstation.' },
    { id: 'EQ-D04', name: 'Autoclave (Class B)', room: 'Sterilization', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: true, notes: '208V/20A. Requires steam exhaust to exterior.' },
    { id: 'EQ-D05', name: 'Ultrasonic Cleaner', room: 'Sterilization', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Adjacent to dirty-side of sterilization workflow.' },
    { id: 'EQ-D06', name: 'Dental Compressor (Oil-Free)', room: 'Storage / Mechanical', quantity: 1, hot_water: false, cold_water: false, drain: true, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: true, notes: '208V/30A. Noise isolation required. Condensate drain.' },
    { id: 'EQ-D07', name: 'Dental Vacuum System', room: 'Storage / Mechanical', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: true, notes: '208V/20A. Amalgam separator required per regulations.' },
    { id: 'EQ-D08', name: 'Operatory Sink', room: 'Operatory', quantity: 3, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Hands-free sensor faucet recommended.' },
    { id: 'EQ-D09', name: 'Sterilization Sink (Triple Basin)', room: 'Sterilization', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Dirty/rinse/clean workflow. Deep basins.' },
    { id: 'EQ-D10', name: 'Nitrous Oxide System', room: 'Operatory', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: true, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: true, notes: 'N2O/O2 piped. Scavenging system to exterior exhaust.' },
    { id: 'EQ-D11', name: 'Operatory Workstation / Monitor', room: 'Operatory', quantity: 3, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Wall-mount monitor. CAT6 to server room.' },
    { id: 'EQ-D12', name: 'Reception Workstation', room: 'Reception / Waiting', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Dual monitors. Phone/data at front desk.' },
    { id: 'EQ-D13', name: 'CBCT Scanner', room: 'X-Ray / Pano Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Optional. 208V/30A. Enhanced lead shielding.' },
  ],

  optometry: [
    { id: 'EQ-O01', name: 'Phoropter / Refraction Unit', room: 'Exam Room', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Wall or ceiling mount. Min 20\' lane or mirror system.' },
    { id: 'EQ-O02', name: 'Slit Lamp Biomicroscope', room: 'Exam Room', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Instrument table. Digital imaging option.' },
    { id: 'EQ-O03', name: 'Auto-Refractor / Keratometer', room: 'Pre-Test Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Combined unit. Network for data transfer.' },
    { id: 'EQ-O04', name: 'OCT Scanner', room: 'Pre-Test Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Optical coherence tomography. Darkened room preferred.' },
    { id: 'EQ-O05', name: 'Visual Field Analyzer', room: 'Pre-Test Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Humphrey or equivalent. Quiet room required.' },
    { id: 'EQ-O06', name: 'Lensometer', room: 'Pre-Test Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Digital preferred for auto-read.' },
    { id: 'EQ-O07', name: 'Retinal Camera (Fundus)', room: 'Pre-Test Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Non-mydriatic. Network connected.' },
    { id: 'EQ-O08', name: 'Tonometer', room: 'Exam Room', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'iCare or Goldmann. Exam table mounted.' },
    { id: 'EQ-O09', name: 'Edging / Finishing System', room: 'Contact Lens Room', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Lens cutting. Water coolant required.' },
    { id: 'EQ-O10', name: 'Frame Display System', room: 'Optical Dispensary', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'LED-lit wall displays. Track lighting recommended.' },
    { id: 'EQ-O11', name: 'PD Meter / Digital Measurement', room: 'Optical Dispensary', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Digital pupillary distance measurement.' },
    { id: 'EQ-O12', name: 'Exam Room Sink', room: 'Exam Room', quantity: 2, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Small hand wash sink in each exam room.' },
  ],

  veterinary: [
    { id: 'EQ-V01', name: 'Exam Table (Hydraulic)', room: 'Exam Room', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Stainless steel top. Integrated scale preferred.' },
    { id: 'EQ-V02', name: 'Veterinary X-Ray System', room: 'X-Ray Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Digital DR preferred. Lead-lined room. 208V/30A.' },
    { id: 'EQ-V03', name: 'Surgery Table (Heated)', room: 'Surgery Suite', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Stainless steel. Thermostatically controlled heating pad.' },
    { id: 'EQ-V04', name: 'Anesthesia Machine', room: 'Surgery Suite', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: true, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: true, notes: 'Isoflurane. Scavenging system to exterior. O2 supply.' },
    { id: 'EQ-V05', name: 'Surgical Light (Ceiling Mount)', room: 'Surgery Suite', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: false, notes: 'LED shadowless. Ceiling reinforcement required.' },
    { id: 'EQ-V06', name: 'Autoclave', room: 'Treatment Area', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: true, notes: '208V/20A. Steam exhaust to exterior.' },
    { id: 'EQ-V07', name: 'Laboratory Analyzer (CBC/Chem)', room: 'Lab / Pharmacy', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'IDEXX or equivalent. Bench space + network.' },
    { id: 'EQ-V08', name: 'Dental Scaler (Veterinary)', room: 'Treatment Area', quantity: 1, hot_water: false, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Ultrasonic + hand scaling. Water supply required.' },
    { id: 'EQ-V09', name: 'Kennel Units (Stainless)', room: 'Kennel / Recovery', quantity: 8, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: true, notes: 'Mix of sizes. Floor drains for cleaning. Exhaust ventilation.' },
    { id: 'EQ-V10', name: 'Treatment Area Wet Table', room: 'Treatment Area', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Stainless steel with integrated sink and ramp.' },
    { id: 'EQ-V11', name: 'Scrub Sink (Surgery)', room: 'Surgery Suite', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Foot/knee operated. At surgery entry.' },
    { id: 'EQ-V12', name: 'Pharmacy Refrigerator', room: 'Lab / Pharmacy', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Medical grade. Temperature monitored. Alarmed.' },
    { id: 'EQ-V13', name: 'Patient Monitor', room: 'Surgery Suite', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'SpO2, ECG, temp, BP. Wall mount.' },
  ],

  physiotherapy: [
    { id: 'EQ-P01', name: 'Treatment Plinth (Electric)', room: 'Treatment Bay', quantity: 4, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Hi-lo electric. Privacy curtains between bays.' },
    { id: 'EQ-P02', name: 'Ultrasound Therapy Unit', room: 'Treatment Bay', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Portable between treatment bays.' },
    { id: 'EQ-P03', name: 'TENS / IFC Unit', room: 'Treatment Bay', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Electrotherapy. Wall-mounted or cart.' },
    { id: 'EQ-P04', name: 'Parallel Bars', room: 'Open Gym / Exercise Area', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Floor mounted. Clear 8\' approach zone each end.' },
    { id: 'EQ-P05', name: 'Treadmill (Medical Grade)', room: 'Open Gym / Exercise Area', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: false, notes: '20A dedicated. Side rails required for rehab use.' },
    { id: 'EQ-P06', name: 'Stationary Bicycle (Recumbent)', room: 'Open Gym / Exercise Area', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Low step-through for mobility-limited patients.' },
    { id: 'EQ-P07', name: 'Hydrotherapy Tub', room: 'Hydrotherapy Room', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: true, standard_outlet: true, data: false, mechanical_vent: true, notes: '208V. Floor drain. Humidity exhaust. Non-slip surrounds.' },
    { id: 'EQ-P08', name: 'Hot/Cold Pack Unit', room: 'Treatment Bay', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Hydrocollator + cold pack freezer. Dedicated 20A.' },
    { id: 'EQ-P09', name: 'Balance / Wobble Board Station', room: 'Open Gym / Exercise Area', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Wall-mount bars for balance training. Mirror wall.' },
    { id: 'EQ-P10', name: 'Shockwave Therapy Unit', room: 'Private Treatment Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'ESWT unit. Private room for noise.' },
  ],

  medical_office: [
    { id: 'EQ-M01', name: 'Exam Table', room: 'Exam Room', quantity: 3, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Adjustable with paper roll. Step stool.' },
    { id: 'EQ-M02', name: 'Exam Room Sink', room: 'Exam Room', quantity: 3, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Hands-free faucet. Soap/sanitizer dispensers.' },
    { id: 'EQ-M03', name: 'Blood Draw Chair', room: 'Lab / Blood Draw', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Reclining phlebotomy chair. Counter space adjacent.' },
    { id: 'EQ-M04', name: 'Centrifuge', room: 'Lab / Blood Draw', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: false, mechanical_vent: false, notes: 'Bench-top centrifuge. Vibration pad recommended.' },
    { id: 'EQ-M05', name: 'Lab Sink', room: 'Lab / Blood Draw', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Deep basin for specimen handling.' },
    { id: 'EQ-M06', name: 'ECG Machine', room: 'Exam Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Portable. Network connection for records.' },
    { id: 'EQ-M07', name: 'Specimen Refrigerator', room: 'Lab / Blood Draw', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Medical grade. Temperature alarmed. Under-counter.' },
    { id: 'EQ-M08', name: 'Nurse Station Workstation', room: 'Nurse Station', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Sit/stand desk. Dual monitors. Phone/data.' },
    { id: 'EQ-M09', name: 'Vitals Station', room: 'Nurse Station', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'BP, weight scale, pulse ox. Standing height counter.' },
    { id: 'EQ-M10', name: 'Sharps / Biohazard Disposal', room: 'Exam Room', quantity: 3, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Wall-mount sharps container in each exam room.' },
  ],

  pharmacy: [
    { id: 'EQ-PH01', name: 'Dispensing Counter System', room: 'Prescription Counter', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Rx workflow system. Multiple workstations.' },
    { id: 'EQ-PH02', name: 'Automated Dispensing Cabinet', room: 'Prescription Counter', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: true, mechanical_vent: false, notes: 'ScriptPro or equivalent. 208V dedicated.' },
    { id: 'EQ-PH03', name: 'Laminar Flow Hood', room: 'Compounding Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: true, standard_outlet: true, data: false, mechanical_vent: true, notes: 'ISO 5 clean air. HEPA filtered. Dedicated exhaust.' },
    { id: 'EQ-PH04', name: 'Compounding Sink', room: 'Compounding Room', quantity: 1, hot_water: true, cold_water: true, drain: true, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Deep basin with purified water option.' },
    { id: 'EQ-PH05', name: 'Walk-In Refrigerator', room: 'Cold Storage', quantity: 1, hot_water: false, cold_water: false, drain: true, gas: false, dedicated_circuit: true, standard_outlet: false, data: true, mechanical_vent: true, notes: '208V/30A. Temperature monitoring w/ alarm. Condensate drain.' },
    { id: 'EQ-PH06', name: 'Shelving System (High-Density)', room: 'Prescription Counter', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'Adjustable shelving for medication storage. Code-compliant.' },
    { id: 'EQ-PH07', name: 'POS Terminal', room: 'Retail / Dispensary Floor', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Cash register + debit terminal. Network required.' },
    { id: 'EQ-PH08', name: 'Consultation Desk', room: 'Consultation Room', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Privacy screen. Blood pressure cuff station.' },
    { id: 'EQ-PH09', name: 'Safe (Narcotics)', room: 'Prescription Counter', quantity: 1, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: false, data: false, mechanical_vent: false, notes: 'TL-30 rated. Bolted to floor. Dual lock.' },
    { id: 'EQ-PH10', name: 'Label Printer', room: 'Prescription Counter', quantity: 2, hot_water: false, cold_water: false, drain: false, gas: false, dedicated_circuit: false, standard_outlet: true, data: true, mechanical_vent: false, notes: 'Zebra or equivalent. Network connected.' },
  ],
};

export function getEquipmentForClinicType(clinicType: string): EquipmentTemplate[] {
  return EQUIPMENT_DATABASE[clinicType] ?? [];
}
