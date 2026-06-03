'use client';

import './radial-menu.css';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { PixelClose } from './icons';

export type MenuIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type MenuItem = {
  id: number;
  label: string;
  icon: MenuIcon;
  disabled?: boolean;
};

export type RadialMenuHandle = {
  close: () => void;
};

export type RadialMenuProps = {
  menuItems: MenuItem[];
  size?: number;
  iconSize?: number;
  labelSize?: number;
  bandWidth?: number;
  innerGap?: number;
  outerGap?: number;
  outerRingWidth?: number;
  edgePadding?: number;
  closeOnSelect?: boolean;
  canOpen?: (event: MouseEvent) => boolean;
  portalContainer?: HTMLElement;
  onSelect?: (item: MenuItem) => void;
  onOpenChange?: (open: boolean) => void;
};

type Point = { x: number; y: number };

type MenuGeometry = {
  radius: number;
  viewBox: string;
  sliceAngle: number;
  outerRingOuterRadius: number;
  outerRingInnerRadius: number;
  wedgeOuterRadius: number;
  wedgeInnerRadius: number;
  iconRingRadius: number;
  centerRadius: number;
};

const START_ANGLE = -90;
const MENU_ANIMATION_MS = 200;
const SECTOR_HIT_WIDTH = 56;

/** Shadow DOM retargets `event.target` on document; use the composed path instead. */
function eventIntersectsNode(event: Event, node: Node | null) {
  if (!node) return false;
  if (event.composedPath().includes(node)) return true;
  const target = event.target;
  return target instanceof Node && node.contains(target);
}

function polarToCartesian(radius: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function clampMenuCenter(
  x: number,
  y: number,
  menuSize: number,
  padding: number,
): Point {
  const half = menuSize / 2;
  const minX = half + padding;
  const minY = half + padding;
  const maxX = window.innerWidth - half - padding;
  const maxY = window.innerHeight - half - padding;

  if (minX > maxX || minY > maxY) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function slicePath(
  index: number,
  total: number,
  outerRadius: number,
  innerRadius: number,
) {
  if (total <= 0) return '';

  if (total === 1) {
    return `
      M ${outerRadius} 0
      A ${outerRadius} ${outerRadius} 0 1 1 ${-outerRadius} 0
      A ${outerRadius} ${outerRadius} 0 1 1 ${outerRadius} 0
      M ${innerRadius} 0
      A ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius} 0
      A ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius} 0
    `;
  }

  const slice = 360 / total;
  const midDeg = START_ANGLE + slice * index;
  const half = slice / 2;
  const startDeg = midDeg - half;
  const endDeg = midDeg + half;
  const outerStart = polarToCartesian(outerRadius, startDeg);
  const outerEnd = polarToCartesian(outerRadius, endDeg);
  const innerStart = polarToCartesian(innerRadius, startDeg);
  const innerEnd = polarToCartesian(innerRadius, endDeg);
  const largeArc = slice > 180 ? 1 : 0;

  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
}

function computeGeometry({
  size,
  bandWidth,
  innerGap,
  outerGap,
  outerRingWidth,
  itemCount,
}: {
  size: number;
  bandWidth: number;
  innerGap: number;
  outerGap: number;
  outerRingWidth: number;
  itemCount: number;
}): MenuGeometry {
  const radius = size / 2;
  const outerRingOuterRadius = radius;
  const outerRingInnerRadius = outerRingOuterRadius - outerRingWidth;
  const wedgeOuterRadius = outerRingInnerRadius - outerGap;
  const wedgeInnerRadius = wedgeOuterRadius - bandWidth;

  return {
    radius,
    viewBox: `${-radius} ${-radius} ${size} ${size}`,
    sliceAngle: 360 / itemCount,
    outerRingOuterRadius,
    outerRingInnerRadius,
    wedgeOuterRadius,
    wedgeInnerRadius,
    iconRingRadius: (wedgeOuterRadius + wedgeInnerRadius) / 2,
    centerRadius: Math.max(wedgeInnerRadius - innerGap, 0),
  };
}

function useRadialMenu(
  size: number,
  edgePadding: number,
  canOpen?: (event: MouseEvent) => boolean,
) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<Point>({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const close = React.useCallback(() => {
    clearCloseTimer();
    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setHoveredIndex(null);
      closeTimerRef.current = null;
    }, MENU_ANIMATION_MS);
  }, [clearCloseTimer]);

  const openAtPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      clearCloseTimer();
      setPosition(clampMenuCenter(clientX, clientY, size, edgePadding));
      setIsVisible(false);
      setOpen(true);
    },
    [clearCloseTimer, size, edgePadding],
  );

  React.useEffect(() => {
    const onDoubleClick = (event: MouseEvent) => {
      if (eventIntersectsNode(event, menuRef.current)) return;
      if (canOpen && !canOpen(event)) return;
      event.preventDefault();
      openAtPointer(event.clientX, event.clientY);
    };

    document.addEventListener('dblclick', onDoubleClick, true);
    return () => document.removeEventListener('dblclick', onDoubleClick, true);
  }, [openAtPointer, canOpen]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open, position.x, position.y]);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const onPointerDown = (event: PointerEvent) => {
      if (eventIntersectsNode(event, menuRef.current)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    const onResize = () => {
      setPosition((current) =>
        clampMenuCenter(current.x, current.y, size, edgePadding),
      );
    };

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', onResize);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      clearCloseTimer();
    };
  }, [open, close, size, edgePadding, clearCloseTimer]);

  const handleSectorHover = React.useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const sector = (event.target as Element).closest('[data-sector]');
      setHoveredIndex(
        sector ? Number((sector as HTMLElement).dataset.sector) : null,
      );
    },
    [],
  );

  const clearHover = React.useCallback(() => setHoveredIndex(null), []);

  return {
    menuRef,
    open,
    isVisible,
    position,
    hoveredIndex,
    close,
    handleSectorHover,
    clearHover,
  };
}

function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type SectorProps = {
  item: MenuItem;
  index: number;
  total: number;
  geometry: MenuGeometry;
  isHovered: boolean;
  iconSize: number;
  labelSize: number;
  closeOnSelect: boolean;
  onSelect: (item: MenuItem) => void;
  onClose: () => void;
};

const RadialMenuSector = React.memo(function RadialMenuSector({
  item,
  index,
  total,
  geometry,
  isHovered,
  iconSize,
  labelSize,
  closeOnSelect,
  onSelect,
  onClose,
}: SectorProps) {
  const Icon = item.icon;
  const midDeg = START_ANGLE + geometry.sliceAngle * index;
  const { x: iconX, y: iconY } = polarToCartesian(
    geometry.iconRingRadius,
    midDeg,
  );
  const hitHeight = iconSize + labelSize + 10;

  const handleSelect = () => {
    if (item.disabled) return;
    onSelect(item);
    if (closeOnSelect) onClose();
  };

  const sectorClassName = [
    'radial-menu-sector',
    item.disabled ? 'is-disabled' : '',
    isHovered ? 'is-hovered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g
      data-sector={index}
      className={sectorClassName}
      onClick={handleSelect}
    >
      <path
        d={slicePath(
          index,
          total,
          geometry.outerRingOuterRadius,
          geometry.outerRingInnerRadius,
        )}
        className="radial-menu-wedge radial-menu-wedge--outer"
      />
      <path
        d={slicePath(
          index,
          total,
          geometry.wedgeOuterRadius,
          geometry.wedgeInnerRadius,
        )}
        className="radial-menu-wedge radial-menu-wedge--inner"
      />
      <foreignObject
        x={iconX - SECTOR_HIT_WIDTH / 2}
        y={iconY - hitHeight / 2}
        width={SECTOR_HIT_WIDTH}
        height={hitHeight}
        xmlns="http://www.w3.org/1999/xhtml"
      >
        <button
          type="button"
          role="menuitem"
          aria-label={item.label}
          disabled={item.disabled}
          onClick={(event) => {
            event.stopPropagation();
            handleSelect();
          }}
          className="radial-menu-sector-btn"
        >
          <Icon aria-hidden style={{ width: iconSize, height: iconSize }} />
          <span
            className="radial-menu-sector-label"
            style={{ fontSize: labelSize }}
          >
            {item.label}
          </span>
        </button>
      </foreignObject>
    </g>
  );
});

type CloseButtonProps = {
  centerRadius: number;
  onClose: () => void;
};

const RadialMenuCloseButton = React.memo(function RadialMenuCloseButton({
  centerRadius,
  onClose,
}: CloseButtonProps) {
  const diameter = centerRadius * 2;

  return (
    <g className="radial-menu-close">
      <circle
        cx={0}
        cy={0}
        r={centerRadius}
        className="radial-menu-close-bg"
      />
      <foreignObject
        x={-centerRadius}
        y={-centerRadius}
        width={diameter}
        height={diameter}
        xmlns="http://www.w3.org/1999/xhtml"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="radial-menu-close-btn"
        >
          <PixelClose className="radial-menu-close-icon" />
        </button>
      </foreignObject>
    </g>
  );
});

const RadialMenu = React.forwardRef<RadialMenuHandle, RadialMenuProps>(
  function RadialMenu(
    {
      menuItems,
      size = 260,
      iconSize = 18,
      labelSize = 12,
      bandWidth = 82,
      innerGap = 4,
      outerGap = 2,
      outerRingWidth = 0,
      edgePadding = 4,
      closeOnSelect = true,
      canOpen,
      portalContainer,
      onSelect,
      onOpenChange,
    },
    ref,
  ) {
    const mounted = useMounted();
    const {
      menuRef,
      open,
      isVisible,
      position,
      hoveredIndex,
      close,
      handleSectorHover,
      clearHover,
    } = useRadialMenu(size, edgePadding, canOpen);

    React.useImperativeHandle(ref, () => ({ close }), [close]);

    React.useEffect(() => {
      onOpenChange?.(open);
    }, [open, onOpenChange]);

    const geometry = React.useMemo(
      () =>
        computeGeometry({
          size,
          bandWidth,
          innerGap,
          outerGap,
          outerRingWidth,
          itemCount: menuItems.length,
        }),
      [size, bandWidth, innerGap, outerGap, outerRingWidth, menuItems.length],
    );

    const handleSelect = React.useCallback(
      (item: MenuItem) => onSelect?.(item),
      [onSelect],
    );

    if (!mounted || !open) return null;

    const half = size / 2;
    const portalTarget = portalContainer ?? document.body;
    const holderClassName = isVisible
      ? 'radial-menu-holder is-open'
      : 'radial-menu-holder';

    return createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label="Radial menu"
        className={holderClassName}
        style={{
          left: position.x - half,
          top: position.y - half,
          width: size,
          height: size,
        }}
      >
        <svg
          className="radial-menu-svg"
          viewBox={geometry.viewBox}
          onMouseOver={handleSectorHover}
          onMouseLeave={clearHover}
        >
          {menuItems.map((item, index) => (
            <RadialMenuSector
              key={item.id}
              item={item}
              index={index}
              total={menuItems.length}
              geometry={geometry}
              isHovered={hoveredIndex === index}
              iconSize={iconSize}
              labelSize={labelSize}
              closeOnSelect={closeOnSelect}
              onSelect={handleSelect}
              onClose={close}
            />
          ))}
          <RadialMenuCloseButton
            centerRadius={geometry.centerRadius}
            onClose={close}
          />
        </svg>
      </div>,
      portalTarget,
    );
  },
);

export { RadialMenu };
