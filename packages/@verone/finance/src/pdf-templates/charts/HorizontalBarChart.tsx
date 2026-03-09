import React from 'react';
import { Svg, Rect, Text as SvgText, View } from '@react-pdf/renderer';

interface BarChartData {
  label: string;
  value: number;
  color: string;
  displayValue?: string;
}

interface HorizontalBarChartProps {
  data: BarChartData[];
  maxBars?: number;
  barHeight?: number;
  showValues?: boolean;
}

export function HorizontalBarChart({
  data,
  maxBars = 10,
  barHeight = 14,
  showValues = true,
}: HorizontalBarChartProps) {
  const items = data.filter(d => d.value > 0).slice(0, maxBars);
  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map(d => d.value));
  if (maxValue === 0) return null;

  const labelWidth = 60;
  const valueWidth = showValues ? 50 : 0;
  const barAreaWidth = 100;
  const rowHeight = barHeight + 6;
  const totalHeight = items.length * rowHeight + 4;
  const totalWidth = labelWidth + barAreaWidth + valueWidth + 10;

  return (
    <View>
      <Svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      >
        {items.map((item, i) => {
          const y = i * rowHeight + 2;
          const barWidth = (item.value / maxValue) * barAreaWidth;

          return (
            <React.Fragment key={i}>
              {/* Label */}
              <SvgText
                x={labelWidth - 4}
                y={y + barHeight / 2 + 3}
                textAnchor="end"
                style={{
                  fontSize: 7,
                  fontFamily: 'Helvetica',
                  fill: '#374151',
                }}
              >
                {item.label.length > 10
                  ? item.label.substring(0, 8) + '...'
                  : item.label}
              </SvgText>

              {/* Bar background */}
              <Rect
                x={labelWidth}
                y={y}
                width={barAreaWidth}
                height={barHeight}
                fill="#F3F4F6"
                rx={2}
              />

              {/* Bar fill */}
              <Rect
                x={labelWidth}
                y={y}
                width={Math.max(barWidth, 2)}
                height={barHeight}
                fill={item.color}
                rx={2}
              />

              {/* Value text */}
              {showValues && (
                <SvgText
                  x={labelWidth + barAreaWidth + 6}
                  y={y + barHeight / 2 + 3}
                  style={{
                    fontSize: 7,
                    fontFamily: 'Helvetica-Bold',
                    fill: '#111827',
                  }}
                >
                  {item.displayValue ?? String(item.value)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
