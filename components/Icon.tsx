import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'user' | 'pin' | 'clock' | 'pencil' | 'trash' | 'plus' | 'download' | 'lock'
  | 'doc' | 'grid' | 'play' | 'stop' | 'bike' | 'briefcase' | 'arrow-left'
  | 'logout' | 'chart' | 'copy' | 'check' | 'store' | 'camera' | 'x' | 'phone' | 'navigate';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Porting 1:1 dei <symbol id="i-*"> SVG del riferimento CORRIO (index.html) —
// stesse coordinate/path, così le icone sono pixel-identiche a quelle web.
export function Icon({ name, size = 18, color = '#1f2933', strokeWidth = 1.8 }: Props) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'user' && (
        <>
          <Path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" {...common} />
          <Path d="M4.5 20.5c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" {...common} />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path d="M12 21.5s7-6.6 7-12A7 7 0 0 0 5 9.5c0 5.4 7 12 7 12Z" {...common} />
          <Circle cx={12} cy={9.5} r={2.5} {...common} />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3.5 2" {...common} />
        </>
      )}
      {name === 'pencil' && (
        <>
          <Path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" {...common} />
          <Path d="M14.5 5.5l4 4" {...common} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M5 7h14" {...common} />
          <Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...common} />
          <Path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" {...common} />
          <Path d="M10 11v6M14 11v6" {...common} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'download' && (
        <>
          <Path d="M12 3v12" {...common} />
          <Path d="M7 10l5 5 5-5" {...common} />
          <Path d="M4 19h16" {...common} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={11} width={14} height={9} rx={2} {...common} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...common} />
        </>
      )}
      {name === 'doc' && (
        <>
          <Path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" {...common} />
          <Path d="M14 3v4h4" {...common} />
          <Path d="M9 13h6M9 16h6" {...common} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x={3} y={3} width={8} height={8} rx={1.5} {...common} />
          <Rect x={13} y={3} width={8} height={8} rx={1.5} {...common} />
          <Rect x={3} y={13} width={8} height={8} rx={1.5} {...common} />
          <Rect x={13} y={13} width={8} height={8} rx={1.5} {...common} />
        </>
      )}
      {name === 'play' && <Path d="M7 4.5v15l13-7.5-13-7.5Z" {...common} />}
      {name === 'stop' && <Rect x={5} y={5} width={14} height={14} rx={2} {...common} />}
      {name === 'bike' && (
        <>
          <Circle cx={5.5} cy={18} r={3} {...common} />
          <Circle cx={18.5} cy={18} r={3} {...common} />
          <Path d="M5.5 18 9 10h4l2 4h3.5" {...common} />
          <Path d="M9 10 8 6H6" {...common} />
          <Path d="M13 10l2-3h2" {...common} />
        </>
      )}
      {name === 'briefcase' && (
        <>
          <Rect x={3} y={8} width={18} height={12} rx={2} {...common} />
          <Path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...common} />
          <Path d="M3 13h18" {...common} />
        </>
      )}
      {name === 'arrow-left' && (
        <>
          <Path d="M19 12H5" {...common} />
          <Path d="M11 6l-6 6 6 6" {...common} />
        </>
      )}
      {name === 'logout' && (
        <>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...common} />
          <Path d="M16 17l5-5-5-5" {...common} />
          <Path d="M21 12H9" {...common} />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M4 20V10" {...common} />
          <Path d="M11 20V4" {...common} />
          <Path d="M18 20v-7" {...common} />
          <Path d="M3 20h18" {...common} />
        </>
      )}
      {name === 'copy' && (
        <>
          <Rect x={9} y={9} width={12} height={12} rx={2} {...common} />
          <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...common} />
        </>
      )}
      {name === 'check' && <Path d="M20 6L9 17l-5-5" {...common} />}
      {name === 'store' && (
        <>
          <Path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" {...common} />
          <Path d="M3 4h18l1.5 5a2.5 2.5 0 0 1-4.9.9A2.5 2.5 0 0 1 15 12a2.5 2.5 0 0 1-4.6-1.1A2.5 2.5 0 0 1 8 12a2.5 2.5 0 0 1-4.9-.9L4.5 4Z" {...common} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" {...common} />
          <Circle cx={12} cy={13.5} r={3.5} {...common} />
        </>
      )}
      {name === 'x' && <Path d="M6 6l12 12M18 6L6 18" {...common} />}
      {name === 'phone' && (
        <Path d="M6.5 3.5h2.7l1.3 4-2 1.6a11.5 11.5 0 0 0 5.4 5.4l1.6-2 4 1.3v2.7a2 2 0 0 1-2.2 2C10.7 18 6 13.3 4.5 6.7a2 2 0 0 1 2-3.2Z" {...common} />
      )}
      {name === 'navigate' && (
        <>
          <Path d="M12 2 4 20l8-4.5L20 20 12 2Z" {...common} />
        </>
      )}
    </Svg>
  );
}
