/** X-axis tick that splits multi-word labels onto two lines */
export default function WrapTick({ x, y, payload, fontSize = 11 }) {
  const words = String(payload.value).split(' ');
  const lines = words.length > 1 && String(payload.value).length > 9 ? [words[0], words.slice(1).join(' ')] : [payload.value];
  return (
    <text x={x} y={y + 10} textAnchor="middle" fontSize={fontSize} fill="#4B5578">
      {lines.map((l, i) => <tspan key={i} x={x} dy={i ? 12 : 0}>{l}</tspan>)}
    </text>
  );
}
