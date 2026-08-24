import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

// Porting 1:1 dell'illustrazione SVG di #authLanding nel riferimento CORRIO:
// scooter con scatola pizza, percorso tratteggiato, pin di destinazione, cliente
// col telefono. Stesse coordinate/trasformazioni dell'originale.
export function DeliveryIllustration() {
  return (
    <Svg viewBox="0 0 300 230" width="100%" height="100%">
      <Line x1={12} y1={208} x2={288} y2={208} stroke="#e2e2e6" strokeWidth={2} />
      <Path d="M38 36 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4Z" fill="none" stroke="#d8d8dc" strokeWidth={1.5} />
      <Path d="M258 58 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" fill="none" stroke="#d8d8dc" strokeWidth={1.5} />

      {/* percorso di consegna tratteggiato */}
      <Path d="M95 165 Q150 108 205 148" fill="none" stroke="#E31C4D" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
      <G transform="translate(138,86)">
        <Path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18c0-5.5-4.5-10-10-10Z" fill="#E31C4D" />
        <Circle cx={10} cy={10} r={4} fill="#fff" />
      </G>

      {/* scooter con scatola pizza */}
      <G transform="translate(14,140)">
        <Circle cx={12} cy={55} r={12} fill="none" stroke="#9aa0ac" strokeWidth={3} />
        <Circle cx={70} cy={55} r={12} fill="none" stroke="#9aa0ac" strokeWidth={3} />
        <Path d="M12 55 L30 55 L38 30 L58 30 L70 55" fill="none" stroke="#9aa0ac" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M38 30 L34 18" fill="none" stroke="#9aa0ac" strokeWidth={3} strokeLinecap="round" />
        <Rect x={16} y={4} width={28} height={19} rx={2} fill="#E31C4D" />
        <Path d="M16 10.5h28" stroke="#fff" strokeWidth={1.5} />
        <Circle cx={53} cy={8} r={8} fill="none" stroke="#9aa0ac" strokeWidth={3} />
        <Path d="M45 8a8 8 0 0 1 16 0" fill="#E31C4D" stroke="none" />
        <Path d="M47 15 L58 30" fill="none" stroke="#9aa0ac" strokeWidth={3} strokeLinecap="round" />
      </G>

      {/* cliente con telefono */}
      <G transform="translate(224,110)">
        <Circle cx={20} cy={10} r={10} fill="none" stroke="#9aa0ac" strokeWidth={3} />
        <Path d="M8 62 L8 32a12 12 0 0 1 24 0v30" fill="none" stroke="#9aa0ac" strokeWidth={3} strokeLinecap="round" />
        <Rect x={26} y={32} width={15} height={24} rx={3} fill="#fff" stroke="#9aa0ac" strokeWidth={2.5} />
        <Path d="M28.5 40 L38.5 40" stroke="#E31C4D" strokeWidth={2} />
        <Path d="M28.5 45.5 L35 45.5" stroke="#E31C4D" strokeWidth={2} />
      </G>
    </Svg>
  );
}
