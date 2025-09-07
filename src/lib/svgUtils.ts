/**
 * Secure SVG manipulation utilities to avoid innerHTML XSS vulnerabilities
 */

export interface CandleData {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  color: string;
}

export interface PriceLevelData {
  price: number;
  yPosition: number;
}

/**
 * Creates candlestick elements safely using DOM API
 */
export function createCandlestickElements(
  parent: SVGElement,
  candles: CandleData[]
): void {
  // Clear existing elements
  parent.innerHTML = '';

  candles.forEach(candle => {
    // Create candlestick group
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Create high-low line (wick)
    const wickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    wickLine.setAttribute('x1', candle.x.toString());
    wickLine.setAttribute('y1', candle.high.toString());
    wickLine.setAttribute('x2', candle.x.toString());
    wickLine.setAttribute('y2', candle.low.toString());
    wickLine.setAttribute('stroke', candle.color);
    wickLine.setAttribute('stroke-width', '1');

    // Create body rectangle
    const bodyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const bodyHeight = Math.abs(candle.close - candle.open);
    const bodyY = Math.min(candle.open, candle.close);
    
    bodyRect.setAttribute('x', (candle.x - 5).toString());
    bodyRect.setAttribute('y', bodyY.toString());
    bodyRect.setAttribute('width', '10');
    bodyRect.setAttribute('height', bodyHeight.toString());
    bodyRect.setAttribute('fill', candle.color);
    bodyRect.setAttribute('stroke', candle.color);

    group.appendChild(wickLine);
    group.appendChild(bodyRect);
    parent.appendChild(group);
  });
}

/**
 * Creates volume bars safely
 */
export function createVolumeElements(
  parent: SVGElement,
  volumes: Array<{ x: number; height: number; color: string }>
): void {
  parent.innerHTML = '';

  volumes.forEach(vol => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (vol.x - 5).toString());
    rect.setAttribute('y', (400 - vol.height).toString());
    rect.setAttribute('width', '10');
    rect.setAttribute('height', vol.height.toString());
    rect.setAttribute('fill', vol.color);
    rect.setAttribute('opacity', '0.7');
    
    parent.appendChild(rect);
  });
}

/**
 * Creates price level lines and labels safely
 */
export function createPriceLevelElements(
  parent: SVGElement,
  levels: PriceLevelData[]
): void {
  parent.innerHTML = '';

  levels.forEach(level => {
    // Create horizontal line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '20');
    line.setAttribute('y1', level.yPosition.toString());
    line.setAttribute('x2', '1000');
    line.setAttribute('y2', level.yPosition.toString());
    line.setAttribute('stroke', '#374151');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '2 4');

    // Create price label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '1005');
    text.setAttribute('y', (level.yPosition + 4).toString());
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#9ca3af');
    text.textContent = level.price.toFixed(2);

    parent.appendChild(line);
    parent.appendChild(text);
  });
}

/**
 * Creates EMA line elements safely
 */
export function createEMALineElement(
  parent: SVGElement,
  points: Array<{ x: number; y: number }>,
  color: string,
  id: string
): void {
  // Remove existing EMA line with same id
  const existing = parent.querySelector(`#${id}`);
  if (existing) {
    existing.remove();
  }

  if (points.length < 2) return;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('id', id);
  
  let pathData = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x},${points[i].y}`;
  }
  
  path.setAttribute('d', pathData);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  path.setAttribute('opacity', '0.8');

  parent.appendChild(path);
}
