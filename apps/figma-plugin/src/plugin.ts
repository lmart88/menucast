// Figma Plugin Main Thread
// Runs in Figma's sandbox — has access to Figma API but NOT fetch/DOM

figma.showUI(__html__, { width: 320, height: 480, title: "MenuCast" });

figma.ui.onmessage = async (msg: { type: string; payload?: unknown }) => {
  if (msg.type === "export-and-push") {
    const { tvId, token, appUrl } = msg.payload as {
      tvId: string;
      token: string;
      appUrl: string;
    };

    // Get the current page selection or use the current page frame
    const selection = figma.currentPage.selection;
    const node =
      selection.length === 1 && selection[0].type === "FRAME"
        ? selection[0]
        : figma.currentPage.children.find((n) => n.type === "FRAME");

    if (!node) {
      figma.ui.postMessage({
        type: "error",
        message: "Please select a frame to export as your menu.",
      });
      return;
    }

    try {
      // Export the frame as PNG
      const bytes = await (node as FrameNode).exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });

      // Send bytes to UI thread (which has fetch access)
      figma.ui.postMessage({
        type: "upload",
        payload: {
          bytes: Array.from(bytes),
          fileName: `${node.name.replace(/\s+/g, "-").toLowerCase()}.png`,
          tvId,
          token,
          appUrl,
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
