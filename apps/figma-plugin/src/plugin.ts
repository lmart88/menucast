// Figma Plugin Main Thread
// Runs in Figma's sandbox — has access to Figma API and figma.clientStorage, but NOT fetch/DOM

figma.showUI(__html__, { width: 360, height: 420, title: "MenuCast" });

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
    const { tvId, token, appUrl } = msg.payload as {
      tvId: string;
      token: string;
      appUrl: string;
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
