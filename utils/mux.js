// utils/mux.js
const Mux = require("@mux/mux-node");

// ✅ Create a client instance
const muxClient = new Mux({
  tokenId: "773b534a-1cc0-4926-839a-7859bbf4b8e3",
  tokenSecret:
    "vPjAtQBRl7QPwc25Jp3aTAAgG/ZRE3iSC1e/7JNBnUcsvgB+VsF8oilHOn6h4dYD6s8YdW2vXPK",
});

// ✅ Destructure the Video object correctly
const { video } = muxClient;

// ✅ Export it
module.exports = video;
