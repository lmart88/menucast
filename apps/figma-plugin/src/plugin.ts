// Figma Plugin Main Thread
// Runs in Figma's sandbox — has access to Figma API and figma.clientStorage, but NOT fetch/DOM

figma.showUI(__html__, { width: 360, height: 630, title: "MenuCast" });

// Send saved credentials to UI on startup
(async () => {
  try {
    const token = await figma.clientStorage.getAsync("menucast_token");
    const appUrl = await figma.clientStorage.getAsync("menucast_app_url");
    figma.ui.postMessage({
      type: "init-storage",
      payload: {
        token: typeof token === "string" ? token : "",
        appUrl: typeof appUrl === "string" ? appUrl : "",
      },
    });
  } catch (e) {
    console.error("Failed to load credentials from clientStorage", e);
  }
})();

function rgbToCss(color: RGB, opacity = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return opacity < 1 ? `rgba(${r}, ${g}, ${b}, ${opacity})` : `rgb(${r}, ${g}, ${b})`;
}

function getSolidPaintColor(fills: readonly Paint[] | PluginAPI["mixed"]): { color: string; hex: string } | null {
  if (!fills || fills === figma.mixed || !Array.isArray(fills)) return null;
  const solid = fills.find((p) => p.type === "SOLID" && p.visible !== false) as SolidPaint | undefined;
  if (!solid) return null;
  const opacity = solid.opacity ?? 1;
  const r = Math.round(solid.color.r * 255);
  const g = Math.round(solid.color.g * 255);
  const b = Math.round(solid.color.b * 255);
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  return {
    color: rgbToCss(solid.color, opacity),
    hex,
  };
}

function parseFontWeight(style: string): number {
  const s = (style || "").toLowerCase();
  if (s.includes("black") || s.includes("heavy") || s.includes("extra bold")) return 900;
  if (s.includes("bold")) return 700;
  if (s.includes("semi bold") || s.includes("semibold") || s.includes("demi")) return 600;
  if (s.includes("medium")) return 500;
  if (s.includes("light") || s.includes("thin")) return 300;
  return 400;
}

// 1. Extract Hybrid Overlay Data
function extractHybridOverlayElements(frame: FrameNode) {
  const frameBox = frame.absoluteBoundingBox;
  if (!frameBox) return { elements: [], fonts: [] };

  const textNodes = frame.findAll((n) => n.type === "TEXT" && n.visible) as TextNode[];
  const fonts = new Set<string>();

  const elements = textNodes.map((t, idx) => {
    const box = t.absoluteBoundingBox;
    const relX = box ? Math.round(box.x - frameBox.x) : Math.round(t.x);
    const relY = box ? Math.round(box.y - frameBox.y) : Math.round(t.y);
    const relW = box ? Math.round(box.width) : Math.round(t.width);
    const relH = box ? Math.round(box.height) : Math.round(t.height);

    let fontFam = "sans-serif";
    let fontWeight = 400;
    if (t.fontName !== figma.mixed) {
      fontFam = t.fontName.family;
      fontWeight = parseFontWeight(t.fontName.style);
      fonts.add(fontFam);
    }

    const fontSize = t.fontSize !== figma.mixed ? t.fontSize : 16;
    const paintColor = getSolidPaintColor(t.fills);
    const color = paintColor?.color || "#ffffff";

    let textAlign = "left";
    if (t.textAlignHorizontal === "CENTER") textAlign = "center";
    else if (t.textAlignHorizontal === "RIGHT") textAlign = "right";
    else if (t.textAlignHorizontal === "JUSTIFIED") textAlign = "justify";

    let letterSpacing = "normal";
    if (t.letterSpacing !== figma.mixed && t.letterSpacing.value !== 0) {
      letterSpacing = t.letterSpacing.unit === "PERCENT" ? `${t.letterSpacing.value / 100}em` : `${t.letterSpacing.value}px`;
    }

    let lineHeight = "normal";
    if (t.lineHeight !== figma.mixed) {
      if (t.lineHeight.unit === "PIXELS") lineHeight = `${t.lineHeight.value}px`;
      else if (t.lineHeight.unit === "PERCENT") lineHeight = `${t.lineHeight.value / 100}`;
    }

    // Determine field type (price if starts with $ or numbers/dot)
    const textVal = t.characters.trim();
    const isPrice = /^\$?\d+(\.\d{2})?$/.test(textVal);

    return {
      id: `field_${t.id.replace(/[^a-zA-Z0-9_-]/g, "_")}_${idx}`,
      name: t.name || `Text ${idx + 1}`,
      text: t.characters,
      isPrice,
      x: relX,
      y: relY,
      width: relW,
      height: relH,
      fontSize,
      fontFamily: fontFam,
      fontWeight,
      color,
      textAlign,
      letterSpacing,
      lineHeight,
      opacity: t.opacity,
    };
  });

  return {
    elements,
    fonts: Array.from(fonts),
  };
}

// 2. Extract Responsive AutoLayout Data
interface ResponsiveNode {
  id: string;
  type: "frame" | "text" | "box";
  name: string;
  layoutMode?: "row" | "column" | "none";
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  alignItems?: string;
  justifyContent?: string;
  flexGrow?: number;
  width?: number | "auto" | "100%";
  height?: number | "auto" | "100%";
  backgroundColor?: string;
  borderRadius?: number;
  border?: string;
  text?: string;
  fieldId?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  textAlign?: string;
  children?: ResponsiveNode[];
}

function extractResponsiveTree(node: SceneNode, fonts: Set<string>, fields: Record<string, { label: string; value: string; isPrice: boolean }>): ResponsiveNode | null {
  if (!node.visible) return null;

  if (node.type === "TEXT") {
    let fontFam = "sans-serif";
    let fontWeight = 400;
    if (node.fontName !== figma.mixed) {
      fontFam = node.fontName.family;
      fontWeight = parseFontWeight(node.fontName.style);
      fonts.add(fontFam);
    }
    const fontSize = node.fontSize !== figma.mixed ? node.fontSize : 16;
    const paintColor = getSolidPaintColor(node.fills);
    const color = paintColor?.color || "#ffffff";

    let textAlign = "left";
    if (node.textAlignHorizontal === "CENTER") textAlign = "center";
    else if (node.textAlignHorizontal === "RIGHT") textAlign = "right";

    const fieldId = `field_${node.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const textVal = node.characters.trim();
    const isPrice = /^\$?\d+(\.\d{2})?$/.test(textVal);

    fields[fieldId] = {
      label: node.name || "Text Element",
      value: node.characters,
      isPrice,
    };

    return {
      id: node.id,
      type: "text",
      name: node.name,
      fieldId,
      text: node.characters,
      fontSize,
      fontFamily: fontFam,
      fontWeight,
      color,
      textAlign,
    };
  }

  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "GROUP") {
    const frame = node as FrameNode;
    const bgPaint = getSolidPaintColor(frame.fills);
    const bg = bgPaint ? bgPaint.color : undefined;
    const radius = typeof frame.cornerRadius === "number" ? frame.cornerRadius : undefined;

    let border: string | undefined;
    if (frame.strokes && Array.isArray(frame.strokes) && frame.strokes.length > 0 && typeof frame.strokeWeight === "number") {
      const strokeColor = getSolidPaintColor(frame.strokes);
      if (strokeColor) {
        border = `${frame.strokeWeight}px solid ${strokeColor.color}`;
      }
    }

    let layoutMode: "row" | "column" | "none" = "none";
    if (frame.layoutMode === "HORIZONTAL") layoutMode = "row";
    else if (frame.layoutMode === "VERTICAL") layoutMode = "column";

    let justifyContent = "flex-start";
    if (frame.primaryAxisAlignItems === "CENTER") justifyContent = "center";
    else if (frame.primaryAxisAlignItems === "MAX") justifyContent = "flex-end";
    else if (frame.primaryAxisAlignItems === "SPACE_BETWEEN") justifyContent = "space-between";

    let alignItems = "flex-start";
    if (frame.counterAxisAlignItems === "CENTER") alignItems = "center";
    else if (frame.counterAxisAlignItems === "MAX") alignItems = "flex-end";

    const padding = {
      top: frame.paddingTop || 0,
      right: frame.paddingRight || 0,
      bottom: frame.paddingBottom || 0,
      left: frame.paddingLeft || 0,
    };

    const children: ResponsiveNode[] = [];
    if ("children" in frame) {
      for (const child of frame.children) {
        const childNode = extractResponsiveTree(child, fonts, fields);
        if (childNode) children.push(childNode);
      }
    }

    return {
      id: frame.id,
      type: "frame",
      name: frame.name,
      layoutMode,
      gap: frame.itemSpacing || 0,
      padding,
      justifyContent,
      alignItems,
      flexGrow: frame.layoutGrow || (frame.layoutAlign === "STRETCH" ? 1 : 0),
      backgroundColor: bg,
      borderRadius: radius,
      border,
      children,
    };
  }

  // Generic box (Rectangle, Ellipse, etc.)
  if (node.type === "RECTANGLE") {
    const rect = node as RectangleNode;
    const bgPaint = getSolidPaintColor(rect.fills);
    const radius = typeof rect.cornerRadius === "number" ? rect.cornerRadius : undefined;
    return {
      id: rect.id,
      type: "box",
      name: rect.name,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      backgroundColor: bgPaint?.color || "#333333",
      borderRadius: radius,
    };
  }

  return null;
}

figma.ui.onmessage = async (msg: { type: string; payload?: unknown }) => {
  if (msg.type === "save-credentials") {
    const { token, appUrl } = msg.payload as { token: string; appUrl: string };
    try {
      await figma.clientStorage.setAsync("menucast_token", token);
      await figma.clientStorage.setAsync("menucast_app_url", appUrl);
    } catch (e) {
      console.error("Failed to save credentials to clientStorage", e);
    }
  }

  if (msg.type === "clear-credentials") {
    try {
      await figma.clientStorage.deleteAsync("menucast_token");
      await figma.clientStorage.deleteAsync("menucast_app_url");
    } catch (e) {
      console.error("Failed to clear credentials from clientStorage", e);
    }
  }

  if (msg.type === "create-frame") {
    const { width, height, name } = msg.payload as {
      width: number;
      height: number;
      name: string;
    };

    const frame = figma.createFrame();
    frame.name = `${name || "TV"} Menu (${width}×${height})`;
    frame.resize(width, height);
    frame.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.08, b: 0.08 } }];

    // Place at center of viewport
    const center = figma.viewport.center;
    frame.x = Math.round(center.x - width / 2);
    frame.y = Math.round(center.y - height / 2);

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.ui.postMessage({
      type: "status-msg",
      message: `✓ Created ${width}×${height} frame on canvas!`,
    });
  }

  if (msg.type === "export-and-push") {
    const { tvId, token, appUrl, mode = "static" } = msg.payload as {
      tvId: string;
      token: string;
      appUrl: string;
      mode: "static" | "hybrid" | "responsive";
    };

    const selection = figma.currentPage.selection;
    const node =
      selection.length === 1 && selection[0].type === "FRAME"
        ? (selection[0] as FrameNode)
        : (figma.currentPage.children.find((n) => n.type === "FRAME") as FrameNode | undefined);

    if (!node) {
      figma.ui.postMessage({
        type: "error",
        message: "Please select a frame to export as your menu.",
      });
      return;
    }

    try {
      const fileNameBase = node.name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

      // OPTION 1: STATIC IMAGE MODE
      if (mode === "static") {
        const bytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 2 },
        });

        figma.ui.postMessage({
          type: "upload",
          payload: {
            mode: "static",
            bytes: Array.from(bytes),
            fileName: `${fileNameBase}_static.png`,
            tvId,
            token,
            appUrl,
            menuData: null,
          },
        });
        return;
      }

      // OPTION 2: HYBRID OVERLAY MODE
      if (mode === "hybrid") {
        const { elements, fonts } = extractHybridOverlayElements(node);

        // Hide text layers to render clean background graphics slice
        const textNodes = node.findAll((n) => n.type === "TEXT") as TextNode[];
        const originalVisibilities = textNodes.map((t) => t.visible);

        let bgBytes: Uint8Array;
        try {
          textNodes.forEach((t) => {
            t.visible = false;
          });
          bgBytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 2 },
          });
        } finally {
          // Unconditionally restore text node visibility
          textNodes.forEach((t, i) => {
            t.visible = originalVisibilities[i];
          });
        }

        const menuData = {
          mode: "hybrid",
          canvas: {
            width: Math.round(node.width),
            height: Math.round(node.height),
          },
          fonts,
          elements,
        };

        figma.ui.postMessage({
          type: "upload",
          payload: {
            mode: "hybrid",
            bytes: Array.from(bgBytes),
            fileName: `${fileNameBase}_bg.png`,
            tvId,
            token,
            appUrl,
            menuData,
          },
        });
        return;
      }

      // OPTION 3: RESPONSIVE AUTOLAYOUT HTML MODE
      if (mode === "responsive") {
        const fonts = new Set<string>();
        const fields: Record<string, { label: string; value: string; isPrice: boolean }> = {};
        const tree = extractResponsiveTree(node, fonts, fields);

        // Also export a thumbnail/preview PNG
        const previewBytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 1.5 },
        });

        const bgPaint = getSolidPaintColor(node.fills);
        const menuData = {
          mode: "responsive",
          canvas: {
            width: Math.round(node.width),
            height: Math.round(node.height),
            backgroundColor: bgPaint?.color || "#111111",
          },
          fonts: Array.from(fonts),
          fields,
          tree,
        };

        figma.ui.postMessage({
          type: "upload",
          payload: {
            mode: "responsive",
            bytes: Array.from(previewBytes),
            fileName: `${fileNameBase}_preview.png`,
            tvId,
            token,
            appUrl,
            menuData,
          },
        });
        return;
      }
    } catch (err) {
      figma.ui.postMessage({
        type: "error",
        message: `Export failed: ${err}`,
      });
    }
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
