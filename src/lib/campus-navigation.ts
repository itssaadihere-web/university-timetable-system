/**
 * Campus Navigation & Venue Intelligence Engine
 * Handles SHU (Old Building) vs FPS (New Building), floor decoding,
 * specialty identification (Labs, Horseshoe, Workshop), and step-by-step directions.
 */

export interface RoomNavigationInfo {
  roomId: string;
  roomName: string;
  buildingName: string;
  buildingType: 'SHU (Old Building)' | 'FPS (New Building)' | 'Other Block';
  floorNumber: number;
  floorLabel: string;
  specialtyTags: string[];
  specialtyDescription: string;
  directions: string[];
  tips: string[];
}

/**
 * Decodes building and floor from room ID or name
 * Rules:
 * - SHU Building = Old Building
 * - FPS Building = New Building
 * - SFU/SHU Floor prefixes:
 *   - A-* = Ground Floor (0)
 *   - B-* / FF-* = 1st Floor (1)
 *   - C-* / SF-* = 2nd Floor (2)
 *   - D-* / TF-* = 3rd Floor (3)
 *   - FRF-* = 4th Floor (4)
 */
export function getRoomNavigationDetails(
  roomId: string,
  rawRoomName?: string,
  buildingName?: string
): RoomNavigationInfo {
  const idLower = (roomId || '').toLowerCase();
  const nameLower = (rawRoomName || '').toLowerCase();
  const bLower = (buildingName || '').toLowerCase();

  let buildingType: 'SHU (Old Building)' | 'FPS (New Building)' | 'Other Block' = 'SHU (Old Building)';
  let floorNumber = 0;
  let floorLabel = 'Ground Floor';
  const specialtyTags: string[] = [];
  const directions: string[] = [];
  const tips: string[] = [];

  // Determine Building: SHU (Old Building) vs FPS (New Building)
  if (bLower.includes('fps') || nameLower.includes('fps') || idLower.includes('fps') || bLower.includes('new building') || bLower.includes('new block')) {
    buildingType = 'FPS (New Building)';
  } else {
    buildingType = 'SHU (Old Building)';
  }

  // Determine Floor from Room Code Prefix
  if (idLower.startsWith('room-a-') || idLower.startsWith('a-') || nameLower.startsWith('a-') || nameLower.includes('ground')) {
    floorNumber = 0;
    floorLabel = 'Ground Floor (Level 0)';
  } else if (idLower.startsWith('room-b-') || idLower.startsWith('b-') || idLower.startsWith('room-ff-') || idLower.startsWith('ff-') || nameLower.includes('1st floor') || nameLower.startsWith('ff-') || nameLower.startsWith('b-')) {
    floorNumber = 1;
    floorLabel = '1st Floor (Level 1)';
  } else if (idLower.startsWith('room-c-') || idLower.startsWith('c-') || idLower.startsWith('room-sf-') || idLower.startsWith('sf-') || nameLower.includes('2nd floor') || nameLower.startsWith('sf-') || nameLower.startsWith('c-')) {
    floorNumber = 2;
    floorLabel = '2nd Floor (Level 2)';
  } else if (idLower.startsWith('room-d-') || idLower.startsWith('d-') || idLower.startsWith('room-tf-') || idLower.startsWith('tf-') || nameLower.includes('3rd floor') || nameLower.startsWith('tf-') || nameLower.startsWith('d-')) {
    floorNumber = 3;
    floorLabel = '3rd Floor (Level 3)';
  } else if (idLower.startsWith('room-frf-') || idLower.startsWith('frf-') || nameLower.includes('4th floor') || nameLower.startsWith('frf-')) {
    floorNumber = 4;
    floorLabel = '4th Floor (Level 4)';
  } else {
    floorNumber = 0;
    floorLabel = 'Ground Floor / Main Level';
  }

  // Specialty Detection
  if (nameLower.includes('computer lab') || idLower.includes('lab') || nameLower.includes('it lab')) {
    specialtyTags.push('Computer Lab / IT Lab');
  }
  if (nameLower.includes('language lab')) {
    specialtyTags.push('Digital Language Lab');
  }
  if (nameLower.includes('horseshoe')) {
    specialtyTags.push('Horseshoe Case-Study Amphitheater');
  }
  if (nameLower.includes('multimedia') || nameLower.includes('lcd')) {
    specialtyTags.push('Smart Interactive Display Room');
  }
  if (nameLower.includes('workshop') || nameLower.includes('studio')) {
    specialtyTags.push('Practical Workshop / Studio');
  }
  if (specialtyTags.length === 0) {
    specialtyTags.push('Standard Lecture Classroom');
  }

  const specialtyDescription = specialtyTags.join(' • ');

  // Walking Directions Engine
  if (buildingType === 'SHU (Old Building)') {
    directions.push('Enter through the Main Campus Reception / SHU Old Building entrance.');
    if (floorNumber === 0) {
      directions.push('Walk down the central corridor on the Ground Floor.');
      directions.push(`Look for Room ${rawRoomName || roomId} on the corridor display.`);
    } else if (floorNumber === 1) {
      directions.push('Take the Central Staircase or Main Elevator up to the 1st Floor (Prefix B / FF).');
      directions.push(`Turn into the First Floor Wing corridor to locate Room ${rawRoomName || roomId}.`);
    } else if (floorNumber === 2) {
      directions.push('Head up to the 2nd Floor (Prefix C / SF) via the central stairs or elevator.');
      directions.push(`Follow the Science & Management Wing corridor to find Room ${rawRoomName || roomId}.`);
    } else if (floorNumber === 3) {
      directions.push('Proceed up to the 3rd Floor (Prefix D / TF) via the Academic Tower stairs or elevator.');
      directions.push(`Walk towards the third-floor lecture and lab hall wing for Room ${rawRoomName || roomId}.`);
    } else if (floorNumber === 4) {
      directions.push('Head up to the 4th Floor (Prefix FRF) via the main faculty/amphitheater elevator.');
      directions.push(`Locate the Horseshoe Lecture Halls corridor on the 4th Floor for Room ${rawRoomName || roomId}.`);
    }
  } else {
    directions.push('Head towards the FPS New Building (Faculty of Pharmaceutical & Allied Sciences block).');
    directions.push(`Take the elevator/stairs to ${floorLabel}.`);
    directions.push(`Follow the marked departmental signboards to Room ${rawRoomName || roomId}.`);
  }

  // Helpful Tips
  if (specialtyTags.some((t) => t.includes('Lab'))) {
    tips.push('⚡ Lab Venue: Please carry your USB drive/credentials and maintain quiet in lab zones.');
  }
  if (specialtyTags.some((t) => t.includes('Horseshoe'))) {
    tips.push('🏛️ Tiered Horseshoe Seating: Best suited for case study discussions and presentations.');
  }
  if (buildingType === 'SHU (Old Building)') {
    tips.push('🏛️ Note: SHU is the original Old Building. Prefix letter indicates your floor (A=Ground, B=1st, C=2nd, D=3rd, FRF=4th).');
  }

  return {
    roomId,
    roomName: rawRoomName || roomId,
    buildingName: buildingName || 'SHU Campus',
    buildingType,
    floorNumber,
    floorLabel,
    specialtyTags,
    specialtyDescription,
    directions,
    tips,
  };
}

/**
 * Formats room navigation into a clean WhatsApp-friendly message block
 */
export function formatWhatsAppRoomNavigation(roomInfo: RoomNavigationInfo): string {
  return [
    `📍 *Venue & Navigation Details:*`,
    `🏢 *Building:* ${roomInfo.buildingType}`,
    `🚪 *Room:* ${roomInfo.roomName}`,
    `📶 *Floor:* ${roomInfo.floorLabel}`,
    `🏷️ *Room Type:* ${roomInfo.specialtyDescription}`,
    ``,
    `🧭 *Step-by-Step Walking Directions:*`,
    ...roomInfo.directions.map((d, i) => `  ${i + 1}. ${d}`),
    ``,
    ...(roomInfo.tips.length > 0 ? [`💡 *Helpful Tip:* ${roomInfo.tips[0]}`] : []),
  ].join('\n');
}
