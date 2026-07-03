// Wraps the official @openclaw/slack channel plugin and bridges the presentation surface
// that the registered outbound facade forgets to expose (openclaw/openclaw#95440).
//
// Root cause upstream: extensions/slack/src/channel.ts registers `slackChannelOutbound`
// WITHOUT `renderPresentation`/`presentationCapabilities`, while the inner adapter
// (outbound-adapter.ts) implements both. Core delivery therefore never invokes the Slack
// renderer and downgrades presentation blocks (incl. buttons) to bullet text via
// renderMessagePresentationFallbackText.
//
// This module re-exports the official plugin object with those two properties bridged in.
// If the installed @openclaw/slack already exposes renderPresentation (i.e. upstream fixed
// it — candidate PR openclaw/openclaw#95463), the plugin passes through UNCHANGED.
import { slackPlugin } from "@openclaw/slack/dist/channel-plugin-api.js";
import { buildSlackPresentationBlocks, parseSlackBlocksInput } from "@openclaw/slack/dist/api.js";

function bridgeOutbound(outbound) {
  if (!outbound || typeof outbound.renderPresentation === "function") {
    return outbound; // upstream already fixed — stay out of the way
  }
  return {
    ...outbound,
    // Mirrors the inner adapter's declaration (limits omitted — core tolerates absent
    // limits and the block builders enforce Slack's caps themselves).
    presentationCapabilities: {
      supported: true,
      buttons: true,
      selects: true,
      context: true,
      divider: true,
    },
    // Same contract as the inner adapter's renderPresentation: build Block Kit from the
    // (already capability-adapted) presentation and stash it as channelData.slack
    // .presentationBlocks, which sendPayload's resolveSlackBlocks consumes natively.
    renderPresentation: ({ payload, presentation }) => {
      const slackData = payload.channelData?.slack;
      let offsets = {};
      try {
        const native = parseSlackBlocksInput(slackData?.blocks) ?? [];
        const count = native.filter(
          (b) => typeof b?.block_id === "string" && b.block_id.startsWith("openclaw_reply_buttons_"),
        ).length;
        offsets = { buttonIndexOffset: count };
      } catch {
        offsets = {};
      }
      const presentationBlocks = buildSlackPresentationBlocks(presentation, offsets);
      if (presentationBlocks.length === 0) return null;
      return {
        ...payload,
        channelData: {
          ...payload.channelData,
          slack: {
            ...slackData,
            presentationBlocks,
          },
        },
      };
    },
  };
}

export const slackPluginPatched = {
  ...slackPlugin,
  outbound: bridgeOutbound(slackPlugin.outbound),
};
