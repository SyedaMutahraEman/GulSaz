import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  width?: number;
  height?: number;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  displayValue?: boolean;
  fontSize?: number;
  textMargin?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  width = 1.6,
  height = 48,
  format = 'CODE128',
  displayValue = true,
  fontSize = 12,
  textMargin = 3,
  margin = 0,
  background = 'transparent',
  lineColor = '#111827',
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        font: 'JetBrains Mono',
        fontSize,
        textMargin,
        margin,
        background,
        lineColor,
        valid: () => true
      });
    } catch (err) {
      console.warn('JsBarcode rendering error, falling back to CODE128:', err);
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          font: 'JetBrains Mono',
          fontSize,
          textMargin,
          margin,
          background,
          lineColor
        });
      } catch (fallbackErr) {
        console.error('Failed to render barcode fallback:', fallbackErr);
      }
    }
  }, [value, width, height, format, displayValue, fontSize, textMargin, margin, background, lineColor]);

  if (!value) {
    return <div className="text-xs text-neutral-400">No Barcode</div>;
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full overflow-visible" />
    </div>
  );
};
