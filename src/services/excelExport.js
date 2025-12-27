import { mainAPI } from './api';

/**
 * Generate and download an Excel file from trip data
 * Uses client-side CSV generation (Excel-compatible)
 */

// Format date for Excel
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Escape CSV field
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Generate CSV from data array
const generateCSV = (headers, rows) => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => 
    headers.map(h => escapeCSV(row[h] ?? '')).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

// Download file
const downloadFile = (content, filename, type = 'text/csv;charset=utf-8;') => {
  const blob = new Blob(['\ufeff' + content], { type }); // BOM for Excel UTF-8
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Export trip data to Excel-compatible CSV file
 */
export const exportTripToExcel = async (tripId, onProgress) => {
  try {
    onProgress?.('Fetching trip data...');
    const data = await mainAPI.exportTripData(tripId);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch export data');
    }

    const { trip, vessel, crew, catch: catchData, crates, summary } = data;
    const tripCode = trip.trip_code || `TRIP-${tripId}`;
    
    onProgress?.('Generating Excel file...');

    // =============== SHEET 1: Trip Summary ===============
    const summaryData = [
      { field: 'Trip Code', value: trip.trip_code },
      { field: 'Status', value: trip.status },
      { field: 'Vessel Name', value: vessel.name },
      { field: 'Vessel Registration', value: vessel.registration_number },
      { field: 'IMN Number', value: vessel.imn_number },
      { field: 'Vessel Type', value: vessel.vessel_type },
      { field: 'Departure Date', value: formatDate(trip.departure_date) },
      { field: 'Departure Port', value: trip.departure_port },
      { field: 'Return Date', value: formatDate(trip.return_date) },
      { field: 'Return Port', value: trip.return_port },
      { field: 'Fishing Method', value: trip.fishing_method },
      { field: 'Fishing Method Code', value: trip.fishing_method_code },
      { field: 'FAO Zone', value: trip.fao_zone },
      { field: 'Target Species', value: trip.target_species },
      { field: 'Fuel Used (L)', value: trip.fuel_used },
      { field: 'Ice Used (kg)', value: trip.ice_used },
      { field: 'Total Expense (₹)', value: trip.total_expense },
      { field: '', value: '' },
      { field: 'CATCH SUMMARY', value: '' },
      { field: 'Total Fish Count', value: summary.total_catch_count },
      { field: 'Total Weight (kg)', value: summary.total_weight?.toFixed(2) },
      { field: 'Total Crates', value: summary.total_crates },
      { field: 'Crew Count', value: summary.crew_count },
      { field: '', value: '' },
      { field: 'QUALITY SUMMARY', value: '' },
      { field: 'Grade A (Premium)', value: summary.quality_summary?.grade_a || 0 },
      { field: 'Grade B (Standard)', value: summary.quality_summary?.grade_b || 0 },
      { field: 'Grade C (Low)', value: summary.quality_summary?.grade_c || 0 },
      { field: 'Rejected', value: summary.quality_summary?.rejected || 0 },
      { field: 'Not Inspected', value: summary.quality_summary?.not_inspected || 0 }
    ];

    // =============== SHEET 2: Catch Details ===============
    const catchHeaders = [
      'QR Code', 'Species Code', 'Species Name', 'Scientific Name', 'FAO Zone',
      'Weight (kg)', 'Count', 'Latitude', 'Longitude', 'Catch Time',
      'Temperature (°C)', 'Quality Grade', 'Freshness', 'Eye Clarity', 'Gill Color',
      'Skin Condition', 'Smell', 'Damage Type', 'Damage Notes', 'Inspector Notes',
      'Inspected By', 'Inspected At', 'Crate ID'
    ];
    
    const catchRows = catchData.map(c => ({
      'QR Code': c.qr_code,
      'Species Code': c.species_code,
      'Species Name': c.species_name,
      'Scientific Name': c.scientific_name,
      'FAO Zone': c.fao_zone,
      'Weight (kg)': c.weight_kg,
      'Count': c.count,
      'Latitude': c.latitude,
      'Longitude': c.longitude,
      'Catch Time': formatDateTime(c.catch_timestamp),
      'Temperature (°C)': c.temperature,
      'Quality Grade': c.quality_grade,
      'Freshness': c.freshness,
      'Eye Clarity': c.eye_clarity,
      'Gill Color': c.gill_color,
      'Skin Condition': c.skin_condition,
      'Smell': c.smell,
      'Damage Type': c.damage_type,
      'Damage Notes': c.damage_notes,
      'Inspector Notes': c.inspector_notes,
      'Inspected By': c.inspected_by,
      'Inspected At': formatDateTime(c.inspected_at),
      'Crate ID': c.crate_id
    }));

    // =============== SHEET 3: Crates (Chain of Custody) ===============
    const crateHeaders = [
      'Crate QR', 'Fish Count', 'Total Weight (kg)', 'Packed At',
      'Packed By Name', 'Packed By Phone', 'Seal Number', 'Storage Location', 'Temperature at Pack (°C)'
    ];
    
    const crateRows = crates.map(c => ({
      'Crate QR': c.crate_qr,
      'Fish Count': c.fish_count,
      'Total Weight (kg)': c.total_weight,
      'Packed At': formatDateTime(c.packed_at),
      'Packed By Name': c.packed_by_name,
      'Packed By Phone': c.packed_by_phone,
      'Seal Number': c.seal_number,
      'Storage Location': c.storage_location,
      'Temperature at Pack (°C)': c.temperature_at_pack
    }));

    // =============== SHEET 4: Crew ===============
    const crewHeaders = ['Name', 'Phone', 'Aadhaar (Last 4)', 'Role', 'Share (%)'];
    const crewRows = crew.map(c => ({
      'Name': c.name,
      'Phone': c.phone,
      'Aadhaar (Last 4)': c.aadhaar_last_4,
      'Role': c.role,
      'Share (%)': c.share_percentage
    }));

    // =============== SHEET 5: Species Breakdown ===============
    const speciesHeaders = ['Species Code', 'Species Name', 'Count', 'Weight (kg)'];
    const speciesRows = Object.values(summary.species_breakdown || {}).map(s => ({
      'Species Code': s.code,
      'Species Name': s.name,
      'Count': s.count,
      'Weight (kg)': s.weight?.toFixed(2)
    }));

    // Generate combined CSV with section headers
    let fullCSV = '';
    
    // Summary Section
    fullCSV += '=== TRIP SUMMARY ===\n';
    fullCSV += generateCSV(['field', 'value'], summaryData) + '\n\n';
    
    // Catch Details Section
    fullCSV += '=== CATCH DETAILS ===\n';
    fullCSV += generateCSV(catchHeaders, catchRows) + '\n\n';
    
    // Crates Section
    fullCSV += '=== CRATES (CHAIN OF CUSTODY) ===\n';
    fullCSV += generateCSV(crateHeaders, crateRows) + '\n\n';
    
    // Crew Section
    fullCSV += '=== CREW ===\n';
    fullCSV += generateCSV(crewHeaders, crewRows) + '\n\n';
    
    // Species Breakdown Section
    fullCSV += '=== SPECIES BREAKDOWN ===\n';
    fullCSV += generateCSV(speciesHeaders, speciesRows);

    onProgress?.('Downloading...');
    downloadFile(fullCSV, `BlueOS_Trip_${tripCode}_${formatDate(new Date())}.csv`);
    
    return { success: true, filename: `BlueOS_Trip_${tripCode}.csv` };

  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

/**
 * Export individual sheets as separate CSV files
 */
export const exportTripSheets = async (tripId, sheetType, onProgress) => {
  try {
    onProgress?.('Fetching data...');
    const data = await mainAPI.exportTripData(tripId);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch export data');
    }

    const { trip, catch: catchData, crates, crew, summary } = data;
    const tripCode = trip.trip_code || `TRIP-${tripId}`;
    
    let csv = '';
    let filename = '';

    switch (sheetType) {
      case 'catch':
        const catchHeaders = [
          'QR Code', 'Species Code', 'Species Name', 'Weight (kg)', 'Quality Grade',
          'Temperature', 'Latitude', 'Longitude', 'Catch Time', 'Inspected By'
        ];
        const catchRows = catchData.map(c => ({
          'QR Code': c.qr_code,
          'Species Code': c.species_code,
          'Species Name': c.species_name,
          'Weight (kg)': c.weight_kg,
          'Quality Grade': c.quality_grade,
          'Temperature': c.temperature,
          'Latitude': c.latitude,
          'Longitude': c.longitude,
          'Catch Time': formatDateTime(c.catch_timestamp),
          'Inspected By': c.inspected_by
        }));
        csv = generateCSV(catchHeaders, catchRows);
        filename = `BlueOS_${tripCode}_CatchDetails.csv`;
        break;

      case 'crates':
        const crateHeaders = [
          'Crate QR', 'Fish Count', 'Total Weight', 'Packed At', 'Packed By', 'Phone'
        ];
        const crateRows = crates.map(c => ({
          'Crate QR': c.crate_qr,
          'Fish Count': c.fish_count,
          'Total Weight': c.total_weight,
          'Packed At': formatDateTime(c.packed_at),
          'Packed By': c.packed_by_name,
          'Phone': c.packed_by_phone
        }));
        csv = generateCSV(crateHeaders, crateRows);
        filename = `BlueOS_${tripCode}_Crates.csv`;
        break;

      case 'quality':
        const qualityHeaders = [
          'QR Code', 'Species', 'Weight', 'Temperature', 'Quality Grade', 'Freshness',
          'Eye Clarity', 'Gill Color', 'Skin', 'Smell', 'Damage', 'Inspector', 'Time'
        ];
        const qualityRows = catchData.filter(c => c.quality_grade).map(c => ({
          'QR Code': c.qr_code,
          'Species': c.species_name,
          'Weight': c.weight_kg,
          'Temperature': c.temperature,
          'Quality Grade': c.quality_grade,
          'Freshness': c.freshness,
          'Eye Clarity': c.eye_clarity,
          'Gill Color': c.gill_color,
          'Skin': c.skin_condition,
          'Smell': c.smell,
          'Damage': c.damage_type,
          'Inspector': c.inspected_by,
          'Time': formatDateTime(c.inspected_at)
        }));
        csv = generateCSV(qualityHeaders, qualityRows);
        filename = `BlueOS_${tripCode}_QualityInspection.csv`;
        break;

      default:
        throw new Error('Invalid sheet type');
    }

    onProgress?.('Downloading...');
    downloadFile(csv, filename);
    
    return { success: true, filename };

  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export default {
  exportTripToExcel,
  exportTripSheets
};
